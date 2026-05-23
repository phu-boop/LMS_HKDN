package com.lms.platform.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IdentifyRequest {
    @NotBlank(message = "Identifier is required.")
    private String identifier;
    private String domain;
}
