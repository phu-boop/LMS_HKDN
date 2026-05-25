package com.lms.platform.modules.identity.dto;

/**
 * Response DTO for identity lookup (Identify endpoint).
 */
public record IdentifyResponse(
    String nextStep,
    IdentityTenantBranding tenant
) {}
