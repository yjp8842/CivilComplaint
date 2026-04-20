package com.civil.service;

import com.civil.entity.CivilComplaint;
import com.civil.repository.CivilComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CivilService {

    private final CivilComplaintRepository repository;

    public CivilComplaint apply(String applicantId, String applicantName, String type, String purpose) {
        CivilComplaint complaint = CivilComplaint.builder()
                .id("CIVIL-" + System.currentTimeMillis())
                .type(type)
                .purpose(purpose)
                .applicantId(applicantId)
                .applicantName(applicantName)
                .status("접수")
                .contact("02-1234-5678")
                .internalCode("INT-" + System.currentTimeMillis())
                .appliedAt(LocalDateTime.now())
                .build();

        return repository.save(complaint);
    }

    // 시민용: 본인 민원만
    public List<CivilComplaint> getMyComplaints(String applicantId) {
        return repository.findByApplicantIdOrderByAppliedAtDesc(applicantId);
    }

    // 기관용: 전체 민원
    public List<CivilComplaint> getAllComplaints() {
        return repository.findAll();
    }
}