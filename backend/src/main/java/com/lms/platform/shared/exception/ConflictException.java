package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a conflict arises, e.g. duplicate key or state violation (HTTP 409).
 */
public class ConflictException extends BaseException {

    public ConflictException(String detail) {
        super(HttpStatus.CONFLICT, "CONFLICT", "Conflict", detail);
    }

    public ConflictException(String code, String detail) {
        super(HttpStatus.CONFLICT, code, "Conflict", detail);
    }
}
