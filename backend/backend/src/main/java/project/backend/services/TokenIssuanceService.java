package project.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import project.backend.domain.RefreshToken;
import project.backend.domain.User;
import project.backend.dto.AuthResponse;
import project.backend.repository.RefreshTokenRepository;

// Split out of AuthService so it has no dependency on AuthenticationManager -
// OAuth2LoginSuccessHandler needs to issue tokens too, and pulling in
// AuthenticationManager there creates a circular bean dependency back to
// SecurityConfig (which must construct the handler before its own filter
// chain bean, which is what AuthenticationManager needs to resolve).
@Service
public class TokenIssuanceService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final UserService userService;

    public TokenIssuanceService(
            RefreshTokenRepository refreshTokenRepository,
            JwtService jwtService,
            UserService userService
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @Transactional
    public AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = jwtService.generateRefreshTokenValue();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(jwtService.refreshTokenExpiry())
                .build();

        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, refreshTokenValue, userService.toUserResponse(user));
    }
}
