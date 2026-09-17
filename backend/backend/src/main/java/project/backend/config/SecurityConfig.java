package project.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.core.Authentication;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import project.backend.dto.ApiErrorResponse;
import project.backend.security.JwtAuthenticationFilter;
import project.backend.security.OAuth2LoginSuccessHandler;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final OAuth2Properties oAuth2Properties;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
            OAuth2Properties oAuth2Properties
    ){
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.oAuth2Properties = oAuth2Properties;
    }
        
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.
        csrf(AbstractHttpConfigurer::disable)
        .cors(cors->{})
        .sessionManagement(session->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint((request, response, authException) -> {
                // Without this, Spring's default entry point returns 403 for a
                // missing/invalid/expired token, indistinguishable from a genuine
                // authorization failure - the frontend only retries-after-refresh on 401.
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(ApiErrorResponse.of(HttpStatus.UNAUTHORIZED, "Authentication required").toJson());
            })
            // Same JSON shape as every other API error instead of an empty 403.
            .accessDeniedHandler((request, response, accessDeniedException) -> {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(ApiErrorResponse.of(HttpStatus.FORBIDDEN, "You don't have permission to do that").toJson());
            }))
        .authorizeHttpRequests(auth->auth
            .requestMatchers(HttpMethod.OPTIONS , "/**").permitAll()
            .requestMatchers("/api/auth/register" ,"/api/auth/login" , "/api/auth/refresh").permitAll()
            .requestMatchers("/actuator/health").permitAll()
            // Error dispatches must render their own status and body, not be
            // re-challenged as unauthenticated and turned into a 401.
            .requestMatchers("/error").permitAll()
            .requestMatchers("/oauth2/**" , "/login/oauth2/**").permitAll()
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated()
            ).addFilterBefore(jwtAuthenticationFilter , UsernamePasswordAuthenticationFilter.class)
        .oauth2Login(oauth2 -> oauth2
            .successHandler(oAuth2LoginSuccessHandler)
            .failureHandler((request, response, exception) ->
                response.sendRedirect(oAuth2Properties.frontendRedirectUri() + "/login?error=oauth2_failed"))
        );

            return http.build();
    }
}

