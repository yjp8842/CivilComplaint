package com.civil.model;

import io.jsonwebtoken.Claims;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthContext {

    private final AuthType authType;
    private final String principal;      // OPEN_API: API Key, OAUTH: JWT sub
    private final String userId;         // OAUTH: JWT sub 클레임, OPEN_API: null
    private final String applicantName;  // OAUTH: JWT name 클레임, OPEN_API: null
    private final Claims claims;         // OAUTH일 때만 존재, OPEN_API는 null

    // ── ThreadLocal 관리 ────────────────────────────────────────────────────

    private static final ThreadLocal<AuthContext> HOLDER = new ThreadLocal<>();

    public static void set(AuthContext ctx) {
        HOLDER.set(ctx);
    }

    public static AuthContext get() {
        return HOLDER.get();
    }

    public static void clear() {
        HOLDER.remove();
    }
}