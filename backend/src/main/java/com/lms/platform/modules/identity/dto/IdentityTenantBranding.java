package com.lms.platform.modules.identity.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@Data
@Builder
public class IdentityTenantBranding {
    private String tenantCode;
    private String name;
    private String subdomain;
    private String domain;
    private boolean isWhiteLabel;
    private String logoUrl;
    private String avatarUrl;
    private String watermarkSettings;
}
