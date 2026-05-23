package com.lms.platform.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/**
 * Request DTO for user login.
 */
public record LoginRequest(
    @NotBlank String username,
    @NotBlank String password
) {}
