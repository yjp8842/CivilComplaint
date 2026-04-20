package com.civil.util;

import org.springframework.stereotype.Component;

@Component
public class ApiKeyValidator {

    private static final String API_KEY_PREFIX = "govkey-";

    /**
     * X-API-Key 헤더 검증: "govkey-" 접두사 + 최소 1자 이상의 값
     */
    public boolean validate(String apiKey) {
        return apiKey != null
                && apiKey.startsWith(API_KEY_PREFIX)
                && apiKey.length() > API_KEY_PREFIX.length();
    }
}