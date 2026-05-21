package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Custom exception mapping to the LoginError response.
 */
public class LoginException extends BaseException {

    private final Integer retryAfterSeconds;

    public LoginException(String code, String message) {
        this(HttpStatus.UNAUTHORIZED, code, message, null);
    }

    public LoginException(HttpStatus status, String code, String message) {
        this(status, code, message, null);
    }

    public LoginException(HttpStatus status, String code, String message, Integer retryAfterSeconds) {
        super(status, code, "Login Error", message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public Integer getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
