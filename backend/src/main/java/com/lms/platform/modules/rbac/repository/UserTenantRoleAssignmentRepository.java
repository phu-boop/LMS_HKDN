package com.lms.platform.modules.rbac.repository;

import com.lms.platform.modules.rbac.entity.UserTenantRoleAssignment;
import com.lms.platform.modules.user.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserTenantRoleAssignmentRepository extends JpaRepository<UserTenantRoleAssignment, UUID> {
    List<UserTenantRoleAssignment> findByUser_Id(UUID userId);
}
