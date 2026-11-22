// 달달베이비 정적 사이트 빌드 (Node 18+, 추가 설치 없음)
//   node build.mjs            → dist/ 에 페이지별 HTML, sitemap.xml, robots.txt 생성
//   node build.mjs --single   → dist/preview.html 한 파일 미리보기도 함께 생성
// 사이트 주소는 SITE_URL 환경변수 또는 site.config.json 의 siteUrl 에서 읽어요.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const here = path.dirname(new URL(import.meta.url).pathname);
const src = f => fs.readFileSync(path.join(here, "src", f), "utf8");
const cfg = JSON.parse(fs.readFileSync(path.join(here, "site.config.json"), "utf8"));
const SITE = (process.env.SITE_URL || cfg.siteUrl || "http://localhost:8000").replace(/\/+$/, "");
const OUT = path.join(here, "dist");
const TODAY = new Date().toISOString().slice(0, 10);

// 브라우저와 같은 화면 함수를 Node 안에서 실행해서 HTML을 미리 만들어요.
// 애드센스: site.config.json 의 adsenseClient(ca-pub-...)가 있을 때만 켜져요.
const ADS = cfg.adsenseClient ? { client: cfg.adsenseClient.trim(), slot: (cfg.adsenseSlot || "").trim() } : null;
const ctx = vm.createContext({ console, location: { hostname: "build", hash: "" }, window: ADS ? { ADS } : {} });
for (const f of ["data.js", "core.js"]) vm.runInContext(src(f), ctx, { filename: f });
const run = expr => vm.runInContext(expr, ctx);
const STAGES = run("STAGES");
const WHEN = run("WHEN");
const HOTCATS = run("Object.keys(HOT)");

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trim() + "…" : s);

// 페이지 목록과 검색용 문구
const pages = [
  { page: "home", path: "", priority: "1.0",
    title: "달달베이비 | 개월수별 육아 필수템 당근 vs 새상품 · 출산준비물 · 아기 간식 몇개월부터",
    ogTitle: "달달베이비 · 개월수별 육아 필수템, 당근 vs 새상품 비교",
    desc: "개월수마다 뭘 해줘야 할지 모르는 초보 엄빠를 위한 개월수별 육아 가이드. 출산준비물 꼭 살 것과 안 사도 될 것, 0~36개월 육아용품 당근 vs 새상품 가격 비교, 쌀떡뻥·이유식 몇 개월부터, 아기 열날 때 응급처치까지." },
  ...STAGES.map(s => ({
    page: s.id, path: `month/${s.slug}/`, priority: "0.9",
    title: `${s.kw}${s.kw.includes("당근") ? "" : " · 당근 vs 새상품"} | 달달베이비`,
    ogTitle: `${s.label} · ${s.title}`,
    desc: clip(`${s.kw}. ${s.label} 아기 필수템 ${s.products.length}개를 당근 중고 시세와 새상품 가격으로 비교하고, ${s.feed.main}, 먹어도 되는 것과 안전 수칙까지 정리했어요.`, 160),
    crumb: s.label,
  })),
  { page: "checklist", path: "checklist/", priority: "0.9",
    title: "출산준비물 꼭 살것 안사도 될것 · 신생아 준비물 리스트 당근 vs 새상품 | 달달베이비",
    ogTitle: "출산준비물 꼭 살 것, 당근으로 아낄 것, 안 사도 될 것",
    desc: "출산준비물 꼭 살 것과 안 사도 될 것을 체크리스트로 정리했어요. 젖병·카시트는 새상품으로, 아기침대·바운서는 당근 중고로, 아기 베개·범퍼는 안 사도 돼요. 예상 예산까지.",
    crumb: "출산준비물 리스트" },
  { page: "when", path: "when/", priority: "0.9",
    title: "아기 언제부터? 이유식·떡뻥·물·우유·꿀·보행기 시기 총정리 | 달달베이비",
    ogTitle: "아기 언제부터? 엄빠들이 가장 많이 묻는 시기 총정리",
    desc: clip(`이유식 언제부터, 떡뻥 언제부터, 아기 물 언제부터, 생우유·꿀·주스·보행기 언제부터까지. 엄빠들이 가장 많이 검색하는 ${WHEN.length}가지 시기를 한눈에 정리했어요.`, 160),
    crumb: "아기 언제부터" },
  { page: "sos", path: "emergency/", priority: "0.9",
    title: "아기 열날때·기도막힘 응급처치 · 영아 하임리히법과 심폐소생술 | 달달베이비",
    ogTitle: "아기 열날 때, 숨을 못 쉴 때 응급처치",
    desc: "아기가 음식이 목에 걸렸을 때 영아 하임리히법(등 두드리기·가슴 압박), 아기 열날 때 응급실 가야 하는 경우, 해열제 몇 개월부터, 영아 심폐소생술을 단계별로 정리했어요.", crumb: "아기 응급처치" },
  { page: "snacks", path: "snacks/", priority: "0.9",
    title: "아기 쌀떡뻥·간식 몇개월부터? 개월수별 과자·음료 추천과 성분 비교 | 달달베이비",
    ogTitle: "아기 쌀떡뻥·간식 몇 개월부터? 개월수별 총정리",
    desc: "아기 쌀떡뻥 몇 개월부터, 아기 과자 하루 몇 번, 주스는 언제부터? 6개월 떡뻥부터 두 돌 간식까지 개월수별 간식·음료와 나트륨·당 성분 기준을 비교했어요.", crumb: "아기 간식" },
  { page: "babyfood", path: "babyfood/", priority: "0.8",
    title: "시판 이유식 브랜드 비교·가격 · 배달 이유식 vs 상온 이유식 vs 직접 만들기 | 달달베이비",
    ogTitle: "시판 이유식 브랜드 비교, 한 끼 가격까지",
    desc: "시판 이유식 브랜드 비교와 한 끼 가격. 배달 이유식, 상온 이유식, 직접 만들기의 비용과 장단점을 비교하고 많이 쓰는 이유식 브랜드를 모았어요.", crumb: "시판 이유식 비교" },
  { page: "hot", path: "hot/", priority: "0.7",
    title: "요즘 육아템 추천 · 이번 달 핫템 TOP 3 (젖병·기저귀·장난감) | 달달베이비",
    ogTitle: "이번 달 육아 핫템 TOP 3",
    desc: `요즘 엄빠들이 많이 사는 육아템 추천. 최근 30일 가장 많이 담은 ${HOTCATS.join(", ")} 육아템을 카테고리별 1~3위로 보여드려요.`, crumb: "이번 달 핫템" },
  { page: "community", path: "community/", priority: "0.6",
    title: "엄빠 커뮤니티 · 자유게시판·육아 질문답변·사고팔아요 | 달달베이비",
    ogTitle: "달달베이비 엄빠 커뮤니티",
    desc: "초보 엄마 아빠들이 육아 고민을 나누는 곳. 자유게시판, 개월수별 육아 질문답변, 육아용품 중고 사고팔아요 게시판.", crumb: "엄빠 커뮤니티" },
];

function jsonLd(p) {
  const url = SITE + "/" + p.path;
  const items = [];
  if (p.page === "home") items.push({ "@context": "https://schema.org", "@type": "WebSite", name: "달달베이비", url: SITE + "/", inLanguage: "ko-KR", description: p.desc });
  if (p.crumb) items.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "달달베이비", item: SITE + "/" },
    { "@type": "ListItem", position: 2, name: /개월$/.test(p.crumb) ? `${p.crumb} 가이드` : p.crumb, item: url }] });
  if (p.page === "sos") {
    const infant = run('SOS.find(x=>x.id==="infant")');
    items.push({ "@context": "https://schema.org", "@type": "HowTo", name: "돌 전 아기(영아) 기도폐쇄 응급처치, 하임리히법",
      step: infant.steps.map(([n, t], i) => ({ "@type": "HowToStep", position: i + 1, name: n, text: t })) });
  }
  // 화면 맨 아래 '자주 묻는 질문'과 같은 목록이에요.
  const faqList = run(`pageFaq(${JSON.stringify(p.page)})`);
  if (faqList) items.push({ "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqList.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  return items.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
}

function verifyMeta() {
  let m = "";
  if (cfg.naverVerification) m += `<meta name="naver-site-verification" content="${esc(cfg.naverVerification)}">\n`;
  if (cfg.googleVerification) m += `<meta name="google-site-verification" content="${esc(cfg.googleVerification)}">\n`;
  if (ADS) m += `<meta name="google-adsense-account" content="${esc(ADS.client)}">\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADS.client)}" crossorigin="anonymous"></script>\n`;
  return m;
}

function renderPage(p, { single = false, root: rootOverride } = {}) {
  const depth = p.path.split("/").filter(Boolean).length;
  const root = single ? "" : rootOverride ?? "../".repeat(depth);
  if (single) run("MPA=false;ROOT='';PAGE=null;");
  else run(`setPage(${JSON.stringify(p.page)}, ${JSON.stringify(root)})`);
  const view = p.page === "community" ? "free" : p.page;
  const fill = {
    TITLE: esc(p.title), OG_TITLE: esc(p.ogTitle), DESC: esc(p.desc),
    URL: SITE + "/" + p.path, OG_IMAGE: SITE + "/assets/og.png", ROOT: root, VERIFY: verifyMeta(),
    CSS: single ? `<style>\n${src("style.css")}</style>` : `<link rel="stylesheet" href="${root}assets/style.css?v=${TODAY}">`,
    JSONLD: single ? "" : jsonLd(p),
    TOP: run(`layoutTop(${JSON.stringify(view)})`),
    APP: run(`renderStatic(${JSON.stringify(view)})`),
    TABS: run(`layoutTabs(${JSON.stringify(view)})`),
    FOOTER: run("layoutFooter()"),
    DD: (single ? "" : `<script>window.DD=${JSON.stringify({ page: p.page, root })}</script>`) + (ADS ? `\n<script>window.ADS=${JSON.stringify(ADS)}</script>` : ""),
    SCRIPTS: single
      ? ["data.js", "core.js", "client.js"].map(f => `<script>\n${src(f)}</script>`).join("\n")
      : ["data.js", "core.js", "client.js"].map(f => `<script src="${root}assets/${f}?v=${TODAY}"></script>`).join("\n"),
  };
  return src("page.html").replace(/\{\{(\w+)\}\}/g, (_, k) => (k in fill ? fill[k] : ""));
}

// 출력
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
for (const p of pages) {
  const dir = path.join(OUT, p.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderPage(p));
}
fs.writeFileSync(path.join(OUT, "404.html"), renderPage(pages[0], { root: new URL(SITE + "/").pathname }).replace("<title>", '<meta name="robots" content="noindex">\n<title>'));
for (const f of ["style.css", "data.js", "core.js", "client.js"]) fs.copyFileSync(path.join(here, "src", f), path.join(OUT, "assets", f));
for (const f of fs.readdirSync(path.join(here, "assets"))) fs.copyFileSync(path.join(here, "assets", f), path.join(OUT, "assets", f));
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
// 직접 산 도메인이면 GitHub Pages 용 CNAME 파일을 만들어요.
const host = new URL(SITE).hostname;
if (!/localhost|github\.io$/.test(host)) fs.writeFileSync(path.join(OUT, "CNAME"), host + "\n");

fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(p => `  <url><loc>${SITE}/${p.path}</loc><lastmod>${TODAY}</lastmod><priority>${p.priority}</priority></url>`).join("\n") +
  `\n</urlset>\n`);
// 애드센스 판매자 확인용 ads.txt
if (ADS) fs.writeFileSync(path.join(OUT, "ads.txt"), `google.com, ${ADS.client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

if (process.argv.includes("--single")) {
  const html = renderPage(pages[0], { single: true })
    .replace(/<!doctype html>\s*<html lang="ko">\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/i, "")
    .replace(/<\/head>\s*<body>/, "").replace(/<\/body>\s*<\/html>\s*$/, "");
  fs.writeFileSync(path.join(OUT, "preview.html"), html);
}
console.log(`빌드 완료: ${pages.length}개 페이지 → dist/ (사이트 주소 ${SITE})`);
