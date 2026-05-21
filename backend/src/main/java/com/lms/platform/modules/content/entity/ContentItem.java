package com.lms.platform.modules.content.entity;

import com.lms.platform.common.model.BaseEntity;
import com.lms.platform.common.model.enums.ContentType;
import com.lms.platform.common.model.enums.PublishStatus;
import com.lms.platform.modules.curriculum.entity.CurriculumNode;
import com.lms.platform.modules.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "content_item")
@Getter
@Setter
public class ContentItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_node_id", nullable = false)
    private CurriculumNode curriculumNode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "content_type")
    private ContentType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_path", columnDefinition = "text")
    private String filePath;

    @Column(name = "hls_url", columnDefinition = "text")
    private String hlsUrl;

    @Column(name = "source_url", columnDefinition = "text")
    private String sourceUrl;

    @Column(name = "thumbnail_url", columnDefinition = "text")
    private String thumbnailUrl;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "publish_status", nullable = false, columnDefinition = "publish_status")
    private PublishStatus publishStatus = PublishStatus.DRAFT;

    @Column(name = "visibility_from")
    private OffsetDateTime visibilityFrom;

    @Column(name = "visibility_to")
    private OffsetDateTime visibilityTo;

    @Column(name = "is_downloadable", nullable = false)
    private boolean isDownloadable = false;

    @Column(name = "watermark_enabled", nullable = false)
    private boolean watermarkEnabled = true;

    @Column(name = "signed_url_ttl")
    private Integer signedUrlTtl = 3600;
}
