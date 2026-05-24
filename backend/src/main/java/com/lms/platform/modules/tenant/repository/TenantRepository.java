package com.lms.platform.modules.tenant.repository;

import com.lms.platform.common.model.enums.CommonStatus;
import com.lms.platform.modules.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for managing Tenant entities.
 */
@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findByCode(String Code);
    /**
     * Find an active, non-deleted Tenant by its subdomain.
     */
    Optional<Tenant> findBySubdomainAndStatusAndIsDeletedFalse(String subdomain, CommonStatus status);

    /**
     * Find an active, non-deleted Tenant by its code.
     */
    Optional<Tenant> findByCodeAndStatusAndIsDeletedFalse(String code, CommonStatus status);
}
