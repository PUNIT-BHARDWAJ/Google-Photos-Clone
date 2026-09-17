package project.backend.services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.backend.domain.User;
import project.backend.dto.UpdateProfileRequest;
import project.backend.dto.UserResponse;
import project.backend.exception.BadRequestException;
import project.backend.exception.UnauthorizedException;
import project.backend.repository.UserRepository;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse getUserResponseByEmail(String email) {
        return toUserResponse(getByEmail(email));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    public Optional<String> findEmailById(UUID userId) {
        return userRepository.findById(userId).map(User::getEmail);
    }

    public boolean existsById(UUID userId) {
        return userRepository.existsById(userId);
    }

    @Transactional
    public UserResponse updateProfile(User user, UpdateProfileRequest request) {
        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName().trim());
        }

        if (request.newPassword() != null) {
            if (request.currentPassword() == null || request.currentPassword().isBlank()) {
                throw new BadRequestException("Current password is required to set a new password");
            }
            if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new UnauthorizedException("Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    public UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName());
    }
}
