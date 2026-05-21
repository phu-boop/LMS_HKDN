package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a requested resource is not found (HTTP 404).
 */
public class ResourceNotFoundException extends BaseException {

    public ResourceNotFoundException(String detail) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "Resource Not Found", detail);
    }

    public ResourceNotFoundException(String code, String detail) {
        super(HttpStatus.NOT_FOUND, code, "Resource Not Found", detail);
    }
}
