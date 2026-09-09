# Everytime Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시간 찾기 방의 내 시간에서 에브리타임 공개 링크(또는 캡처)를 가져와 수업과 겹치지 않는 칸을 자동 선택한다.

**Architecture:** 순수 함수로 URL·XML·HTML·슬롯 변환을 두고, 서버 액션은 공개 페이지만 읽는다. UI는 기존 `handleSelectionChange`에 `Set`만 넘긴다.

**Tech Stack:** Next.js 16 server actions, Vitest, 기존 TimeGrid/RoomClient.

## Global Constraints

- 날짜만 찾기 방에는 버튼을 두지 않는다.
- 허용 URL은 `everytime.kr/@{id}`와 http/www 변형만.
- 에브리타임 원본(링크·이미지·수업 목록)을 저장하지 않는다.
- 실패 시 기존 선택을 유지하고, 성공 시 통째로 덮어쓴다.
- 비전 API를 쓰지 않는다.
- 실패 문구는 스펙 표를 그대로 쓴다.

---

### Task 1: 슬롯 변환과 URL 파서

**Files:**
- Create: `src/lib/everytime.ts`
- Test: `src/lib/everytime.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `ClassBlock { weekday: number; start: string; end: string }`, `parseEverytimeUrl(input: string): string | null`, `applyTimetableToSlots(dates: string[], timeStart: string, timeEnd: string, blocks: ClassBlock[]): Set<string>`, `parseEverytimeXml(xml: string): ClassBlock[]`, `parseEverytimeHtml(html: string): ClassBlock[]`

- [x] Write failing tests, implement, run vitest

### Task 2: 서버에서 공개 시간표 읽기

**Files:**
- Create: `src/lib/actions/everytime.ts`

**Interfaces:**
- Consumes: Task 1 parsers
- Produces: `importEverytime(formData: FormData): Promise<{ blocks: ClassBlock[] } | { error: string; code: EverytimeImportError }>`

- [x] GET `everytime.kr/@id`, HTML/XML 파싱, 비면 friend API XML, 타임아웃 8초

### Task 3: 가져오기 시트와 내 시간 연결

**Files:**
- Create: `src/components/EverytimeImportSheet.tsx`
- Modify: `src/components/RoomClient.tsx`

- [x] 내 시간에만 버튼, 링크 실패 시 캡처, 성공 시 `handleSelectionChange`

### Task 4: 브라우저 확인

- [x] 내 시간 버튼, 날짜만/입장 전 없음, 가져온 뒤 드래그 저장
