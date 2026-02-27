# KMOU 대학원 종합 설문조사 시스템

2025학년도 국립한국해양대학교 대학원 종합 설문조사 플랫폼입니다.

## 프로젝트 개요

본 프로젝트는 국립한국해양대학교 대학원생들의 비교과 프로그램 만족도, 대학원 교육 및 연구환경 만족도를 조사하기 위한 웹 기반 설문조사 시스템입니다.

### 설문 구성

- **Part A (비교과 프로그램)**: 16문항
  - 대학원 비교과 프로그램 참여 현황 및 만족도
  - 프로그램 수요 조사

- **Part B (교육/연구환경)**: 50문항
  - B-1: 지도교수 및 지도 관계
  - B-2: 대학원 교과과정
  - B-3: 교육서비스
  - B-4: 연구환경
  - B-5: 시설 및 지원
  - B-6: 대학원 문화

- **Part C (추가 정보)**: 5문항
  - 기본 인구통계학 정보

### 언어 지원

- **한국어**: `/survey` (기본 인터페이스)
- **영어**: `/en/survey` (국제학생 대응)

각 언어별 독립적인 질문 데이터셋과 사용자 인터페이스를 제공합니다.

---

## 기술 스택

### 프론트엔드
- **Next.js 14** - App Router 기반 풀스택 프레임워크
- **React 18** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Radix UI** - 접근성 좋은 UI 컴포넌트
- **shadcn/ui** - 복합 컴포넌트

### 백엔드
- **Next.js API Routes** - 서버리스 API 구현
- **Supabase** - PostgreSQL 기반 백엔드 서비스

### 상태 관리
- **Zustand** - 경량 클라이언트 상태 관리

### 데이터베이스
- **Supabase (PostgreSQL)** - 메인 데이터베이스
- **better-sqlite3** - 로컬 백업/개발 용도 데이터베이스

### 테스트/자동화
- **Playwright** - E2E 테스트 및 스크린샷 자동 생성

---

## 프로젝트 구조

```
kmou-survey/
├── src/
│   ├── app/
│   │   ├── survey/                      # 한국어 설문 페이지
│   │   │   └── page.tsx
│   │   ├── en/
│   │   │   ├── survey/
│   │   │   │   └── page.tsx            # 영어 설문 페이지
│   │   │   └── complete/
│   │   │       └── page.tsx            # 영어 완료 페이지
│   │   ├── complete/                   # 설문 완료 페이지
│   │   │   └── page.tsx
│   │   ├── admin/                      # 관리자 대시보드
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   └── responses/
│   │   │       ├── route.ts           # 설문 응답 제출/저장 API
│   │   │       └── [id]/route.ts      # 개별 응답 조회 API
│   │   ├── layout.tsx                  # 루트 레이아웃
│   │   └── globals.css                 # 전역 스타일
│   ├── components/
│   │   ├── survey/
│   │   │   ├── QuestionRenderer.tsx     # 한국어 질문 렌더러
│   │   │   └── QuestionRendererEN.tsx  # 영어 질문 렌더러
│   │   └── ui/                         # shadcn/ui 컴포넌트
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       └── ...
│   ├── data/
│   │   ├── kmou-questions.ts            # 한국어 설문 문항 데이터
│   │   └── kmou-questions-en.ts         # 영어 설문 문항 데이터
│   ├── lib/
│   │   ├── supabase.ts                  # Supabase 클라이언트 설정
│   │   └── db/
│   │       └── sqlite.ts                # SQLite 로컬 DB (개발 용도)
│   └── store/
│       └── surveyStore.ts               # Zustand 상태 관리
├── public/
│   └── fonts/                           # 로컬 폰트 파일
├── report/
│   ├── REPORT.md                        # 설문 결과 보고서
│   ├── plots/                           # matplotlib 차트 이미지
│   └── screenshots/                     # Playwright 스크린샷
├── data/
│   └── survey.db                        # SQLite 로컬 데이터베이스
├── .env.local                           # 환경 변수 (Git 무시됨)
├── package.json                         # 프로젝트 의존성
├── tsconfig.json                        # TypeScript 설정
├── tailwind.config.ts                   # Tailwind CSS 설정
├── postcss.config.mjs                   # PostCSS 설정
└── README.md                            # 본 문서
```

---

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/username/kmou-survey.git
cd kmou-survey
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```env
# Supabase 설정
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### 4. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 `http://localhost:3002`로 접속합니다.

---

## 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `USE_SUPABASE` | Supabase 사용 여부 (true/false) | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 (서버 전용) | `eyJhbGc...` |
| `NEXT_PUBLIC_APP_URL` | 애플리케이션 URL | `http://localhost:3002` |

**보안 주의사항:**
- `SUPABASE_SERVICE_ROLE_KEY`는 절대로 클라이언트에 노출되지 않습니다
- `.env.local`은 `.gitignore`에 포함되어 있으며 Git에 커밋되지 않습니다

---

## 주요 기능

### 설문 시스템

#### 페이지 기반 진행
- 설문을 질문 5개씩 묶은 페이지 단위로 진행
- Part와 Section 경계에서 자동으로 페이지 분할
- 진행률 % 표시로 사용자 경험 향상

#### 척도 매트릭스
- 연속된 척도 문항 3개 이상을 테이블 형태로 표시
- 동일한 척도 범위를 가진 질문들을 효율적으로 표현
- 한눈에 비교 가능한 레이아웃

#### 섹션 네비게이션
- Part B에서 B-1~B-6 섹션으로 직접 이동 가능
- 섹션 헤더로 현재 위치 명확히 표시
- 소섹션 제목으로 질문의 맥락 제공

#### 조건부 문항
- `conditionalOn` 속성으로 이전 응답에 따라 문항 표시/숨김
- 복잡한 설문 로직 구현 가능

#### 자동 중간 저장
- Part 전환 시 자동으로 응답 저장
- 실수로 인한 데이터 손실 방지
- UUID 기반 응답 추적

#### 반응형 디자인
- 모바일, 태블릿, 데스크톱 모두 최적화
- 터치 친화적 인터페이스
- 접근성(WCAG) 준수

### 질문 유형

| 유형 | 설명 | 사용 사례 |
|------|------|----------|
| `radio` | 단일 선택 | "귀하의 성별은?" |
| `checkbox` | 복수 선택 (maxSelections 지원) | "참여한 프로그램 모두 선택" |
| `scale` | 리커트 척도 (1-5, 1-6 등) | "만족도를 1-5점으로 평가" |
| `ranking` | 클릭 순서 순위 매기기 | "우선순위 상위 3개 선택" |
| `text` | 단답형 | "대학 이름" |
| `paragraph` | 장문형 | "의견이나 건의사항" |

### 관리자 대시보드

**접근 경로:** `/admin`

**인증:**
- 비밀번호: `kmou2025admin`
- sessionStorage 기반 세션 유지 (새 탭에서는 재인증 필요)

**주요 탭:**

1. **개요 (Overview)**
   - 총 응답 수
   - 완료/미완료 응답 현황
   - 언어별 응답 분포

2. **응답 목록 (Responses)**
   - 개별 응답 상세 조회
   - 응답 시간 및 상태 확인
   - 검색 및 필터링 기능

3. **통계 (Statistics)**
   - 차트 기반 데이터 시각화
   - 질문별 응답 분포
   - 요약 통계

---

## 데이터베이스

### Supabase (메인 데이터베이스)

**테이블: `kmou_survey_submissions`**

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 응답 고유 ID |
| `responses` | JSONB | 전체 응답 데이터 (질문ID: 답변 매핑) |
| `submitted_at` | TIMESTAMP | 제출/저장 시간 |
| `language` | TEXT | 언어 코드 ('ko', 'en') |
| `status` | TEXT | 응답 상태 ('draft', 'complete') |
| `ip_address` | TEXT | 응답자 IP 주소 (선택사항) |

**응답 데이터 구조:**
```json
{
  "A-1": "선택항목",
  "A-2": ["항목1", "항목2"],
  "B-1": 4,
  "B-3-1": 3,
  "C-1": "홍길동"
}
```

### SQLite (로컬 백업)

**파일:** `data/survey.db`

**사용 조건:**
- `USE_SUPABASE=false`로 설정 시 활성화
- 개발 및 로컬 테스트 용도

**스키마:**
- Supabase의 `kmou_survey_submissions` 테이블과 동일한 구조

---

## API 엔드포인트

### POST `/api/responses`
설문 응답 제출 또는 저장

**요청 본문:**
```json
{
  "responses": {
    "A-1": "선택값",
    "B-2": 5
  },
  "language": "ko",
  "id": "uuid (기존 응답 업데이트용)",
  "status": "complete"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "submitted_at": "2025-01-10T12:34:56Z"
  }
}
```

### GET `/api/responses`
모든 응답 조회 (관리자 전용)

**응답:**
```json
[
  {
    "id": "uuid",
    "responses": {...},
    "submitted_at": "2025-01-10T12:34:56Z",
    "language": "ko",
    "status": "complete"
  }
]
```

### GET `/api/responses/[id]`
개별 응답 조회

**응답:**
```json
{
  "id": "uuid",
  "responses": {...},
  "submitted_at": "2025-01-10T12:34:56Z",
  "language": "ko",
  "status": "complete"
}
```

---

## 상태 관리

### Zustand Store (`surveyStore.ts`)

설문 응답 상태를 클라이언트에서 관리합니다.

**상태:**
```typescript
{
  responses: Record<string, ResponseValue>;   // 질문ID: 응답값 매핑
  currentIndex: number;                        // 현재 페이지 인덱스
}
```

**메서드:**
- `setResponse(questionId, value)` - 특정 질문 응답 설정
- `setCurrentIndex(index)` - 현재 페이지 인덱스 변경
- `reset()` - 모든 상태 초기화

**사용 예:**
```typescript
const { responses, setResponse, currentIndex } = useSurveyStore();

setResponse('A-1', '선택항목');
```

---

## 이중 언어 구현

### 페이지 구조

```
/survey          → 한국어 (기본)
/en/survey       → 영어
/complete        → 한국어 완료 페이지
/en/complete     → 영어 완료 페이지
/admin           → 관리자 (언어 무관)
```

### 데이터 분리

```
src/data/
├── kmou-questions.ts       # 한국어 질문 (KMOU_SURVEY_QUESTIONS)
└── kmou-questions-en.ts    # 영어 질문 (KMOU_SURVEY_QUESTIONS_EN)
```

### 컴포넌트 분리

```
src/components/survey/
├── QuestionRenderer.tsx     # 한국어 질문 렌더러
└── QuestionRendererEN.tsx   # 영어 질문 렌더러
```

각 언어별 렌더러는 독립적으로 동작하며, 선택지, 라벨, 도움말 등을 각 언어에 맞게 표시합니다.

---

## 결과 보고서

### 위치
```
report/
├── REPORT.md               # 설문 결과 분석 보고서
├── plots/                  # matplotlib 차트 이미지
│   ├── part_a_distribution.png
│   ├── part_b_satisfaction.png
│   └── ...
└── screenshots/            # Playwright 스크린샷
    ├── survey_page_1.png
    ├── admin_dashboard.png
    └── ...
```

### 생성 방법

Playwright를 이용한 자동 스크린샷 생성:
```bash
npx playwright codegen http://localhost:3002
```

matplotlib을 이용한 차트 생성:
```python
import pandas as pd
import matplotlib.pyplot as plt

# 응답 데이터 분석 및 시각화
```

---

## 스크립트 및 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 시작 (포트 3002) |
| `npm run build` | 프로덕션 빌드 생성 |
| `npm run start` | 프로덕션 서버 시작 (포트 3002) |
| `npm run lint` | ESLint 검사 실행 |

---

## 개발 가이드

### 새로운 질문 추가

1. **데이터 정의** (`src/data/kmou-questions.ts`)

```typescript
{
  id: 'A-10',
  part: 'A',
  section: 'A',
  sectionTitle: '비교과 프로그램',
  type: 'scale',
  title: '프로그램 개선사항',
  options: undefined,
  scaleMin: 1,
  scaleMax: 5,
  scaleMinLabel: '매우 불만족',
  scaleMaxLabel: '매우 만족',
  required: true,
  conditionalOn: undefined,
}
```

2. **영어 버전 추가** (`src/data/kmou-questions-en.ts`)

```typescript
{
  id: 'A-10',
  part: 'A',
  section: 'A',
  sectionTitle: 'Co-curricular Programs',
  type: 'scale',
  title: 'Program Improvements',
  // ... 영어 버전
}
```

3. **테스트**
   - 한국어: `/survey`
   - 영어: `/en/survey`

### 질문 타입 확장

`QuestionRenderer.tsx`와 `QuestionRendererEN.tsx`에서 새로운 타입 처리:

```typescript
case 'custom-type':
  return <CustomTypeComponent question={q} value={value} onChange={handleChange} />;
```

### 조건부 로직

```typescript
{
  id: 'B-10',
  type: 'text',
  title: '구체적인 내용을 적어주세요',
  conditionalOn: {
    questionId: 'B-9',
    value: '기타'  // B-9 답변이 '기타'일 때만 표시
  }
}
```

---

## 배포

### Vercel 배포

```bash
vercel
```

환경 변수는 Vercel 대시보드에서 설정합니다.

### 커스텀 서버 배포

```bash
npm run build
npm start
```

---

## 보안 고려사항

- **CORS 설정**: API 엔드포인트는 승인된 도메인만 허용
- **HTTPS**: 프로덕션 환경에서 필수
- **입력 검증**: 모든 사용자 입력 검증 필수
- **IP 추적**: 응답 IP 기록 (선택사항)
- **데이터 암호화**: Supabase Row Level Security (RLS) 정책 설정 권장

---

## 트러블슈팅

### Supabase 연결 오류

```
Error: Failed to fetch from Supabase
```

**해결:**
1. `.env.local` 파일 확인
2. Supabase URL과 키 정확성 확인
3. Supabase 프로젝트가 활성화되었는지 확인

### 포트 3002가 이미 사용 중

```bash
# 다른 포트 사용
npm run dev -- -p 3003
```

### 데이터베이스 마이그레이션

SQLite에서 Supabase로 데이터 이관:

```bash
# Supabase 테이블 생성 후
# 데이터 익스포트/임포트 스크립트 실행
node scripts/migrate-to-supabase.js
```

---

## 기여 가이드

1. **포크**: 저장소를 포크합니다
2. **브랜치**: `git checkout -b feature/your-feature`
3. **커밋**: `git commit -am 'Add new feature'`
4. **푸시**: `git push origin feature/your-feature`
5. **PR**: Pull Request 제출

### 코드 스타일

- **Prettier**: 자동 포매팅
- **ESLint**: 코드 품질 검사
- **TypeScript**: 엄격한 타입 체크

---

## 라이선스

본 프로젝트는 국립한국해양대학교의 내부 프로젝트입니다.

---

## 지원 및 문의

- **버그 보고**: GitHub Issues 사용
- **기능 요청**: GitHub Discussions 사용
- **이메일 지원**: [담당자 이메일]

---

## 변경 이력

### v0.1.0 (2025-01-10)
- 초기 릴리스
- Part A, B, C 완성
- 한국어/영어 이중 언어 지원
- 관리자 대시보드
- Supabase 연동

---

## 감사의 말

- 국립한국해양대학교 대학원
- 설문 참여 대학원생 여러분
- 개발 팀

---

**마지막 업데이트:** 2025년 1월 10일
