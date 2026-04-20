package com.civil.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String userId;          // 로그인 ID

    @Column(nullable = false)
    private String password;        // BCrypt 해시된 비밀번호

    @Column(nullable = false)
    private String name;            // 실명 (JWT name 클레임에 사용)

    @Column(nullable = false)
    private String roles;           // 콤마 구분 (예: "CITIZEN" / "CITIZEN,ADMIN")

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public User(String userId, String password, String name, String roles, LocalDateTime createdAt) {
        this.userId    = userId;
        this.password  = password;
        this.name      = name;
        this.roles     = roles;
        this.createdAt = createdAt;
    }
}
