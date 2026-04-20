package com.civil.repository;

import com.civil.entity.CivilComplaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CivilComplaintRepository extends JpaRepository<CivilComplaint, String> {

    // 본인 민원만 조회 (시민용)
    List<CivilComplaint> findByApplicantIdOrderByAppliedAtDesc(String applicantId);
}