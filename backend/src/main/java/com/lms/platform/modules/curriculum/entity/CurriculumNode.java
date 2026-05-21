package com.lms.platform.modules.curriculum.entity;

import com.lms.platform.common.model.BaseEntity;
import com.lms.platform.common.model.enums.CommonStatus;
import com.lms.platform.modules.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "curriculum_node", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "parent_id", "title"})
})
@Getter
@Setter
public class CurriculumNode extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private CurriculumNode parent;

    @Column(name = "node_type", nullable = false, length = 100)
    private String nodeType;

    @Column(length = 50)
    private String code;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "common_status")
    private CommonStatus status = CommonStatus.ACTIVE;
}
