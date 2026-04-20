package com.civil.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "civil_complaint")
@Getter
@NoArgsConstructor
public class CivilComplaint {

    @Id
    @Column(name = "id", length = 50)
    private String id;                  // CIVIL-{timestamp}

    @Column(nullable = false)
    private String type;                // 민원 종류

    @Column
    private String purpose;             // 발급 목적

    @Column(nullable = false)
    private String applicantId;         // JWT sub (신청인)

    @Column(nullable = false)
    private String applicantName;       // 신청인 이름

    @Column(nullable = false)
    private String status;              // 접수 / 처리중 / 완료

    @Column
    private String contact;             // 담당자 연락처

    @Column
    private String internalCode;

    @Column(nullable = false)
    private LocalDateTime appliedAt;    // 신청일시

    @Builder
    public CivilComplaint(String id, String type, String purpose,
                          String applicantId, String applicantName,
                          String status, String contact, String internalCode,
                          LocalDateTime appliedAt) {
        this.id          = id;
        this.type        = type;
        this.purpose     = purpose;
        this.applicantId = applicantId;
        this.applicantName = applicantName;
        this.status      = status;
        this.contact     = contact;
        this.internalCode  = internalCode;
        this.appliedAt   = appliedAt;
    }
}