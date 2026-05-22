package com.lms.platform.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for user login.
 */
public record LoginRequest(
    @NotBlank String username,
    @NotBlank String password,
    String domain,
    String userAgent,
    String ipAddress
) {}
