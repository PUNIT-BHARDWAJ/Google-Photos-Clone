package project.backend.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;

import jakarta.servlet.RequestDispatcher;
import project.backend.controllers.ApiErrorController;
import project.backend.dto.ApiErrorResponse;

/**
 * The statuses curl can't easily reach against a healthy local backend (403 -
 * no endpoint requires a role - and a genuine 500) plus the /error fallback,
 * all asserted to use the shared { error, message } body.
 */
class ApiErrorFormatTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void accessDeniedIs403() {
        ResponseEntity<ApiErrorResponse> response = handler.handleAccessDenied(new AccessDeniedException("nope"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isEqualTo(new ApiErrorResponse("FORBIDDEN", "You don't have permission to do that"));
    }

    @Test
    void unexpectedExceptionIsAGeneric500WithoutLeakingDetails() {
        ResponseEntity<ApiErrorResponse> response = handler.handleUnexpected(new IllegalStateException("db password is hunter2"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isEqualTo(
                new ApiErrorResponse("INTERNAL_SERVER_ERROR", "Something went wrong. Please try again."));
    }

    @Test
    void otherSpringClientErrorsKeepTheirStatus() {
        ResponseEntity<ApiErrorResponse> response = handler.handleUnexpected(new HttpMediaTypeNotAcceptableException("no"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_ACCEPTABLE);
        assertThat(response.getBody().error()).isEqualTo("NOT_ACCEPTABLE");
    }

    @Test
    void errorControllerUsesTheSameShape() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/error");
        request.setAttribute(RequestDispatcher.ERROR_STATUS_CODE, 500);

        ResponseEntity<ApiErrorResponse> response = new ApiErrorController().handleError(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isEqualTo(
                new ApiErrorResponse("INTERNAL_SERVER_ERROR", "Something went wrong. Please try again."));
    }

    @Test
    void securityJsonIsEscaped() {
        String json = ApiErrorResponse.of(HttpStatus.UNAUTHORIZED, "say \"hi\" \\ bye\n").toJson();

        assertThat(json).isEqualTo("{\"error\":\"UNAUTHORIZED\",\"message\":\"say \\\"hi\\\" \\\\ bye\\n\"}");
    }
}
