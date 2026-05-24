package com.lms.platform.modules.user.repository;

import com.lms.platform.modules.user.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository
        extends JpaRepository<UserAccount, UUID> {

    Optional<UserAccount> findByUsername(String username);
}