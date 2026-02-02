# Offio API 설계

## 개요

- **Base URL**: `/api/v1` (Next.js API Routes)
- **인증**: Bearer Token (JWT) 또는 NextAuth 세션
- **응답 형식**: JSON

---

## 인증 API

### POST /auth/login
로그인

**Request:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "name": "홍길동",
    "role": "worker",
    "companyId": "uuid",
    "companyName": "ABC회사"
  }
}
```

---

### POST /auth/refresh
토큰 갱신

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### POST /auth/logout
로그아웃

**Response:**
```json
{
  "success": true
}
```

---

## 데스크톱 앱 API

### POST /desktop/session/start
근무 시작

**Request:**
```json
{
  "deviceInfo": {
    "os": "Windows 11",
    "hostname": "DESKTOP-ABC123",
    "ip": "192.168.0.100"
  }
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "startTime": "2026-01-29T09:00:00Z",
  "screenshotInterval": 60
}
```

---

### POST /desktop/session/end
근무 종료

**Request:**
```json
{
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "endTime": "2026-01-29T18:00:00Z",
  "totalWorkSeconds": 32400,
  "totalActiveSeconds": 28000
}
```

---

### POST /desktop/activity
활동 데이터 전송 (10초마다)

**Request:**
```json
{
  "sessionId": "uuid",
  "startTime": "2026-01-29T09:00:00Z",
  "endTime": "2026-01-29T09:00:10Z",
  "durationSeconds": 10,
  "keyboardCount": 45,
  "keyPressCount": 120,
  "mouseClickCount": 8,
  "mouseDistance": 10054,
  "actionCount": 53,
  "windows": [
    { "name": "chrome", "focusSeconds": 6 },
    { "name": "Illustrator", "focusSeconds": 4 }
  ]
}
```

**Response:**
```json
{
  "activityLogId": 12345
}
```

---

### POST /desktop/screenshot
스크린샷 업로드

**Request:** `multipart/form-data`
- `sessionId`: UUID
- `capturedAt`: ISO8601 timestamp
- `file`: 이미지 파일 (PNG/JPEG)

**Response:**
```json
{
  "screenshotId": 12345,
  "fileUrl": "https://storage.offio.kr/screenshots/..."
}
```

---

## 근무자 웹 API

### GET /worker/sessions
내 근무 기록 목록

**Query:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `status`: recording | editing | submitted | approved | rejected

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "date": "2026-01-29",
      "startTime": "2026-01-29T09:00:00Z",
      "endTime": "2026-01-29T18:00:00Z",
      "status": "editing",
      "totalWorkSeconds": 32400,
      "totalActiveSeconds": 28000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### GET /worker/sessions/:sessionId
근무 기록 상세

**Response:**
```json
{
  "id": "uuid",
  "date": "2026-01-29",
  "startTime": "2026-01-29T09:00:00Z",
  "endTime": "2026-01-29T18:00:00Z",
  "status": "editing",
  "totalWorkSeconds": 32400,
  "totalActiveSeconds": 28000,
  "memo": "",
  "adminComment": null
}
```

---

### GET /worker/sessions/:sessionId/timeline
타임라인 데이터 (시간대별 활동)

**Response:**
```json
{
  "timeline": [
    {
      "hour": 9,
      "activeMinutes": 55,
      "topPrograms": [
        { "name": "chrome", "minutes": 30 },
        { "name": "Illustrator", "minutes": 20 }
      ]
    },
    {
      "hour": 10,
      "activeMinutes": 48,
      "topPrograms": [...]
    }
  ]
}
```

---

### GET /worker/sessions/:sessionId/activities
활동 로그 목록

**Query:**
- `startTime`: ISO8601
- `endTime`: ISO8601

**Response:**
```json
{
  "activities": [
    {
      "id": 12345,
      "startTime": "2026-01-29T09:00:00Z",
      "endTime": "2026-01-29T09:00:10Z",
      "actionCount": 53,
      "isExcluded": false,
      "excludeReason": null,
      "windows": [
        { "name": "chrome", "focusSeconds": 6 }
      ]
    }
  ]
}
```

---

### PATCH /worker/sessions/:sessionId/activities/:activityId
활동 구간 편집 (제외 처리)

**Request:**
```json
{
  "isExcluded": true,
  "excludeReason": "점심시간"
}
```

---

### GET /worker/sessions/:sessionId/screenshots
스크린샷 목록

**Response:**
```json
{
  "screenshots": [
    {
      "id": 12345,
      "capturedAt": "2026-01-29T09:00:00Z",
      "fileUrl": "https://storage.offio.kr/...",
      "isDeleted": false
    }
  ]
}
```

---

### DELETE /worker/sessions/:sessionId/screenshots/:screenshotId
스크린샷 삭제 (소프트 삭제)

**Response:**
```json
{
  "success": true
}
```

---

### PATCH /worker/sessions/:sessionId
근무 기록 편집 (메모 등)

**Request:**
```json
{
  "memo": "외근 후 재택 전환"
}
```

---

### POST /worker/sessions/:sessionId/submit
근무 기록 제출

**Response:**
```json
{
  "success": true,
  "submittedAt": "2026-01-29T19:00:00Z"
}
```

---

### GET /worker/stats/weekly
주간 통계

**Query:**
- `date`: YYYY-MM-DD (해당 주의 아무 날짜)

**Response:**
```json
{
  "weekStart": "2026-01-27",
  "weekEnd": "2026-02-02",
  "totalWorkHours": 42.5,
  "averageWorkHours": 8.5,
  "topPrograms": [
    { "name": "chrome", "hours": 15.2 },
    { "name": "Illustrator", "hours": 12.8 }
  ]
}
```

---

### GET /worker/stats/monthly
월간 통계

**Query:**
- `year`: 2026
- `month`: 1

**Response:**
```json
{
  "year": 2026,
  "month": 1,
  "totalWorkDays": 22,
  "totalWorkHours": 176,
  "averageWorkHours": 8,
  "remoteWorkDays": 18
}
```

---

## 관리자 웹 API

### GET /admin/dashboard
실시간 현황

**Response:**
```json
{
  "today": {
    "totalEmployees": 30,
    "working": 25,
    "notStarted": 3,
    "onLeave": 2
  },
  "currentlyWorking": [
    {
      "userId": "uuid",
      "name": "홍길동",
      "department": "디자인팀",
      "startTime": "2026-01-29T09:00:00Z",
      "currentActiveMinutes": 180
    }
  ]
}
```

---

### GET /admin/sessions
팀원 근무 기록

**Query:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `userId`: UUID (선택)
- `status`: submitted | approved | rejected
- `department`: 부서명 (선택)

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "홍길동",
        "department": "디자인팀"
      },
      "date": "2026-01-29",
      "status": "submitted",
      "totalWorkSeconds": 32400,
      "submittedAt": "2026-01-29T19:00:00Z"
    }
  ]
}
```

---

### GET /admin/sessions/:sessionId
팀원 근무 기록 상세 (타임라인, 스크린샷 포함)

**Response:**
```json
{
  "id": "uuid",
  "user": {
    "id": "uuid",
    "name": "홍길동"
  },
  "date": "2026-01-29",
  "status": "submitted",
  "totalWorkSeconds": 32400,
  "memo": "외근 후 재택",
  "timeline": [...],
  "screenshots": [...]
}
```

---

### POST /admin/sessions/:sessionId/approve
근무 기록 승인

**Request:**
```json
{
  "comment": "확인 완료"
}
```

**Response:**
```json
{
  "success": true,
  "approvedAt": "2026-01-30T10:00:00Z"
}
```

---

### POST /admin/sessions/:sessionId/reject
근무 기록 반려

**Request:**
```json
{
  "comment": "12시~13시 구간 확인 필요"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### GET /admin/reports/monthly
월간 리포트

**Query:**
- `year`: 2026
- `month`: 1

**Response:**
```json
{
  "year": 2026,
  "month": 1,
  "summary": {
    "totalEmployees": 30,
    "totalWorkDays": 22,
    "averageWorkHours": 176
  },
  "employees": [
    {
      "userId": "uuid",
      "name": "홍길동",
      "department": "디자인팀",
      "workDays": 20,
      "totalWorkHours": 168,
      "remoteWorkDays": 18
    }
  ]
}
```

---

### GET /admin/reports/monthly/export
월간 리포트 엑셀 다운로드

**Query:**
- `year`: 2026
- `month`: 1

**Response:** Excel 파일 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

## 사용자 관리 API (Admin)

### GET /admin/users
직원 목록

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@company.com",
      "name": "홍길동",
      "role": "worker",
      "department": "디자인팀",
      "isActive": true
    }
  ]
}
```

---

### POST /admin/users
직원 추가

**Request:**
```json
{
  "email": "new@company.com",
  "name": "김철수",
  "role": "worker",
  "department": "개발팀"
}
```

---

### PATCH /admin/users/:userId
직원 정보 수정

**Request:**
```json
{
  "role": "manager",
  "department": "디자인팀"
}
```

---

### DELETE /admin/users/:userId
직원 비활성화

---

## 에러 응답

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다"
  }
}
```

**에러 코드:**
| 코드 | HTTP | 설명 |
|------|------|------|
| UNAUTHORIZED | 401 | 인증 필요 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| VALIDATION_ERROR | 400 | 입력값 오류 |
| SESSION_ALREADY_STARTED | 400 | 이미 근무 중 |
| SESSION_NOT_FOUND | 404 | 세션 없음 |
| ALREADY_SUBMITTED | 400 | 이미 제출됨 |

---

## MVP 범위

### Phase 1 (MVP) - Lite + Standard 공통
- [x] 인증 (login, refresh, logout)
- [x] 데스크톱 앱 (session, activity, screenshot)
- [x] 근무자 웹 (sessions, timeline, activities, screenshots, submit)
- [x] 관리자 웹 (dashboard, sessions, approve/reject)
- [x] 기본 리포트 (monthly)

### Phase 2 - Standard 차별화
- [ ] 지원금 증빙 리포트 API
- [ ] 엑셀 다운로드

### Phase 3 - Enterprise 기능
- [ ] 직원 프로필 API (UserProfile CRUD)
- [ ] 부서/조직 관리 API
- [ ] 근무 정책 API
- [ ] 회사 설정 API
- [ ] 휴가 신청/승인 API
- [ ] 고급 통계/분석 API

---

## Phase 3 API 상세 (Enterprise)

### GET /admin/users/:userId/profile
직원 상세 정보 조회

**Response:**
```json
{
  "userId": "uuid",
  "phone": "010-1234-5678",
  "employeeNumber": "EMP001",
  "position": "대리",
  "hireDate": "2023-03-01",
  "birthDate": "1990-05-15",
  "annualLeaveDays": 15,
  "usedLeaveDays": 3.5
}
```

---

### PUT /admin/users/:userId/profile
직원 상세 정보 수정

**Request:**
```json
{
  "phone": "010-1234-5678",
  "employeeNumber": "EMP001",
  "position": "과장",
  "hireDate": "2023-03-01",
  "birthDate": "1990-05-15",
  "annualLeaveDays": 17
}
```

---

### GET /admin/users/profiles
전체 직원 프로필 목록 (Enterprise)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@company.com",
      "name": "홍길동",
      "role": "worker",
      "department": "개발팀",
      "profile": {
        "phone": "010-1234-5678",
        "employeeNumber": "EMP001",
        "position": "대리",
        "hireDate": "2023-03-01",
        "annualLeaveDays": 15,
        "usedLeaveDays": 3.5
      }
    }
  ]
}
