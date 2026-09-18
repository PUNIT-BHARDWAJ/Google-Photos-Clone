package project.backend.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import project.backend.domain.User;
import project.backend.dto.UpdateProfileRequest;
import project.backend.exception.BadRequestException;
import project.backend.repository.UserRepository;

/**
 * The demo account's credentials are published on the sign-in page, so anyone
 * can log into it. It must not be possible to change it from there.
 */
class UserServiceDemoAccountTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        userService = new UserService(userRepository, passwordEncoder);
    }

    private static User user(String email) {
        return User.builder().email(email).displayName("Demo User").passwordHash("hashed").build();
    }

    @Test
    @DisplayName("the demo account's password cannot be changed")
    void rejectsPasswordChangeOnDemoAccount() {
        User demo = user("demo@google-photos-clone.app");

        assertThatThrownBy(() -> userService.updateProfile(demo,
                new UpdateProfileRequest(null, "DemoPass123!", "NewPassword123!")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("The demo account cannot be modified");

        assertThat(demo.getPasswordHash()).isEqualTo("hashed");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("the demo account cannot be renamed either - its name is on display")
    void rejectsDisplayNameChangeOnDemoAccount() {
        User demo = user("DEMO@Google-Photos-Clone.app");

        assertThatThrownBy(() -> userService.updateProfile(demo, new UpdateProfileRequest("Anything", null, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("The demo account cannot be modified");

        assertThat(demo.getDisplayName()).isEqualTo("Demo User");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("everyone else can still update their profile")
    void allowsUpdatesForOtherAccounts() {
        User person = user("someone@example.com");
        when(passwordEncoder.matches("current", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword123!")).thenReturn("new-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        userService.updateProfile(person, new UpdateProfileRequest("Renamed", "current", "NewPassword123!"));

        assertThat(person.getDisplayName()).isEqualTo("Renamed");
        assertThat(person.getPasswordHash()).isEqualTo("new-hash");
    }

    @Test
    @DisplayName("the check is on the address itself, not on similar-looking ones")
    void recognisesOnlyTheDemoAddress() {
        assertThat(UserService.isDemoAccount(user("demo@google-photos-clone.app"))).isTrue();
        assertThat(UserService.isDemoAccount(user("Demo@Google-Photos-Clone.App"))).isTrue();
        assertThat(UserService.isDemoAccount(user("demo@google-photos-clone.app.evil.com"))).isFalse();
        assertThat(UserService.isDemoAccount(user("notdemo@google-photos-clone.app"))).isFalse();
        assertThat(UserService.isDemoAccount(null)).isFalse();
    }
}
