package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;

/**
 * Exception thrown when refresh token is invalid or expired.
 */
public class RefreshTokenException extends BaseException {

    private final Integer retryAfterSeconds;

    public RefreshTokenException(String code, String message) {
        this(HttpStatus.UNAUTHORIZED, code, message, null);
    }

    public RefreshTokenException(HttpStatus status, String code, String message, Integer retryAfterSeconds) {
        super(status, code, "RefreshTokenException error", message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public RefreshTokenException(ErrorCode errorCode) {
        this(HttpStatus.UNAUTHORIZED, errorCode.getCode(), errorCode.getDefaultMessage(), null);
    }

    public RefreshTokenException(HttpStatus status, ErrorCode errorCode) {
        this(status, errorCode.getCode(), errorCode.getDefaultMessage(), null);
    }

    public RefreshTokenException(HttpStatus status, ErrorCode errorCode, Integer retryAfterSeconds) {
        this(status, errorCode.getCode(), errorCode.getDefaultMessage(), retryAfterSeconds);
    }

    public RefreshTokenException(HttpStatus status, ErrorCode errorCode, String message, Integer retryAfterSeconds) {
        this(status, errorCode.getCode(), message, retryAfterSeconds);
    }

    public Integer getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}

