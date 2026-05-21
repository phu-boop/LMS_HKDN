package com.lms.platform.modules.school.entity;

import com.lms.platform.common.model.BaseEntity;
import com.lms.platform.common.model.enums.CommonStatus;
import com.lms.platform.common.model.enums.LoginPolicy;
import com.lms.platform.modules.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "school_tenant_mapping", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "school_id"})
})
@Getter
@Setter
public class SchoolTenantMapping extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "contract_start", nullable = false)
    private LocalDate contractStart;

    @Column(name = "contract_end", nullable = false)
    private LocalDate contractEnd;

    @Column(name = "max_concurrent_sessions", nullable = false)
    private int maxConcurrentSessions = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "login_policy", nullable = false, columnDefinition = "login_policy")
    private LoginPolicy loginPolicy = LoginPolicy.BLOCK_NEW;

    @Column(name = "enforce_expiry", nullable = false)
    private boolean enforceExpiry = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "common_status")
    private CommonStatus status = CommonStatus.ACTIVE;
}
