/* 달달베이비 브라우저 전용 코드: 저장소(Supabase/데모), 라우터, 이벤트 */
const sb=SB_ON?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
let ME=null;
async function hash(s){try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return"x"+h}}

const Local={
  _posts(){return LS.get("dd-posts",null)||SEED_POSTS.map(p=>({...p,ex:true,at:Date.now()-p.ago*864e5,c:p.c.map(([a,t,ago])=>({a,t,at:Date.now()-ago*864e5}))}))},
  _save(p){LS.set("dd-posts",p)},
  _map(p){return{...p,cn:p.c.length,mine:!!ME&&p.a===ME.nick}},
  async init(){const e=LS.get("dd-session",null),u=LS.get("dd-users",{})[e];ME=u?{id:e,nick:u.nick}:null},
  async list(b,q,lim=50){let l=this._posts().filter(p=>p.b===b);if(q)l=l.filter(p=>(p.t+p.body).includes(q));return l.sort((x,y)=>y.at-x.at).slice(0,lim).map(p=>this._map(p))},
  async get(id){const p=this._posts().find(x=>x.id===id);return p?{...this._map(p),liked:LS.get("dd-liked",[]).includes(id)}:null},
  async create(p){const all=this._posts(),id=Math.max(0,...all.map(x=>x.id))+1;all.unshift({...p,id,a:ME.nick,at:Date.now(),h:0,c:[],st:p.b==="market"?"sale":undefined});this._save(all);return id},
  async comment(id,t){const all=this._posts();all.find(x=>x.id===id).c.push({a:ME.nick,t,at:Date.now()});this._save(all)},
  async like(id){const all=this._posts(),p=all.find(x=>x.id===id),L=new Set(LS.get("dd-liked",[]));if(L.has(id)){L.delete(id);p.h--}else{L.add(id);p.h++}LS.set("dd-liked",[...L]);this._save(all)},
  async setStatus(id,st){const all=this._posts();all.find(x=>x.id===id).st=st;this._save(all)},
  async remove(id){this._save(this._posts().filter(x=>x.id!==id))},
  async signUp(nick,email,pw,month){const us=LS.get("dd-users",{});if(us[email])return{err:"이미 가입된 이메일이에요. 로그인해 주세요."};if(Object.values(us).some(u=>u.nick===nick))return{err:"이미 쓰고 있는 닉네임이에요. 다른 닉네임을 골라주세요."};us[email]={nick,pw:await hash(email+pw),month,joined:Date.now()};LS.set("dd-users",us);LS.set("dd-session",email);ME={id:email,nick};return{}},
  async signIn(email,pw){const u=LS.get("dd-users",{})[email];if(!u||u.pw!==await hash(email+pw))return{err:"이메일이나 비밀번호가 맞지 않아요."};LS.set("dd-session",email);ME={id:email,nick:u.nick};return{}},
  async signOut(){LS.set("dd-session",null);ME=null}
};

const POST_COLS="id,board,title,body,price,region,status,like_count,comment_count,created_at,author_id,author:profiles!posts_author_id_fkey(nick)";
const Remote={
  _map(r){return{id:r.id,b:r.board,t:r.title,body:r.body,a:(r.author&&r.author.nick)||"알 수 없음",at:new Date(r.created_at).getTime(),h:r.like_count,cn:r.comment_count,price:r.price,rg:r.region,st:r.status,mine:!!ME&&r.author_id===ME.id}},
  async _me(s){if(!s){ME=null;return}const{data}=await sb.from("profiles").select("nick").eq("id",s.user.id).maybeSingle();ME={id:s.user.id,nick:(data&&data.nick)||(s.user.user_metadata&&s.user.user_metadata.nick)||"엄빠"}},
  async init(){const{data}=await sb.auth.getSession();await this._me(data.session);sb.auth.onAuthStateChange((ev,s)=>{if(ev==="SIGNED_IN"||ev==="SIGNED_OUT")setTimeout(()=>this._me(s).then(updateMe),0)})},
  async list(b,q,lim=50){let r=sb.from("posts").select(POST_COLS).eq("board",b).order("created_at",{ascending:false}).limit(lim);
    const qq=(q||"").replace(/[,()%*\\]/g," ").trim();if(qq)r=r.or(`title.ilike.%${qq}%,body.ilike.%${qq}%`);
    const{data,error}=await r;if(error)throw error;return data.map(x=>this._map(x))},
  async get(id){const{data,error}=await sb.from("posts").select(POST_COLS+",comments(body,created_at,author:profiles!comments_author_id_fkey(nick))").eq("id",id).maybeSingle();if(error)throw error;if(!data)return null;
    const p=this._map(data);p.c=(data.comments||[]).map(c=>({a:(c.author&&c.author.nick)||"알 수 없음",t:c.body,at:new Date(c.created_at).getTime()})).sort((x,y)=>x.at-y.at);
    p.liked=false;if(ME){const{data:l}=await sb.from("likes").select("post_id").eq("post_id",id).eq("user_id",ME.id).maybeSingle();p.liked=!!l}return p},
  async create(p){const{data,error}=await sb.from("posts").insert({board:p.b,title:p.t,body:p.body,price:p.b==="market"?p.price:null,region:p.b==="market"?p.rg:null}).select("id").single();if(error)throw error;return data.id},
  async comment(id,t){const{error}=await sb.from("comments").insert({post_id:id,body:t});if(error)throw error},
  async like(id,liked){const{error}=liked?await sb.from("likes").delete().eq("post_id",id).eq("user_id",ME.id):await sb.from("likes").insert({post_id:id});if(error&&!/duplicate/i.test(error.message))throw error},
  async setStatus(id,st){const{error}=await sb.from("posts").update({status:st}).eq("id",id);if(error)throw error},
  async remove(id){const{error}=await sb.from("posts").delete().eq("id",id);if(error)throw error},
  async signUp(nick,email,pw,month){
    const{data:ex,error:e1}=await sb.from("profiles").select("id").eq("nick",nick).maybeSingle();if(e1)return{err:krErr(e1)};if(ex)return{err:"이미 쓰고 있는 닉네임이에요. 다른 닉네임을 골라주세요."};
    const{data,error}=await sb.auth.signUp({email,password:pw,options:{data:{nick,baby_month:month===""?null:month},emailRedirectTo:location.origin+location.pathname}});
    if(error)return{err:krErr(error)};if(!data.session)return{confirm:true};await this._me(data.session);return{}},
  async signIn(email,pw){const{data,error}=await sb.auth.signInWithPassword({email,password:pw});if(error)return{err:krErr(error)};await this._me(data.session);return{}},
  async signOut(){await sb.auth.signOut();ME=null}
};
const Store=SB_ON?Remote:Local;
async function fillBoard(b,seq){
  const el=$("#plist");if(!el)return;
  try{const l=await Store.list(b,S.q);if(seq!==routeSeq)return;
    el.innerHTML=l.length?`<ul class="plist">${l.map(p=>postRow(p,b)).join("")}</ul>`:`<div class="empty">${S.q?"검색 결과가 없어요.":"아직 글이 없어요. 첫 글을 남겨보세요."}</div>`}
  catch(e){if(seq===routeSeq)el.innerHTML=`<div class="empty">${esc(krErr(e))}</div>`}
}
async function fillHomeComm(seq){
  const el=$("#home-comm");if(!el)return;
  try{const ps=await Promise.all(["free","qna","market"].map(b=>Store.list(b,"",1).then(l=>l[0])));if(seq!==routeSeq)return;
    el.innerHTML=["free","qna","market"].map((b,i)=>{const p=ps[i];return p
      ?`<a class="tile" href="#post-${p.id}"><span class="eb">${BOARDS[b]}</span><h3>${esc(p.t)}</h3><p>${esc(p.a)} · ${ago(p.at)} · ${HEART("var(--pink)",13)} ${p.h}</p></a>`
      :`<a class="tile" href="#${b}"><span class="eb">${BOARDS[b]}</span><h3>첫 글의 주인공이 되어주세요</h3><p>아직 글이 없어요.</p></a>`}).join("")}
  catch(e){el.innerHTML=""}
}

/* ===== 라우터 ===== */
let lastView="",routeSeq=0;
function updateMe(){const m=$("#me");m.textContent=ME?ME.nick+" · 로그아웃":"로그인";m.href=ME?U("home"):U("login")}
async function route(){
  const seq=++routeSeq,h=currentView();let html,after=null;
  if(h!==lastView&&!BOARDS[h])S.q="";
  const hc=/^cat(\d+)$/.exec((location.hash||"").slice(1));if(hc&&Object.keys(HOT)[+hc[1]])S.hotCat=Object.keys(HOT)[+hc[1]];
  try{
    if(BOARDS[h]){html=boardShell(h);after=()=>fillBoard(h,seq)}
    else if(/^post-\d+$/.test(h)){$("#app").innerHTML=loadingView();html=viewPost(await Store.get(+h.slice(5)))}
    else if(h==="write")html=viewWrite();
    else if(h==="login")html=viewLogin();
    else if(h==="join")html=viewJoin();
    else if(h==="home"||!h){html=viewHome();after=()=>fillHomeComm(seq)}
    else if(["hot","sos","snacks","babyfood","when","checklist"].includes(h)||STAGES.some(s=>s.id===h))html=renderStatic(h);
    else{html=viewHome();after=()=>fillHomeComm(seq)}
  }catch(e){html=errView(e)}
  if(seq!==routeSeq)return;
  $("#app").innerHTML=html;
  const nav=navOf(h);
  document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("on",a.dataset.nav===nav));
  updateMe();
  if(h!==lastView&&lastView!=="")window.scrollTo(0,0);lastView=h;
  const mo=document.querySelector(".mo.on");if(mo)mo.parentElement.scrollLeft=mo.offsetLeft-mo.parentElement.offsetLeft-20;
  if(after)after();
  pushAds();
}
function pushAds(){if(!window.ADS||!window.ADS.slot)return;document.querySelectorAll("ins.adsbygoogle:not([data-adsbygoogle-status])").forEach(()=>{try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}})}
function go(v){const u=U(v);
  if(u.startsWith("#")){if(location.hash===u)route();else location.hash=u.slice(1)}
  else location.href=u;
}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;d.setAttribute("role","status");document.body.appendChild(d);setTimeout(()=>d.remove(),2400)}
const busy=(f,on)=>{const b=f.querySelector("button[type=submit]");if(b){b.disabled=on;b.style.opacity=on?.6:1}};

document.addEventListener("click",async e=>{
  const t=e.target.closest("[data-stype],[data-go],[data-cat],[data-play],[data-sos],[data-hotcat],[data-like],[data-wb],[data-del],[data-after],#me");if(!t)return;
  if(t.id==="me"){if(ME){e.preventDefault();await Store.signOut();toast("로그아웃했어요");route()}return}
  if(t.dataset.after){S.after=t.dataset.after;return}
  if(t.dataset.stype){const v=t.dataset.stype;document.querySelectorAll("[data-stype]").forEach(b=>b.classList.toggle("on",b===t));document.querySelectorAll(".snack,.snackrow").forEach(el=>el.hidden=v!=="전체"&&el.dataset.t!==v);return}
  if(t.dataset.go){const el=document.getElementById(t.dataset.go);if(el)el.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"});document.querySelectorAll(".seg-in button").forEach(b=>b.classList.toggle("on",b===t));return}
  if(t.dataset.cat){S.cat=t.dataset.cat;$("#prod-body").innerHTML=productsBody(stageOf(S.month));return}
  if(t.dataset.sos){S.sos=t.dataset.sos;const b=$("#sos-block");if(b)b.outerHTML=sosBlock();return}
  if(t.dataset.hotcat){S.hotCat=t.dataset.hotcat;if(currentView()==="hot"){e.preventDefault();route()}return}
  if(t.dataset.wb){S.writeBoard=t.dataset.wb;return}
  if(t.dataset.like){if(!ME){S.after=currentView();toast("로그인하면 좋아요를 누를 수 있어요");go("login");return}
    t.disabled=true;try{await Store.like(+t.dataset.like,t.dataset.liked==="1");route()}catch(err){toast(krErr(err));t.disabled=false}return}
  if(t.dataset.del){if(!t.dataset.armed){t.dataset.armed="1";t.textContent="한 번 더 누르면 삭제돼요";t.style.color="var(--danger)";return}
    try{await Store.remove(+t.dataset.del);toast("글을 삭제했어요");go(t.dataset.b)}catch(err){toast(krErr(err))}return}
  if(t.dataset.play){const id=t.dataset.play;
    if(!CAN_EMBED){const a=document.createElement("a");a.href="https://www.youtube.com/watch?v="+id;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();return}
    const f=document.createElement("iframe");f.className="vframe";f.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;f.title="유튜브 영상";f.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";f.allowFullscreen=true;t.replaceWith(f)}
});
document.addEventListener("change",async e=>{const t=e.target;
  if(t.dataset.have){t.checked?S.have.add(t.dataset.have):S.have.delete(t.dataset.have);LS.set("dd-have",[...S.have]);const pb=$("#prod-body");if(pb)pb.innerHTML=productsBody(stageOf(S.month));else{const li=t.closest("li");if(li)li.classList.toggle("have",t.checked)}return}
  if(t.id==="used-only"){S.usedOnly=t.checked;$("#prod-body").innerHTML=productsBody(stageOf(S.month));return}
  if(t.id==="birth"){LS.set("dd-birth",t.value);const bo=birthOut(t.value);if(bo.m!=null){S.month=bo.m;route()}else $("#birth-out").innerHTML=bo.txt;return}
  if(t.id==="w-board"){S.writeBoard=t.value;route();return}
  if(t.id==="st-sel"){try{await Store.setStatus(+t.dataset.post,t.value);toast("거래 상태를 바꿨어요")}catch(err){toast(krErr(err))}}
});
let qTimer;
document.addEventListener("input",e=>{if(e.target.id==="q"){S.q=e.target.value.trim();clearTimeout(qTimer);const b=currentView();qTimer=setTimeout(()=>fillBoard(b,routeSeq),250)}});
document.addEventListener("submit",async e=>{e.preventDefault();const f=e.target;busy(f,true);
  try{
  if(f.id==="jform"){const nick=$("#j-nick").value.trim(),em=$("#j-email").value.trim().toLowerCase(),pw=$("#j-pw").value;
    if(nick.length<2){$("#j-err").textContent="닉네임은 2자 이상으로 정해주세요.";return}
    const r=await Store.signUp(nick,em,pw,$("#j-month").value);
    if(r.err){$("#j-err").textContent=r.err;return}
    if(r.confirm){$("#app").innerHTML=viewCheckMail(em);window.scrollTo(0,0);return}
    toast(nick+" 님, 환영해요!");const a=S.after;S.after=null;go(a||"home")}
  if(f.id==="lform"){const r=await Store.signIn($("#l-email").value.trim().toLowerCase(),$("#l-pw").value);
    if(r.err){$("#l-err").textContent=r.err;return}
    toast(ME.nick+" 님, 반가워요!");const a=S.after;S.after=null;go(a||"home")}
  if(f.id==="wform"){if(!ME)return go("login");const b=$("#w-board").value;
    const p={b,t:$("#w-title").value.trim(),body:$("#w-body").value.trim()};
    if(!p.t||!p.body){$("#w-err").textContent="제목과 내용을 입력해 주세요.";return}
    if(b==="market"){p.price=Math.max(0,+$("#w-price").value||0);p.rg=$("#w-region").value.trim()}
    const id=await Store.create(p);toast("글을 올렸어요");go("post-"+id)}
  if(f.id==="cform"){const t=$("#ctext").value.trim();if(!ME||!t)return;await Store.comment(+f.dataset.post,t);route()}
  }catch(err){const el=f.querySelector(".err");if(el)el.textContent=krErr(err);else toast(krErr(err))}
  finally{busy(f,false)}
});
window.addEventListener("hashchange",route);
if(window.DD)setPage(window.DD.page,window.DD.root);
Store.init().catch(()=>{}).finally(route);
