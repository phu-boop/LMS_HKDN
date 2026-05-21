package com.lms.platform.modules.rbac.entity;

import com.lms.platform.common.model.BaseEntity;
import com.lms.platform.modules.tenant.entity.Tenant;
import com.lms.platform.modules.user.entity.UserAccount;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_tenant_role_assignment", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "tenant_id", "role_id"})
})
@Getter
@Setter
public class UserTenantRoleAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "is_inherited", nullable = false)
    private boolean isInherited = false;
}
