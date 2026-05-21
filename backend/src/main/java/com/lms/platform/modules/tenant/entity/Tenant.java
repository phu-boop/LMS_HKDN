package com.lms.platform.modules.tenant.entity;

import com.lms.platform.common.model.BaseEntity;
import com.lms.platform.common.model.enums.CommonStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "tenant")
@Getter
@Setter
public class Tenant extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String subdomain;

    @Column(name = "logo_url", columnDefinition = "text")
    private String logoUrl;

    @Column(name = "avatar_url", columnDefinition = "text")
    private String avatarUrl;

    @Column(columnDefinition = "text")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "watermark_settings", columnDefinition = "jsonb")
    private String watermarkSettings; // Can be mapped to a dedicated POJO later

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "common_status")
    private CommonStatus status = CommonStatus.ACTIVE;
}
