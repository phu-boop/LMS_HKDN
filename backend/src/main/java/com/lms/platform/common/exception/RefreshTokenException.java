package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;

/**
 * Exception thrown when refresh token is invalid or expired.
 */
public class RefreshTokenException extends BaseException {

    private final OffsetDateTime retryAfterSeconds;

    public RefreshTokenException(
            String message,

            OffsetDateTime retryAfterSeconds
    ) {

        super(
                HttpStatus.UNAUTHORIZED,
                "INVALID_TOKEN",
                message
        );

        this.retryAfterSeconds = retryAfterSeconds;
    }

    public OffsetDateTime getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}