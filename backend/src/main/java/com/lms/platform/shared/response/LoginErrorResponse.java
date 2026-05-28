package com.lms.platform.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Custom error response for login (/api/identity/auth/login).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginErrorResponse {
    private String code;
    private String message;
    private Integer retryAfterSeconds;
}
