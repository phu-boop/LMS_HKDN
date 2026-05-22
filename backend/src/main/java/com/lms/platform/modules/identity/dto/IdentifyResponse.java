package com.lms.platform.modules.identity.dto;

import java.util.UUID;

/**
 * Response DTO for identity lookup (Identify endpoint).
 */
public record IdentifyResponse(
    String nextStep
) {}
