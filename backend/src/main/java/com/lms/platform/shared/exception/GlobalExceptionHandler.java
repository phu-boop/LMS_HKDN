package com.lms.platform.common.exception;

import com.lms.platform.common.response.IdentifyErrorResponse;
import com.lms.platform.common.response.LoginErrorResponse;
import com.lms.platform.common.response.ProblemDetails;
import com.lms.platform.common.response.RefreshTokenErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import org.springframework.web.servlet.resource.NoResourceFoundException;
import java.util.stream.Collectors;

/**
 * Global Exception Handler for the LMS application.
 * Intercepts all custom and standard exceptions and formats them as standard API responses.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle custom exceptions extending BaseException (standard HTTP/domain errors).
     */
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ProblemDetails> handleBaseException(BaseException ex, WebRequest request) {
        log.warn("Business Exception: [{}] - Status: {} - Detail: {}", 
                ex.getCode(), ex.getStatus(), ex.getDetail());
        
        ProblemDetails problemDetails = ProblemDetails.builder()
                .type("https://errors.daihoc.io.vn/" + ex.getCode().toLowerCase().replace("_", "-"))
                .title(ex.getTitle())
                .status(ex.getStatus().value())
                .detail(ex.getDetail())
                .instance(getRequestUri(request))
                .build();
                
        return new ResponseEntity<>(problemDetails, ex.getStatus());
    }

    /**
     * Handle LoginException separately to return LoginError schema.
     */
    @ExceptionHandler(LoginException.class)
    public ResponseEntity<LoginErrorResponse> handleLoginException(LoginException ex) {
        log.warn("Login Exception: [{}] - {}", ex.getCode(), ex.getMessage());
        
        LoginErrorResponse errorResponse = LoginErrorResponse.builder()
                .code(ex.getCode())
                .message(ex.getDetail())
                .retryAfterSeconds(ex.getRetryAfterSeconds())
                .build();
                
        return new ResponseEntity<>(errorResponse, ex.getStatus());
    }

    /**
     * Handle RefreshTokenException to return RefreshTokenError schema.
     */
    @ExceptionHandler(RefreshTokenException.class)
    public ResponseEntity<RefreshTokenErrorResponse> handleRefreshTokenException(RefreshTokenException ex) {
        log.warn("Refresh Token Exception: [{}] - {}", ex.getCode(), ex.getMessage());

        RefreshTokenErrorResponse errorResponse = RefreshTokenErrorResponse.builder()
                .code(ex.getCode())
                .message(ex.getDetail())
                .retryAfterSeconds(ex.getRetryAfterSeconds())
                .build();

        return new ResponseEntity<>(errorResponse, ex.getStatus());
    }

    /**
     * Handle validation errors (HTTP 400).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        String validationErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> String.format(error.getDefaultMessage()))
                .collect(Collectors.joining(""));
        IdentifyErrorResponse identifyErrorResponse = new IdentifyErrorResponse();
        log.warn("Validation failure: {}", validationErrors);
        if ("Identifier is required.".equals(validationErrors)) {
            identifyErrorResponse.setCode("VALIDATION_ERROR");
            identifyErrorResponse.setMessage("Identifier is required.");
        }
        else {
            identifyErrorResponse.setCode("VALIDATION_ERROR");
            identifyErrorResponse.setMessage("This is default error.");
             }
        return new ResponseEntity<>(identifyErrorResponse, HttpStatus.BAD_REQUEST);
    }
    /**
     * Handle Spring MVC NoResourceFoundException (HTTP 404).
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ProblemDetails> handleNoResourceFound(NoResourceFoundException ex, WebRequest request) {
        log.warn("No static resource or route found: {}", ex.getMessage());

        ProblemDetails problemDetails = ProblemDetails.builder()
                .type("https://errors.daihoc.io.vn/resource-not-found")
                .title("Resource Not Found")
                .status(HttpStatus.NOT_FOUND.value())
                .detail(ex.getMessage())
                .instance(getRequestUri(request))
                .build();

        return new ResponseEntity<>(problemDetails, HttpStatus.NOT_FOUND);
    }

    /**
     * Fallback for all other unhandled exceptions (HTTP 500).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetails> handleGenericException(Exception ex, WebRequest request) {
        log.error("Unhandled Exception occurred: ", ex);

        ProblemDetails problemDetails = ProblemDetails.builder()
                .type("https://errors.daihoc.io.vn/internal-server-error")
                .title("Internal Server Error")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .detail("An unexpected error occurred. Please try again later.")
                .instance(getRequestUri(request))
                .build();

        return new ResponseEntity<>(problemDetails, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String getRequestUri(WebRequest request) {
        if (request instanceof ServletWebRequest) {
            return ((ServletWebRequest) request).getRequest().getRequestURI();
        }
        return null;
    }
}
