package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a tenant is not found or is inactive.
 */
public class TenantNotFoundException extends BaseException {

    public TenantNotFoundException(String detail) {
        super(HttpStatus.NOT_FOUND, "TENANT_NOT_FOUND", "Tenant Not Found", detail);
    }
}
