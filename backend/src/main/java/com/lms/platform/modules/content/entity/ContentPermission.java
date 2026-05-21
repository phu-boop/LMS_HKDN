package com.lms.platform.modules.content.entity;

import com.lms.platform.common.model.BaseEntity;
import com.lms.platform.modules.curriculum.entity.CurriculumNode;
import com.lms.platform.modules.school.entity.School;
import com.lms.platform.modules.tenant.entity.Tenant;
import com.lms.platform.modules.user.entity.UserAccount;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "content_permission")
@Getter
@Setter
public class ContentPermission extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_node_id", nullable = false)
    private CurriculumNode curriculumNode;

    @Column(name = "can_view", nullable = false)
    private boolean canView = true;

    @Column(name = "can_download", nullable = false)
    private boolean canDownload = false;

    @Column(name = "can_comment", nullable = false)
    private boolean canComment = true;
}
