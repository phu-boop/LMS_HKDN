package com.lms.platform.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IdentifyRequest {
    @NotBlank
    private String identifier;
    private String domain;
}
