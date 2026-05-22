package com.lms.platform.modules.identity.dto;

/**
 * Response DTO for successful login.
 */
public record LoginResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    IdentityTenantBranding tenantBranding,
    String tokenType
) {
    public LoginResponse(String accessToken, String refreshToken, long expiresIn, IdentityTenantBranding tenantBranding) {
        this(accessToken, refreshToken, expiresIn, tenantBranding, "Bearer");
    }
}
