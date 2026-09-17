package project.backend.controllers;

import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import project.backend.dto.ApiErrorResponse;

/**
 * Replaces Spring Boot's BasicErrorController for failures that never reach
 * GlobalExceptionHandler (anything thrown in a servlet filter, container-level
 * errors), which otherwise answer with Spring's own
 * {timestamp, status, error, path} JSON instead of the API's error format.
 */
@RestController
public class ApiErrorController implements ErrorController {

    private static final String SERVER_ERROR_MESSAGE = "Something went wrong. Please try again.";

    @RequestMapping("/error")
    public ResponseEntity<ApiErrorResponse> handleError(HttpServletRequest request) {
        Object statusCode = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);

        // Requested directly rather than forwarded here for a real error.
        if (!(statusCode instanceof Integer code)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiErrorResponse.of(HttpStatus.NOT_FOUND, "Endpoint not found"));
        }

        HttpStatus status = HttpStatus.resolve(code);
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String message = status.is5xxServerError() ? SERVER_ERROR_MESSAGE : status.getReasonPhrase();
        return ResponseEntity.status(status).body(ApiErrorResponse.of(status, message));
    }
}
