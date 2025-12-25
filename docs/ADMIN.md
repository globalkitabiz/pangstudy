# 관리자 메뉴 및 기능 설명서

이 문서는 Pangstudy의 관리자 기능과 UI(관리자 페이지)에 대한 설명서입니다. 관리자 권한을 가진 사용자는 사용자 관리, 과제(Assignments) 할당, 및 운영 리포트를 확인할 수 있습니다.

**위치**
- 관리자 페이지: `ManageUsers` 메뉴에서 각 사용자 옆의 **Assign** 버튼으로 진입
- 관리자 리포트(Week1): `ManageUsers` 하단의 Week 1 Report 섹션에서 확인

## 메뉴 구조

- Users (관리자 전용 추가 액션)
  - View Decks: 사용자가 만든 덱 보기
  - Assign: 사용자에게 덱 또는 개별 카드를 할당하는 모달 열기
  - Admin Report: `week1_completion.md`의 내용을 바로 확인

- Study (일반 사용자)
  - Study by Deck: `/study/:deckId` 경로에서 덱 기준 학습
  - Assigned Study: `/study/assigned` 경로에서 관리자에게 할당된 항목 학습

## 주요 기능 설명

1) Assign (할당 생성)
- 위치: `ManageUsers`의 각 사용자 항목 옆 `Assign` 버튼
- 입력 필드:
  - User ID: 할당 대상 사용자 ID (자동 채움 가능)
  - Deck: 덱을 선택하면 해당 덱의 카드 목록이 로드됩니다
  - Card: 선택 항목이 비어있으면 덱 전체가 할당됩니다
  - Due date: (옵션) 복습 기한 (형식: `YYYY-MM-DD HH:MM:SS`)
  - Repeat days: 반복 간격(정수)
  - Notes: 관리자 메모(학생에게 보여질 수 있음)
- 동작: `POST /api/admin/assign`으로 전송 (관리자 JWT 필요)

2) Assigned Study (사용자 측)
- 접근: `/study/assigned` 또는 UI에서 Assigned 모드로 진입
- 동작: 관리자가 생성한 할당 중 기한이 지났거나 기한 미설정인 항목을 조회하여 학습 목록으로 표시
- 리뷰 완료 시: `POST /api/study/assigned/:id/review` 호출하여 상태를 `completed`로 변경하거나 반복 간격에 따라 다음 기한을 설정

3) 관리자 리포트
- 위치: `ManageUsers` 하단의 Week 1 Report (파일: `client/public/week1_completion.md`)
- 목적: 프로젝트 초반 개발 완료 보고서 확인용

## 인증 및 권한
- 관리자 전용 엔드포인트는 JWT와 `is_admin` 플래그가 필요합니다.
- `is_admin`은 DB의 `users.is_admin` 컬럼(정수, 0/1)으로 관리됩니다.

## 운영 체크리스트
- 관리자 계정 생성 후 `is_admin=1` 설정 필요
- 대량 할당을 자동화하려면 서버사이드 스크립트를 작성하여 여러 `assignments` 행을 추가 가능

## 향후 개선 아이디어 (권장)
- AssignModal에서 사용자 선택 드롭다운 추가
- 알림(이메일/웹훅) 트리거: 할당 시 사용자에게 알림 전송
- 관리자용 할당 목록 페이지(필터/페이징)

---

관리자 문서가 필요하시면 이 파일을 기반으로 더 상세한 운영 절차(스크린샷, 예시 요청/응답 등)를 추가해 드리겠습니다.
