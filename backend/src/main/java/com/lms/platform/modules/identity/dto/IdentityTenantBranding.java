package com.lms.platform.modules.identity.dto;

/**
 * DTO representing tenant branding information in the identity module.
 */
public record IdentityTenantBranding(
    String tenantCode,
    String name,
    String subdomain,
    String domain,
    boolean isWhiteLabel,
    String logoUrl,
    String avatarUrl,
    String watermarkSettings
) {}
