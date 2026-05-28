package com.lms.platform.common.security.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Holds context information for the current active Tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantContext {
    private UUID tenantId;
    private String code;
    private String subdomain;
}
