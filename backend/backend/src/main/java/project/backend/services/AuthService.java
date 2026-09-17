package project.backend.services;

import java.time.Instant;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import project.backend.domain.RefreshToken;
import project.backend.domain.User;
import project.backend.dto.AuthResponse;
import project.backend.dto.LoginRequest;
import project.backend.dto.RegisterReqest;
import project.backend.exception.ResourceConflictException;
import project.backend.exception.UnauthorizedException;
import project.backend.repository.RefreshTokenRepository;
import project.backend.repository.UserRepository;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenIssuanceService tokenIssuanceService;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            UserService userService,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            TokenIssuanceService tokenIssuanceService
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenIssuanceService = tokenIssuanceService;
    }

    @Transactional
    public AuthResponse register(RegisterReqest request) {
        String email = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ResourceConflictException("Email is already registered");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName().trim())
                .build();

        userRepository.save(user);
        return tokenIssuanceService.issueTokens(user);
    }



    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().toLowerCase().trim();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );

        User user = userService.getByEmail(email);
        refreshTokenRepository.deleteByUserId(user.getId());
        return tokenIssuanceService.issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token expired");
        }

        User user = refreshToken.getUser();
        refreshTokenRepository.delete(refreshToken);
        return tokenIssuanceService.issueTokens(user);
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
           .ifPresent(refreshTokenRepository::delete);
    }
}
