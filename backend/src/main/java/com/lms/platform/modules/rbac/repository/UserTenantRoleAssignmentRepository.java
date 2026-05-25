package com.lms.platform.modules.rbac.repository;

import com.lms.platform.modules.rbac.entity.UserTenantRoleAssignment;
import com.lms.platform.modules.user.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserTenantRoleAssignmentRepository extends JpaRepository<UserTenantRoleAssignment, UUID> {
    List<UserTenantRoleAssignment> findByUser_Id(UUID userId);
    @Query("""
            SELECT r.code
            FROM UserTenantRoleAssignment utra
            JOIN utra.role r
            WHERE utra.user.id = :userId
              AND utra.isDeleted = false
           """)
    List<String> findRoleByIdUser(UUID userId);
}
