package com.lms.platform.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for refreshing the access token.
 */
public record RefreshTokenRequest(
    @NotBlank String refreshToken
) {}
