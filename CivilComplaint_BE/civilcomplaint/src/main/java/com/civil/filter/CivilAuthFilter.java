package com.civil.filter;

import com.civil.model.AuthContext;
import com.civil.model.AuthType;
import com.civil.model.RequiredAuth;
import com.civil.util.ApiKeyValidator;
import com.civil.util.JwtValidator;
import io.jsonwebtoken.Claims;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class CivilAuthFilter implements Filter {

    private final ApiKeyValidator apiKeyValidator;
    private final JwtValidator jwtValidator;
    private final ApplicationContext applicationContext;

    private volatile RequestMappingHandlerMapping handlerMapping;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpReq = (HttpServletRequest) request;
        HttpServletResponse httpRes = (HttpServletResponse) response;

        try {
            // 1. /auth/** 경로 통과
            if (httpReq.getRequestURI().startsWith("/auth/")) {
                chain.doFilter(request, response);
                return;
            }

            // 2. 헤더 파싱
            String apiKey = httpReq.getHeader("X-API-Key");
            String authHeader = httpReq.getHeader("Authorization");
            String bearerToken = (authHeader != null && authHeader.startsWith("Bearer "))
                    ? authHeader.substring(7)
                    : null;

            // 3. 자격증명 검증 → 유효한 인증 정보 없으면 401
            AuthContext ctx = tryAuthenticate(apiKey, bearerToken);
            if (ctx == null) {
                sendError(httpRes, HttpServletResponse.SC_UNAUTHORIZED,
                        "UNAUTHORIZED", "유효한 인증 정보가 없습니다.");
                return;
            }

            // 4. @RequiredAuth 어노테이션 조회
            RequiredAuth requiredAuth = resolveRequiredAuth(httpReq);
            if (requiredAuth == null) {
                // 어노테이션 없는 경로는 통과
                AuthContext.set(ctx);
                chain.doFilter(request, response);
                return;
            }

            // 5. 인증 방식 불일치 → 403
            if (!isAllowed(ctx.getAuthType(), requiredAuth.value())) {
                log.debug("Auth type mismatch - actual={}, required={}", ctx.getAuthType(), requiredAuth.value());
                sendError(httpRes, HttpServletResponse.SC_FORBIDDEN,
                        "FORBIDDEN", "해당 엔드포인트에 허용되지 않는 인증 방식입니다.");
                return;
            }

            // 6. ThreadLocal 저장
            AuthContext.set(ctx);
            log.debug("Auth OK - type={}, principal={}", ctx.getAuthType(), ctx.getPrincipal());

            chain.doFilter(request, response);

        } finally {
            // 7. 반드시 clear (메모리 누수 방지)
            AuthContext.clear();
        }
    }

    // ── 자격증명 검증 (API Key 우선, JWT 폴백) ────────────────────────────────

    private AuthContext tryAuthenticate(String apiKey, String bearerToken) {
        if (apiKeyValidator.validate(apiKey)) {
            return AuthContext.builder()
                    .authType(AuthType.OPEN_API)
                    .principal(apiKey)
                    .build();
        }
        if (bearerToken != null && jwtValidator.validate(bearerToken)) {
            Claims claims = jwtValidator.parse(bearerToken);
            String sub = claims.getSubject();
            String name = claims.get("name", String.class); // JWT name 클레임
            return AuthContext.builder()
                    .authType(AuthType.OAUTH)
                    .principal(sub)
                    .userId(sub)
                    .applicantName(name)
                    .claims(claims)
                    .build();
        }
        return null;
    }

    // ── 인증 방식 허용 여부 확인 ──────────────────────────────────────────────

    private boolean isAllowed(AuthType actual, AuthType required) {
        return switch (required) {
            case OPEN_API -> actual == AuthType.OPEN_API;
            case OAUTH -> actual == AuthType.OAUTH;
            case BOTH -> true;
        };
    }

    // ── 핸들러 메서드에서 @RequiredAuth 추출 ─────────────────────────────────

    private RequiredAuth resolveRequiredAuth(HttpServletRequest request) {
        try {
            Object handler = getHandlerMapping().getHandler(request).getHandler();
            if (handler instanceof HandlerMethod handlerMethod) {
                return handlerMethod.getMethodAnnotation(RequiredAuth.class);
            }
        } catch (Exception e) {
            log.debug("Handler lookup skipped for [{}]: {}", request.getRequestURI(), e.getMessage());
        }
        return null;
    }

    private RequestMappingHandlerMapping getHandlerMapping() {
        if (handlerMapping == null) {
            synchronized (this) {
                if (handlerMapping == null) {
                    handlerMapping = applicationContext
                            .getBean("requestMappingHandlerMapping", RequestMappingHandlerMapping.class);
                }
            }
        }
        return handlerMapping;
    }

    // ── 에러 응답 헬퍼 ────────────────────────────────────────────────────────

    private void sendError(HttpServletResponse res, int status, String code, String message)
            throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write(
                "{\"code\":\"" + code + "\",\"message\":\"" + message + "\"}"
        );
    }
}