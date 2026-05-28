package com.lms.platform.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenErrorResponse {
    private String code;
    private String message;
    private Integer retryAfterSeconds;
}
