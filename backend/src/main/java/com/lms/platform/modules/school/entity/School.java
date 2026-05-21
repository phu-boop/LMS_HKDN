package com.lms.platform.modules.school.entity;

import com.lms.platform.common.model.BaseEntity;
import com.lms.platform.common.model.enums.CommonStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "school")
@Getter
@Setter
public class School extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "tax_id", length = 50)
    private String taxId;

    @Column(name = "province_code", length = 20)
    private String provinceCode;

    @Column(name = "district_code", length = 20)
    private String districtCode;

    @Column(columnDefinition = "text")
    private String address;

    @Column(name = "contact_name", length = 255)
    private String contactName;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "common_status")
    private CommonStatus status = CommonStatus.ACTIVE;

    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;
}
