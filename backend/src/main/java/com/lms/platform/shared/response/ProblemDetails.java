package com.lms.platform.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standard RFC 7807 Problem Details object for error responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDetails {
    private String type;
    private String title;
    private Integer status;
    private String detail;
    private String instance;
}
