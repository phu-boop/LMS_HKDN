package com.lms.platform.modules.user.entity;

import com.lms.platform.common.model.BaseEntity;
import com.lms.platform.common.model.enums.AccountType;
import com.lms.platform.common.model.enums.CommonStatus;
import com.lms.platform.modules.school.entity.School;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "user_account")
@Getter
@Setter
public class UserAccount extends BaseEntity {

    @Column(nullable = false, unique = true, length = 150)
    private String username;

    @Column(unique = true, length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "password_hash", nullable = false, columnDefinition = "text")
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "avatar_url", columnDefinition = "text")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, columnDefinition = "account_type")
    private AccountType accountType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_school_id")
    private School homeSchool;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts = 0;

    @Column(name = "locked_until")
    private OffsetDateTime lockedUntil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "common_status")
    private CommonStatus status = CommonStatus.ACTIVE;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;
}
