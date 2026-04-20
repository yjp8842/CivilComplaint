# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

민원 서비스 프론트엔드. 백엔드(civil-api)와 별도 프로젝트로 분리되어 있음.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 기술 스택

- **Vite + React 19** (JavaScript, no TypeScript)
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin. `@import "tailwindcss"` in `index.css`. No `tailwind.config.js` needed.
- **axios** — API 호출은 반드시 `src/api/civilApi.js` 함수만 사용 (컴포넌트 내 직접 호출 금지)
- **react-router-dom** — `/login`, `/`, `/agency`, `/dashboard` 라우팅
- **TanStack React Query** — `QueryClient`는 `src/main.jsx`에서 초기화, `QueryClientProvider`로 앱 전체를 감쌈

## 백엔드 연동

- 백엔드: Spring Boot, `localhost:8080`
- 프록시: `vite.config.js`에서 `/civil`, `/auth` → `http://localhost:8080` 포워딩 (CORS 별도 설정 불필요)

## 백엔드 API 명세

### 인증 방식

| 타입     | 헤더                          | 기준                                          |
| -------- | ----------------------------- | --------------------------------------------- |
| OPEN_API | `X-API-Key: {apiKey}`         | 개인 식별 불필요 — API Key면 누구나 접근 가능 |
| OAUTH    | `Authorization: Bearer {JWT}` | 개인 식별 필요 — 로그인한 사용자만 접근 가능  |
| BOTH     | 둘 다 허용                    | 인증 타입에 따라 응답 내용 다름               |

### 엔드포인트

```
POST /auth/register       Body: { "userId": "...", "password": "...", "name": "...", "roles": ["CITIZEN"] }
                          응답: 200 OK (회원 DB 저장, BCrypt 해싱)

POST /auth/login          Body: { "userId": "...", "password": "..." }
                          응답: { "token": "...", "tokenType": "Bearer" }
                          (JWT payload에 sub=userId, name, roles 포함)

POST /auth/token          테스트용 — DB 조회 없이 JWT 즉시 발급
                          Body: { "userId": "citizen-001", "name": "홍길동", "roles": ["CITIZEN"] }
                          응답: { "token": "...", "tokenType": "Bearer" }

POST /auth/apikey         테스트용 API Key 발급
                          Body: { "name": "testorg" }
                          응답: { "apiKey": "govkey-testorg-xxxxxxxx" }

GET  /civil/agencies      OPEN_API 전용 (OAuth 시 403)
                          응답: { "agencies": [{ "code": "...", "name": "..." }] }

POST /civil/apply         OAUTH 전용 (API Key 시 403)
                          Body: { "type": "주민등록등본", "purpose": "대출용" }
                          응답: { "id": "CIVIL-...", "type": "...", "status": "접수", "appliedAt": "..." }

GET  /civil/status        BOTH 허용
                          OPEN_API → 전체 민원 목록 (internalCode 포함, contact 제외)
                            응답: { "complaints": [{ "id", "type", "status", "appliedAt", "internalCode" }] }
                          OAUTH    → 본인 민원 목록만 (contact 포함, internalCode 제외)
                            응답: { "complaints": [{ "id", "type", "status", "appliedAt", "contact" }] }
```

### 에러 응답 형식

```json
{ "code": "UNAUTHORIZED", "message": "유효한 인증 정보가 없습니다." }
{ "code": "FORBIDDEN",    "message": "해당 엔드포인트에 허용되지 않는 인증 방식입니다." }
```

401/403 에러 응답은 UI에 빨간색으로 표시.

## 프로젝트 구조

```
src/
├── pages/
│   ├── Login.jsx          # 로그인 페이지 (/auth/login, 비밀번호 인증)
│   ├── Register.jsx       # 회원가입 페이지 (/auth/register, DB 저장)
│   ├── Home.jsx           # 민원 신청 + 내 민원 목록 (OAUTH)
│   ├── Agency.jsx         # 기관 서비스 — 기관 목록 + 전체 민원 현황 (OPEN_API)
│   └── Dashboard.jsx      # API 테스트 대시보드
├── components/
│   ├── AuthPanel.jsx      # API Key / OAuth 토큰 입력
│   ├── ApiTester.jsx      # API 호출 + JSON 응답 뷰어
│   ├── CivilForm.jsx      # 민원 신청 폼
│   └── StatusViewer.jsx   # 민원 상태 조회
├── hooks/
│   └── useAuth.js         # 인증 상태 (token, userName, isLoggedIn, login, logout)
├── api/
│   └── civilApi.js        # axios 인스턴스 + API 호출 함수
└── App.jsx                # 라우팅 설정
```

### civilApi.js 함수 목록

- `register(body)` → `POST /auth/register` (실제 회원가입, DB 저장)
- `loginUser(body)` → `POST /auth/login` (실제 로그인, BCrypt 검증 후 JWT 발급)
- `issueToken(body)` → `POST /auth/token` (테스트용 JWT 즉시 발급)
- `getAgencies(apiKey)` → `GET /civil/agencies`
- `applyCivil(token, body)` → `POST /civil/apply`
- `getStatus(authHeader)` → `GET /civil/status`

## 코딩 컨벤션

- 컴포넌트: 함수형 컴포넌트 + hooks
- 스타일링: Tailwind CSS 클래스만 사용 (인라인 `style` 속성 금지)
- 상태 관리: `useState`, `useAuth` hook (Redux 사용 안 함)
- API 호출: `civilApi.js` 함수만 사용 (컴포넌트 내 axios 직접 호출 금지)
