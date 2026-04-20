# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# civil-api 프로젝트 컨텍스트

## 프로젝트 개요
민원 서비스 API — Filter 기반 OpenAPI/OAuth 인증 차별화
워밍업 프로젝트

## 기술 스택
- Java 17
- Spring Boot 3.2
- Gradle (Groovy DSL)
- jjwt 0.12.3
- Lombok
- Spring Data JPA + MySQL

## 패키지 구조
```
com.civil
├── config/
│   └── SecurityConfig.java          # Filter 등록, Security 설정
├── filter/
│   └── CivilAuthFilter.java         # 핵심 인증 Filter
├── model/
│   ├── AuthType.java                # OPEN_API / OAUTH / BOTH
│   ├── RequiredAuth.java            # 메서드 단위 커스텀 어노테이션
│   └── AuthContext.java             # ThreadLocal 인증 컨텍스트 (userId 포함)
├── util/
│   ├── ApiKeyValidator.java         # X-API-Key 검증
│   └── JwtValidator.java            # Bearer JWT 검증
├── entity/
│   ├── CivilComplaint.java          # 민원 JPA 엔티티
│   └── User.java                    # 유저 JPA 엔티티
├── repository/
│   ├── CivilComplaintRepository.java # 민원 JPA Repository
│   └── UserRepository.java          # 유저 JPA Repository
├── service/
│   ├── CivilService.java            # 민원 저장/조회 비즈니스 로직
│   └── UserService.java             # 회원가입/로그인 비즈니스 로직
└── controller/
    ├── CivilController.java         # 민원 API (agencies / apply / status)
    └── AuthController.java          # 회원가입/로그인/테스트용 토큰·키 발급
```

## 인증 구조 설계

인증 방식 구분 기준은 **개인 식별이 필요한가** 여부다.

- OPEN_API : X-API-Key 헤더 — 개인 식별 불필요, API Key가 있으면 누구나 접근 가능
- OAuth    : Authorization: Bearer JWT — 개인 식별 필요, 로그인한 사용자만 접근 가능
- BOTH     : 둘 다 허용, AuthContext로 응답 범위 차별화

## API 목록

### 인증 API (/auth)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /auth/register | 회원가입 — DB에 유저 저장 (BCrypt 해싱) |
| POST | /auth/login | 로그인 — DB 인증 후 JWT 발급 |
| POST | /auth/token | 테스트용 JWT 즉시 발급 (DB 조회 없음) |
| POST | /auth/apikey | 테스트용 API Key 발급 |

### 민원 API (/civil)

| 메서드 | 경로 | 인증 | 개인 식별 | 설명 |
|--------|------|------|-----------|------|
| GET | /civil/agencies | OPEN_API | 불필요 | 공공기관 목록 — API Key면 누구나 |
| POST | /civil/apply | OAuth | 필요 | 민원 신청 — JWT sub/name → DB 저장 |
| GET | /civil/status | BOTH | 여부에 따라 응답 범위 다름 | OPEN_API: 전체 민원 목록 / OAuth: 본인 민원 목록 |

## Filter 동작 순서
1. /auth/** 경로 통과
2. 헤더 파싱 (X-API-Key or Authorization)
3. ApiKeyValidator / JwtValidator 검증 → 실패 시 401
4. RequestMappingHandlerMapping으로 @RequiredAuth 조회
5. 인증 방식 불일치 → 403
6. AuthContext → ThreadLocal 저장
7. finally: AuthContext.clear() 반드시 호출

## AuthContext

```java
AuthContext {
    AuthType authType;      // OPEN_API | OAUTH
    String   principal;     // OPEN_API: API Key, OAUTH: JWT sub
    String   userId;        // OAuth: JWT sub 클레임, OPEN_API: null
    String   applicantName; // OAuth: JWT name 클레임, OPEN_API: null
    Claims   claims;        // OAuth일 때만 존재, OPEN_API: null
}
```

- OAuth 인증 시 `CivilAuthFilter`가 JWT `sub` → `userId`, `name` → `applicantName` 파싱해서 저장
- OPEN_API 인증 시 `userId`, `applicantName`은 null

## 데이터 흐름 (JPA)

```
POST /auth/register
  → UserService.register() → BCrypt 해싱 → users 테이블 저장

POST /auth/login
  → UserService.login() → BCrypt 검증 → JWT 발급 (sub=userId, name, roles)

POST /civil/apply (JWT)
  → AuthContext.getUserId() → applicantId
  → AuthContext.getApplicantName() → applicantName
  → CivilService.apply(applicantId, applicantName, type, purpose)
  → CivilComplaint 엔티티 생성 → MySQL 저장

GET /civil/status (OPEN_API)
  → CivilService.getAllComplaints()
  → 전체 민원 반환 (internalCode 포함, contact 제외)

GET /civil/status (OAuth)
  → AuthContext.getUserId() → applicantId
  → CivilService.getMyComplaints(applicantId)
  → 본인 민원만 반환 (contact 포함, internalCode 제외)
```

## 엔티티 필드

### CivilComplaint (civil_complaint 테이블)

| 필드 | nullable | 설명 |
|------|----------|------|
| id | false | CIVIL-{timestamp} |
| type | false | 민원 종류 |
| purpose | true | 발급 목적 |
| applicantId | false | JWT sub (신청인 userId) |
| applicantName | false | JWT name 클레임 (신청인 이름) |
| status | false | 접수 / 처리중 / 완료 |
| contact | true | 담당자 연락처 |
| internalCode | true | 기관용 내부 처리 코드 |
| appliedAt | false | 신청일시 |

### User (users 테이블)

| 필드 | nullable | 설명 |
|------|----------|------|
| id | false | PK (auto increment) |
| userId | false, unique | 로그인 ID |
| password | false | BCrypt 해시된 비밀번호 |
| name | false | 실명 (JWT name 클레임에 사용) |
| roles | false | 콤마 구분 문자열 (예: "CITIZEN") |
| createdAt | false | 가입일시 |

## GET /civil/status 응답 차별화

### OPEN_API (개인 식별 불필요)
전체 민원 공개 현황. `contact` 제외, `internalCode` 포함.
```json
{
  "complaints": [
    { "id": "CIVIL-001", "type": "주민등록등본", "status": "처리중", "appliedAt": "...", "internalCode": "INT-001" }
  ]
}
```

### OAuth (개인 식별 필요)
JWT `sub` → `applicantId` 기준 본인 민원만. `internalCode` 제외, `contact` 포함.
```json
{
  "complaints": [
    { "id": "CIVIL-001", "type": "주민등록등본", "status": "처리중", "appliedAt": "...", "contact": "02-1234-5678" }
  ]
}
```

## POST /civil/apply 응답

```json
{ "id": "CIVIL-001", "type": "주민등록등본", "status": "접수", "appliedAt": "..." }
```

## 코딩 컨벤션
- 언어: Java (Kotlin 사용 안 함)
- 주석: 한국어
- 응답 형식: Map<String, Object> (DTO 클래스 없이)
- 에러 응답: { "code": "...", "message": "..." }
- ThreadLocal 사용 시 반드시 finally clear() 포함

---

## Build & Run

```bash
# Gradle 래퍼 초기화 (최초 1회 — 시스템 Gradle 필요)
gradle wrapper --gradle-version 8.5

# 빌드
./gradlew build

# 실행 (포트 8080)
./gradlew bootRun

# 테스트 전체 / 단일 클래스
./gradlew test
./gradlew test --tests "com.civil.SomeTest"
```

## 개발용 테스트

```bash
# 회원가입
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","password":"pw123","name":"홍길동","roles":["CITIZEN"]}'

# 로그인 → JWT 발급
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","password":"pw123"}'

# 테스트용 JWT 즉시 발급 (DB 없이)
curl -X POST http://localhost:8080/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"citizen-001","name":"홍길동","roles":["CITIZEN"]}'

# 테스트용 API Key 발급
curl -X POST http://localhost:8080/auth/apikey \
  -H "Content-Type: application/json" \
  -d '{"name":"testorg"}'

# OPEN_API — 공공기관 목록 조회
curl http://localhost:8080/civil/agencies \
  -H "X-API-Key: govkey-testorg-xxxxxxxx"

# OAuth — 민원 신청
curl -X POST http://localhost:8080/civil/apply \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"주민등록등본","purpose":"대출용"}'

# OPEN_API — 전체 민원 공개 현황 조회
curl http://localhost:8080/civil/status \
  -H "X-API-Key: govkey-testorg-xxxxxxxx"

# OAuth — 본인 민원 목록 조회
curl http://localhost:8080/civil/status \
  -H "Authorization: Bearer <token>"
```