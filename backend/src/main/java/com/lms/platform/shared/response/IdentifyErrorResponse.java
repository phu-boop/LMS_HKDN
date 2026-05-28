package com.lms.platform.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Custom error response for Identifier-first lookup (/api/identity/identify).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdentifyErrorResponse {
    private String code;
    private String message;
}
