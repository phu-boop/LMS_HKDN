package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when the user is not authenticated (HTTP 401).
 */
public class UnauthorizedException extends BaseException {

    public UnauthorizedException(String detail) {
        super(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Unauthorized", detail);
    }

    public UnauthorizedException(String code, String detail) {
        super(HttpStatus.UNAUTHORIZED, code, "Unauthorized", detail);
    }
}
