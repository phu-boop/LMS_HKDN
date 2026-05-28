package com.lms.platform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a request is made to a multi-tenant endpoint without resolving a tenant context.
 */
public class TenantContextRequiredException extends BaseException {

    public TenantContextRequiredException(String detail) {
        super(HttpStatus.BAD_REQUEST, "TENANT_CONTEXT_REQUIRED", "Tenant Context Required", detail);
    }
}
