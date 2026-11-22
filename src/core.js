/* 달달베이비 공용 코드: 화면 HTML을 만드는 함수들. 빌드(Node)와 브라우저 양쪽에서 실행돼요. document는 여기서 바로 쓰지 않아요. */
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const SB_ON=!!(typeof window!=="undefined"&&window.supabase&&SUPABASE_URL&&SUPABASE_KEY&&!/claude|anthropic/i.test(location.hostname));
function krErr(e){const m=(e&&e.message)||String(e);
  if(/Invalid login credentials/i.test(m))return"이메일이나 비밀번호가 맞지 않아요.";
  if(/Email not confirmed/i.test(m))return"메일함에서 인증 링크를 먼저 눌러주세요.";
  if(/already registered|already been registered/i.test(m))return"이미 가입된 이메일이에요. 로그인해 주세요.";
  if(/Password should be/i.test(m))return"비밀번호는 8자 이상으로 정해주세요.";
  if(/rate limit|too many/i.test(m))return"잠시 후 다시 시도해 주세요. 요청이 너무 많았어요.";
  if(/duplicate key.*nick|profiles_nick_key|Database error saving new user/i.test(m))return"이미 쓰고 있는 닉네임이에요. 다른 닉네임을 골라주세요.";
  if(/does not exist|PGRST205|schema cache/i.test(m))return"게시판 DB가 아직 준비되지 않았어요. supabase-setup.sql을 실행해 주세요.";
  return"문제가 생겼어요. 잠시 후 다시 시도해 주세요. ("+m+")"}
const S={month:6,cat:"전체",usedOnly:false,have:new Set(LS.get("dd-have",[])),sos:"infant",hotCat:Object.keys(HOT)[0],writeBoard:"free",q:""};
const CAN_EMBED=!/claude|anthropic/i.test(location.hostname);
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stageOf=m=>STAGES.find(s=>m>=s.from&&m<=s.to)||STAGES[STAGES.length-1];
const man=n=>n>=10000?(Math.round(n/1000)/10).toString().replace(/\.0$/,"")+"만":(n/1000)+"천";
const rng=r=>`${man(r[0])}~${man(r[1])}원`;
const mid=r=>(r[0]+r[1])/2;
const won=n=>(Math.round(n/100)*100).toLocaleString("ko-KR")+"원";
const clean=n=>n.replace(/\(.*?\)/g,"").split("/")[0].trim();
const coupang=(st,p)=>COUPANG_LINKS[st.id+"-"+p.k]||"https://www.coupang.com/np/search?q="+encodeURIComponent(clean(p.n));
const daangn=p=>"https://www.daangn.com/kr/buy-sell/?search="+encodeURIComponent(clean(p.n));
const VERDICT={new:["새상품 추천","v-new"],used:["중고도 좋아요","v-used"],either:["조건부 중고","v-either"]};
const BOARDS={free:"자유게시판",qna:"질문답변",market:"사고팔아요"};
const ago=t=>{const m=(Date.now()-t)/6e4;if(m<1)return"방금";if(m<60)return Math.floor(m)+"분 전";if(m<1440)return Math.floor(m/60)+"시간 전";return Math.floor(m/1440)+"일 전"};
const HEART=(c="var(--pink)",w=18)=>`<svg class="heart" width="${w}" height="${w}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3A5.6 5.6 0 0 1 12 5.6a5.6 5.6 0 0 1 10 6.1C19.5 16.4 12 21 12 21z" fill="${c}"/></svg>`;

/* 웃는 아기 얼굴 일러스트 */
function baby(bg="#FFD6E3",mood="smile",cls="",hair=1){
  const mouth=mood==="open"?`<path d="M42 66q8 11 16 0z" fill="#E2557A"/><path d="M45 70q5 3 10 0" stroke="#FF9DB5" stroke-width="2.5" fill="none" stroke-linecap="round"/>`:`<path d="M42 66q8 8 16 0" stroke="#3B2A22" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  const eyes=mood==="wink"?`<path d="M37 55q4.5-5 9 0" stroke="#3B2A22" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="59" cy="54" r="3.6" fill="#3B2A22"/><circle cx="60.3" cy="52.6" r="1.2" fill="#fff"/>`:`<path d="M37 55q4.5-5 9 0M54 55q4.5-5 9 0" stroke="#3B2A22" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  return `<svg class="${cls}" viewBox="0 0 100 100" role="img" aria-label="웃는 아기 얼굴"><circle cx="50" cy="50" r="50" fill="${bg}"/><circle cx="21" cy="57" r="7" fill="#FFD9C2"/><circle cx="79" cy="57" r="7" fill="#FFD9C2"/><circle cx="50" cy="56" r="29" fill="#FFE5D3"/>${hairSvg(hair)}${eyes}<ellipse cx="35" cy="64" rx="5.5" ry="3.6" fill="#FF9DB5" opacity=".75"/><ellipse cx="65" cy="64" rx="5.5" ry="3.6" fill="#FF9DB5" opacity=".75"/>${mouth}</svg>`;
}
const MOODS=["smile","open","wink"];
/* 개월이 지날수록 머리카락이 자라요: 0(신생아 한 가닥) ~ 7(두 돌, 양갈래) */
function hairSvg(lv){
  const H="#7A5644",st=`stroke="${H}" stroke-width="3" fill="none" stroke-linecap="round"`;
  const curl=`<path d="M50 28q-8-9 1-13q-1 7 3 9" ${st}/>`;
  if(lv<=0)return curl;
  if(lv===1)return curl+`<path d="M43 30q-4-5 0-9M57 30q4-5 0-9" ${st} stroke-width="2.4"/>`;
  if(lv===2)return curl+`<path d="M39 32q-6-6-1-11M61 32q6-6 1-11M45 29q-3-5 1-8M55 29q3-5-1-8" ${st} stroke-width="2.6"/>`;
  if(lv===3)return `<path d="M27 47Q27 26 50 26Q73 26 73 47Q66 36 50 35Q34 36 27 47Z" fill="${H}"/>`+curl;
  const cap=`<path d="M23 54Q21 23 50 22Q79 23 77 54Q73 41 67 38Q61 44 55 38Q49 44 43 38Q37 44 31 39Q26 44 23 54Z" fill="${H}"/>`;
  if(lv===4)return cap+`<path d="M50 23q-6-9 2-13q0 6 2 9" ${st}/>`;
  const sides=`<path d="M23 50q-3 10 2 16q2-8 3-13zM77 50q3 10-2 16q-2-8-3-13z" fill="${H}"/>`;
  if(lv===5)return cap+sides;
  if(lv===6)return cap+sides+`<path d="M50 22q-3-11 6-14q-1 7-3 10z" fill="${H}"/><circle cx="50" cy="22" r="3.4" fill="#FF7AA2"/>`;
  return cap+sides+`<circle cx="21" cy="33" r="8" fill="${H}"/><circle cx="79" cy="33" r="8" fill="${H}"/><circle cx="26" cy="37" r="3" fill="#FF7AA2"/><circle cx="74" cy="37" r="3" fill="#FF7AA2"/>`;
}

/* ===== 공통 조각 ===== */
function monthsRow(active){
  return `<div class="months" role="list">${STAGES.map((s,i)=>`<a role="listitem" class="mo${s.id===active?" on":""}" href="${U(s.id)}">${baby(s.color,MOODS[i%3],"",i)}<b>${s.label}</b><span>${s.name}</span></a>`).join("")}</div>`;
}
function videoCard([id,title,ch]){
  return `<div class="video"><button class="vthumb" data-play="${id}" aria-label="재생: ${esc(title)}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()"><span class="play"></span></button>
  <div class="vmeta"><b>${esc(title)}</b><span>${esc(ch)}</span><a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">유튜브에서 보기 ↗</a></div></div>`;
}
function sosBlock(lv="h2"){
  const s=SOS.find(x=>x.id===S.sos);
  return `<div class="sos-wrap" id="sos-block">
    <div class="sos-title"><${lv}>${lv==="h1"?"영아 하임리히법 · 아기 기도막힘 응급처치":"아기가 숨을 못 쉬어요"}</${lv}><span class="call num">119</span></div>
    <div class="muted" style="font-size:14px">먼저 119에 전화하고 스피커폰으로 안내를 받으며 처치하세요.</div>
    <div class="sos-tabs" role="tablist">${SOS.map(x=>`<button role="tab" aria-selected="${x.id===S.sos}" class="${x.id===S.sos?"on":""}" data-sos="${x.id}">${x.label}</button>`).join("")}</div>
    <div class="sos-body"><ol class="steps">${s.steps.map(([a,b])=>`<li><b>${esc(a)}</b>${esc(b)}</li>`).join("")}</ol><div class="videos">${s.videos.map(videoCard).join("")}</div></div>
    <p class="muted" style="font-size:13px;margin:14px 0 0">일반적인 응급처치 안내예요. 소방서·보건소·대한적십자사의 무료 교육에서 꼭 실습해 두세요.</p>
  </div>`;
}
function birthOut(v){
  if(!v)return{txt:"생일은 이 기기에만 저장돼요.",m:null};
  const b=new Date(v+"T00:00:00"),now=new Date();
  if(isNaN(b)||b>now)return{txt:"오늘 이전 날짜를 넣어주세요.",m:null};
  let m=(now.getFullYear()-b.getFullYear())*12+(now.getMonth()-b.getMonth());if(now.getDate()<b.getDate())m--;
  const d=Math.floor((now-b)/864e5)+1;
  return{txt:`생후 <b class="num">${m}개월</b>, 태어난 지 <b class="num">${d.toLocaleString("ko-KR")}일</b>째예요`,m:Math.min(36,Math.max(0,m))};
}

/* ===== 화면: 홈 ===== */
function viewHome(){
  const saved=LS.get("dd-birth",""),bo=birthOut(saved);
  const hotTop=Object.entries(HOT).slice(0,4).map(([c,l])=>`<a class="tile" href="${hotHref(c)}" data-hotcat="${esc(c)}"><span class="eb">${esc(c)}</span><span class="rank">1위</span><h3>${esc(l[0].n)}</h3><p>${won(l[0].p)} · ${esc(l[0].why)}</p></a>`).join("");
  return `<div class="wrap hero"><div class="hero-grid">
    <div><p class="hero-sub">${TAGLINE}</p><h1>우리 아기에게<br><em>딱 맞는 것만.</em></h1>
      <p>개월 수에 맞춰 꼭 필요한 육아템과 먹거리, 안전 정보를 골라드려요. 초보 엄빠도 헤매지 않게.</p>
      <p class="maker">${HEART("var(--pink)",15)} ${MAKER}</p>
      <div class="birth"><label for="birth">아기 생일</label><input type="date" id="birth" value="${esc(saved)}" max="${new Date().toISOString().slice(0,10)}"></div>
      <div class="birth-out" id="birth-out">${bo.txt}</div>
      ${bo.m!=null?`<a class="btn pink" style="display:inline-flex" href="${U(stageOf(bo.m).id)}">${stageOf(bo.m).label} 가이드 보기</a>`:""}
    </div>
    <div class="hero-art">${baby("#FFE1EA","open","face",2)}<span class="float h1">${HEART("var(--pink)",64)}</span><span class="float h2">${HEART("#FFB3C9",40)}</span><span class="float h3">${HEART("#FF8FB0",44)}</span></div>
  </div></div>
  <div class="wrap sec" style="padding-top:28px"><div class="sec-head"><h2>개월별로 둘러보기.</h2></div>${monthsRow(bo.m!=null?stageOf(bo.m).id:"")}</div>
  ${homeSnacks()}
  ${homeWhen()}
  <div class="wrap sec"><div class="sec-head"><h2>이번 달 핫템. <span class="soft">엄빠들이 제일 많이 담았어요.</span> <span class="tag">예시</span></h2><a href="${U("hot")}">전체 순위 보기 ›</a></div><div class="tiles">${hotTop}</div></div>
  <div class="wrap sec"><div class="sec-head"><h2>엄빠 커뮤니티. <span class="soft">혼자 고민하지 마세요.</span></h2><a href="${U("free")}">커뮤니티 가기 ›</a></div><div class="tiles" id="home-comm"></div></div>
  <div class="wrap sec"><a class="sos-banner" href="${U("sos")}"><b>응급처치, 미리 봐두세요.</b><span>돌 전 하임리히, 돌 이후 하임리히, 영아 심폐소생술을 영상으로 정리했어요.</span><i>지금 보기</i></a></div>`;
}

/* ===== 화면: 가이드 ===== */
function productCard(st,p){
  const max=p.nw[1],pos=r=>`left:${r[0]/max*100}%;width:${Math.max(4,(r[1]-r[0])/max*100)}%`;
  const [vl,vc]=VERDICT[p.v],have=S.have.has(st.id+"-"+p.k);
  return `<article class="card${have?" have":""}">
    <div class="card-top"><div><div class="cat">${esc(p.c)}</div><h4>${esc(p.n)}</h4></div><label class="have-box"><input type="checkbox" id="have-${st.id}-${p.k}" data-have="${st.id}-${p.k}" ${have?"checked":""}>있어요</label></div>
    <p class="why">${esc(p.why)}</p>
    <div class="prices num">
      <div class="pr"><span class="lbl">새상품</span><span class="bar n"><b style="${pos(p.nw)}"></b></span><span class="val">${rng(p.nw)}</span></div>
      <div class="pr"><span class="lbl">당근 시세</span>${p.us?`<span class="bar u"><b style="${pos(p.us)}"></b></span><span class="val">${rng(p.us)}</span>`:`<span class="bar u"></span><span class="val na">중고 비추천</span>`}</div>
    </div>
    <div class="verdict ${vc}"><b>${vl}</b><span>${esc(p.note)}</span></div>
    <div class="actions">${p.v==="used"
      ?`<a class="btn pri" href="${daangn(p)}" target="_blank" rel="noopener">당근 매물 보기</a><a class="btn sec2" href="${coupang(st,p)}" target="_blank" rel="sponsored noopener">쿠팡 새상품</a>`
      :`<a class="btn pri" href="${coupang(st,p)}" target="_blank" rel="sponsored noopener">쿠팡에서 보기</a>${p.us?`<a class="btn sec2" href="${daangn(p)}" target="_blank" rel="noopener">당근 시세</a>`:`<span></span>`}`}</div>
  </article>`;
}
function productsBody(st){
  const cats=["전체",...new Set(st.products.map(p=>p.c))];if(!cats.includes(S.cat))S.cat="전체";
  const list=st.products.filter(p=>(S.cat==="전체"||p.c===S.cat)&&(!S.usedOnly||p.v!=="new"));
  const all=st.products.reduce((a,p)=>a+mid(p.nw),0);
  const smart=st.products.reduce((a,p)=>a+((p.v==="used"&&p.us)?mid(p.us):mid(p.nw)),0);
  const owned=st.products.filter(p=>S.have.has(st.id+"-"+p.k)).length;
  const nNew=st.products.filter(p=>p.v==="new").length;
  return `<dl class="budget num"><div><dt>이 시기 필수템</dt><dd>${st.products.length}개</dd></div><div class="hl"><dt>새상품 추천</dt><dd>${nNew}개</dd></div><div><dt>예상 예산 (추천대로 구매)</dt><dd>${won(smart)}</dd></div><div><dt>준비 완료</dt><dd>${owned} / ${st.products.length}</dd></div></dl>
  <div class="filters">${cats.map(c=>`<button class="chip${c===S.cat?" on":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}<label class="toggle"><input type="checkbox" id="used-only" ${S.usedOnly?"checked":""}>중고 가능한 것만</label></div>
  ${list.length?`<div class="grid">${list.map(p=>productCard(st,p)).join("")}</div>`:`<div class="empty">조건에 맞는 물건이 없어요. 필터를 바꿔보세요.</div>`}
  <p class="muted" style="font-size:13px;margin-top:12px">전부 새상품으로 사면 약 ${won(all)}예요. 가격은 예시 시세예요.</p>`;
}
function viewGuide(st){
  const f=st.feed,i=STAGES.indexOf(st);
  const col=(cls,t,arr)=>`<div class="fcol ${cls}"><h4>${t}</h4><ul>${arr.map(([a,b])=>`<li>${esc(a)}<em>${esc(b)}</em></li>`).join("")}</ul></div>`;
  return `<div class="wrap" style="padding-top:18px">${monthsRow(st.id)}</div>
  <div class="wrap stage-head">${baby(st.color,MOODS[i%3],"",i)}<div><div class="eb">${st.label} · ${st.name}</div><h1>${esc(st.h1)}</h1><p class="lead-title">${esc(st.title)}</p><p>${esc(st.sum)}</p><ul class="miles">${st.miles.map(m=>`<li>${esc(m)}</li>`).join("")}</ul></div></div>
  <div class="seg"><div class="wrap"><div class="seg-in"><button data-go="products" class="on">필수템</button><button data-go="snacks">간식·음료</button><button data-go="food">먹거리</button><button data-go="safety">안전·영상</button><button data-go="faq">자주 묻는 질문</button><button data-go="sos-block">응급처치</button></div></div></div>
  <section class="wrap sec" id="products" style="padding-top:24px"><div class="sec-head"><h2>${st.label} 필수템. <span class="soft">새상품과 당근 시세 비교.</span></h2></div>${cpNote()}<div id="prod-body">${productsBody(st)}</div></section>
  ${adSlot()}
  <section class="wrap sec" id="snacks"><div class="sec-head"><h2>${st.label} 간식·음료. <span class="soft">떡뻥부터 음료까지.</span></h2><a href="${U("snacks")}">개월수별 간식 전체 보기 ›</a></div>${SNACK_GUIDE[st.id].none?"":cpNote()}${snackBlock(st)}</section>
  <section class="wrap sec" id="food"><div class="sec-head"><h2>먹을 수 있는 것.</h2></div>
    <div class="food-intro"><span class="muted" style="font-size:13px">${st.label} 식사</span><b>${esc(f.main)}</b><p>${esc(f.detail)}</p></div>
    <div class="food">${col("f-ok","먹어도 돼요",f.ok)}${col("f-care","조심해서",f.care)}${col("f-no","아직 안 돼요",f.no)}</div></section>
  <section class="wrap sec" id="safety"><div class="sec-head"><h2>안전 수칙과 영상.</h2><span class="muted" style="font-size:14px">${CAN_EMBED?"썸네일을 누르면 바로 재생돼요.":"미리보기에서는 영상이 유튜브 새 탭으로 열려요."}</span></div>
    <ul class="tips">${st.tips.map(([a,b])=>`<li><b>${esc(a)}</b>${esc(b)}</li>`).join("")}</ul><div class="videos">${st.videos.map(videoCard).join("")}</div></section>
  <section class="wrap sec" id="faq"><div class="sec-head"><h2>${st.label} 아기, 자주 묻는 질문.</h2><a href="${U("when")}">아기 언제부터? 전체 보기 ›</a></div>${faqHtml(faqFor(st))}</section>
  <section class="wrap sec">${sosBlock()}</section>`;
}

/* ===== 화면: 핫템 ===== */
function viewHot(){
  const l=HOT[S.hotCat];
  const dl=d=>d==="NEW"?`<span class="delta nw">NEW</span>`:d==="="?`<span class="delta">유지</span>`:d.startsWith("+")?`<span class="delta up">▲ ${d.slice(1)}</span>`:`<span class="delta dn">▼ ${d.slice(1)}</span>`;
  return `<div class="wrap sec" style="padding-top:40px"><div class="sec-head"><h1 class="h-page">이번 달 핫템. <span class="soft">최근 30일 기준.</span> <span class="tag">예시 데이터</span></h1></div>
  ${cpNote()}
  <div class="filters">${Object.keys(HOT).map(c=>`<button class="chip${c===S.hotCat?" on":""}" data-hotcat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
  <div class="podium">${l.map((h,i)=>`<article class="hot${i===0?" first":""}">${dl(h.d)}<span class="medal">${i+1}위</span><h3>${esc(h.n)}</h3><p>${esc(h.why)}</p><div class="hot-stat"><b class="price num">${won(h.p)}</b> · ${esc(h.s)}</div><a class="btn pri" style="margin-top:auto" href="${COUPANG_LINKS["hot-"+h.n]||"https://www.coupang.com/np/search?q="+encodeURIComponent(h.n)}" target="_blank" rel="sponsored noopener">쿠팡에서 보기</a></article>`).join("")}</div>
  <p class="muted" style="font-size:13px;margin-top:16px">순위는 예시예요. 실제 서비스에서는 쿠팡 파트너스 API의 카테고리별 베스트 상품과 사이트 내 클릭 수를 합쳐 매달 자동으로 갱신할 수 있어요.</p></div>`;
}

/* ===== 화면: 커뮤니티 ===== */
const STL={sale:["판매중","st-sale"],res:["예약중","st-res"],done:["거래완료","st-done"]};
const loadingView=()=>`<div class="wrap sec"><div class="empty">불러오는 중이에요…</div></div>`;
const errView=e=>`<div class="wrap sec"><div class="empty">${esc(krErr(e))}</div></div>`;
function postRow(p,b){
  return `<li><a href="${U("post-"+p.id)}">
    <span class="t">${b==="qna"?`<span class="qa">Q.</span>`:""}${b==="market"&&STL[p.st]?`<span class="status ${STL[p.st][1]}">${STL[p.st][0]}</span>`:""}${esc(p.t)}</span>
    <span class="m">${esc(p.a)} · ${ago(p.at)}${p.rg?` · ${esc(p.rg)}`:""}${p.ex?` · <span class="tag">예시</span>`:""}</span>
    <span class="r num">${b==="market"?`<span class="price">${p.price?won(p.price):"나눔"}</span>`:""}<span>${HEART("var(--pink)",14)} ${p.h}</span><span>댓글 ${p.cn}</span></span></a></li>`;
}
function boardShell(b){
  return `<div class="wrap sec" style="padding-top:40px"><div class="sec-head"><h1 class="h-page">엄빠 커뮤니티.</h1></div>
  <nav class="boards" aria-label="게시판">${Object.entries(BOARDS).map(([k,v])=>`<a href="${U(k)}" class="${k===b?"on":""}">${v}</a>`).join("")}</nav>
  ${b==="market"?`<div class="notice"><b>안전 거래 안내</b> 직거래는 사람 많은 곳에서, 송금 전 물건을 꼭 확인하세요. 카시트, 젖꼭지처럼 새상품을 권하는 물건은 거래를 피해주세요.</div>`:""}
  ${b==="qna"?`<div class="notice"><b>의료 질문은</b> 경험 공유로만 참고하시고, 급한 증상은 소아과나 119에 먼저 연락하세요.</div>`:""}
  <div class="board-bar"><input type="search" id="q" placeholder="${BOARDS[b]}에서 검색" value="${esc(S.q)}" aria-label="게시글 검색"><a class="btn pink" href="${U("write")}" data-wb="${b}">${HEART("#fff",16)} 글쓰기</a></div>
  <div id="plist">${loadingView()}</div></div>`;
}
function viewPost(p){
  if(!p)return`<div class="wrap sec"><div class="empty">글을 찾을 수 없어요. 지워졌을 수 있어요. <a href="${U("free")}">목록으로</a></div></div>`;
  return `<div class="wrap sec" style="padding-top:32px"><article class="post">
    <a href="${U(p.b)}" class="muted" style="text-decoration:none;font-size:14px">‹ ${BOARDS[p.b]}</a>
    <h1>${p.b==="qna"?`<span class="qa">Q.</span>`:""}${esc(p.t)}</h1>
    <div class="meta">${baby("#FFE1EA","smile","avatar")}<b style="color:var(--ink)">${esc(p.a)}</b><span>${ago(p.at)}</span>${p.rg?`<span>${esc(p.rg)}</span>`:""}${p.ex?`<span class="tag">예시 글</span>`:""}
      ${p.b==="market"&&STL[p.st]&&!p.mine?`<span class="status ${STL[p.st][1]}">${STL[p.st][0]}</span>`:""}</div>
    ${p.b==="market"?`<div style="font-size:26px;font-weight:900;margin-top:16px" class="num">${p.price?won(p.price):"무료 나눔"}</div>`:""}
    <div class="body">${esc(p.body)}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button class="like${p.liked?" on":""}" data-like="${p.id}" data-liked="${p.liked?1:0}" aria-pressed="${!!p.liked}">${HEART(p.liked?"#fff":"var(--pink)")} 좋아요 ${p.h}</button>
      ${p.mine&&p.b==="market"?`<label class="muted" style="font-size:13px;display:flex;gap:6px;align-items:center" for="st-sel">거래 상태<select id="st-sel" data-post="${p.id}" style="border:1px solid var(--line);border-radius:999px;padding:6px 10px;background:var(--card)">${Object.entries(STL).map(([k,v])=>`<option value="${k}" ${k===p.st?"selected":""}>${v[0]}</option>`).join("")}</select></label>`:""}
      ${p.mine?`<button class="btn sec2" style="background:var(--bg2);margin-left:auto" data-del="${p.id}" data-b="${p.b}">글 삭제</button>`:""}
    </div>
    <div class="comments"><h3 style="font-size:18px">${p.b==="qna"?"답변":"댓글"} ${p.c.length}</h3>
      ${p.c.map(c=>`<div class="cmt"><b>${esc(c.a)}</b><span>${ago(c.at)}</span><p>${esc(c.t)}</p></div>`).join("")}
      ${ME?`<form class="cform" id="cform" data-post="${p.id}"><textarea id="ctext" aria-label="${p.b==="qna"?"답변":"댓글"} 입력" maxlength="2000" placeholder="${p.b==="qna"?"경험을 나눠주세요":"따뜻한 댓글을 남겨주세요"}" required></textarea><button class="btn pink" type="submit">등록</button></form>`
        :`<a class="btn sec2" style="background:var(--bg2)" href="${U("login")}" data-after="post-${p.id}">로그인하고 ${p.b==="qna"?"답변":"댓글"} 남기기</a>`}
    </div></article></div>`;
}
function viewWrite(){
  if(!ME){S.after="write";return viewLogin("글을 쓰려면 로그인이 필요해요.")}
  const b=S.writeBoard;
  return `<div class="wrap"><form class="form wide" id="wform">
    <h1>${BOARDS[b]}에 글쓰기</h1>
    <div class="field"><label for="w-board">게시판</label><select id="w-board">${Object.entries(BOARDS).map(([k,v])=>`<option value="${k}" ${k===b?"selected":""}>${v}</option>`).join("")}</select></div>
    <div class="field"><label for="w-title">제목</label><input id="w-title" required maxlength="60" placeholder="${b==="qna"?"궁금한 점을 한 줄로":"제목을 입력하세요"}"></div>
    ${b==="market"?`<div class="row2"><div class="field"><label for="w-price">가격 (원, 나눔은 0)</label><input id="w-price" type="number" min="0" max="100000000" step="1000" required inputmode="numeric"></div><div class="field"><label for="w-region">거래 지역</label><input id="w-region" required maxlength="30" placeholder="예: 마포구"></div></div>`:""}
    <div class="field"><label for="w-body">내용</label><textarea id="w-body" required maxlength="5000" placeholder="${b==="market"?"사용 기간, 상태, 구성품을 적어주세요":"자유롭게 적어주세요"}"></textarea></div>
    <p class="err" id="w-err"></p>
    <button class="btn pink block" type="submit">등록하기</button>
  </form></div>`;
}
const demoNote=()=>SB_ON?"":`<p class="demo-note">미리보기 데모 모드예요. 계정과 글은 이 브라우저에만 저장돼요.</p>`;
const kakaoBtn=(t)=>`<button type="button" class="btn kakao block" data-kakao="1"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.6 10-8S17.5 3 12 3z"/></svg>${t}</button><div class="or"><span>또는 이메일로</span></div>`;
function viewLogin(msg=""){
  return `<div class="wrap"><form class="form" id="lform">${baby("#FFE1EA","wink","face-top")}
    <h1>다시 만나서 반가워요</h1><p class="sub">${esc(msg||"로그인하고 엄빠들과 이야기 나눠요.")}</p>
    ${kakaoBtn("카카오로 3초 만에 로그인")}
    <div class="field"><label for="l-email">이메일</label><input id="l-email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="l-pw">비밀번호</label><input id="l-pw" type="password" autocomplete="current-password" required></div>
    <p class="err" id="l-err"></p><button class="btn pink block" type="submit">로그인</button>
    <p class="alt">처음이신가요? <a href="${U("join")}">회원가입</a></p>${demoNote()}</form></div>`;
}
function viewJoin(){
  return `<div class="wrap"><form class="form" id="jform">${baby("#FFF0C9","open","face-top")}
    <h1>달달베이비 가족이 되어주세요</h1><p class="sub">가입하면 글쓰기, 댓글, 좋아요를 할 수 있어요.</p>
    ${kakaoBtn("카카오로 시작하기")}
    <div class="field"><label for="j-nick">닉네임 (2~12자)</label><input id="j-nick" required minlength="2" maxlength="12" placeholder="예: 콩이맘"></div>
    <div class="field"><label for="j-email">이메일</label><input id="j-email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="j-pw">비밀번호 (8자 이상)</label><input id="j-pw" type="password" minlength="8" autocomplete="new-password" required></div>
    <div class="field"><label for="j-month">아기 개월 수 (선택)</label><select id="j-month"><option value="">선택 안 함</option>${STAGES.map(s=>`<option value="${s.from}">${s.label}</option>`).join("")}<option value="-1">임신 중</option></select></div>
    <p class="err" id="j-err"></p><button class="btn pink block" type="submit">가입하기</button>
    <p class="alt">이미 계정이 있나요? <a href="${U("login")}">로그인</a></p>${demoNote()}</form></div>`;
}
function viewCheckMail(email){
  return `<div class="wrap"><div class="form">${baby("#E3F1FF","smile","face-top")}<h1>메일을 확인해 주세요</h1>
    <p class="sub">${esc(email)} 으로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나고 바로 로그인돼요.</p>
    <a class="btn sec2 block" style="background:var(--bg2)" href="${U("login")}">로그인 화면으로</a></div></div>`;
}
function viewSOS(){return `<div class="wrap sec" style="padding-top:32px">${sosBlock("h1")}</div>`}

const TAGLINE="개월수별 육아 필수템 · 당근 vs 새상품 비교";
const MAKER="IT대기업 출신 육아대디가 만든 초기육아의 모든것";
/* ===== 쿠팡 파트너스 고지 ===== */
const CP_NOTICE="이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
const cpNote=()=>`<p class="cp-note"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>${CP_NOTICE}</p>`;

/* ===== 주소 =====
   빌드된 사이트(여러 페이지): /month/6/ 같은 실제 주소. 한 파일 미리보기: #m6 같은 해시 주소. */
let MPA=false,ROOT="",PAGE=null;
function setPage(page,root){MPA=true;PAGE=page;ROOT=root}
const PATHS={home:"",hot:"hot/",sos:"emergency/",snacks:"snacks/",babyfood:"babyfood/",when:"when/",checklist:"checklist/"};
STAGES.forEach(s=>{PATHS[s.id]="month/"+s.slug+"/"});
const HASH_VIEWS=/^(free|qna|market|write|login|join|post-\d+)$/;
function U(v){
  if(!MPA)return"#"+v;
  if(PATHS[v]!=null)return ROOT+PATHS[v];
  if(/^(free|qna|market|post-\d+)$/.test(v))return(PAGE==="community"?"":ROOT+"community/")+"#"+v;
  return"#"+v;
}
const hotHref=c=>MPA?U("hot")+"#cat"+Object.keys(HOT).indexOf(c):"#hot";
function currentView(){
  const h=(typeof location!=="undefined"&&location.hash||"").slice(1);
  if(MPA){if(HASH_VIEWS.test(h))return h;return PAGE==="community"?"free":PAGE}
  return h||"home";
}
/* 정적으로 미리 만들 수 있는 화면 */
function renderStatic(v){
  if(STAGES.some(s=>s.id===v)){const st=STAGES.find(s=>s.id===v);S.month=st.from;return viewGuide(st)}
  if(v==="hot")return viewHot();
  if(v==="snacks")return viewSnacks();
  if(v==="when")return viewWhen();
  if(v==="checklist")return viewChecklist();
  if(v==="babyfood")return viewBabyfood();
  if(v==="sos")return viewSOS();
  if(BOARDS[v])return boardShell(v);
  return viewHome();
}
function navOf(v){if(/^m\d+$/.test(v)||v==="when"||v==="checklist")return"guide";if(v==="snacks"||v==="babyfood")return"snack";if(v==="hot")return"hot";if(v==="sos")return"sos";if(BOARDS[v]||v==="write"||/^post-/.test(v)||v==="community")return"board";if(v==="login"||v==="join")return"me";return"home"}

/* ===== 공통 틀: 상단 메뉴, 하단 탭, 푸터 ===== */
const LOGO=`<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3A5.6 5.6 0 0 1 12 5.6a5.6 5.6 0 0 1 10 6.1C19.5 16.4 12 21 12 21z" fill="var(--pink)"/></svg>`;
function layoutTop(v){const n=navOf(v),on=k=>n===k?' class="on" aria-current="page"':"";
  return `<nav class="gnav" aria-label="주 메뉴"><div class="wrap">
  <a class="logo" href="${U("home")}" aria-label="달달베이비 홈">${LOGO}달달베이비</a><span class="tagline">${TAGLINE}</span>
  <div class="links" id="links"><a href="${U("m0")}" data-nav="guide"${on("guide")}>개월별 가이드</a><a href="${U("snacks")}" data-nav="snack"${on("snack")}>간식·이유식</a><a href="${U("hot")}" data-nav="hot"${on("hot")}>이번 달 핫템</a><a href="${U("free")}" data-nav="board"${on("board")}>커뮤니티</a><a href="${U("sos")}" class="sos" data-nav="sos">응급처치</a></div>
  <a class="me" id="me" href="${U("login")}">로그인</a></div></nav>`}
function layoutTabs(v){const n=navOf(v),c=k=>n===k?"on":"";
  return `<nav class="tabbar" aria-label="하단 메뉴" id="tabbar">
  <a href="${U("home")}" data-nav="home" class="${c("home")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z"/></svg>홈</a>
  <a href="${U("m0")}" data-nav="guide" class="${c("guide")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M9.5 12.5h.01M14.5 12.5h.01M9.5 16c1.5 1.2 3.5 1.2 5 0" stroke-linecap="round"/></svg>가이드</a>
  <a href="${U("snacks")}" data-nav="snack" class="${c("snack")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="14.5" cy="9" r="1" fill="currentColor"/><circle cx="13" cy="14.5" r="1.3" fill="currentColor"/><circle cx="8.5" cy="14" r=".9" fill="currentColor"/></svg>간식</a>
  <a href="${U("free")}" data-nav="board" class="${c("board")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>커뮤니티</a>
  <a href="${U("sos")}" data-nav="sos" class="sos ${c("sos")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10" stroke-linecap="round"/></svg>응급</a></nav>`}
function layoutFooter(){
  return `<footer><div class="wrap">
  <nav class="foot-links" aria-label="개월별 가이드">${STAGES.map(s=>`<a href="${U(s.id)}">${s.label} 가이드</a>`).join("")}<a href="${U("checklist")}">출산준비물 리스트</a><a href="${U("when")}">아기 언제부터?</a><a href="${U("snacks")}">개월수별 아기 간식</a><a href="${U("babyfood")}">이유식 브랜드 추천</a><a href="${U("sos")}">영아 응급처치</a><a href="${U("hot")}">이번 달 핫템</a></nav>
  <p class="cp-foot"><b>쿠팡 파트너스 안내</b> ${CP_NOTICE}</p>
  <div>가격, 당근 시세, 핫템 순위는 2026년 11월 기준으로 만든 예시 데이터예요. 실제 가격과 순위는 판매처와 시점에 따라 달라요.</div>
  <div>발달·식단·응급처치 정보는 일반적인 기준이에요. 걱정되는 점은 소아청소년과 전문의와 상의하세요. 영상 저작권은 각 채널에 있어요.</div>
  <p class="foot-maker">${HEART("var(--pink)",14)} ${MAKER}</p>
  <div>© 2026 달달베이비 · daldalbaby.com · ${TAGLINE}</div></div></footer>`}

/* ===== 간식·음료 ===== */
const snackLink=s=>COUPANG_LINKS["snack-"+s.k]||"https://www.coupang.com/np/search?q="+encodeURIComponent(clean(s.n));
const brandLink=b=>COUPANG_LINKS["brand-"+b.k]||"https://www.coupang.com/np/search?q="+encodeURIComponent(b.n.replace(/\(.*?\)/g,"").trim()+(b.g==="snack"?" 아기 간식":" 이유식"));
function snackCard(s,isNew){
  return `<article class="snack" data-t="${esc(s.t)}">
    <div class="snack-top"><span class="stype t${SNACK_TYPES.indexOf(s.t)}">${esc(s.t)}</span><span class="from${isNew?" new":""}">${isNew?"이 시기부터":s.from+"개월부터"}</span></div>
    <h4>${esc(s.n)}</h4><p class="why">${esc(s.why)}</p>
    <p class="stip"><b>고르는 법</b>${esc(s.tip)}</p>
    <div class="snack-foot"><span class="sprice num">${rng(s.p)}<small> / ${esc(s.u)}</small></span><a class="btn pri" href="${snackLink(s)}" target="_blank" rel="sponsored noopener">쿠팡에서 보기</a></div>
  </article>`;
}
function snackNone(st,g){
  return `<div class="snack-none">${baby(st.color,"smile","",STAGES.indexOf(st))}<div><b>${st.label}에는 간식이 필요 없어요</b><p>${esc(g.msg)}</p><a href="${U("snacks")}">6개월부터 먹는 간식 미리 보기 ›</a></div></div>`;
}
function snackBlock(st){
  const g=SNACK_GUIDE[st.id];if(g.none)return snackNone(st,g);
  const l=SNACKS.filter(s=>s.from<=st.to).sort((a,b)=>b.from-a.from);
  return `<div class="snack-guide"><span class="times">${g.times}</span><p>${esc(g.msg)}</p></div>
  <div class="snack-grid">${l.map(s=>snackCard(s,s.from>=st.from)).join("")}</div>
  <p class="muted" style="font-size:13px;margin-top:12px">가격은 예시예요. 성분표와 알레르기 표시는 꼭 직접 확인하세요.</p>`;
}
function homeSnacks(){
  const tiles=STAGES.filter(s=>!SNACK_GUIDE[s.id].none).map(st=>{const g=SNACK_GUIDE[st.id],nw=SNACKS.filter(s=>s.from>=st.from&&s.from<=st.to);
    return `<a class="tile snack-tile" href="${U(st.id)}"><span class="eb">${st.label} · ${g.times}</span><h3>${nw.length?esc(nw.slice(0,2).map(s=>clean(s.n)).join(", ")):"앞 시기 간식 그대로"}</h3><p>${esc(g.msg.split(".")[0])}.</p></a>`}).join("");
  return `<div class="wrap sec"><div class="sec-head"><h2>개월수별 간식·음료. <span class="soft">언제부터 뭘 먹일까?</span></h2><a href="${U("snacks")}">간식 가이드 전체 보기 ›</a></div>
  <div class="tiles five">${tiles}</div>
  <a class="food-banner" href="${U("babyfood")}"><div><b>이유식, 만들까 살까?</b><span>직접 만들기, 배달 이유식, 상온 이유식 비용 비교와 브랜드 추천</span></div><i>브랜드 보기</i></a></div>`;
}
function viewSnacks(){
  const stages=STAGES;
  return `<div class="wrap sec" style="padding-top:40px">
  <div class="sec-head"><h1 class="h-page">아기 간식 언제부터? <span class="soft">개월수별 떡뻥·과자·음료 총정리.</span></h1><a href="${U("babyfood")}">이유식 브랜드 추천 ›</a></div>
  ${cpNote()}
  <h2 class="h-sub">간식 고르는 6가지 기준</h2>
  <ul class="tips">${SNACK_RULES.map(([a,b])=>`<li><b>${esc(a)}</b>${esc(b)}</li>`).join("")}</ul>
  ${nutritionTable()}
  ${adSlot()}
  <div class="filters" role="group" aria-label="간식 종류">${["전체",...SNACK_TYPES].map(t=>`<button class="chip${t==="전체"?" on":""}" data-stype="${esc(t)}">${esc(t)}</button>`).join("")}</div>
  <div class="jump">${stages.map(st=>`<button class="chip" data-go="s-${st.id}">${st.label}</button>`).join("")}</div>
  ${stages.map((st,i)=>{const g=SNACK_GUIDE[st.id],nw=SNACKS.filter(s=>s.from>=st.from&&s.from<=st.to);
    return `<section class="snack-stage" id="s-${st.id}"><div class="ss-head">${baby(st.color,MOODS[i%3],"",i)}<div><h2>${st.label} 아기 간식 <span class="soft">· ${st.name}</span></h2><p>${esc(g.msg)}</p></div>${g.times?`<span class="times">${g.times}</span>`:""}</div>
    ${nw.length?`<div class="snack-grid">${nw.map(s=>snackCard(s,false)).join("")}</div>`:g.none?"":`<p class="muted">새로 시작하는 간식은 없어요. 앞 시기 간식을 이어서 주세요.</p>`}
    <a class="more" href="${U(st.id)}">${st.label} 필수템·먹거리 전체 보기 ›</a></section>`}).join("")}
  <p class="muted" style="font-size:13px;margin-top:20px">가격은 2026년 11월 기준 예시예요. 아기마다 속도가 달라요. 알레르기가 걱정되면 소아청소년과와 상의하세요.</p></div>`;
}
function viewBabyfood(){
  const groups=Object.entries(BRAND_GROUPS);
  return `<div class="wrap sec" style="padding-top:40px">
  <div class="sec-head"><h1 class="h-page">시판 이유식 추천. <span class="soft">배달 이유식 vs 상온 이유식 vs 직접 만들기.</span></h1><a href="${U("snacks")}">개월수별 간식 보기 ›</a></div>
  ${cpNote()}
  <h2 class="h-sub">세 가지 방법 비교</h2>
  <div class="ways">${FOOD_WAYS.map(w=>`<article class="way"><h3>${esc(w.n)}</h3><div class="cost num">${esc(w.cost)}</div>
    <dl><dt>좋은 점</dt><dd>${esc(w.good)}</dd><dt>아쉬운 점</dt><dd>${esc(w.bad)}</dd><dt>이런 집에 맞아요</dt><dd>${esc(w.fit)}</dd></dl></article>`).join("")}</div>
  ${groups.map(([g,label])=>`<h2 class="h-sub">${esc(label)}</h2><div class="brands">${BRANDS.filter(b=>b.g===g).map((b,i)=>`<article class="brand"><span class="mono" style="background:${STAGES[(i*3+g.length)%STAGES.length].color}">${esc(b.n.slice(0,1))}</span><div><h3>${esc(b.n)}</h3><p>${esc(b.d)}</p></div><a class="btn pri" href="${brandLink(b)}" target="_blank" rel="sponsored noopener">쿠팡에서 보기</a></article>`).join("")}</div>`).join("")}
  <p class="notice" style="margin-top:22px"><b>안내</b> 많이 쓰이는 브랜드를 예시로 모았고, 광고나 협찬이 아니에요. 한 끼 비용은 대략적인 예시예요. 단계(초기·중기·후기)와 알레르기 성분은 구매 전에 꼭 확인하세요.</p>
  </div>`;
}

/* ===== 자주 묻는 질문 (검색용) ===== */
function faqFor(st){
  const g=SNACK_GUIDE[st.id],f=st.feed,n=st.products.filter(p=>p.v==="new").map(p=>clean(p.n)),u=st.products.filter(p=>p.v!=="new").map(p=>clean(p.n));
  const l=[
    [`${st.label} 아기는 무엇을 얼마나 먹나요?`,`${f.main}. ${f.detail}`],
    [`${st.label} 아기 간식은 뭘 주면 되나요?`,g.none?g.msg:`${g.times}. ${g.msg} 많이 주는 간식: ${SNACKS.filter(s=>s.from<=st.to).slice(0,4).map(s=>clean(s.n)).join(", ")}.`],
    [`${st.label} 육아 필수템은 뭐가 있나요?`,`${st.products.map(p=>clean(p.n)).join(", ")}이 필요해요.`],
    [`${st.label} 육아용품, 당근 중고로 사도 되나요?`,`${u.length?u.join(", ")+"은 중고로 사도 괜찮아요. ":""}${n.length?n.join(", ")+"은 위생과 안전 때문에 새상품을 추천해요.":""}`],
    [`${st.label} 아기 발달은 어느 정도인가요?`,`${st.miles.join(", ")}. 아기마다 속도가 달라요.`]
  ];
  WHEN.filter(w=>w.st===st.id).forEach(w=>l.push([w.q,`${w.a}. ${w.d}`]));
  return l;
}
const faqHtml=l=>`<div class="faq">${l.map(([q,a],i)=>`<details${i===0?" open":""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;
function homeWhen(){
  return `<div class="wrap sec"><div class="sec-head"><h2>아기 언제부터? <span class="soft">엄빠들이 가장 많이 찾는 질문.</span></h2><a href="${U("when")}">전체 보기 ›</a></div>
  <div class="when-chips">${WHEN.slice(0,10).map(w=>`<a href="${U("when")}" class="wchip">${esc(w.q.replace(/[?]$/,""))}<b>${esc(w.a.split(",")[0])}</b></a>`).join("")}</div>
  <a class="food-banner" style="background:var(--mint-soft)" href="${U("checklist")}"><div><b style="color:var(--mint)">출산준비물 리스트</b><span>꼭 새상품으로 살 것, 당근 중고로 아껴도 되는 것을 나눠 정리했어요</span></div><i style="background:var(--mint)">체크리스트 보기</i></a></div>`;
}
function viewWhen(){
  return `<div class="wrap sec" style="padding-top:40px">
  <div class="sec-head"><h1 class="h-page">아기 언제부터? <span class="soft">이유식·떡뻥·물·우유·꿀 시기 총정리.</span></h1></div>
  <div class="jump">${WHEN.map(w=>`<button class="chip" data-go="w-${w.k}">${esc(w.q.split(" ").slice(0,2).join(" "))}</button>`).join("")}</div>
  <div class="whens">${WHEN.map((w,i)=>`<article class="when" id="w-${w.k}"><h2>${esc(w.q)}</h2><p class="ans">${esc(w.a)}</p><p>${esc(w.d)}</p><a href="${U(w.st)}">${STAGES.find(s=>s.id===w.st).label} 가이드 보기 ›</a></article>${i===5?adSlot():""}`).join("")}</div>
  <p class="muted" style="font-size:13px;margin-top:20px">일반적인 기준이에요. 아기마다 다를 수 있으니 걱정되는 점은 소아청소년과와 상의하세요.</p></div>`;
}
function viewChecklist(){
  const items=[...STAGES[0].products.map(p=>[STAGES[0],p]),...STAGES[1].products.map(p=>[STAGES[1],p])];
  const grp=(title,sub,list)=>`<h2 class="h-sub">${title} <span class="muted" style="font-size:14px;font-weight:400">${sub}</span></h2><ul class="clist">${list.map(([st,p])=>{const id=st.id+"-"+p.k,h=S.have.has(id);
    return `<li class="${h?"have":""}"><label><input type="checkbox" data-have="${id}" id="cl-${id}" ${h?"checked":""}><span><b>${esc(p.n)}</b><em>${esc(p.why)}</em></span></label><span class="cprice num">${rng(p.nw)}${p.us&&p.v!=="new"?`<small>당근 ${rng(p.us)}</small>`:""}</span><a class="btn ${p.v==="used"?"sec2":"pri"}" href="${p.v==="used"?daangn(p):coupang(st,p)}" target="_blank" rel="${p.v==="used"?"noopener":"sponsored noopener"}">${p.v==="used"?"당근":"쿠팡"}</a></li>`}).join("")}</ul>`;
  const nw=items.filter(([,p])=>p.v==="new"),us=items.filter(([,p])=>p.v!=="new");
  const total=items.reduce((a,[,p])=>a+((p.v==="used"&&p.us)?mid(p.us):mid(p.nw)),0);
  return `<div class="wrap sec" style="padding-top:40px">
  <div class="sec-head"><h1 class="h-page">출산준비물 리스트. <span class="soft">신생아 필수템 체크리스트.</span></h1><a href="${U("m0")}">0~1개월 가이드 ›</a></div>
  ${cpNote()}
  <dl class="budget num"><div><dt>준비물</dt><dd>${items.length}개</dd></div><div class="hl"><dt>꼭 새상품</dt><dd>${nw.length}개</dd></div><div><dt>당근 중고 OK</dt><dd>${us.length}개</dd></div><div><dt>예상 예산 (추천대로)</dt><dd>${won(total)}</dd></div></dl>
  ${grp("꼭 새상품으로 사세요","입에 닿거나 안전과 직결되는 물건",nw)}
  ${adSlot()}
  ${grp("당근 중고로 아껴도 돼요","쓰는 기간이 짧고 세척이 쉬운 물건",us)}
  <p class="muted" style="font-size:13px;margin-top:16px">체크한 항목은 이 기기에 저장돼요. 가격은 예시 시세예요.</p></div>`;
}
/* ===== 간식 성분 비교표 ===== */
function nutritionTable(){
  return `<h2 class="h-sub">간식 성분 비교표 <span class="muted" style="font-size:14px;font-weight:400">1회 먹는 양 기준, 이 정도면 좋아요</span></h2>
  <div class="tbl-wrap"><table class="ntable"><thead><tr><th>간식</th><th>시작</th><th>나트륨</th><th>당류</th><th>원재료</th><th></th></tr></thead><tbody>
  ${SNACKS.map(s=>`<tr data-t="${esc(s.t)}" class="snackrow"><td><b>${esc(clean(s.n))}</b><small>${esc(s.t)}</small></td><td class="num">${s.from}개월~</td><td>${esc(s.std.na)}</td><td>${esc(s.std.su)}</td><td>${esc(s.std.ing)}</td><td><a href="${snackLink(s)}" target="_blank" rel="sponsored noopener">쿠팡 ›</a></td></tr>`).join("")}
  </tbody></table></div>
  <p class="muted" style="font-size:12px;margin-top:8px">달달베이비가 정한 고르는 기준이에요. 제품 뒷면 영양성분표의 1회 제공량 수치와 비교해 보세요. 제품별 실제 성분은 쿠팡 연동 후 표시할 예정이에요.</p>`;
}
/* ===== 애드센스 ===== */
const ADS=(typeof window!=="undefined"&&window.ADS)||null;
function adSlot(){
  if(!ADS||!ADS.client||!ADS.slot)return"";
  return `<div class="wrap ad-wrap"><span class="ad-label">광고</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(ADS.client)}" data-ad-slot="${esc(ADS.slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
}
