package com.civil.controller;

import com.civil.entity.CivilComplaint;
import com.civil.model.AuthContext;
import com.civil.model.AuthType;
import com.civil.model.RequiredAuth;
import com.civil.service.CivilService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/civil")
@RequiredArgsConstructor
public class CivilController {

    private final CivilService civilService;

    /**
     * GET /civil/agencies
     * 공공기관 목록 조회 — 개인 식별 불필요, API Key면 누구나 접근 가능
     */
    @GetMapping("/agencies")
    @RequiredAuth(AuthType.OPEN_API)
    public ResponseEntity<?> getAgencies() {
        return ResponseEntity.ok(Map.of(
                "agencies", List.of(
                        Map.of("code", "GOV001", "name", "행정안전부"),
                        Map.of("code", "GOV002", "name", "보건복지부"),
                        Map.of("code", "GOV003", "name", "국토교통부")
                )
        ));
    }

    /**
     * POST /civil/apply
     * 민원 신청 — 개인 식별 필요, JWT(로그인 시민)만 접근 가능
     * JWT sub → userId로 신청인 식별 후 store에 저장
     */
    @PostMapping("/apply")
    @RequiredAuth(AuthType.OAUTH)
    public ResponseEntity<?> applyComplaint(@RequestBody Map<String, Object> body) {
        AuthContext ctx = AuthContext.get();
        String userId = ctx.getUserId();
        log.debug("Complaint apply - userId={}", userId);

        CivilComplaint saved = civilService.apply(
                userId,
                ctx.getApplicantName(),
                (String) body.getOrDefault("type", ""),
                (String) body.getOrDefault("purpose", "")
        );

        return ResponseEntity.ok(Map.of(
                "id",        saved.getId(),
                "type",      saved.getType(),
                "status",    saved.getStatus(),
                "appliedAt", saved.getAppliedAt().toString()
        ));
    }

    /**
     * GET /civil/status
     * 민원 목록 조회 — 개인 식별 여부에 따라 응답 범위 차별화
     *   - OPEN_API: 개인 식별 불필요 → 전체 민원 공개 현황 (internalCode 포함)
     *   - OAUTH   : 개인 식별 필요 → userId 기준 본인 민원만 (contact 포함)
     */
    @GetMapping("/status")
    @RequiredAuth(AuthType.BOTH)
    public ResponseEntity<?> getStatus() {
        AuthContext ctx = AuthContext.get();

        if (ctx.getAuthType() == AuthType.OPEN_API) {
            // 기관: 전체 민원 목록 (internalCode 포함, contact 제외)
            List<Map<String, Object>> all = civilService.getAllComplaints()
                    .stream()
                    .map(c -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id",           c.getId());
                        map.put("type",         c.getType());
                        map.put("status",       c.getStatus());
                        map.put("internalCode", c.getInternalCode());
                        map.put("appliedAt",    c.getAppliedAt().toString());
                        return map;
                    })
                    .toList();
            return ResponseEntity.ok(Map.of("complaints", all));

        } else {
            // 시민: 본인 민원만 (contact 포함, internalCode 제외)
            String userId = ctx.getUserId();
            log.debug("Status query - userId={}", userId);

            List<Map<String, Object>> mine = civilService.getMyComplaints(userId)
                    .stream()
                    .map(c -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id",        c.getId());
                        map.put("type",      c.getType());
                        map.put("status",    c.getStatus());
                        map.put("contact",   c.getContact());
                        map.put("appliedAt", c.getAppliedAt().toString());
                        return map;
                    })
                    .toList();
            return ResponseEntity.ok(Map.of("complaints", mine));
        }
    }
}
