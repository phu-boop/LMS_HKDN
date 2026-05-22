package com.lms.platform.common.model;

import com.lms.platform.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.util.UUID;

/**
 * Base class for all entities that are tenant scoped.
 * Adds a {@code tenant_id} column and enables a Hibernate filter to enforce data isolation.
 */
@Getter
@Setter
@MappedSuperclass
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = UUID.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public abstract class BaseTenantEntity extends BaseEntity {

    /**
     * Identifier of the tenant that owns this row.
     */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
}
