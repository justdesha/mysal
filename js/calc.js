// Bud — calculations. Ported from Bud 0.9.2 (same data format, so existing data loads as is),
// with the 1.0 fixes marked "fix 1.0". No DOM in here: screens import what they need.
const MN=["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
const MS=["січ","лют","бер","кві","тра","чер","лип","сер","вер","жов","лис","гру"];
const MG=["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"];
const ML=["січні","лютому","березні","квітні","травні","червні","липні","серпні","вересні","жовтні","листопаді","грудні"];
const DL=["неділя","понеділок","вівторок","середа","четвер","п’ятниця","субота"];
const DS=["Нд","Пн","Вт","Ср","Чт","Пт","Сб"];
const W_DAY=["день","дні","днів"],W_SH=["зміна","зміни","змін"],W_T=["раз","рази","разів"],W_M=["місяць","місяці","місяців"],W_WK=["тиждень","тижні","тижнів"],W_N=["ніч","ночі","ночей"];
const KEY="mysal7",OLDK="mysal2";
const CUR=[["CZK","Kč","Чеська крона"],["EUR","€","Євро"],["PLN","zł","Польський злотий"],["USD","$","Долар США"],["UAH","₴","Гривня"]];
const FX0={EUR:1,CZK:25,PLN:4.25,USD:1.13,UAH:47.5},CCUR={CZ:"CZK",PL:"PLN",UA:"UAH"};
const CT=[["HPP","HPP — трудовий договір","CZ"],["DPP","DPP — до 300 год на рік","CZ"],["DPČ","DPČ — до пів ставки","CZ"],["ŽL","Živnost — самозайнятість","CZ"],["UoP","Umowa o pracę — трудовий","PL"],["UZ","Umowa zlecenie — доручення","PL"],["UoD","Umowa o dzieło — підряд","PL"],["B2B","B2B / JDG — самозайнятість","PL"],["UAemp","Трудовий договір","UA"],["fop","ФОП","UA"],["UAcpd","ЦПД — цивільно-правовий","UA"],["emp","Трудовий договір (інша країна)",""],["part","Погодинна підробітка",""],["gig","Разовий підробіток",""],["other","Інше / фриланс",""]];
const JC=["#a6d83f","#f2c230","#4fb3e8","#f07ba0","#9b7cf0","#ff9f4a"];
const FUN=[["walk","Прогулянки"],["sport","Спорт"],["friends","Друзі"],["sleep","Відіспатись"],["nature","Природа"],["read","Читання"],["games","Ігри"],["create","Творчість"],["cook","Готувати"],["movies","Кіно й серіали"],["music","Музика"],["trip","Поїздки"]];
const LV=[[0,"Мінус"],[1,"Виживання"],[1.2,"Стабільно"],[1.5,"Запас"],[2,"Свобода"]];
const LVT=["Цього місяця дохід не дотягнув до базових витрат. Буває — головне, що тепер видно, як спланувати наступний.","Базові витрати покриті, але запасу майже нема. Ще трохи — і стане спокійніше.","Витрати покриті й щось лишається. Добрий фундамент.","Є запас: можна впевнено відкладати й не хвилюватись.","Дохід покриває базу двічі. Гарна робота — не забудь і відпочити."];
const pad=n=>String(n).padStart(2,"0");
const ds=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const pk=k=>{const[a,b,c]=k.split("-").map(Number);return new Date(a,b-1,c)};
const mk=(y,m)=>{const d=new Date(y,m,1);return d.getFullYear()+"-"+pad(d.getMonth()+1)};
const dim=(y,m)=>new Date(y,m+1,0).getDate();
const addD=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const monday=d=>addD(d,-((d.getDay()+6)%7));
const today=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())};
const dd=(a,b)=>Math.round((b-a)/864e5);
let TD=today(),TK=ds(TD);
const tm=s=>{const[h,m]=String(s).split(":").map(Number);return h*60+(m||0)};
const mt=x=>{x=((Math.round(x)%1440)+1440)%1440;return pad(Math.floor(x/60))+":"+pad(x%60)};
const nf=(n,d=1)=>(Math.round(n*10**d)/10**d).toLocaleString("uk-UA",{maximumFractionDigits:d});
const sym=c=>(CUR.find(x=>x[0]===(c||S.cur))||CUR[0])[1];
const kc=(n,c)=>Math.round(n).toLocaleString("uk-UA")+"\u00a0"+sym(c);
const gx=(m,f)=>{const x=S&&S.prof&&S.prof.sx;return x==="f"?f:x==="m"?m:m+"/"+f};
const sgv=()=>num(S.cfg.sg)||8,prepv=()=>num(S.cfg.prep)||60,offv=()=>num(S.cfg.off)||2;
const toM=(n,c)=>{if(!c||c===S.cur)return n;const f=S.fx||FX0;return n/(num(f[c])||FX0[c]||1)*(num(f[S.cur])||FX0[S.cur]||1)};
const hf=h=>nf(h)+"\u00a0год";
const hm=m=>{m=Math.round(m);const h=Math.floor(m/60),r=m%60;return h+"\u00a0год"+(r?" "+r+"\u00a0хв":"")};
const pl=(n,f)=>{n=Math.abs(Math.round(n));const a=n%10,b=n%100;return f[a===1&&b!==11?0:a>=2&&a<=4&&(b<12||b>14)?1:2]};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const num=v=>{const x=parseFloat(String(v).replace(/\s/g,"").replace(",","."));return isFinite(x)&&x>=0?x:0};
const uid=()=>Math.random().toString(36).slice(2,9);
const dLong=d=>d.getDate()+" "+MG[d.getMonth()];
function rng(a,b){return a.getMonth()===b.getMonth()?a.getDate()+"–"+b.getDate()+" "+MG[b.getMonth()]:dLong(a)+" – "+dLong(b)}
const DEFR={rate:0,mult:1,bonus:0};
function newJob(n,c,cur){return{id:uid(),n:n||"",c:c||JC[0],ct:"",pt:"",cur:cur||"CZK",pd:"",lag:"",brk:"",yl:0,bn:"",bd:"",zd:[],zs:false,st:""}}
function blank(){const j={...newJob("",JC[0],"CZK"),id:"j1"};
  return{v:4,u:0,name:"",cur:"CZK",curSet:false,onb:false,demo:false,jobs:[j],rates:{j1:{}},days:{},sleep:{},slips:[],sv:{},bal:{a:0,d:""},gigs:[],fx:{...FX0},prof:{bd:"",ph:[],av:"",sx:""},nt:{read:{},ver:"",badge:false,log:[],del:{}},since:"",lastBk:"",sp:[],abs:{},jhide:false,jfin:false,
  tpl:[],
  base:[],
  goals:[{id:"cush",n:"Подушка безпеки",t:0,s:0}],
  cfg:{week:0,wkU:false,rest:11,off:0,fun:[],target:0,theme:"auto",sg:0,prep:0,lb:"",lw:"",ls:"",last:0}}}
function migrate(p){const b=blank();if(!p||typeof p!=="object")return b;
  if((p.v||0)<4){const j=b.jobs[0],c=p.cfg||{};j.brk=c.brk||0;j.yl=c.yl||0;if(c.zd)j.zd=c.zd;
    const days={};for(const[k,e]of Object.entries(p.days||{})){if(!e)continue;if(e.t==="o")days[k]={o:1};else if(e.t==="w"){const h=e.h||8,x={id:uid(),j:"j1",h,z:!!e.z};if(e.s){x.s=e.s;x.e=mt(tm(e.s)+h*60)}days[k]={sh:[x]};if(e.f)days[k].f=e.f}}
    p={...p,v:4,days,rates:{j1:p.rates||{}}}}
  const o={...b,...p,cfg:{...b.cfg,...(p.cfg||{})}};
  ["jobs","tpl","base","goals","slips"].forEach(k=>{if(!Array.isArray(o[k]))o[k]=b[k]});
  ["sleep","sv","rates","days"].forEach(k=>{if(!o[k]||typeof o[k]!=="object")o[k]={}});
  if(!o.bal)o.bal={a:0,d:""};if(!CUR.find(x=>x[0]===o.cur))o.cur="CZK";if(!Array.isArray(o.gigs))o.gigs=[];if(!Array.isArray(o.sp))o.sp=[];if(!o.abs||typeof o.abs!=="object")o.abs={};if(!o.fx)o.fx={...FX0};if(!o.prof)o.prof={bd:"",ph:[],av:"",sx:""};if(o.prof.sx==null)o.prof.sx="";if(p.curSet===undefined)o.curSet=true;if(!Array.isArray(o.prof.ph))o.prof.ph=[];if(!o.nt)o.nt={read:{},ver:"",badge:false};if(!o.nt.read)o.nt.read={};
  if((o.mv||0)<1&&o.onb){const rm=[],used={};(o.sp||[]).forEach(x=>{const d=pk(x.k),last=dim(d.getFullYear(),d.getMonth());
      if(o.bal&&x.k===o.bal.d)return;
      const b=(o.base||[]).find(b=>num(b.d)&&Math.min(num(b.d),last)===d.getDate()&&Math.abs(num(b.a)-num(x.a))<.01&&(!x.cur||x.cur===o.cur)&&!used[b.id+x.k]);
      if(b){used[b.id+x.k]=1;rm.push({id:x.id,n:x.n||"Витрата",a:num(x.a),k:x.k,b:b.n})}});
    if(rm.length){const ids=new Set(rm.map(r=>r.id));o.sp=o.sp.filter(x=>!ids.has(x.id));o.mvNote=rm}o.mv=1}if(!Array.isArray(o.nt.log))o.nt.log=[];if(!o.nt.del)o.nt.del={};o.jobs.forEach(j=>{if(!j.cur||!CUR.find(x=>x[0]===j.cur))j.cur=o.cur;if(!j.pt)j.pt="h";if(j.bd==null)j.bd="";if(j.zs==null)j.zs=false;if(j.st==null)j.st=""});if(!o.jobs.length)o.jobs=b.jobs;o.jobs.forEach(j=>{if(!o.rates[j.id])o.rates[j.id]={}});
  return o}
let S=blank();
const jc=id=>(job(id).cur||S.cur);
const job=id=>S.jobs.find(j=>j.id===id)||S.jobs[0];
const multi=()=>S.jobs.length>1;
function R(j,y,m){const t=S.rates[j]||{},e=t[mk(y,m)];if(e)return e;for(let i=1;i<=48;i++){const x=t[mk(y,m-i)];if(x)return x}const ks=Object.keys(t).sort();return ks.length?t[ks[0]]:DEFR}
function pin(y,m){const k=mk(y,m);if(k>mk(TD.getFullYear(),TD.getMonth()))return;S.jobs.forEach(j=>{const t=S.rates[j.id]||(S.rates[j.id]={});if(!t[k])t[k]={...R(j.id,y,m)}})}
const shH=x=>{if(x.s&&x.e){let d=tm(x.e)-tm(x.s);if(d<=0)d+=1440;return d/60}return num(x.h)};
const paidH=x=>{const h=shH(x),b=num(job(x.j).brk);return Math.max(0,h-(b&&h>6?b/60:0))};
const shG=(x,y,m)=>{if(job(x.j).pt!=="h")return 0;const r=R(x.j,y,m);return paidH(x)*r.rate+(x.z?num(r.bonus):0)};
const shN=(x,y,m)=>shG(x,y,m)*R(x.j,y,m).mult;
const shOf=k=>(S.days[k]&&S.days[k].sh)||[];
const isWd=k=>shOf(k).length>0;
const isOff=k=>!!(S.days[k]&&S.days[k].o);
const mSum=(y,m,jf)=>sumR(new Date(y,m,1),new Date(y,m,dim(y,m)),jf);
const baseSum=()=>S.base.reduce((a,x)=>a+num(x.a),0);
const goalT=g=>g.id==="cush"&&!num(g.t)?baseSum()*3:num(g.t);
const autoTarget=()=>{const b=baseSum();return b?Math.ceil(b*1.5/500)*500:0};
const target=()=>num(S.cfg.target)||autoTarget();
const norm=()=>num(S.cfg.week)||40;
const restMin=()=>(num(S.cfg.rest)||11)*60;
const netRate=(y=TD.getFullYear(),m=TD.getMonth(),j=bestJob())=>{const r=R(j,y,m);return toM(r.rate*r.mult,job(j).cur)||1};
function avgShift(){let h=0,n=0;for(let d=addD(TD,-60);d<=TD;d=addD(d,1))for(const x of shOf(ds(d))){h+=paidH(x);n++}return n>=3?h/n:8}
function blocks(a,b){const L=[];for(let d=a,i=0;d<=b;d=addD(d,1),i++){const k=ds(d),sh=shOf(k).filter(x=>x.s&&x.e);if(!sh.length)continue;
  const base=dd(a,d)*1440;let s=1e9,e=-1;sh.forEach(x=>{const ss=base+tm(x.s),ee=ss+shH(x)*60;s=Math.min(s,ss);e=Math.max(e,ee)});L.push({k,s,e})}return L}
function overlaps(k){const sh=shOf(k).filter(x=>x.s&&x.e).map(x=>({x,s:tm(x.s),e:tm(x.s)+shH(x)*60})).sort((a,b)=>a.s-b.s),r=[];
  for(let i=0;i<sh.length;i++)for(let j=i+1;j<sh.length;j++){const o=Math.min(sh[i].e,sh[j].e)-sh[j].s;if(o>0)r.push({a:sh[i].x,b:sh[j].x,min:o})}return r}
function shortRests(a,b){const L=blocks(addD(a,-1),b),r=[];for(let i=1;i<L.length;i++){const g=L[i].s-L[i-1].e;if(L[i].k>=ds(a)&&g<restMin()&&pk(L[i].k)-pk(L[i-1].k)<=864e5*1.5)r.push({k:L[i].k,pk:L[i-1].k,g})}return r}
function stats(a,b){const end=b>TD?TD:b,wk={};let w=0,wd=0,h=0,st=0,mx=0,late=0,early=0,er=0,en=0,lg=0,lgH=0,days=0;
  for(let d=a;d<=end;d=addD(d,1)){days++;const k=ds(d),sh=shOf(k).filter(x=>!x.pl),m=ds(monday(d)),day=S.days[k];wk[m]=wk[m]||{n:0,w:0};wk[m].n++;
    if(sh.length){wd++;wk[m].w++;st++;mx=Math.max(mx,st);let dh=0;sh.forEach(x=>{w++;dh+=paidH(x);if(x.s){if(tm(x.s)<360)early++;if(tm(x.s)+shH(x)*60>1320)late++}});h+=dh;
      if(day.f){er++;en+=day.f;if(dh>=10){lg++;if(day.f===1)lgH++}}}else st=0}
  const tight=Object.values(wk).filter(x=>x.n===7&&x.w>7-offv()).length,short=a<=end?shortRests(a,end).length:0;
  return{w,wd,h,mx,short,late,early,er,en,lg,lgH,days,tight,avg:w?h/w:0,pw:days?h/(days/7):0,fe:er?en/er:0}}
const curStreak=()=>{let n=0;for(let d=TD;isWd(ds(d));d=addD(d,-1))n++;return n};
const feel=x=>!x?"—":x<1.7?"важко":x<2.4?"нормально":"легко";
function level(c){let i=0;LV.forEach((l,j)=>{if(c>=l[0])i=j});return i}
const hasData=()=>Object.keys(S.days).length>0;
const slDur=e=>{if(!e||!e.b||!e.w)return 0;let d=tm(e.w)-tm(e.b);if(d<=0)d+=1440;return d};
function sleepStats(a,b){let n=0,t=0,short=0,q=0,qn=0;const bt=[],pre=[];
  for(let d=a;d<=b;d=addD(d,1)){const k=ds(d),e=S.sleep[k],m=slDur(e);if(!m)continue;n++;t+=m;if(m<420)short++;let x=tm(e.b);if(x<720)x+=1440;bt.push(x);if(e.q){q+=e.q;qn++}
    const f=shOf(k).filter(x=>x.s).sort((a,b)=>tm(a.s)-tm(b.s))[0];if(f&&tm(f.s)<540)pre.push(m)}
  const avgB=bt.length?bt.reduce((s,x)=>s+x,0)/bt.length:0,spread=bt.length>1?Math.sqrt(bt.reduce((s,x)=>s+(x-avgB)**2,0)/bt.length):0;
  return{n,avg:n?t/n:0,short,avgB,spread,fq:qn?q/qn:0,pre:pre.length?pre.reduce((s,x)=>s+x,0)/pre.length:0,preN:pre.length}}
const prevM=()=>{const d=new Date(TD.getFullYear(),TD.getMonth()-1,1);return[d.getFullYear(),d.getMonth()]};
function saveAdvice(y,m){const base=baseSum(),s=mSum(y,m);if(!base||!s.n)return null;const free=s.n-base;if(free<0)return{free,save:0,life:0,base,n:s.n,li:0};
  const li=level(s.n/base),sh=li<=1?.3:li===2?.4:li===3?.5:.6,save=Math.floor(free*sh/100)*100;return{free,save,life:free-save,base,n:s.n,li,sh}}
function yearUse(j,y){let h=0,p=0;for(let d=new Date(y,0,1);d<=new Date(y,11,31);d=addD(d,1)){const k=ds(d);shOf(k).forEach(x=>{if(x.j===j){if(k>TK)p+=paidH(x);else h+=paidH(x)}})}return{h,p}}
function slipFor(j,per){return S.slips.find(s=>s.j===j&&s.m===per)}
const INCM=[["all","Усі джерела"],["main","Основна робота"],["side","Додаткові"]];
const jobSide=j=>!!(j&&j.side);
const gigSide=g=>{if(g.side!==undefined)return!!g.side;const j=g.j&&S.jobs.find(x=>x.id===g.j);return j?jobSide(j):true};
const incM=()=>S.cfg.inc||"all";
const incOk=side=>{const m=incM();return m==="all"||(m==="side")===!!side};
const hasSide=()=>S.jobs.some(jobSide)||S.gigs.some(g=>num(g.a)&&gigSide(g));
function gigNet(g){return g.tx==="gross"?num(g.a)*(num(g.p)||85)/100:num(g.a)}
function sumR(a,b,jf){const o={h:0,g:0,n:0,w:0,wd:0,o:0,z:0,ph:0,pn:0,pw:0,sk:0,vc:0,byJ:{}},a0=ds(a),b0=ds(b),bj=id=>o.byJ[id]||(o.byJ[id]={h:0,n:0,ph:0,pn:0,w:0});
  const MJ=S.jobs.filter(j=>j.pt==="m"&&(!jf||j.id===jf));
  for(let d=a;d<=b;d=addD(d,1)){const k=ds(d),y=d.getFullYear(),m=d.getMonth(),fut=k>TK;
    MJ.forEach(j=>{if(j.st&&k<j.st)return;if(!incOk(jobSide(j)))return;const ab0=absOf(k);if(ab0&&ab0.j===j.id)return;const r=R(j.id,y,m),v=toM(num(r.mon),j.cur)/dim(y,m),q=bj(j.id);if(fut){o.pn+=v;q.pn+=v}else{o.n+=v;o.g+=toM(num(r.mg)||num(r.mon),j.cur)/dim(y,m);q.n+=v}});
    if(isOff(k)){if(!fut)o.o++;continue}
    {const ab=absOf(k);if(ab){if(ab.t==="sick")o.sk++;else o.vc++;if((!jf||ab.j===jf)&&incOk(jobSide(job(ab.j)))){const v=toM(absVal(k,ab),job(ab.j).cur),q=bj(ab.j);if(fut){o.pn+=v;q.pn+=v}else{o.n+=v;o.g+=v;q.n+=v}}continue}}
    let any=0;
    for(const x of shOf(k)){if(jf&&x.j!==jf)continue;const ok=incOk(jobSide(job(x.j))),cur=job(x.j).cur,g=ok?toM(shG(x,y,m),cur):0,n=ok?toM(shN(x,y,m),cur):0,h=paidH(x),q=bj(x.j);
      if(fut||x.pl){o.ph+=h;o.pn+=n;o.pw++;q.ph+=h;q.pn+=n}else{any=1;o.h+=h;o.g+=g;o.n+=n;o.w++;q.h+=h;q.n+=n;q.w++;if(x.z)o.z++}}
    if(any&&!fut)o.wd++}
  S.gigs.forEach(g=>{if(!g.d||g.d<a0||g.d>b0||!num(g.a))return;if(jf&&g.j!==jf)return;if(!incOk(gigSide(g)))return;const v=toM(gigNet(g),g.cur),q=bj(g.j||"gig");if(g.d>TK){o.pn+=v;q.pn+=v}else{o.n+=v;o.g+=toM(num(g.a),g.cur);q.n+=v}});
  return o}
function jobMonth(jid,y,m){const J=job(jid),r=R(jid,y,m),pre=mk(y,m);let g=0,n=0,h=0,z=0;if(J.pt==="m"){g=num(r.mg)||num(r.mon);n=num(r.mon)}
  for(let d=1;d<=dim(y,m);d++){{const k0=ds(new Date(y,m,d)),ab=absOf(k0);if(ab&&ab.j===jid){const v=absVal(k0,ab);if(J.pt==="m"){n-=num(r.mon)/dim(y,m);g-=(num(r.mg)||num(r.mon))/dim(y,m)}n+=v;g+=v}}for(const x of shOf(ds(new Date(y,m,d)))){if(x.j!==jid)continue;h+=paidH(x);if(x.z)z++;g+=shG(x,y,m);n+=shN(x,y,m)}}
  S.gigs.forEach(q=>{if(q.j===jid&&q.d&&q.d.startsWith(pre)&&(q.cur||S.cur)===J.cur){g+=num(q.a);n+=gigNet(q)}});return{g,n,h,z}}
function payEvents(from,days){const E=[],fk=ds(from),ek=ds(addD(from,days));
  for(let i=0;i<=days;i++){const d=addD(from,i),y=d.getFullYear(),m=d.getMonth(),last=dim(y,m);
    S.jobs.forEach(j=>{if(j.pt==="g"||!incOk(jobSide(j)))return;const pd=Math.min(num(j.pd)||0,last);if(!pd||d.getDate()!==pd)return;const pm=new Date(y,m-num(j.lag),1),per=mk(pm.getFullYear(),pm.getMonth()),sl=slipFor(j.id,per),raw=sl&&num(sl.net)?num(sl.net):jobMonth(j.id,pm.getFullYear(),pm.getMonth()).n;
      if(raw>0)E.push({d,t:"in",n:j.n,a:toM(raw,j.cur),real:!!(sl&&num(sl.net)),per:pm,pt:j.pt})});
    S.base.forEach(b=>{const bd=num(b.d);if(!bd||!num(b.a))return;if(d.getDate()===Math.min(bd,last))E.push({d,t:"out",n:b.n||"Витрата",a:num(b.a),cat:catOf(b),ess:isEss(b)})})}
  S.gigs.forEach(g=>{const k=g.pd||g.d;if(!k||k<fk||k>ek||!num(g.a)||!incOk(gigSide(g)))return;E.push({d:pk(k),t:"in",n:g.n||"Разовий підробіток",a:toM(gigNet(g),g.cur),real:true,gig:true})});
  const ord=e=>e.t==="in"?0:e.ess?1:2;return E.sort((a,b)=>a.d-b.d||ord(a)-ord(b)||b.a-a.a)}
function bestJob(){let b=null,v=-1;const y=TD.getFullYear(),m=TD.getMonth();S.jobs.forEach(j=>{if(j.pt!=="h")return;const r=R(j.id,y,m),x=toM(r.rate*r.mult,j.cur);if(x>v){v=x;b=j.id}});return b||S.jobs[0].id}
const age=()=>{const b=S.prof&&S.prof.bd;if(!b)return null;const d=pk(b);let a=TD.getFullYear()-d.getFullYear();if(TD.getMonth()<d.getMonth()||(TD.getMonth()===d.getMonth()&&TD.getDate()<d.getDate()))a--;return a>0&&a<120?a:null};
const recSleep=()=>{const a=age();return a===null?[7,9]:a<18?[8,10]:a>=65?[7,8]:[7,9]};
function convertMain(nc){const oc=S.cur;if(nc===oc)return;const f=x=>Math.round(toM(num(x),oc)/toM(1,nc)*100)/100;
  /* toM переводить в поточну основну; рахуємо через EUR */
  const fx=S.fx||FX0,k=(num(fx[nc])||FX0[nc])/(num(fx[oc])||FX0[oc]);S.base.forEach(b=>{if(num(b.a))b.a=Math.round(num(b.a)*k)});S.goals.forEach(g=>{if(num(g.t))g.t=Math.round(num(g.t)*k);if(num(g.s))g.s=Math.round(num(g.s)*k)});if(num(S.bal.a))S.bal.a=Math.round(num(S.bal.a)*k);if(num(S.cfg.target))S.cfg.target=Math.round(num(S.cfg.target)*k);S.cur=nc}

function sleepDebt(){const g=sgv()*60;let n=0,d=0;for(let i=0;i<7;i++){const m=slDur(S.sleep[ds(addD(TD,-i))]);if(!m)continue;n++;d+=m<g?g-m:-Math.min(60,m-g)}
  return n>=3?{n,debt:Math.max(0,d)*7/n,real:Math.max(0,d)}:null}
function restWin(from,to){const base=addD(from,-1),L=blocks(base,addD(to,8));if(!L.length)return null;const lastK=L[L.length-1].k;
  for(let d=from;d<=to;d=addD(d,1)){if(ds(addD(d,6))>lastK)break;const W0=dd(base,d)*1440,W1=W0+7*1440,In=L.filter(x=>x.e>W0&&x.s<W1);if(In.length<2)continue;
    let prev=W0,mx=0;for(const x of In){mx=Math.max(mx,Math.max(x.s,W0)-prev);prev=Math.max(prev,Math.min(x.e,W1))}mx=Math.max(mx,W1-prev);if(mx<2100)return{a:d,mx}}return null}
function backRot(a,b){const r=[];for(let d=a;d<b;d=addD(d,1)){const k1=ds(d),k2=ds(addD(d,1)),s1=shOf(k1).filter(x=>x.s).map(x=>tm(x.s)),s2=shOf(k2).filter(x=>x.s).map(x=>tm(x.s));
  if(!s1.length||!s2.length)continue;const l=Math.max(...s1),e=Math.min(...s2);if(l>=840&&e<=600)r.push({k:k1,k2,a:mt(l),b:mt(e)})}return r}
function runAhead(lim){let run=0,st=null;for(let i=-14;i<=10;i++){const d=addD(TD,i),k=ds(d);if(isWd(k)){if(!run)st=d;run++;if(run>lim&&k>TK)return{st,n:(()=>{let n=run;for(let j=i+1;j<=20&&isWd(ds(addD(TD,j)));j++)n++;return n})()}}else run=0}return null}
function autoZ(x,k){const j=job(x.j),d=pk(k),wd=d.getDay();/* fix 1.0: bonus rates of the shift's own month, not the month open in the calendar */x.z=!!(num(R(x.j,d.getFullYear(),d.getMonth()).bonus)&&(j.zd||[]).includes(wd));return x}
function planRange(p){const y=TD.getFullYear(),m=TD.getMonth();if(p==="w"){const a=addD(monday(TD),7);return[a,addD(a,6)]}if(p==="n")return[new Date(y,m+1,1),new Date(y,m+2,0)];return[addD(TD,1),new Date(y,m,dim(y,m))]}
function tplList(jp){let T=S.tpl.filter(t=>jp==="best"||t.j===jp);if(!T.length){const j=jp==="best"?bestJob():jp,s=S.cfg.ls||"08:00";T=[{id:"_",n:"Зміна",j,s,e:mt(tm(s)+8*60)}]}return T}
function simBase(){const a=addD(TD,-55),s=sumR(a,TD),st=stats(a,TD),wk=8;let spw=s.w/wk,hps=s.w?s.h/s.w:avgShift(),npw=s.n/wk,wdpw=st.wd/wk;
  if(s.w<4){spw=Math.min(5,Math.round(norm()/8));hps=8;npw=spw*hps*netRate();wdpw=spw}return{spw,hps,npw,wdpw}}
const CATS=[["home","🏠","Житло",1],["util","💡","Комунальні",1],["food","🛒","Їжа",1],["tr","🚌","Транспорт",1],["com","📱","Зв’язок та інтернет",1],["hlth","💊","Здоров’я",1],["edu","📚","Навчання",0],["sub","🎧","Підписки",0],["fun","🎉","Розваги",0],["oth","📦","Інше",0]];
const CATKW={home:/оренд|квартир|житл|іпотек|nájem|rent|hypot/i,util:/комунал|енерг|світл|газ|вода|опален|elektř|energi/i,food:/їж|продукт|харч|food|jídlo|супермаркет|lidl|albert|billa|kaufland|tesco|penny|rohlik|рохлік/i,tr:/транспорт|проїзд|метро|lítačk|проїзн|бензин|пальн|автобус|таксі|taxi|uber|bolt|liftago|трамва|потяг|vlak|regiojet/i,com:/зв.?яз|інтернет|інет|мобіл|телефон|internet|vodafone|t-mobile|o2/i,hlth:/лік|аптек|здоров|страхуван|pojišt|стомат/i,edu:/навчан|курс|репетит|занят|урок|школ|універ|мов/i,sub:/spotify|netflix|youtube|підписк|icloud|apple|google|chatgpt|claude|disney/i,fun:/розваг|кіно|спорт|зал|gym|бар|кафе|кав|ресторан|піц|бургер|кебаб|kavár|restaur|pivo|пиво/i};
const catOf=b=>b&&b.cat||Object.keys(CATKW).find(k=>CATKW[k].test((b&&b.n)||""))||"oth";
const catI=k=>CATS.find(c=>c[0]===k)||CATS[CATS.length-1];
const isEss=b=>catI(catOf(b))[3]===1||(baseSum()>0&&num(b.a)>=baseSum()*.25);
function ledger(a,b){const L=payEvents(a,dd(a,b)).map(e=>({...e,k:ds(e.d)})),a0=ds(a),b0=ds(b);
  (S.sp||[]).forEach(x=>{if(x.k>=a0&&x.k<=b0)L.push({d:pk(x.k),k:x.k,t:"sp",n:x.n||"Витрата",a:toM(num(x.a),x.cur),id:x.id,ts:x.ts,cat:x.cat||catOf({n:x.n})})});
  return L.sort((p,q)=>q.k<p.k?-1:q.k>p.k?1:(q.ts||0)-(p.ts||0))}
function balNow(){if(!S.bal.d)return null;const t0=S.bal.ts||0,from=addD(pk(S.bal.d),1);let b=num(S.bal.a);
  if(from<=TD)payEvents(from,dd(from,TD)).forEach(e=>{b+=e.t==="in"?e.a:-e.a});
  /* дохід, доданий після оновлення балансу з датою виплати в той самий день, теж зараховується */
  S.gigs.forEach(g=>{const k=g.pd||g.d;if(k===S.bal.d&&k<=TK&&(g.ts||0)>t0&&num(g.a)&&incOk(gigSide(g)))b+=toM(gigNet(g),g.cur)});
  (S.sp||[]).forEach(x=>{if((x.ts||0)>t0&&x.k>=S.bal.d)b-=toM(num(x.a),x.cur)});return b}
function cashflow(){const E=payEvents(addD(TD,1),45),set=!!S.bal.d,bal=set?balNow():0;let run=bal,min=Infinity,minAt=null;const rows=[];
  E.forEach(e=>{run+=e.t==="in"?e.a:-e.a;rows.push({...e,run});if(run<min){min=run;minAt=e}});
  const ni=E.find(e=>e.t==="in"&&!e.gig),until=ni?ni.d:addD(TD,30),days=Math.max(1,dd(TD,until)),bills=E.filter(e=>e.t==="out"&&e.d<until).reduce((s,e)=>s+e.a,0);
  const unrel=e=>e.t==="in"&&!e.gig&&!e.real&&e.pt==="h"&&e.per&&new Date(e.per.getFullYear(),e.per.getMonth()+1,1)>TD;
  const hE=E.find(e=>ni&&e.d>ni.d&&unrel(e)),H=hE?hE.d:addD(TD,46),bal0=bal+(set?spentToday():0);
  let A=Infinity,cum=0,res=null,cumB=0;
  for(const e of E){if(e.d>=H)break;cum+=e.t==="in"?e.a:-e.a;if(e.d<until){cumB=cum;const k=dd(TD,e.d);if(k>0&&e.t==="out"){const v=(bal0+cum)/k;if(v<A)A=v}}
    else if(e.t==="out"){const v=(bal0+cum)/days;if(v<A){A=v;res=E.filter(x=>x.t==="out"&&+x.d===+e.d).reduce((p,q)=>q.a>p.a?q:p)}}}
  {const v=(bal0+cumB)/days;if(v<=A){A=v;res=null}}
  return{E:rows,bal,set,min,minAt,ni,days,bills,H,res,safe:Math.max(0,A),risk:rows.filter(e=>e.d<H)}}
function spentToday(){const t0=S.bal.ts||0;return(S.sp||[]).filter(x=>x.k===TK&&(x.ts||0)>t0).reduce((s,x)=>s+toM(num(x.a),x.cur),0)}
function dayBudget(){if(!S.bal.d||incM()==="side")return null;const c=cashflow(),sp=spentToday(),allow=c.safe;
  return{allow,spent:sp,left:allow-sp,until:c.ni?c.ni.d:null,days:c.days,bal:c.bal,res:c.res}}
function cashRisk(){if(!S.bal.d||incM()==="side")return null;const c=cashflow();let re=c.bal,rt=c.bal,hiE=null,loE=null;
  for(const e of c.risk){if(e.t==="in"){re+=e.a;rt+=e.a;continue}rt-=e.a;if(e.ess){re-=e.a;if(re<0&&!hiE)hiE={e,v:-re}}if(rt<0&&!loE)loE={e,v:-rt}}
  if(hiE)return{lvl:"hi",t:"Може не вистачити на важливе",s:`${dLong(hiE.e.d)}: ${esc(hiE.e.n)} — бракуватиме ~${kc(hiE.v)}.`};
  if(loE)return{lvl:"lo",t:"Не все влізе до зарплати",s:`Обов’язкові платежі покриті, але ${dLong(loE.e.d)} на «${esc(loE.e.n)}» може забракнути ~${kc(loE.v)}. Можна перенести чи скоротити.`};
  if(c.ni&&c.safe<0)return{lvl:"hi",t:"До зарплати тісно",s:`До ${dLong(c.ni.d)} рахунки більші за залишок.`};return null}
function optimum(){const L=[];for(let d=addD(TD,-90);d<=TD;d=addD(d,1)){const k=ds(d),day=S.days[k];if(!day||!day.sh||!day.f)continue;const sh=day.sh.filter(x=>!x.pl);if(!sh.length)continue;const h=sh.reduce((s,x)=>s+paidH(x),0),st=sh.filter(x=>x.s).map(x=>tm(x.s));L.push({k,d,h,st:st.length?Math.min(...st):null,f:day.f})}
  if(L.length<8)return{ok:false,n:L.length};const avg=a=>a.reduce((s,x)=>s+x.f,0)/a.length;
  const B=[[0,6.5,"до 6 год"],[6.5,8.5,"7–8 год"],[8.5,10,"9–10 год"],[10,24,"від 10 год"]];let bl=null;
  B.forEach(b=>{const a=L.filter(x=>x.h>=b[0]&&x.h<b[1]);if(a.length>=3){const v=avg(a);if(!bl||v>bl.v+.05||(Math.abs(v-bl.v)<=.05&&a.length>bl.n))bl={b,v,n:a.length}}});
  const T=[[0,420,"до 7:00"],[420,600,"7:00–10:00"],[600,840,"10:00–14:00"],[840,1440,"після 14:00"]];let tl=null;
  T.forEach(t=>{const a=L.filter(x=>x.st!==null&&x.st>=t[0]&&x.st<t[1]);if(a.length>=3){const v=avg(a);if(!tl||v>tl.v+.05)tl={t,v,n:a.length}}});
  const pos={};L.forEach(x=>{let p=1;for(let q=addD(x.d,-1);isWd(ds(q));q=addD(q,-1))p++;(pos[p]=pos[p]||[]).push(x.f)});
  let run=null;for(let p=2;p<=8;p++){const a=pos[p];if(a&&a.length>=2&&a.reduce((s,v)=>s+v,0)/a.length<1.8){run=p-1;break}}
  const sl=f=>{const a=L.filter(x=>x.f===f).map(x=>slDur(S.sleep[x.k])).filter(Boolean);return a.length>=3?a.reduce((s,v)=>s+v,0)/a.length:null},sg=sl(3),sb=sl(1);
  let bj=null;if(multi()){const s=sumR(addD(TD,-60),TD);S.jobs.forEach(j=>{const q=s.byJ[j.id];if(q&&q.h>=8){const v=q.n/q.h;if(!bj||v>bj.v)bj={j,v}}})}
  return{ok:true,n:L.length,len:bl&&bl.b,start:tl&&tl.t,run,sg,sb,bj}}
function jobFact(jid,y,m){const J=job(jid),r=R(jid,y,m),pre=mk(y,m),last=dim(y,m);let g=0,n=0,h=0,w=0;
  for(let d=1;d<=last;d++){const k=ds(new Date(y,m,d));if(k>TK)break;{const ab=absOf(k);if(ab&&ab.j===jid){const v=absVal(k,ab);n+=v;g+=v;continue}}if(J.pt==="m"&&(!J.st||k>=J.st)){n+=num(r.mon)/last;g+=(num(r.mg)||num(r.mon))/last}
    for(const x of shOf(k)){if(x.j!==jid||x.pl)continue;h+=paidH(x);w++;g+=shG(x,y,m);n+=shN(x,y,m)}}
  S.gigs.forEach(q=>{if(q.j===jid&&q.d&&q.d.startsWith(pre)&&q.d<=TK&&(q.cur||S.cur)===J.cur&&num(q.a)){g+=num(q.a);n+=gigNet(q)}});return{g,n,h,w}}
function yearData(y){const J=S.jobs.map(j=>{const M=MN.map((_,m)=>({...jobFact(j.id,y,m),sl:slipFor(j.id,mk(y,m))}));const t=M.reduce((s,x)=>({g:s.g+x.g,n:s.n+x.n,h:s.h+x.h,w:s.w+x.w,sl:s.sl+(x.sl?1:0),sn:s.sn+(x.sl&&num(x.sl.net)?num(x.sl.net):0)}),{g:0,n:0,h:0,w:0,sl:0,sn:0});return{j,M,t}});
  const G=S.gigs.filter(q=>q.d&&q.d.startsWith(String(y))&&q.d<=TK&&num(q.a)&&!(q.j&&S.jobs.find(j=>j.id===q.j&&(q.cur||S.cur)===j.cur)));
  const tot=J.reduce((s,x)=>s+toM(x.t.n,x.j.cur),0)+G.reduce((s,q)=>s+toM(gigNet(q),q.cur),0),hrs=J.reduce((s,x)=>s+x.t.h,0),sh=J.reduce((s,x)=>s+x.t.w,0),SL=S.slips.filter(s=>s.m.startsWith(String(y)));
  const MT=MN.map((_,m)=>J.reduce((s,x)=>s+toM(x.M[m].n,x.j.cur),0)+G.filter(q=>q.d.startsWith(mk(y,m))).reduce((s,q)=>s+toM(gigNet(q),q.cur),0));
  const AB=MN.map((_,m)=>absCount(new Date(y,m,1),new Date(y,m,dim(y,m))));return{J,G,tot,hrs,sh,SL,MT,AB}}
const CZPH=[[14,60],[30,60],[60,66],[380,72]],USTP={1:50,2:60,3:70,4:100},UST=[["1","до 3 років"],["2","3–5 років"],["3","5–8 років"],["4","понад 8 років"]];
const LAW={
 HPP:{c:"CZ",sk:"Перші 14 календарних днів роботодавець платить náhradu mzdy — 60 % редукованого середнього заробітку, лише за робочі дні (зміни). З 15-го дня — nemocenské від ČSSZ: 60 % до 30-го дня, 66 % з 31-го, 72 % з 61-го. Максимум — 380 днів.",vc:"Щонайменше 4 тижні на рік — 20 робочих днів при п’ятиденці. Оплачується за середнім заробітком.",ph:CZPH,max:380,vd:20,vp:100,ins:"emp"},
 DPP:{c:"CZ",sk:"Лікарняні є, лише якщо дохід із DPP у місяці від 12 000 Kč (2026; з 2027 — 12 500 Kč) — тоді ти застрахований і діють правила як для HPP: 60 % перші 14 днів від роботодавця, далі nemocenské від ČSSZ. Нижче порогу лікарняних немає.",vc:"Відпустка є, якщо угода тривала від 4 тижнів і за рік відпрацьовано щонайменше 80 год. Рахується в годинах: приблизно відпрацьоване × 4/52 (від фіктивних 20 год на тиждень). Години відпустки не входять у ліміт 300 год.",ph:CZPH,max:380,thr:12000,thrY:{2025:11500,2026:12000,2027:12500},vh:true,vp:100,ins:"thr"},
 "DPČ":{c:"CZ",sk:"Лікарняні є, якщо дохід із DPČ у місяці від 4 500 Kč (2026) — тоді діють правила як для HPP.",vc:"Як для DPP: від 4 тижнів і 80 год за рік — відпустка в годинах, приблизно відпрацьоване × 4/52. Тут вона входить в обсяг роботи за угодою.",ph:CZPH,max:380,thr:4500,thrY:{2025:4500,2026:4500},vh:true,vp:100,ins:"thr"},
 "ŽL":{c:"CZ",sk:"Náhrady mzdy для OSVČ немає. Якщо платиш добровільне лікарняне страхування — nemocenské від ČSSZ з 15-го дня: 60 %, з 31-го — 66 %, з 61-го — 72 %. Перші 14 днів не оплачуються.",vc:"Законної відпустки немає — відпочинок плануєш і фінансуєш сам.",ph:[[14,0],[30,60],[60,66],[380,72]],max:380,vd:0,vp:0,ins:"vol"},
 UoP:{c:"PL",sk:"До 33 днів хвороби на рік (14 — після 50 років) роботодавець платить wynagrodzenie chorobowe — 80 %. Далі zasiłek chorobowy від ZUS — теж 80 % (70 % у лікарні, 100 % у вагітності чи після нещасного випадку дорогою на роботу). Максимум — 182 дні. Право виникає після 30 днів страхування.",vc:"20 днів на рік при стажі до 10 років і 26 — від 10. З 2026 року до стажу зараховують і zlecenie, і JDG (у приватних роботодавців — з 1 травня 2026).",ph:[[182,80]],max:182,vd:20,vd10:26,vp:100,ins:"emp"},
 UZ:{c:"PL",sk:"Лікарняне страхування на zleceniu добровільне. Якщо платиш — zasiłek chorobowy від ZUS 80 % після 90 днів безперервного страхування, до 182 днів.",vc:"Законної відпустки немає, якщо не домовились у договорі. Але з 2026 року цей період зараховують до стажу для майбутньої відпустки на umowie o pracę.",ph:[[182,80]],max:182,vd:0,vp:0,ins:"vol"},
 UoD:{c:"PL",sk:"Umowa o dzieło не дає лікарняного страхування — за хворобу не платять.",vc:"Відпустки немає.",ph:[],max:0,vd:0,vp:0,ins:"none"},
 B2B:{c:"PL",sk:"Лікарняне страхування добровільне. Якщо платиш — zasiłek від ZUS 80 % після 90 днів страхування, до 182 днів.",vc:"Законної відпустки немає.",ph:[[182,80]],max:182,vd:0,vp:0,ins:"vol"},
 UAemp:{c:"UA",sk:"Перші 5 днів оплачує роботодавець, з 6-го — Пенсійний фонд. Розмір залежить від страхового стажу: до 3 років — 50 % середньої зарплати, 3–5 — 60 %, 5–8 — 70 %, понад 8 — 100 %.",vc:"Щонайменше 24 календарні дні на рік. Під час воєнного стану роботодавець може обмежити основну відпустку 24 днями й перенести решту на потім. Це обмеження не діє для окремих категорій, як-от неповнолітні й люди з інвалідністю.",ph:"ust",max:0,vd:24,cal:true,vp:100,ins:"emp"},
 fop:{c:"UA",sk:"Якщо вчасно сплачуєш ЄСВ, Пенсійний фонд оплачує лікарняний з 6-го дня, перші 5 — ні. Розмір — від 50 % до 100 % залежно від стажу. Якщо за останні 12 місяців стажу менше 6, допомогу рахують від мінімальної зарплати.",vc:"Законної відпустки немає.",ph:"ust5",max:0,vd:0,vp:0,ins:"esv"},
 UAcpd:{c:"UA",sk:"Замовник за ЦПД перші 5 днів не оплачує. Якщо з винагороди сплачували ЄСВ, з 6-го дня допомогу може призначити Пенсійний фонд — 50–100 % залежно від стажу. Деталі краще уточнити в ПФУ.",vc:"За ЦПД законної відпустки немає.",ph:"ust5",max:0,vd:0,vp:0,ins:"esv"}};
const LAWG={c:"",sk:"Для цього типу роботи правила залежать від країни й договору. Вкажи в налаштуваннях роботи, скільки платять, — і я врахую.",vc:"Скільки днів відпустки і чи вона оплачується — вкажи в налаштуваннях роботи.",ph:[],max:0,vd:0,vp:0,ins:"none"};
const lawOf=J=>LAW[J.ct]||(J.ct==="emp"&&J.cur==="UAH"?LAW.UAemp:LAWG);
let ABC={u:-1,g:{}};
function absGroups(){if(ABC.u===S.u)return ABC.g;const g={};for(const[k,d]of Object.entries(S.days)){if(d&&d.ab)(g[d.ab.g]=g[d.ab.g]||[]).push(k)}Object.values(g).forEach(a=>a.sort());ABC={u:S.u,g};return g}
const absOf=k=>S.days[k]&&S.days[k].ab;
let AVC={u:-1,m:{}};function avgDayCal(jid){if(AVC.u!==S.u+"|"+TK)AVC={u:S.u+"|"+TK,m:{}};if(AVC.m[jid]!==undefined)return AVC.m[jid];return AVC.m[jid]=avgDayCal0(jid)}
/* fix 1.0: average per calendar day over the time the job actually existed (max 91 days), not always over 91 days */
function avgWindow(jid){const st=jobStart(job(jid)),a0=addD(TD,-90);const a=st&&st>a0?st:a0;return{a,days:Math.max(7,dd(a,TD)+1)}}
function avgDayCal0(jid){const J=job(jid);if(J.pt==="m"){const r=R(jid,TD.getFullYear(),TD.getMonth());return num(r.mon)*12/365}const W=avgWindow(jid);let n=0;for(let d=W.a;d<=TD;d=addD(d,1)){for(const x of shOf(ds(d))){if(x.j!==jid||x.pl)continue;n+=shN(x,d.getFullYear(),d.getMonth())}}
  if(n>0)return n/W.days;const r=R(jid,TD.getFullYear(),TD.getMonth());return r.rate*r.mult*avgShift()*5/7}
/* gross average per calendar day — the base for sick pay */
function avgDayGross(jid){const J=job(jid);if(J.pt==="m"){const r=R(jid,TD.getFullYear(),TD.getMonth());return(num(r.mg)||num(r.mon))*12/365}const W=avgWindow(jid);let g=0;for(let d=W.a;d<=TD;d=addD(d,1)){for(const x of shOf(ds(d))){if(x.j!==jid||x.pl)continue;g+=shG(x,d.getFullYear(),d.getMonth())}}
  if(g>0)return g/W.days;const r=R(jid,TD.getFullYear(),TD.getMonth());return r.rate*avgShift()*5/7}
/* fix 1.0: Czech law first reduces the daily base (redukční hranice), then applies 60/66/72 %. ČSSZ figures; next years fall back to the latest known */
const REDCZ={2025:[1466,2199,4397],2026:[1633,2449,4897]};
function reduceCZ(v,y){const ks=Object.keys(REDCZ).map(Number).sort((a,b)=>a-b);const L=REDCZ[y]||REDCZ[ks.filter(k=>k<=y).pop()||ks[0]];const[a,b,c]=L;return Math.min(v,a)*.9+Math.max(0,Math.min(v,b)-a)*.6+Math.max(0,Math.min(v,c)-b)*.3}
function avgHourNet(jid){let n=0,h=0;for(let d=addD(TD,-90);d<=TD;d=addD(d,1))for(const x of shOf(ds(d))){if(x.j!==jid||x.pl)continue;n+=shN(x,d.getFullYear(),d.getMonth());h+=paidH(x)}if(h>0)return n/h;const r=R(jid,TD.getFullYear(),TD.getMonth());return r.rate*r.mult}
/* fix 1.0: participation in sickness insurance is decided month by month — did this month's income from the job reach the threshold of that year */
function thrFor(L,y){if(!L.thrY)return L.thr;const ks=Object.keys(L.thrY).map(Number).sort((a,b)=>a-b);return L.thrY[y]||L.thrY[ks.filter(k=>k<=y).pop()||ks[0]]}
function insuredThr(J,L,k){const d=k?pk(k):TD,y=d.getFullYear(),mm=d.getMonth();let x=0;for(let q=1;q<=dim(y,mm);q++)for(const sh of shOf(ds(new Date(y,mm,q))))if(sh.j===J.id)x+=shG(sh,y,mm);return toM(x,J.cur)/toM(1,"CZK")>=thrFor(L,y)}
function sickPct(J,i,k){if(num(J.skp))return num(J.skp);const L=lawOf(J);if(!L.ph||L.ins==="none")return 0;if((L.ins==="vol"||L.ins==="esv")&&!J.vi)return 0;if(L.ins==="thr"&&!insuredThr(J,L,k))return 0;
  if(L.ph==="ust"||L.ph==="ust5"){if(L.ph==="ust5"&&i<=5)return 0;return USTP[J.ust]||50}if(L.max&&i>L.max)return 0;for(const[to,p]of L.ph)if(i<=to)return p;return 0}
function vacPct(J){if(J.vcp!==undefined&&J.vcp!=="")return num(J.vcp);return lawOf(J).vp}
const isWkd=k=>{const w=pk(k).getDay();return w>0&&w<6};
function absVal(k,a){const J=job(a.j),G=absGroups()[a.g]||[k],i=G.indexOf(k)+1,meta=(S.abs||{})[a.g]||{},L=lawOf(J);
  if(a.t==="sick"){const p=meta.p!==undefined&&meta.p!==""?num(meta.p):sickPct(J,i,G[0]||k);if(!p)return 0;const base=L.c==="CZ"?reduceCZ(toM(avgDayGross(J.id),J.cur)/toM(1,"CZK"),pk(k).getFullYear())*toM(1,"CZK")/toM(1,J.cur):avgDayCal(J.id);return base*p/100}
  const p=meta.p!==undefined&&meta.p!==""?num(meta.p):vacPct(J);if(!p)return 0;
  if(L.vh)return isWkd(k)?avgShift()*avgHourNet(J.id)*p/100:0;if(L.cal)return avgDayCal(J.id)*p/100;return isWkd(k)?avgDayCal(J.id)*7/5*p/100:0}
function vacEnt(J,y){const L=lawOf(J);if(J.vd!==undefined&&J.vd!==""){return{u:"d",v:num(J.vd),custom:true}}
  if(L.vh){const u=yearUse(J.id,y);return{u:"h",v:u.h>=80?Math.ceil(u.h*4/52):0,need:u.h<80}}
  const full=L.vd10&&J.s10?L.vd10:L.vd,st=jobStart(J);if(st&&st.getFullYear()===y&&st>new Date(y,0,1)){const yd=dd(new Date(y,0,1),new Date(y+1,0,1)),k=dd(st,new Date(y+1,0,1))/yd;return{u:"d",v:Math.round(full*k*2)/2,full,pro:true,st}}
  return{u:"d",v:full}}
function jobStart(J){if(J.st)return pk(J.st);let f=null;for(const k of Object.keys(S.days)){if(f&&k>=f)continue;if((S.days[k].sh||[]).some(x=>x.j===J.id))f=k}return f?pk(f):null}
function vacUsed(J,y){const L=lawOf(J),pre=String(y);let d=0;for(const[k,x]of Object.entries(S.days)){if(!x||!x.ab||x.ab.t!=="vac"||x.ab.j!==J.id||!k.startsWith(pre))continue;if(L.cal||isWkd(k))d++}
  return L.vh&&!(J.vd!==undefined&&J.vd!=="")?{u:"h",v:Math.round(d*avgShift())}:{u:"d",v:d}}
function absCount(a,b){let sk=0,vc=0;for(let d=a;d<=b;d=addD(d,1)){const x=absOf(ds(d));if(x){if(x.t==="sick")sk++;else vc++}}return{sk,vc}}
function sickAfterLoad(){const G=absGroups(),st=Object.entries(G).filter(([g,a])=>absOf(a[0]).t==="sick"&&a[0]>=ds(addD(TD,-365))).map(([g,a])=>a[0]);if(st.length<2)return null;
  let n=0;st.forEach(k=>{const d=pk(k),s=stats(addD(d,-14),addD(d,-1)),z=sleepStats(addD(d,-14),addD(d,-1));if(s.pw>norm()*1.1||s.short>=2||s.mx>=7||(z.n>=4&&z.avg<390))n++});return{n,all:st.length}}
/* ---------- module plumbing ---------- */
function setState(o){S=o}
function getState(){return S}
/** call when the app becomes visible again: moves "today" past midnight */
function syncToday(){const t=today();if(ds(t)!==TK){TD=t;TK=ds(t);return true}return false}
export { MN,MS,MG,ML,DL,DS,W_DAY,W_SH,W_T,W_M,W_WK,W_N,KEY,OLDK,CUR,FX0,CCUR,CT,JC,FUN,LV,LVT,pad,ds,pk,mk,dim,addD,monday,today,dd,TD,TK,tm,mt,nf,sym,kc,gx,sgv,prepv,offv,toM,hf,hm,pl,esc,num,uid,dLong,rng,DEFR,newJob,blank,migrate,S,jc,job,multi,R,pin,shH,paidH,shG,shN,shOf,isWd,isOff,mSum,baseSum,goalT,autoTarget,target,norm,restMin,netRate,avgShift,blocks,overlaps,shortRests,stats,curStreak,feel,level,hasData,slDur,sleepStats,prevM,saveAdvice,yearUse,slipFor,INCM,jobSide,gigSide,incM,incOk,hasSide,gigNet,sumR,jobMonth,payEvents,bestJob,age,recSleep,convertMain,sleepDebt,restWin,backRot,runAhead,autoZ,planRange,tplList,simBase,CATS,CATKW,catOf,catI,isEss,ledger,balNow,cashflow,spentToday,dayBudget,cashRisk,optimum,jobFact,yearData,CZPH,USTP,UST,LAW,LAWG,lawOf,ABC,absGroups,absOf,AVC,avgDayCal,avgWindow,avgDayCal0,avgDayGross,REDCZ,reduceCZ,avgHourNet,thrFor,insuredThr,sickPct,vacPct,isWkd,absVal,vacEnt,jobStart,vacUsed,absCount,sickAfterLoad, setState, getState, syncToday };
