package com.civil.controller;

import com.civil.entity.User;
import com.civil.service.UserService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 인증 관련 엔드포인트.
 * /auth/** 경로는 CivilAuthFilter에서 인증 없이 통과.
 */
@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final SecretKey secretKey;
    private final UserService userService;

    public AuthController(@Value("${jwt.secret}") String secret, UserService userService) {
        this.secretKey   = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.userService = userService;
    }

    /**
     * 회원가입
     * POST /auth/register  { "userId": "user123", "password": "pw123", "name": "홍길동", "roles": ["CITIZEN"] }
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {
        String userId   = (String) body.get("userId");
        String password = (String) body.get("password");
        String name     = (String) body.get("name");

        Object rolesObj = body.get("roles");
        List<String> roles = (rolesObj instanceof List<?> list)
                ? list.stream().map(Object::toString).toList()
                : List.of("CITIZEN");

        try {
            User user = userService.register(userId, password, name, roles);
            log.debug("회원가입 완료 - userId={}", user.getUserId());
            return ResponseEntity.ok(Map.of(
                    "userId", user.getUserId(),
                    "name",   user.getName()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("code", "DUPLICATE_USER_ID", "message", e.getMessage())
            );
        }
    }

    /**
     * 로그인 — DB 인증 후 JWT 발급
     * POST /auth/login  { "userId": "user123", "password": "pw123" }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        String userId   = (String) body.get("userId");
        String password = (String) body.get("password");

        try {
            User user = userService.login(userId, password);
            List<String> roles = Arrays.asList(user.getRoles().split(","));
            String token = buildToken(user.getUserId(), user.getName(), roles);

            log.debug("로그인 성공 - userId={}", userId);
            return ResponseEntity.ok(Map.of("token", token, "tokenType", "Bearer"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(
                    Map.of("code", "LOGIN_FAILED", "message", e.getMessage())
            );
        }
    }

    /**
     * 테스트용 JWT 토큰 발급 (DB 조회 없이 즉시 발급)
     * POST /auth/token  { "userId": "citizen-001", "name": "홍길동", "roles": ["CITIZEN"] }
     */
    @PostMapping("/token")
    public ResponseEntity<?> issueToken(@RequestBody Map<String, Object> body) {
        String userId = (String) body.getOrDefault("userId", "anonymous");
        String name   = (String) body.getOrDefault("name", "이름없음");

        Object rolesObj = body.get("roles");
        List<String> roles = (rolesObj instanceof List<?> list)
                ? list.stream().map(Object::toString).toList()
                : List.of("CITIZEN");

        String token = buildToken(userId, name, roles);
        log.debug("테스트 JWT 발급 - userId={}, name={}, roles={}", userId, name, roles);
        return ResponseEntity.ok(Map.of("token", token, "tokenType", "Bearer"));
    }

    /**
     * 테스트용 API Key 발급
     * POST /auth/apikey  { "name": "testorg" }
     */
    @PostMapping("/apikey")
    public ResponseEntity<?> issueApiKey(@RequestBody Map<String, String> body) {
        String name   = body.getOrDefault("name", "test");
        String apiKey = "govkey-" + name + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        log.debug("API Key 발급 - name={}, key={}", name, apiKey);
        return ResponseEntity.ok(Map.of("apiKey", apiKey));
    }

    // ── JWT 빌더 헬퍼 ─────────────────────────────────────────────────────────

    private String buildToken(String userId, String name, List<String> roles) {
        return Jwts.builder()
                .subject(userId)
                .claim("name", name)
                .claim("roles", roles)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3_600_000L))
                .signWith(secretKey)
                .compact();
    }
}