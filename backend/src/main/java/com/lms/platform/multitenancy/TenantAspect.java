package com.lms.platform.common.security.tenant;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Aspect that enables the Hibernate {@code tenantFilter} before any transactional method execution.
 * It retrieves the current tenant from {@link TenantContextHolder} and activates the filter with the tenantId.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class TenantAspect {

    private final EntityManager entityManager;

    /**
     * Intercept any method annotated with @Transactional (including service layer) and enable the tenant filter.
     */
    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object enableTenantFilter(ProceedingJoinPoint pjp) throws Throwable {
        try {
            UUID tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null) {
                Session session = entityManager.unwrap(Session.class);
                session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
                log.debug("Hibernate tenant filter enabled for tenantId: {}", tenantId);
            } else {
                log.warn("Tenant ID is null while attempting to enable tenant filter. Queries may not be scoped.");
            }
            return pjp.proceed();
        } finally {
            // Ensure the filter is disabled after the transaction to avoid cross‑tenant leakage in pooled sessions.
            Session session = entityManager.unwrap(Session.class);
            if (session.getEnabledFilter("tenantFilter") != null) {
                session.disableFilter("tenantFilter");
                log.debug("Hibernate tenant filter disabled after transaction.");
            }
        }
    }
}
