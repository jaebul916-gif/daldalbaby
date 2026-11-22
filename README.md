# 달달베이비

초보 엄빠를 위한 개월별 육아 가이드. 시기별 필수템 가격비교(새상품·당근 시세), 먹거리, 응급처치 영상, 이번 달 핫템, 엄빠 커뮤니티.

- 프레임워크 없이 HTML, CSS, JavaScript로 만들었어요. 빌드에는 Node만 있으면 되고 따로 설치할 패키지는 없어요.
- 회원과 게시판 데이터는 Supabase에 저장해요.
- GitHub Pages에 배포하고, 검색엔진이 읽을 수 있도록 페이지마다 HTML을 미리 만들어요(SSG).

## 폴더 구조

| 경로 | 내용 |
|---|---|
| `src/page.html` | 모든 페이지의 공통 틀 (메타태그, OpenGraph 자리) |
| `src/style.css` | 스타일 |
| `src/data.js` | Supabase 주소·공개 키, 쿠팡 파트너스 링크, 개월별 데이터, 핫템, 예시 글 |
| `src/core.js` | 화면 HTML을 만드는 함수 (빌드할 때와 브라우저에서 같이 써요) |
| `src/client.js` | 브라우저 전용: 로그인, 게시판 저장, 주소 이동, 클릭 처리 |
| `build.mjs` | `dist/`에 페이지별 HTML, `sitemap.xml`, `robots.txt` 생성 |
| `site.config.json` | 사이트 주소, 네이버·구글 소유확인 코드 |
| `assets/` | 공유 이미지(`og.png`), 파비콘 |
| `supabase/setup.sql` | DB 테이블과 보안 규칙 |
| `.github/workflows/deploy.yml` | main에 올리면 빌드 후 GitHub Pages에 배포 |
| `.github/workflows/supabase-keepalive.yml` | 매일 1번 Supabase를 깨워서 무료 플랜 정지를 막아요 |

## 만들어지는 페이지

| 주소 | 내용 |
|---|---|
| `/` | 홈 |
| `/month/0-1/` ~ `/month/19-36/` | 개월별 가이드 8개 |
| `/emergency/` | 영아 하임리히법·심폐소생술 |
| `/hot/` | 이번 달 핫템 |
| `/community/` | 커뮤니티 (`#free`, `#qna`, `#market`, `#post-번호`) |

## 내 컴퓨터에서 보기

```bash
node build.mjs
cd dist && python3 -m http.server 8000
# http://localhost:8000 접속
```

`node build.mjs --single`을 실행하면 파일 하나짜리 미리보기 `dist/preview.html`도 같이 만들어져요.

## 처음 배포하기

1. 이 폴더를 GitHub 저장소의 main 브랜치에 올려요.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿔요.
3. **Settings → Secrets and variables → Actions → New repository secret**에서 두 개를 등록해요.
   - `SUPABASE_URL`: `https://vzozcsrmwdgsobyvnbjl.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_`로 시작하는 공개 키 (secret 키는 넣지 마세요)
4. **Actions** 탭에서 "Deploy to GitHub Pages"가 초록색이 되면 배포가 끝난 거예요.
5. Supabase 대시보드 **Authentication → URL Configuration**의 Site URL에 `https://daldalbaby.com`을 넣어요. 그래야 가입 인증 메일의 링크가 사이트로 돌아와요.

## daldalbaby.com 도메인 연결

사이트 주소 기준(canonical, OG, sitemap, robots)은 `site.config.json`의 `siteUrl`인 `https://daldalbaby.com`이에요. 빌드할 때 GitHub Pages용 `CNAME` 파일도 자동으로 만들어져요.

1. 도메인을 산 곳(가비아, 후이즈 등)의 DNS 설정에 아래 값을 넣어요.
   - `@` A 레코드 4개: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www` CNAME 레코드: `<GitHub아이디>.github.io`
2. 저장소 **Settings → Pages → Custom domain**에 `daldalbaby.com`을 넣고 저장해요. DNS 확인이 끝나면 **Enforce HTTPS**를 체크해요.
3. DNS가 퍼지는 데 몇 분에서 하루까지 걸릴 수 있어요.

도메인을 연결하기 전에 `github.io` 주소로 먼저 시험해 보려면 저장소 **Settings → Secrets and variables → Actions → Variables**에 `SITE_URL`(예: `https://<아이디>.github.io/<저장소이름>`)을 넣고 배포해요. 도메인을 연결한 뒤에는 이 값을 지우세요.

## 검색엔진 등록

- **구글 서치 콘솔**: 속성을 추가하고 HTML 태그 방식의 코드를 `site.config.json`의 `googleVerification`에 넣은 뒤 다시 배포하고, `sitemap.xml`을 제출해요.
- **네이버 서치어드바이저**: 사이트를 등록하고 HTML 태그 코드를 `naverVerification`에 넣은 뒤 다시 배포하고, 요청 → 사이트맵 제출에서 `sitemap.xml`을 넣어요.

## 쿠팡 파트너스

`src/data.js` 맨 위의 `COUPANG_LINKS`에 상품별 파트너스 단축링크를 `"m6-highchair": "https://link.coupang.com/a/..."` 형식으로 넣어요. 대가성 문구는 필수템 목록 위, 핫템 위, 모든 페이지 푸터에 들어가 있어요.

## Supabase 깨우기

`supabase-keepalive.yml`이 매일 한국시간 오전 9시 17분에 게시글 1개를 읽어요. Actions 탭에서 "Run workflow"로 바로 실행해 볼 수 있어요. GitHub는 60일 동안 커밋이 없는 저장소의 예약 실행을 멈출 수 있어요. 그런 메일이 오면 Actions 탭에서 다시 켜주세요.

## 구글 애드센스

1. 애드센스에 `daldalbaby.com`을 사이트로 추가하고, 게시자 ID(`ca-pub-`로 시작)를 `site.config.json`의 `adsenseClient`에 넣은 뒤 배포해요. 그러면 모든 페이지에 애드센스 스크립트와 `ads.txt`가 자동으로 들어가요.
2. 애드센스 사이트 검토가 끝나면 **광고 → 자동 광고**에서 전면 광고(비네트)와 앵커 광고를 켜요. 당근 링크로 나갈 때 등 페이지를 옮길 때 전면 광고가 떠요.
3. 본문 중간 광고 자리를 쓰려면 디스플레이 광고 단위를 만들고 그 슬롯 번호를 `adsenseSlot`에 넣어요. 비워두면 자동 광고만 나와요.

## 카카오 로그인

로그인·회원가입 화면 맨 위에 카카오 버튼이 있어요. 카카오 회원은 이메일 없이 카카오 닉네임으로 가입돼요.

1. Supabase **Authentication → Sign In / Providers → Kakao**를 켜고 REST API 키와 Client Secret을 넣어요. 이메일 동의를 받지 않으면 **Allow users without an email**을 켜요.
2. 카카오 디벨로퍼스의 Redirect URI에 `https://vzozcsrmwdgsobyvnbjl.supabase.co/auth/v1/callback`을 등록해요.
3. 로그인 뒤에는 사이트 첫 화면(`https://daldalbaby.com`)으로 돌아와요. 이 주소는 Supabase **URL Configuration**의 Site URL과 같아야 해요.
4. `setup.sql`을 이미 실행한 DB라면 `supabase/kakao-login.sql`을 SQL Editor에서 한 번 실행해요. 카카오 닉네임이 겹치거나, 12자를 넘거나, 비어 있어도 가입이 막히지 않게 닉네임을 정리해 주는 업데이트예요.
