package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a request is invalid or malformed (HTTP 400).
 */
public class BadRequestException extends BaseException {

    public BadRequestException(String detail) {
        super(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Bad Request", detail);
    }

    public BadRequestException(String code, String detail) {
        super(HttpStatus.BAD_REQUEST, code, "Bad Request", detail);
    }
}
