package project.backend.config;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Development aid: one line per request with method, URI, status and time.
 * Inert unless this logger is at DEBUG (set REQUEST_LOG_LEVEL=DEBUG), so it
 * costs nothing in production. Ordered first so the timing and status cover
 * the security filters too - a request rejected with 401 still gets logged.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !log.isDebugEnabled();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long startNanos = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long elapsedMs = (System.nanoTime() - startNanos) / 1_000_000;
            log.debug("{} {} -> {} ({} ms)", request.getMethod(), describeTarget(request), response.getStatus(), elapsedMs);
        }
    }

    // The OAuth2 redirect endpoints carry one-time authorization codes and
    // state in their query strings - those stay out of the logs.
    private String describeTarget(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        boolean sensitive = uri.startsWith("/login/oauth2/") || uri.startsWith("/oauth2/");
        return query == null || sensitive ? uri : uri + "?" + query;
    }
}
