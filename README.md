# 내 블로그

마크다운으로 글을 쓰면 블로그 페이지로 만들어 GitHub Pages에 올리는 블로그입니다.

## 폴더 구성

- `posts/`: 블로그 글 (마크다운)
- `pages/`: 소개 같은 고정 페이지
- `public/images/`: 글에 넣을 사진
- `site.config.json`: 블로그 이름, 한 줄 소개
- `src/style.css`: 디자인 (색은 맨 위 `:root`에서 바꿈)
- `src/templates.js`: 화면 틀
- `dist/`: 만들어진 결과물 (자동 생성, 직접 고치지 않음)

## 내 컴퓨터에서 미리 보기

```
npm install      # 처음 한 번만
npm run dev
```

- 브라우저에서 http://localhost:4000 을 엽니다.
- 글을 저장한 뒤 새로고침하면 바로 바뀝니다.
- 미리 보기에서는 초안 글도 보입니다.

## 글 쓰기

`posts/` 폴더에 `날짜-영어주소.md` 이름으로 파일을 만듭니다.
예: `2026-11-20-gangneung-dessert-souvenirs.md` → 글 주소는 `/posts/gangneung-dessert-souvenirs/`

파일 맨 위에 글 정보를 적습니다.

```
---
title: 글 제목
date: 2026-11-20
description: 목록과 검색 결과에 보일 한 줄 요약
category: 강릉 기념품
tags: [강릉, 기념품]
cover: /images/사진이름.jpg
coverAlt: 사진 설명
draft: true
---
```

- `draft: true`: 초안. 미리 보기에서만 보이고 블로그에는 올라가지 않습니다. 다 쓰면 `false`로 바꿉니다.
- `cover`: 대표 사진. `public/images/`에 넣은 사진 이름을 적습니다. 없으면 회색 칸으로 보입니다.

## 다른 지역 신청하기 (에어테이블)

머리말 오른쪽 위 버튼을 누르면 신청 팝업이 열리고, 내용은 에어테이블 '블로그 지역 신청' 표에 저장됩니다.

- 표 정보: `site.config.json`의 `airtable`
- 팝업 동작: `src/request.js`
- 토큰(에어테이블 출입 키): 코드에 직접 넣지 않고 아래 두 곳에 넣습니다.
  - 내 컴퓨터: `.env.example`을 복사해 `.env`를 만들고 `AIRTABLE_TOKEN=토큰` 입력 → `npm run dev` 다시 실행
  - GitHub: 저장소 **Settings → Secrets and variables → Actions → New repository secret**, 이름 `AIRTABLE_TOKEN`

토큰은 https://airtable.com/create/tokens 에서 만듭니다.

- 권한(Scopes): `data.records:write` 하나만
- 접근(Access): '블로그 지역 신청' 베이스 하나만

> 주의: 토큰은 블로그 페이지에 그대로 들어가므로 방문자가 볼 수 있습니다. 그래서 권한을 위처럼 최소로 줍니다. 이상한 신청이 쌓이면 토큰을 지우고 새로 만드세요.

## GitHub Pages에 처음 올리기

1. GitHub에서 새 저장소(repository)를 만듭니다. 주소를 `아이디.github.io`로 하면 블로그 주소가 `https://아이디.github.io`가 됩니다.
2. 이 폴더를 그 저장소의 `main` 브랜치에 올립니다.
3. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿉니다.
4. 이후에는 `main`에 올릴 때마다 자동으로 블로그가 다시 만들어집니다. 진행 상황은 저장소의 **Actions** 탭에서 볼 수 있습니다.
