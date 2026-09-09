# 언제어디

**몇 시, 어디? 약속 정보 한 번에**

링크 하나로 가능한 시간을 맞추고, 필요하면 중간 장소까지 함께 정하는 약속 조율 웹 서비스입니다.

When2meet처럼 심플하게 시간을 맞추고, 필요할 때만 중간 장소 찾기 기능을 사용할 수 있습니다.

## 기능

- 약속방 생성 및 공유 링크
- 아이디/이름으로 간편 참여 (비밀번호 선택)
- 실시간 참여자 입력 현황 표시
- 30분 단위 시간표 (드래그 선택)
- 겹치는 시간 자동 계산
- 중간 장소 찾기 (선택 기능)

## 기술 스택

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Realtime)

## 시작하기

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행합니다.

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 Supabase URL과 API 키를 입력합니다.

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 사용 흐름

1. **약속 만들기** — 이름, 날짜, 시간 범위 입력
2. **링크 공유** — 생성된 링크를 친구에게 전달
3. **참여하기** — 아이디/이름 입력 후 가능한 시간 선택
4. **결과 확인** — 겹치는 시간 자동 표시
5. **중간 장소** (선택) — 출발지 입력 후 추천 장소 확인

## 라이선스

MIT
