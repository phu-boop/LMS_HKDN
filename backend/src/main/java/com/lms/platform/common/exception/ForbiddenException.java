package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when the user is authenticated but not authorized to perform the action (HTTP 403).
 */
public class ForbiddenException extends BaseException {

    public ForbiddenException(String detail) {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden", detail);
    }

    public ForbiddenException(String code, String detail) {
        super(HttpStatus.FORBIDDEN, code, "Forbidden", detail);
    }
}
