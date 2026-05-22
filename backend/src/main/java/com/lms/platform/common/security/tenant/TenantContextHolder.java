package com.lms.platform.common.security.tenant;

import java.util.UUID;

/**
 * Thread-local context holder for the current active Tenant.
 * Uses InheritableThreadLocal to ensure the context propagates to asynchronous child threads.
 */
public class TenantContextHolder {

    private static final ThreadLocal<TenantContext> CONTEXT = new InheritableThreadLocal<>();

    /**
     * Set the current Tenant context.
     */
    public static void setTenantContext(TenantContext context) {
        CONTEXT.set(context);
    }

    /**
     * Retrieve the full current Tenant context.
     */
    public static TenantContext getTenantContext() {
        return CONTEXT.get();
    }

    /**
     * Helper to get only the current Tenant ID.
     */
    public static UUID getTenantId() {
        TenantContext context = CONTEXT.get();
        return context != null ? context.getTenantId() : null;
    }

    /**
     * Helper to get only the current Tenant Code.
     */
    public static String getTenantCode() {
        TenantContext context = CONTEXT.get();
        return context != null ? context.getCode() : null;
    }

    /**
     * Clear the Tenant context from ThreadLocal.
     * MUST be called at the end of every request.
     */
    public static void clear() {
        CONTEXT.remove();
    }
}
