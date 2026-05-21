package com.lms.platform.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Standard template for Health check API responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthResponse {
    private String status;
    private String message;
    @Builder.Default
    private String timestamp = OffsetDateTime.now().toString();
    private Map<String, Object> details;

    public static HealthResponse up(String message) {
        return HealthResponse.builder()
                .status("UP")
                .message(message)
                .build();
    }

    public static HealthResponse up(String message, Map<String, Object> details) {
        return HealthResponse.builder()
                .status("UP")
                .message(message)
                .details(details)
                .build();
    }
}
