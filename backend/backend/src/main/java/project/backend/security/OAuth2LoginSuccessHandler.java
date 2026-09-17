package project.backend.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import project.backend.config.OAuth2Properties;
import project.backend.domain.User;
import project.backend.dto.AuthResponse;
import project.backend.repository.RefreshTokenRepository;
import project.backend.repository.UserRepository;
import project.backend.services.TokenIssuanceService;

// Depends only on repositories/TokenIssuanceService - deliberately not
// AuthService, since AuthService needs AuthenticationManager, and injecting
// that here (via SecurityConfig's constructor) creates a circular bean
// dependency back to SecurityConfig's own SecurityFilterChain bean.
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenIssuanceService tokenIssuanceService;
    private final OAuth2Properties oAuth2Properties;

    public OAuth2LoginSuccessHandler(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            TokenIssuanceService tokenIssuanceService,
            OAuth2Properties oAuth2Properties
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenIssuanceService = tokenIssuanceService;
        this.oAuth2Properties = oAuth2Properties;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null || email.isBlank()) {
            response.sendRedirect(oAuth2Properties.frontendRedirectUri() + "/login?error=oauth2_failed");
            return;
        }

        String normalizedEmail = email.toLowerCase().trim();

        // Runs inside one transaction (see @Transactional above) so `user` stays
        // attached to the persistence context all the way through issueTokens()
        // below - on a repeat login, user comes from a plain findByEmail() load
        // rather than a just-saved instance, and handing that off to a *second*,
        // separately-transactional save() (RefreshToken referencing a detached
        // User) is what was crashing.
        User user = userRepository.findByEmail(normalizedEmail).orElseGet(() -> {
            User newUser = User.builder()
                    .email(normalizedEmail)
                    // OAuth2-only accounts have no password of their own; a random
                    // unusable hash satisfies the not-null column without allowing
                    // anyone to log in via the email/password flow with it.
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .displayName(name != null && !name.isBlank() ? name.trim() : normalizedEmail)
                    .build();
            return userRepository.save(newUser);
        });

        refreshTokenRepository.deleteByUserId(user.getId());
        AuthResponse authResponse = tokenIssuanceService.issueTokens(user);

        String redirectUrl = oAuth2Properties.frontendRedirectUri() + "/oauth2/callback"
                + "?accessToken=" + encode(authResponse.accessToken())
                + "&refreshToken=" + encode(authResponse.refreshToken());

        response.sendRedirect(redirectUrl);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
