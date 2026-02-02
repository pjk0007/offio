# Offio DB 설계

## ERD 개요

```
[Company] 1──N [User] 1──N [WorkSession] 1──N [ActivityLog]
                                                 │
                                                 └──N [Screenshot]
```

---

## 테이블 정의

### 1. Company (회사)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| name | VARCHAR(100) | 회사명 |
| logo_url | VARCHAR(500) | 로고 이미지 URL |
| plan | ENUM | 'basic', 'standard', 'premium' |
| screenshot_interval | INT | 스크린샷 간격 (초), 기본 60 |
| created_at | TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | 수정일 |

---

### 2. User (사용자)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| company_id | UUID | FK → Company |
| email | VARCHAR(255) | 이메일 (로그인 ID) |
| password_hash | VARCHAR(255) | 암호화된 비밀번호 |
| name | VARCHAR(50) | 이름 |
| role | ENUM | 'admin', 'manager', 'worker' |
| department | VARCHAR(100) | 부서명 |
| is_active | BOOLEAN | 활성 여부 |
| created_at | TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | 수정일 |

**role 설명:**
- `admin`: 시스템 관리자 (회사 설정, 전체 관리)
- `manager`: 팀 관리자 (팀원 근태 승인)
- `worker`: 일반 근무자

---

### 3. WorkSession (근무 세션)

하루 단위 근무 기록. 데스크톱 앱에서 "근무 시작" ~ "근무 종료"까지의 세션.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| date | DATE | 근무 날짜 |
| start_time | TIMESTAMP | 근무 시작 시간 |
| end_time | TIMESTAMP | 근무 종료 시간 |
| status | ENUM | 'recording', 'editing', 'submitted', 'approved', 'rejected' |
| total_work_seconds | INT | 총 근무 시간 (초) |
| total_active_seconds | INT | 실제 활동 시간 (초) |
| device_os | VARCHAR(50) | OS 정보 (Windows 11, macOS 등) |
| device_hostname | VARCHAR(100) | 호스트명 |
| device_ip | VARCHAR(45) | IP 주소 |
| memo | TEXT | 근무자 메모 |
| admin_comment | TEXT | 관리자 코멘트 |
| submitted_at | TIMESTAMP | 제출 시간 |
| approved_at | TIMESTAMP | 승인 시간 |
| approved_by | UUID | FK → User (승인자) |
| created_at | TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | 수정일 |

**status 흐름:**
```
recording → editing → submitted → approved
                          ↓
                       rejected → editing (재편집)
```

---

### 4. ActivityLog (활동 로그)

10초 단위 활동 데이터. 기존 Firebase 데이터 구조 기반.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK (AUTO_INCREMENT) |
| session_id | UUID | FK → WorkSession |
| start_time | TIMESTAMP | 구간 시작 |
| end_time | TIMESTAMP | 구간 종료 |
| duration_seconds | INT | 구간 길이 (초) |
| keyboard_count | INT | 키보드 활동 횟수 |
| key_press_count | INT | 키 누름 횟수 |
| mouse_click_count | INT | 마우스 클릭 횟수 |
| mouse_distance | INT | 마우스 이동 거리 (px) |
| action_count | INT | 총 활동 횟수 |
| is_excluded | BOOLEAN | 제외 처리 여부 (점심시간 등) |
| exclude_reason | VARCHAR(100) | 제외 사유 |
| created_at | TIMESTAMP | 생성일 |

**인덱스:**
- `idx_activity_session` (session_id)
- `idx_activity_time` (session_id, start_time)

---

### 5. WindowUsage (프로그램 사용 기록)

ActivityLog와 1:N 관계. 10초 구간 내 프로그램별 사용 시간.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK (AUTO_INCREMENT) |
| activity_log_id | BIGINT | FK → ActivityLog |
| program_name | VARCHAR(100) | 프로그램명 |
| focus_seconds | INT | 포커스 시간 (초) |

**인덱스:**
- `idx_window_activity` (activity_log_id)
- `idx_window_program` (program_name)

---

### 6. Screenshot (스크린샷)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK (AUTO_INCREMENT) |
| session_id | UUID | FK → WorkSession |
| activity_log_id | BIGINT | FK → ActivityLog (nullable) |
| captured_at | TIMESTAMP | 캡처 시간 |
| file_url | VARCHAR(500) | 이미지 URL (S3 등) |
| file_size | INT | 파일 크기 (bytes) |
| is_deleted | BOOLEAN | 삭제 여부 (근무자가 제거) |
| deleted_at | TIMESTAMP | 삭제 시간 |
| created_at | TIMESTAMP | 생성일 |

**인덱스:**
- `idx_screenshot_session` (session_id)
- `idx_screenshot_time` (captured_at)

---

---

## MVP 범위

### Phase 1 (MVP) - Lite + Standard 공통

- [x] Company (기본 정보만)
- [x] User (admin, worker 역할만)
- [x] WorkSession
- [x] ActivityLog
- [x] WindowUsage
- [x] Screenshot

### Phase 2 - Standard 차별화

- [ ] 지원금 증빙 리포트용 뷰/쿼리

### Phase 3 - Enterprise 기능

- [ ] UserProfile (직원 상세 정보) 테이블
- [ ] Department 테이블 분리
- [ ] WorkPolicy (근무 정책) 테이블
- [ ] AuditLog (감사 로그) 테이블
- [ ] LeaveRequest (휴가 신청) 테이블

---

## Phase 3 테이블 상세 (Enterprise)

### UserProfile (직원 상세 정보)

User와 1:1 관계. Enterprise 플랜에서만 사용.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User (UNIQUE) |
| phone | VARCHAR(20) | 휴대폰 번호 |
| employee_number | VARCHAR(50) | 사번 |
| position | VARCHAR(50) | 직급 (사원, 대리, 과장 등) |
| hire_date | DATE | 입사일 |
| birth_date | DATE | 생년월일 |
| annual_leave_days | DECIMAL(4,1) | 연차 일수 |
| used_leave_days | DECIMAL(4,1) | 사용 연차 |
| created_at | TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | 수정일 |

**인덱스:**
- `idx_profile_user` (user_id) UNIQUE

---

## 데이터 예시

### ActivityLog 저장 예시 (기존 JSON → RDB)

**기존 Firebase:**
```json
{
  "distance": 10054,
  "action": 8,
  "mouse": 8,
  "keyboard": 0,
  "press": 0,
  "total": 9,
  "startDateTime": { "seconds": 1769645999 },
  "endDateTime": { "seconds": 1769646012 },
  "openWindows": { "chrome": 5, "Illustrator": 4 },
  "screenshot": ["https://..."]
}
```

**RDB 변환:**

ActivityLog:
| id | session_id | start_time | duration_seconds | keyboard_count | mouse_click_count | mouse_distance | action_count |
|----|------------|------------|------------------|----------------|-------------------|----------------|--------------|
| 1 | abc-123 | 2026-01-29 09:00:00 | 9 | 0 | 8 | 10054 | 8 |

WindowUsage:
| activity_log_id | program_name | focus_seconds |
|-----------------|--------------|---------------|
| 1 | chrome | 5 |
| 1 | Illustrator | 4 |

Screenshot:
| session_id | activity_log_id | captured_at | file_url |
|------------|-----------------|-------------|----------|
| abc-123 | 1 | 2026-01-29 09:00:00 | https://... |
