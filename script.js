/* ÉCLAT — Styling Studio · layered wardrobe engine
   Each garment is a transparent layer drawn on the same 1360×2048 canvas as the base body,
   so any top, bottom, dress and shoes can be combined. Catalog lives in data.js. */
const HU=(u,w)=>!/^https?:\/\//i.test(u)?u:'https://images.higgs.ai/?default=1&output=webp&url='+encodeURIComponent(u)+'&w='+w+'&q=85';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const CW=1360,CH=2048;
const IT=Object.fromEntries(ITEMS.map(x=>[x.id,x]));
const BY=s=>ITEMS.filter(x=>x.s===s);
const ORDER=['base','shoes','bottom','top'];
const SLOTN={top:'Tops',bottom:'Bottoms',dress:'Dresses',shoes:'Shoes',look:'Looks'};
const F=[['Daylight','none','transparent'],['Soft Film','contrast(.92) saturate(.85) brightness(1.06)','linear-gradient(180deg,rgba(255,226,214,.35),rgba(180,200,220,.35))'],['Cool Studio','saturate(.9) brightness(1.06) contrast(1.04)','linear-gradient(180deg,rgba(150,190,255,.55),rgba(200,220,255,.3))'],['Blue Hour','brightness(.82) contrast(1.1) saturate(1.1)','linear-gradient(180deg,rgba(70,60,170,.75),rgba(150,90,170,.55))'],['Mono','grayscale(1) contrast(1.12) brightness(1.03)','transparent'],['Golden Hour','saturate(1.1) brightness(1.02)','linear-gradient(180deg,rgba(255,180,90,.6),rgba(255,140,80,.4))']];
const IDS=[['Han Seo-yeon',23,'Seoul, KR',14],['Kim Ha-eun',22,'Busan, KR',17],['Yoon Ji-woo',25,'Seoul, KR',12],['Park Min-ji',24,'Incheon, KR',13],['Lee Soo-ah',21,'Daegu, KR',15]];
const DEF={waist:'loose',top:'nt18',bottom:'nb01',shoes:'ns01',memT:'nt18',memB:'nb01',accessories:[],occasion:'Any',season:'Auto',tint:{},grade:0,real:75,height:168,build:50};
let S=JSON.parse(JSON.stringify(DEF)),hist=[JSON.parse(JSON.stringify(S))],hi=0,idn=0,frame='full',fOff=0,openRow=null,tok=0,tab=2,traits=['Curious','Creative','Gentle'],axes=[],favs=new Set(),cart=new Set(),saved=[],curView='outfits',mode='top';
const locks=new Set(),cur={base:null,shoes:null,bottom:null,top:null};
const clone=o=>JSON.parse(JSON.stringify(o));
const layerCache = new Map();
const missing = new Set();
let requested = 0;
let lastGood = null;
let pendingOutfit = null;
const activeSlots = ['top', 'bottom', 'shoes'];
function imageReady(url) {
  if (layerCache.has(url)) return layerCache.get(url);
  const pending = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { missing.delete(url); resolve(image); };
    image.onerror = () => { missing.add(url); layerCache.delete(url); reject(new Error(url)); };
    image.src = HU(url, CW);
  });
  layerCache.set(url, pending);
  // Decoded photos are large. Thumbnails are small, separate files.
  if (layerCache.size > 28) layerCache.delete(layerCache.keys().next().value);
  return pending;
}
function worn(s=S) {
  return [s.top, s.bottom, s.shoes, ...(s.accessories || [])].filter(Boolean);
}
function layerList(s=S) {
  const top = IT[s.top], bottom = IT[s.bottom], shoes = IT[s.shoes];
  const all = [];
  function plate(k,u,z,from=0,to=CH) {
    if (from < to) all.push({k,u,z,from,to,bb:[0,from,CW,to]});
  }
  function article(k,it,z,asset=it,from=0,to=CH) {
    if(!it)return;
    const [left,y1,right,y2]=asset.bb;
    const material=asset!==it && asset.mask?{...it,mask:asset.mask}:it;
    all.push({k,it:material,id:it.id,u:asset.f,bb:[left,Math.max(from,y1),right,Math.min(to,y2)],z,from,to});
  }
  const split = [top,bottom,shoes].some(it=>it?.collection);
  const insideBoot=shoes.tall && bottom?.insideBoot;
  const shoeZ=insideBoot?4:2;
  const tuck=s.waist==='tucked' && top.tucked && bottom?.collection;
  if (split) {
    plate('base',top.coverShoulder?'assets/base/torso-covered.png':'assets/base/torso.png',0);
    plate('legs','assets/base/legs.png',.1,(bottom||top).legFrom || 840, shoes.footEnd || shoes.bb[1]+15);
    if (shoes.foot) plate('feet',shoes.foot,.2,insideBoot?1515:0);
    article('shoes',shoes,shoeZ);
    article('bottom',bottom,3,insideBoot||bottom,tuck?850:0);
    if(tuck)article('waistband',bottom,5.2,bottom.waistFront||insideBoot||bottom,0,850);
    plate('arms','assets/base/arms.png',4.5,Math.min(...(top.cut||[0,0])));
    article('top',top,5,tuck?top.tucked:top);
    const hand = top.hand || 'assets/base/hands.png';
    plate('hands',hand,7);
  } else {
    plate('base',shoes.base || BASE.f,0);
    article('shoes',shoes,shoeZ);
    article('bottom',bottom,3);
    article('top',top,5);
  }
  for (const id of s.accessories || []) article(id,IT[id],IT[id].z);
  return all.sort((a,b)=>a.z-b.z);
}
function conflict(s) {
  const top=IT[s.top], bottom=IT[s.bottom], shoes=IT[s.shoes];
  if (!top || !shoes || (top.s==='dress') !== !bottom) return 'Choose a dress or a top with a bottom';
  // These original cutouts contain pixels from the matching shirt/sleeves.
  if (s.bottom==='b1' && s.top!=='t1') return 'Cloud sweatpants fit the half-zip sweatshirt';
  if (s.bottom==='b5' && s.top!=='t5') return 'These suit trousers fit the original oversized blazer';
  const accessory=(s.accessories||[]).map(id=>IT[id]).find(a=>a?.fitsTops && !a.fitsTops.includes(s.top));
  if(accessory)return accessory.fitNote;
  if (shoes.tall && bottom?.fit==='cargo') return 'The cargo ankle ties need a low shoe or ankle boot';
  return '';
}
function canTuck(s){return Boolean(IT[s.top]?.tucked && IT[s.bottom]?.collection);}
function sceneKey(s) { return activeSlots.map(k=>s[k]||'').join('/')+'|'+(s.accessories||[]).join('/')+'|'+(s.waist||'loose'); }
function lookState(l) {
  const next={...S,waist:l.waist||'loose',top:l.top,bottom:l.bottom||null,shoes:l.shoes,accessories:[...(l.accessories||[])],tint:{}};
  if(IT[next.top].s==='top')next.memT=next.top;
  if(next.bottom)next.memB=next.bottom;
  return next;
}
async function selectState(next, message) {
  const mine=++requested;pendingOutfit=null;
  if(!canTuck(next))next.waist='loose';
  const reason=conflict(next);
  if(reason){toast(reason);return false;}
  pendingOutfit=next;
  try {
    await Promise.all(layerList(next).map(l=>imageReady(l.u)));
  } catch {
    if(mine===requested){pendingOutfit=null;toast('Image unavailable · the previous outfit is still on');}
    return false;
  }
  if(mine!==requested)return false;
  pendingOutfit=null;apply(next);commit();if(message)toast(message);return true;
}
function equip(id){
  const it=IT[id];if(!it)return;
  const n=clone(pendingOutfit||S);
  if(it.s==='dress'){
    if(IT[n.top].s==='top')n.memT=n.top;
    if(n.bottom)n.memB=n.bottom;
    n.top=id;n.bottom=null;
  } else if(it.s==='top'){
    n.top=n.memT=id;n.bottom=n.bottom||n.memB||DEF.bottom;
  } else if(it.s==='bottom'){
    n.bottom=n.memB=id;if(IT[n.top].s==='dress')n.top=n.memT||DEF.top;
  } else if(it.s==='shoes')n.shoes=id;
  else return toggleAccessory(id);
  if(n.top!==S.top || !canTuck(n))n.waist='loose';
  if(sceneKey(n)===sceneKey(S)){requested++;pendingOutfit=null;return;}
  const removed=(n.accessories||[]).find(a=>IT[a].fitsTops && !IT[a].fitsTops.includes(n.top));
  if(removed)n.accessories=n.accessories.filter(a=>a!==removed);
  return selectState(n,removed?'Waist belt removed to suit this silhouette':'');
}
function toggleAccessory(id){
  const base=pendingOutfit||S,current=base.accessories||[],item=IT[id];
  const next=current.filter(k=>IT[k].group!==item.group);
  if(!current.includes(id))next.push(id);
  return selectState({...base,accessories:next});
}
function wearLook(i){return selectState(lookState(LOOKS[i]));}
const slotOf=m=>m==='dress'?'top':m;
function slotItem(m){const item=IT[S[slotOf(m)]];return item?.s===m?item:null}

/* ---------- helpers ---------- */
function fill(el){el.style.setProperty('--p',(el.value-el.min)/(el.max-el.min)*100+'%')}
function toast(t){const e=$('#toast');e.querySelector('span').textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}
function badge(id,n){const u=$(id+' u');const ch=u.textContent!=n;u.textContent=n;u.classList.toggle('has',n>0);if(ch){u.classList.remove('bump');void u.offsetWidth;u.classList.add('bump')}}
function rescan(t=0,b=0,lin){const s=$('#scan');s.style.setProperty('--t',t+'%');s.style.setProperty('--b',b+'%');s.style.animationTimingFunction=lin?'linear':'';s.classList.remove('go');void s.offsetWidth;s.classList.add('go')}
function crop(el,sz){const k=sz/360;el.style.backgroundImage=`url(${HU(BASE.f,1000)})`;el.style.backgroundSize=`${1360*k}px ${2048*k}px`;el.style.backgroundPosition=`${-500*k}px ${-46*k}px`}
function fitBg(el,u,bb,cw,ch,w=700,pad=.88){const bw=bb[2]-bb[0],bh=bb[3]-bb[1],k=Math.min(cw/bw,ch/bh)*pad;el.style.backgroundImage=`url(${HU(u,w)})`;el.style.backgroundSize=`${CW*k}px ${CH*k}px`;el.style.backgroundPosition=`${-bb[0]*k+(cw-bw*k)/2}px ${-bb[1]*k+(ch-bh*k)/2}px`}
const pct=bb=>[bb[1]/CH*100,100-bb[3]/CH*100];
const blend=it=>it.bl||(it.lum>.55?'multiply':'color');   // light neutrals multiply, coloured fabrics take the new hue
function tintOf(id,s=S){return s.tint&&s.tint[id]}
function maskURL(path,w){return window.eclatMasks?.[path] || HU(path,w)}
function maskCss(it,w){if(it.mask)return`--m:url('${maskURL(it.mask,w)}')`;if(it.mi==null)return`--m:url('${maskURL(it.f,w)}')`;const c=it.mi%MASKS.cols,r=it.mi/MASKS.cols|0;
 return`--m:url('${maskURL(MASKS.f,2000)}');--ms:${MASKS.cols*100}% ${MASKS.rows*100}%;--mp:${c/(MASKS.cols-1)*100}% ${r/(MASKS.rows-1)*100}%`}
/* layer markup reused by the model, library thumbs and the flyer */
function layerHTML(s,w){return layerList(s).filter(l=>l.u).map(l=>{const t=l.id&&tintOf(l.id,s);return`<div class="lay" style="clip-path:${clipping(l)};z-index:${Math.round(10*l.z)};background-image:url(${HU(l.u,w)})">${t?`<i class="tint on" style="${maskCss(l.it,w)};background-color:${t};mix-blend-mode:${blend(l.it)}"></i>`:''}</div>`}).join('')}

/* ---------- layout ---------- */
function fit(){$('#stage').style.setProperty('--s',Math.min(innerWidth/1600,innerHeight/900))}
addEventListener('resize',fit);fit();
addEventListener('pointermove',e=>{const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5,r=document.documentElement.style;r.setProperty('--bx',-x*22+'px');r.setProperty('--by',-y*12+'px');r.setProperty('--mx',x*10+'px')});
$('#bg').style.backgroundImage=`url(${HU(BG,2400)}),url(assets/background-fallback.jpg)`;

/* ---------- model render ---------- */
async function showLook(instant){
  const my=++tok,state=clone(S),layers=layerList(state);
  markOn();
  try {
    await Promise.all(layers.map(l=>imageReady(l.u)));
  } catch {
    if(my===tok && lastGood && sceneKey(state)!==sceneKey(lastGood)) {
      S=clone(lastGood); apply(S,false); toast('Image unavailable · previous outfit restored');
    } else if(my===tok)toast('A studio asset is missing. Extract the full project and reopen it.');
    return;
  }
  if(my!==tok)return;
  const old=new Map([...$('#figs').children].map(el=>[el.dataset.r,el]));
  const changed=[];
  for(const l of layers){
    const sig=[l.u,l.from,l.to].join('|');
    let el=old.get(l.k);old.delete(l.k);
    if(!el || el.dataset.sig!==sig){
      el?.remove();
      el=document.createElement('div');el.className='fig';el.dataset.r=l.k;el.dataset.sig=sig;
      el.style.backgroundImage='url("'+l.u+'")';el.style.clipPath=clipping(l);
      if(l.it?.tint){
        const t=document.createElement('i');t.className='tint';t.style.cssText=maskCss(l.it,CW);el.appendChild(t);
      }
      $('#figs').appendChild(el);
      if(l.it)changed.push(l);
    }
    el.style.zIndex=Math.round(10*l.z);
    paintTint(el,l);
  }
  old.forEach(el=>el.remove());
  // Wipe each incoming fabric with its own alpha bounds. Remove old layers before drawing.
  if(!instant && changed.length){
    const bounds=changed.length===1?pct(changed[0].bb):[0,0];
    rescan(...bounds,true);
    for(const l of changed){
      const el=$('#figs [data-r="'+l.k+'"]');const [a,b]=pct(l.bb);
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)continue;
      el.animate([{clipPath:'inset('+a+'% 0 '+(100-a)+'% 0)'},{clipPath:'inset('+a+'% 0 '+b+'% 0)'}],{duration:380,easing:'ease-out'});
    }
  }
  lastGood=state;renderAcc();renderHot();renderSw();favUI();
  if(curView==='tune' && $('#side .on')?.dataset.m==='Accessories')renderAccessories();
}
function clipping(l){return l.from||l.to!==CH?'inset('+(l.from/CH*100)+'% 0 '+((CH-l.to)/CH*100)+'% 0)':'none';}

function paintTint(f,l){const i=f.querySelector('.tint');if(!i||!l.it)return;const t=tintOf(l.id);i.classList.toggle('on',!!t);if(t){i.style.backgroundColor=t;i.style.mixBlendMode=blend(l.it)}}
function renderHot(){const h=$('#hotspots');h.innerHTML='';
 const spots=[['top',IT[S.top].s==='dress'?[63,30]:[63,25]],['bottom',[36,55]],['shoes',[41,95]]];
 spots.forEach(([k,pos])=>{const id=S[k];if(!id)return;const it=IT[id],d=document.createElement('div');d.className='hs';d.style.left=pos[0]+'%';d.style.top=pos[1]+'%';
  d.innerHTML=`<i><b>${it.n}</b> · ${tintOf(id)?colName(tintOf(id)):it.c} · $${it.p}</i>`;d.onclick=()=>{setMode(it.s);setView('outfits');sideSel('Outfits')};h.appendChild(d)})}
function setFrame(f){frame=f;$('#modelWrap').className=f;$('#posel').textContent={full:'Full',mid:'Mid',portrait:'Portrait'}[f];$$('#bodyc .fr .opt').forEach(o=>o.classList.toggle('on',o.dataset.f===f))}

/* ---------- state / history ---------- */
function apply(s,anim=true){requested++;pendingOutfit=null;S=clone(s);showLook(!anim);$('#occasion').value=S.occasion;$('#season').value=S.season;
 const r=document.documentElement.style;$('#grade').style.filter=F[S.grade][1];$('#tint').style.background=F[S.grade][2];$('#fname').textContent=F[S.grade][0];
 const k=Math.max(0,(80-S.real)/80);r.setProperty('--real',`saturate(${1+k*.9}) contrast(${1+k*.25}) blur(${k*1.4}px) brightness(${1+k*.05})`);$('#bg').style.filter=`blur(${k*5}px) saturate(${1+k*.5})`;
 r.setProperty('--height',1+(S.height-168)/168*.9);r.setProperty('--build',1+(S.build-50)/50*.07);
 $('#realr').value=S.real;fill($('#realr'));$('#realv').textContent=S.real+'%';renderThumbs();syncBody()}
function commit(){if(JSON.stringify(hist[hi])===JSON.stringify(S)){ui();persist();return;}hist=hist.slice(0,hi+1);hist.push(clone(S));hi++;if(hist.length>80){hist.shift();hi--;}ui();persist()}
function ui(){$('#undo').disabled=hi<=0;$('#redo').disabled=hi>=hist.length-1}
function undo(){if(hi>0){requested++;hi--;apply(hist[hi]);ui();persist()}}function redo(){if(hi<hist.length-1){requested++;hi++;apply(hist[hi]);ui();persist()}}

/* ---------- wardrobe panel ---------- */
const PAL=[[null,'Original'],['#E9D8A6','Butter'],['#A9BF95','Matcha'],['#C9B6E4','Lavender'],['#EBB8BE','Blush'],['#9C7A5B','Mocha'],['#8A1E2E','Cherry'],['#3F5FB0','Cobalt'],['#3A4A39','Forest']];
const colName=c=>(PAL.find(p=>p[0]===c)||[0,'Custom'])[1];
function setMode(m){mode=m;$$('#mix .opt').forEach(x=>x.classList.toggle('on',x.dataset.m===m));renderGrid()}
let onlyFavorites=false;
function toggleFav(key){favs.has(key)?favs.delete(key):favs.add(key);favUI();persist();if(onlyFavorites)renderGrid();}
function renderGrid(){
 const g=$('#grid');let list=mode==='look'?LOOKS.map((l,i)=>({...l,i})):BY(mode);
 if(mode!=='look')list=[...list.filter(x=>x.collection),...list.filter(x=>!x.collection)];
 if(onlyFavorites)list=list.filter(x=>favs.has(x.id||'L'+x.i));
 g.className='m-'+mode;g.replaceChildren();g.scrollTop=0;
 for(const [order,x] of list.entries()){
   const card=document.createElement('div');card.className='card';card.dataset.id=x.id||'';card.dataset.i=x.i??'';
   card.style.animationDelay=Math.min(order,7)*25+'ms';
   const wear=document.createElement('button');wear.className='wear';wear.title=x.aesthetic?x.n+' · '+x.aesthetic:x.n+' · '+x.c;wear.setAttribute('aria-label','Wear '+x.n);
   const im=document.createElement('img');im.className='catalog-image';im.loading=order<8?'eager':'lazy';im.decoding='async';im.alt='';im.src=x.thumb||x.f;
   im.onerror=()=>{im.hidden=true;card.classList.add('no-preview');};
   const label=document.createElement('span');label.className='nt';label.textContent=x.n;wear.append(im,label);
   wear.onclick=()=>mode==='look'?wearLook(x.i):equip(x.id);wear.ondblclick=()=>toggleFav(x.id||'L'+x.i);
   const heart=document.createElement('button');heart.className='hb';heart.title='Toggle favorite';heart.setAttribute('aria-label','Favorite '+x.n);
   heart.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/></svg>';
   heart.onclick=e=>{e.stopPropagation();toggleFav(x.id||'L'+x.i);};card.append(wear,heart);
   if(x.p){const p=document.createElement('em');p.className='pr';p.textContent='$'+x.p;card.appendChild(p);}
   g.appendChild(card);
 }
 if(!list.length){const help=document.createElement('p');help.className='empty-grid';help.textContent='No favorites in this category.';g.appendChild(help);}
 $('#cnt').textContent=list.length+' '+SLOTN[mode].toLowerCase()+(onlyFavorites?' · favorites':'');
 markOn();renderSw();favUI();
}
function renderAccessories(){
 const panel=$('#v-tune');panel.innerHTML='<h3>Accessories<small>Tap to wear or remove</small></h3><div class="access-grid"></div>';
 for(const x of BY('accessory')){
   const b=document.createElement('button');b.className='opt access-piece';
   if(x.fitNote)b.title=x.fitNote;
   const on=(S.accessories||[]).includes(x.id);
   b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);
   const pic=document.createElement('img');pic.src=x.thumb;pic.alt='';const label=document.createElement('span');label.textContent=x.n;
   b.append(pic,label);b.onclick=()=>toggleAccessory(x.id);panel.lastChild.appendChild(b);
 }
}

function markOn(){$$('#grid .card').forEach(c=>{let on;if(mode==='look'){const l=LOOKS[+c.dataset.i];on=(S.waist||'loose')===(l.waist||'loose')&&S.top===l.top&&S.bottom===(l.bottom||null)&&S.shoes===l.shoes&&JSON.stringify([...(S.accessories||[])].sort())===JSON.stringify([...(l.accessories||[])].sort())}else on=worn().includes(c.dataset.id);c.classList.toggle('on',on)})}
function favUI(){$$('#grid .card').forEach(c=>c.classList.toggle('fav',favs.has(c.dataset.id||'L'+c.dataset.i)));badge('#bHeart',favs.size);$('#bHeart').classList.toggle('fav',onlyFavorites)}
$$('#mix .opt').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
function renderFitTools(item){
 const keep=$('#restyle-piece');keep.hidden=!item;
 if(item){keep.textContent='Keep '+(item.s==='shoes'?'shoes':item.s)+' · restyle';keep.title='Keep '+item.n+' and restyle the other unlocked pieces';}
 const fit=$('#waist-fit');fit.hidden=!canTuck(S);
 for(const b of fit.querySelectorAll('button'))b.setAttribute('aria-pressed',String((S.waist||'loose')===b.value));
}
$('#restyle-piece').onclick=()=>{const item=slotItem(mode);if(item)restylePiece(item.id);};
$('#restyle-shoes').onclick=()=>restylePiece(null,true);
for(const b of $$('#waist-fit button'))b.onclick=()=>{
 const current=pendingOutfit||S;
 if(canTuck(current) && (current.waist||'loose')!==b.value)selectState({...current,waist:b.value});
};
function renderSw(){const it=mode==='look'?null:slotItem(mode),w=$('#swr'),lk=$('#lock');
 renderFitTools(it);
 lk.style.visibility=mode==='look'?'hidden':'';lk.classList.toggle('on',locks.has(slotOf(mode)));lk.title=locks.has(slotOf(mode))?'Unlock for Randomize':'Lock for Randomize';
 if(!it){w.innerHTML=`<em>${mode==='look'?'Tap a look to wear all of it, then restyle piece by piece':'Pick a '+SLOTN[mode].toLowerCase().replace(/s$/,'')+' to recolour it'}</em>`;return}
 if(!it.tint){w.innerHTML=`<em>${it.n} · original colour only</em>`;return}
 const t=tintOf(it.id)||null;
 w.innerHTML=PAL.map(([c,n])=>`<button class="cw${c?'':' orig'}${t===c?' on':''}" data-c="${c||''}" title="${n}" style="${c?'background:'+c:`background-image:url(${HU(it.f,360)});background-size:${CW*.06}px ${CH*.06}px;background-position:${-(it.bb[0]+it.bb[2])/2*.06+12}px ${-(it.bb[1]+it.bb[3])/2*.06+12}px`}"></button>`).join('');
 $$('#swr .cw').forEach(b=>b.onclick=()=>{const c=b.dataset.c||null;S.tint={...S.tint};c?S.tint[it.id]=c:delete S.tint[it.id];apply(S);commit();toast(it.n+' · '+colName(c))})}
$('#lock').onclick=()=>{const k=slotOf(mode);locks.has(k)?locks.delete(k):locks.add(k);renderSw();persist();toast((locks.has(k)?'Locked ':'Unlocked ')+SLOTN[mode].toLowerCase())};
function renderAcc(){const rows=[[S.top,IT[S.top].s==='dress'?'Dress':'Top'],[S.bottom,'Bottom'],[S.shoes,'Shoes'],...(S.accessories||[]).map(id=>[id,IT[id].n])].filter(r=>r[0]);let tot=0;
 $('#acc').innerHTML=rows.map(([id,lab])=>{const it=IT[id],tc=tintOf(id);tot+=it.p;return`<div class="row${openRow===lab?' open':''}" data-k="${lab}"><button>${lab}<span class="rn">${it.n}${tc?` <i class="dot" style="background:${tc}"></i>`:''}</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button><div class="rbody"><div>${it.pcs.map((x,j)=>{const k=id+j;return`<div class="it"><span>${x[0]}</span><em>${tc&&j===0?colName(tc):x[1]}</em><b>$${x[2]}</b><button class="add${cart.has(k)?' in':''}" data-id="${k}">${cart.has(k)?'✓':'+'}</button></div>`}).join('')}<button class="restyle-row" data-keep="${id}">Keep this piece · restyle</button></div></div></div>`}).join('');
 $$('#acc [data-keep]').forEach(b=>b.onclick=()=>restylePiece(b.dataset.keep));
 $('#total').innerHTML=`<span>Look total</span><b>$${tot}</b>`;
 $$('.row>button').forEach(b=>b.onclick=()=>{const k=b.parentNode.dataset.k;openRow=openRow===k?null:k;$$('.row').forEach(r=>r.classList.toggle('open',r.dataset.k===openRow))});
 $$('.add').forEach(b=>b.onclick=()=>{const id=b.dataset.id;if(cart.has(id))cart.delete(id);else{cart.add(id);toast('Added to cart')}b.classList.toggle('in',cart.has(id));b.textContent=cart.has(id)?'✓':'+';badge('#bCart',cart.size);persist()})}

/* ---------- views ---------- */
function setView(v){curView=v;const m={outfits:'v-outfits',tune:'v-tune',dna:'v-dna',body:'v-body',pers:'v-pers',story:'v-story'};$$('.view').forEach(x=>x.classList.toggle('on',x.id===m[v]));if(v==='story')typeStory();if(v==='dna')dnaRows()}
function sl(name,v,min,max,id){return`<div class="sl"><div><span>${name}</span><b>${v}</b></div><input type="range" min="${min}" max="${max}" value="${v}" data-id="${id}" style="--p:${(v-min)/(max-min)*100}%"></div>`}
const ICON={Face:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M9 10v1M15 10v1M9 15c2 2 4 2 6 0"/></svg>',Hair:'<svg viewBox="0 0 24 24"><path d="M6 20c-2-8 0-15 6-15s8 7 6 15"/></svg>',Makeup:'<svg viewBox="0 0 24 24"><path d="M9 20V10h6v10zM10 10V4h4v6"/></svg>',Body:'<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M8 21l1-9-2-3h10l-2 3 1 9"/></svg>',Outfits:'<svg viewBox="0 0 24 24"><path d="M8 4l-5 4 3 3 2-1v10h8V10l2 1 3-3-5-4a4 4 0 01-8 0z"/></svg>',Accessories:'<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="6"/><path d="M12 8V4"/></svg>',Tattoos:'<svg viewBox="0 0 24 24"><path d="M12 3c4 5 6 8 0 18-6-10-4-13 0-18z"/></svg>',Details:'<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>'};
const MENU=['Face','Hair','Makeup','Body','Outfits','Accessories','Tattoos','Details'];
const TUNE={Face:{pre:['Soft','Defined','Natural','Sculpted'],sl:[['Smile',35],['Jawline',50],['Freckles',10]]},Hair:{sw:['#14110f','#3b2a20','#6b4a35','#a07c5a','#d9c3a1'],pre:['High bun','Low bun','Long straight','Bob','Ponytail'],sl:[['Volume',60],['Shine',70]]},Makeup:{sw:['#e8b4a8','#d98c8c','#b5525e','#8e3c4a'],pre:['No-makeup','Glass skin','Soft glam','Editorial'],sl:[['Blush',30],['Lip tint',45],['Glow',55]]},Accessories:{multi:['Gold hoops','Silver chain','Shoulder bag','Sunglasses','Watch','Hair clip']},Tattoos:{pre:['None','Fine line','Floral','Script','Minimal dots'],sl:[['Opacity',40]]},Details:{pre:['Studio','Natural','Cinematic'],sl:[['Skin texture',70],['Fabric detail',80],['Lighting softness',60]]}};
const tstate={};
function tune(item){if(item==='Accessories'){renderAccessories();setView('tune');return;}const T=TUNE[item],st=tstate[item]=tstate[item]||{pre:null,sw:0,sl:(T.sl||[]).map(s=>s[1]),multi:[]};
 let h=`<h3>${item}<small>changes re-render the model</small></h3>`;
 if(T.sw)h+=`<div class="swr">${T.sw.map((c,i)=>`<button class="sw${st.sw===i?' on':''}" data-i="${i}" style="background:${c}"></button>`).join('')}</div>`;
 if(T.pre)h+=`<div class="opts">${T.pre.map(p=>`<button class="opt${st.pre===p?' on':''}">${p}</button>`).join('')}</div>`;
 if(T.multi)h+=`<h3><small>Add items</small></h3><div class="opts">${T.multi.map(p=>`<button class="opt${st.multi.includes(p)?' on':''}">${p}</button>`).join('')}</div>`;
 (T.sl||[]).forEach((s,i)=>h+=sl(s[0],st.sl[i],0,100,i));
 const v=$('#v-tune');v.innerHTML=h;
 v.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(T.multi){const i=st.multi.indexOf(b.textContent);i<0?st.multi.push(b.textContent):st.multi.splice(i,1);b.classList.toggle('on')}else{st.pre=b.textContent;v.querySelectorAll('.opt').forEach(x=>x.classList.toggle('on',x===b));toast(item+': '+b.textContent)}rescan()});
 v.querySelectorAll('.sw').forEach(b=>b.onclick=()=>{st.sw=+b.dataset.i;v.querySelectorAll('.sw').forEach(x=>x.classList.toggle('on',x===b));rescan()});
 v.querySelectorAll('input').forEach(r=>{r.oninput=()=>{fill(r);st.sl[r.dataset.id]=+r.value;r.previousElementSibling.lastChild.textContent=r.value};r.onchange=rescan});
 setView('tune')}
$('#side').insertAdjacentHTML('beforeend',MENU.map(m=>`<button data-m="${m}">${ICON[m]}${m}</button>`).join(''));
function sideSel(m){$$('#side button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));const b=$(`#side [data-m="${m}"]`);$('#sideInd').style.top=b.offsetTop+'px'}
$$('#side button').forEach(b=>b.onclick=()=>{const m=b.dataset.m;sideSel(m);m==='Outfits'?setView('outfits'):m==='Body'?setView('body'):tune(m)});
const TB=$$('#tabs button');function tabInd(){const b=TB[tab];$('#tabInd').style.left=b.offsetLeft+'px';$('#tabInd').style.width=b.offsetWidth+'px'}
TB.forEach((b,i)=>b.onclick=()=>{tab=i;TB.forEach(x=>x.classList.toggle('on',x===b));tabInd();$('#stage').classList.toggle('away',i!==2);setView(['dna','body','outfits','pers','story'][i]);if(i===2)sideSel('Outfits')});

/* ---------- body ---------- */
function syncBody(){const h=$('#bh'),b=$('#bb');if(h){h.value=S.height;b.value=S.build;fill(h);fill(b);h.previousElementSibling.lastChild.textContent=S.height;b.previousElementSibling.lastChild.textContent=S.build}}
$('#bodyc').innerHTML=sl('Height (cm)',168,150,185,'h').replace('data-id="h"','id="bh"')+sl('Build',50,0,100,'b').replace('data-id="b"','id="bb"')+'<h3><small>Posture</small></h3><div class="opts po">'+['Relaxed','Confident','Editorial'].map((p,i)=>`<button class="opt${i?'':' on'}">${p}</button>`).join('')+'</div><h3><small>Framing</small></h3><div class="opts fr">'+[['full','Full body'],['mid','Mid shot'],['portrait','Portrait']].map(f=>`<button class="opt${f[0]==='full'?' on':''}" data-f="${f[0]}">${f[1]}</button>`).join('')+'</div>';
['bh','bb'].forEach(id=>{const r=$('#'+id);r.oninput=()=>{S[id==='bh'?'height':'build']=+r.value;apply(S)};r.onchange=commit});
$$('.po .opt').forEach(b=>b.onclick=()=>{$$('.po .opt').forEach(x=>x.classList.toggle('on',x===b));rescan()});
$$('.fr .opt').forEach(b=>b.onclick=()=>setFrame(b.dataset.f));

/* ---------- identity / DNA ---------- */
const nameEl=$('#pname');
function scramble(to){let n=0;const ch='abcdefghijklmnopqrstuvwxyz';const t=setInterval(()=>{if(++n>14){clearInterval(t);nameEl.textContent=to;return}nameEl.textContent=[...to].map((c,i)=>i<n/14*to.length||c==' '||c=='-'?c:ch[Math.random()*26|0]).join('')},30)}
function shuffle(){idn=(idn+1)%IDS.length;const d=IDS[idn];const s=$('#shuf');s.dataset.r=(+s.dataset.r||0)+180;s.style.transform=`rotate(${s.dataset.r}deg)`;scramble(d[0]);$('#page').textContent=d[1];$('#pcity').textContent=d[2];$('#ptemp').textContent=d[3]+'°C';dnaRows()}
$('#shuf').onclick=shuffle;$('#reseed').onclick=()=>{shuffle();rescan()};
function dnaRows(){$('#dnarows').innerHTML=[['Seed','EC-0'+(400+idn*37)+'-KR'],['Heritage','Korean'],['Age',IDS[idn][1]],['Eye colour','Dark brown'],['Hair','Black · high bun']].map(r=>`<div><span>${r[0]}</span>${r[1]}</div>`).join('')}
$('#pen').onclick=()=>{const on=nameEl.classList.toggle('edit');nameEl.contentEditable=on;if(on){nameEl.focus();getSelection().selectAllChildren(nameEl)}else{nameEl.blur();toast('Name updated')}};
nameEl.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#pen').click()}};
(function helix(){const s=$('#helix');let t=0;(function f(){let h='';for(let i=0;i<26;i++){const y=5+i*4.4,xa=150+Math.sin(i*.42+t)*38,xb=150-Math.sin(i*.42+t)*38,d1=(Math.cos(i*.42+t)+1)/2,d2=1-d1;
 h+=`<line x1="${xa}" y1="${y}" x2="${xb}" y2="${y}" stroke="rgba(255,255,255,${.15+d1*.25})"/><circle cx="${xa}" cy="${y}" r="${2+d1*2.4}" fill="rgba(255,255,255,${.4+d1*.6})" stroke="none"/><circle cx="${xb}" cy="${y}" r="${2+d2*2.4}" fill="rgba(255,255,255,${.4+d2*.6})" stroke="none"/>`}
 if(curView==='dna'){s.innerHTML=h;t+=.03;}setTimeout(f,curView==='dna'?35:450)})()})();

/* ---------- personality ---------- */
const TR=['Curious','Bold','Calm','Witty','Romantic','Driven','Playful','Gentle','Creative','Loyal'],AX=['Openness','Energy','Warmth','Focus','Humour'];
function calc(){axes=AX.map((a,i)=>{let n=0;traits.forEach(t=>{for(const c of t)n+=c.charCodeAt(0)*(i+3)});return 30+n%65})}
function radar(){const c=[125,100],r=78;const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/5;return[c[0]+Math.cos(a)*r*v,c[1]+Math.sin(a)*r*v]};let h='';
 [.25,.5,.75,1].forEach(v=>h+=`<polygon points="${AX.map((_,i)=>pt(i,v).join(',')).join(' ')}" stroke="rgba(255,255,255,.25)"/>`);
 h+=`<polygon points="${axes.map((v,i)=>pt(i,v/100).join(',')).join(' ')}" fill="rgba(255,255,255,.28)" stroke="#fff" stroke-width="1.5"/>`;
 AX.forEach((a,i)=>{const p=pt(i,1.25);h+=`<text x="${p[0]}" y="${p[1]+4}" fill="#fff" stroke="none" font-size="11" text-anchor="middle">${a}</text>`});$('#radar').innerHTML=h;
 $('#persl').innerHTML=sl('Openness',axes[0],0,100,0)+sl('Energy',axes[1],0,100,1);$$('#persl input').forEach(r=>r.oninput=()=>{fill(r);axes[r.dataset.id]=+r.value;r.previousElementSibling.lastChild.textContent=r.value;radar()})}
function renderTraits(){$('#traits').innerHTML=TR.map(t=>`<button class="opt${traits.includes(t)?' on':''}">${t}</button>`).join('');$$('#traits .opt').forEach(b=>b.onclick=()=>{const t=b.textContent,i=traits.indexOf(t);i<0?(traits.push(t),traits.length>3&&traits.shift()):traits.splice(i,1);calc();renderTraits();radar();persist()})}
calc();renderTraits();radar();

/* ---------- story ---------- */
let typer;function typeStory(){const t=traits,top=IT[S.top],bot=S.bottom&&IT[S.bottom],sh=IT[S.shoes];
 const outfit=top.s==='dress'?`a ${top.n.toLowerCase()}`:`a ${top.n.toLowerCase()} with ${bot.n.toLowerCase()}`;
 const txt=`${nameEl.textContent} is ${S.height} cm of ${(t[0]||'curious').toLowerCase()} energy from ${$('#pcity').textContent.split(',')[0]}. Today she styled ${outfit} and ${sh.n.toLowerCase()}; friends call her ${(t[1]||'calm').toLowerCase()} and a little ${(t[2]||'bold').toLowerCase()}. She keeps a sketchbook of strangers' outfits and is saving for a studio of her own.`;
 const e=$('#story');clearInterval(typer);let n=0;e.classList.add('typing');typer=setInterval(()=>{n+=2;e.textContent=txt.slice(0,n);if(n>=txt.length){clearInterval(typer);e.classList.remove('typing')}},22)}
$('#rewrite').onclick=()=>{traits=[...TR].sort(()=>Math.random()-.5).slice(0,3);calc();renderTraits();radar();typeStory()};

/* ---------- filters / realism ---------- */
$('#flist').innerHTML=F.map((f,i)=>`<button data-i="${i}">${f[0]}</button>`).join('');
$('#fbtn').onclick=e=>{e.stopPropagation();$('#fbtn').classList.toggle('open');$('#flist').classList.toggle('open')};
$$('#flist button').forEach(b=>b.onclick=()=>{S.grade=+b.dataset.i;apply(S);commit()});
function renderThumbs(){$('#thumbs').innerHTML=[0,1,2,3,4].map(j=>{const g=(fOff+j)%F.length;return`<div class="th${S.grade===g?' on':''}" data-g="${g}" title="${F[g][0]}" style="filter:${F[g][1]}"><i style="background:${F[g][2]}"></i></div>`}).join('');
 $$('.th').forEach(t=>{crop(t,64);t.onclick=()=>{S.grade=+t.dataset.g;apply(S);commit()}})}
$('#fnext').onclick=()=>{fOff=(fOff+1)%F.length;renderThumbs();const t=$('#thumbs');t.style.transition='none';t.style.transform='translateX(-14px)';void t.offsetWidth;t.style.transition='transform .35s';t.style.transform='none'};
$('#realr').oninput=e=>{S.real=+e.target.value;apply(S)};$('#realr').onchange=commit;

/* ---------- controls ---------- */
$('#undo').onclick=undo;$('#redo').onclick=redo;
$('#pose').onclick=()=>setFrame({full:'mid',mid:'portrait',portrait:'full'}[frame]);
$('#reset').onclick=()=>{requested++;spin++;S=clone(DEF);apply(S);setFrame('full');commit();toast('Reset to default')};
addEventListener('keydown',e=>{if(e.target.isContentEditable||e.target.matches('input,select,textarea'))return;const m=e.metaKey||e.ctrlKey;
 if(m&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
 if(curView!=='outfits')return;if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'||mode==='look')return;
 const list=BY(mode),it=slotItem(mode),i=it?list.indexOf(it):-1,d=e.key==='ArrowRight'?1:-1;equip(list[(i+d+list.length)%list.length].id)});

/* ---------- download: lookbook card ---------- */
let offlinePack;
function readImage(url) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    if(/^https?:/.test(url))image.crossOrigin='anonymous';
    image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Image unavailable'));image.src=url;
  });
}
async function load(path) {
  if(location.protocol!=='file:')return readImage(path);
  if(!offlinePack){
    offlinePack=new Promise((resolve,reject)=>{
      const tag=document.createElement('script');tag.src='assets/offline-export.js';tag.onload=resolve;
      tag.onerror=()=>{offlinePack=null;reject(new Error('Offline export assets unavailable'));};document.head.appendChild(tag);
    });
  }
  await offlinePack;
  const record=window.eclatPhotoIndex[path];
  if(!record)throw new Error('Missing export asset '+path);
  const [index,w,h,left,top]=record,image=await readImage(window.eclatPhotos[index]);
  if(!w)return image;
  const sheet=document.createElement('canvas');sheet.width=w;sheet.height=h;
  sheet.getContext('2d').drawImage(image,left,top);return sheet;
}
let SPRITE;async function maskOf(it,im){if(it.mask)return load(it.mask);if(it.mi==null)return im;SPRITE=SPRITE||await load(HU(MASKS.f,2720));const w=SPRITE.width/MASKS.cols,h=SPRITE.height/MASKS.rows,c=document.createElement('canvas');c.width=CW;c.height=CH;c.getContext('2d').drawImage(SPRITE,(it.mi%MASKS.cols)*w,(it.mi/MASKS.cols|0)*h,w,h,0,0,CW,CH);return c}
async function tinted(im,mask,color,mode) {
  const fabric=document.createElement('canvas');fabric.width=CW;fabric.height=CH;
  const dye=fabric.getContext('2d');dye.drawImage(im,0,0,CW,CH);
  dye.globalCompositeOperation=mode;dye.fillStyle=color;dye.fillRect(0,0,CW,CH);
  dye.globalCompositeOperation='destination-in';dye.drawImage(mask,0,0,CW,CH);
  const result=document.createElement('canvas');result.width=CW;result.height=CH;
  const out=result.getContext('2d');out.drawImage(im,0,0,CW,CH);
  out.globalCompositeOperation='source-atop';out.drawImage(fabric,0,0);
  return result;
}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
async function download(){const state=clone(S);const person=nameEl.textContent;toast('Rendering your look…');try{
 const c=document.createElement('canvas');c.width=1600;c.height=2048;const x=c.getContext('2d');
 const bg=await load(HU(BG,2400)).catch(()=>load('assets/background-fallback.jpg'));const s=Math.max(1600/bg.width,2048/bg.height),k=Math.max(0,(80-state.real)/80);
 const backdrop=document.createElement('canvas');backdrop.width=c.width;backdrop.height=c.height;
 const bx=backdrop.getContext('2d');bx.filter=`blur(${k*5}px) saturate(${1+k*.5})`;
 bx.drawImage(bg,(c.width-bg.width*s)/2,(c.height-bg.height*s)/2,bg.width*s,bg.height*s);bx.filter='none';
 const stops=F[state.grade][2].match(/rgba\([^)]+\)/g);
 if(stops){const g=bx.createLinearGradient(0,0,0,c.height);g.addColorStop(0,stops[0]);g.addColorStop(1,stops[1]);bx.globalCompositeOperation='soft-light';bx.fillStyle=g;bx.fillRect(0,0,c.width,c.height);}
 x.filter=F[state.grade][1];x.drawImage(backdrop,0,0);x.filter='none';
 x.save();x.filter='none';x.translate(990,2012);x.scale(1,.11);const sh=x.createRadialGradient(0,0,10,0,0,330);sh.addColorStop(0,'rgba(30,28,26,.5)');sh.addColorStop(1,'rgba(30,28,26,0)');x.fillStyle=sh;x.beginPath();x.arc(0,0,330,0,7);x.fill();x.restore();x.filter='none';
 x.save();const sx=1+(state.build-50)/50*.07,sy=1+(state.height-168)/168*.9;x.translate(990,CH);x.scale(sx,sy);x.translate(-990,-CH);
 x.filter=`saturate(${1+k*.9}) contrast(${1+k*.25}) blur(${k*1.4}px) brightness(${1+k*.05})`;
 for(const l of layerList(state).filter(l=>l.u).sort((a,b)=>a.z-b.z)){let im=await load(HU(l.u,1360));const t=l.id&&tintOf(l.id,state);if(t)im=await tinted(im,await maskOf(l.it,im),t,blend(l.it));x.save();x.beginPath();x.rect(310,l.from,CW,l.to-l.from);x.clip();x.drawImage(im,310,0,CW,CH);x.restore()}x.restore()
 x.filter='none';
 x.fillStyle='#fff';x.font='800 92px Syne, sans-serif';x.fillText('ÉCLAT',70,150);x.font='400 26px Figtree, sans-serif';x.globalAlpha=.8;x.fillText('STYLED BY YOU',74,195);x.globalAlpha=1;
 const items=worn(state).map(id=>IT[id]),tot=items.reduce((a,b)=>a+b.p,0);const h=190+items.length*86;
 x.save();rr(x,60,2048-h-60,520,h,34);x.fillStyle='rgba(30,28,34,.42)';x.fill();x.strokeStyle='rgba(255,255,255,.45)';x.lineWidth=2;x.stroke();x.restore();
 let y=2048-h-60+70;x.fillStyle='#fff';x.font='400 40px Figtree, sans-serif';x.fillText(person,96,y);y+=26;
 items.forEach(it=>{y+=80;const t=tintOf(it.id,state);x.font='500 28px Figtree, sans-serif';x.fillStyle='#fff';x.fillText(it.n,96,y);x.font='400 22px Figtree, sans-serif';x.globalAlpha=.7;x.fillText((t?colName(t):it.c)+'  ·  $'+it.p,96,y+30);x.globalAlpha=1;if(t){x.beginPath();x.arc(540,y-8,14,0,7);x.fillStyle=t;x.fill();x.strokeStyle='#fff';x.stroke()}});
 y+=86;x.fillStyle='rgba(255,255,255,.4)';x.fillRect(96,y-50,448,1);x.fillStyle='#fff';x.font='400 22px Figtree, sans-serif';x.fillText('LOOK TOTAL',96,y);x.font='500 34px Figtree, sans-serif';x.textAlign='right';x.fillText('$'+tot,544,y+2);x.textAlign='left';
 const a=document.createElement('a');a.download='eclat-look.png';a.href=c.toDataURL('image/png');a.click();toast('Look downloaded')}catch(e){toast('Image export failed · check the extracted project assets')}}

/* ---------- more menu / library ---------- */
$('#bMore').onclick=e=>{e.stopPropagation();$('#more').classList.toggle('open')};
$$('#more button').forEach((b,i)=>b.onclick=async()=>{
 $('#more').classList.remove('open');
 if(i===1)return download();
 if(i===2){$('#saveb').click();return;}
 if(i===3){TB[1].click();return;}
 const url=new URL(location.href);
 url.hash=new URLSearchParams({look:JSON.stringify(snap())}).toString();
 if(url.protocol==='file:'){toast('Serve the studio to share a look link');return;}
 try{await navigator.clipboard.writeText(url.href);toast('Look link copied');}
 catch{prompt('Copy this look link',url.href);}
});
$('#bDl').onclick=download;$('#bBag').onclick=e=>{e.stopPropagation();$('#lib').classList.toggle('open')};
document.addEventListener('click',e=>{$('#more').classList.remove('open');if(!e.target.closest('#lib,#bBag,#saveb'))$('#lib').classList.remove('open');if(!e.target.closest('.fd')){$('#fbtn').classList.remove('open');$('#flist').classList.remove('open')}});
const snap=()=>clone(S);
$('#saveb').onclick=()=>{
 const savedState=snap();const b=$('#saveb');b.classList.remove('shine');void b.offsetWidth;b.classList.add('shine');
 const slot=saved.length;saved.push(savedState);if(saved.length>40)saved.shift();
 renderLib();persist();$('#lib').classList.add('open');
 const f=document.createElement('div');f.className='flyer';f.innerHTML=layerHTML(savedState,360);
 f.style.cssText='left:580px;top:72px;width:440px;height:663px';$('#stage').appendChild(f);void f.offsetWidth;
 f.style.left=(522+Math.min(slot,6)*80)+'px';f.style.top='606px';f.style.width='72px';f.style.height='104px';
 setTimeout(()=>f.remove(),860);toast('Saved to library');
};
function renderLib(){
 $('#libempty').style.display=saved.length?'none':'';$$('.saved').forEach(x=>x.remove());
 saved.forEach((s,i)=>{
  const d=document.createElement('button');d.className='saved';d.title='Restore saved look '+(i+1);d.setAttribute('aria-label',d.title);
  d.innerHTML='<span class="saved-figure">'+layerHTML(s,360)+'</span>';const f=d.firstElementChild;f.style.transform='scale('+(1+(s.build-50)/50*.07)+','+(1+(s.height-168)/168*.9)+')';d.onclick=()=>selectState(clone(s));$('#librow').appendChild(d);
 });
 $('#libn').textContent=saved.length+' saved';badge('#bBag',saved.length);
}
function persist(){
 try{localStorage.setItem('eclat.v2',JSON.stringify({saved,cur:snap(),favs:[...favs],locks:[...locks],cart:[...cart],traits,idn}));}
 catch{toast('Browser storage is unavailable for this session');}
}
function normalize(raw){
 if(!raw||!['top','dress'].includes(IT[raw.top]?.s)||IT[raw.shoes]?.s!=='shoes')return null;
 const d=IT[raw.top].s==='dress';if(!d&&IT[raw.bottom]?.s!=='bottom')return null;
 const limit=(v,a,b,def)=>Number.isFinite(v)?Math.min(b,Math.max(a,v)):def;
 const n={...clone(DEF),top:raw.top,shoes:raw.shoes,bottom:d?null:raw.bottom,
  memT:IT[raw.memT]?.s==='top'?raw.memT:DEF.memT,memB:IT[raw.memB]?.s==='bottom'?raw.memB:DEF.memB,
  height:limit(raw.height,150,185,168),build:limit(raw.build,0,100,50),grade:Math.round(limit(raw.grade,0,F.length-1,0)),real:limit(raw.real,0,100,75)};
 n.waist=raw.waist==='tucked' && canTuck(n)?'tucked':'loose';
 n.accessories=[];for(const id of Array.isArray(raw.accessories)?raw.accessories:[]){
  if(IT[id]?.s==='accessory'&&!n.accessories.some(k=>IT[k].group===IT[id].group))n.accessories.push(id);
 }
 n.tint={};for(const [id,c] of Object.entries(raw.tint||{})){if(IT[id]?.tint && /^#[0-9a-f]{6}$/i.test(c))n.tint[id]=c;}
 for(const id of ['occasion','season'])if([...$('#'+id).options].some(o=>o.value===raw[id]))n[id]=raw[id];
 if(n.bottom==='b1' && n.top!=='t1' || n.bottom==='b5' && n.top!=='t5')n.bottom=n.memB=DEF.bottom;
 if(IT[n.shoes].tall && IT[n.bottom]?.fit==='cargo')n.shoes='ns03';
 n.accessories=n.accessories.filter(id=>!IT[id].fitsTops || IT[id].fitsTops.includes(n.top));
 return n;
}
function restore(){
 try{
  const d=JSON.parse(localStorage.getItem('eclat.v2')||'null');if(!d)return;
  saved=(Array.isArray(d.saved)?d.saved:[]).map(normalize).filter(Boolean).slice(-40);S=normalize(d.cur)||S;
  favs=new Set((Array.isArray(d.favs)?d.favs:[]).filter(id=>IT[id]||(/^L\d+$/.test(id)&&LOOKS[+id.slice(1)])));
  (d.locks||[]).filter(k=>activeSlots.includes(k)).forEach(k=>locks.add(k));
  cart=new Set((d.cart||[]).filter(id=>ITEMS.some(x=>x.pcs.some((p,i)=>x.id+i===id))));
  if(Array.isArray(d.traits)){traits=d.traits.filter(t=>TR.includes(t)).slice(0,3);calc();renderTraits();radar();}
  if(Number.isInteger(d.idn)&&IDS[d.idn]){idn=(d.idn+IDS.length-1)%IDS.length;shuffle();}
 }catch{}
}

/* ---------- coordinated outfit selection ---------- */
const recentSuggestions=[];
function estimateSeason(){const m=new Date().getMonth();return m<2||m===11?'Winter':m<5?'Spring':m<8?'Summer':'Autumn';}
function tone(item,tints){
 const names=(tints?.[item.id]?colName(tints[item.id]):item.c).toLowerCase();
 if(/burgundy|cherry|oxblood|garnet|rose|pink|plum|blush|terracotta/.test(names))return 'rose';
 if(/olive|forest|green|pine|matcha|sage|emerald/.test(names))return 'green';
 if(/navy|blue|indigo|cobalt|lavender/.test(names))return 'blue';
 if(/butter|gold|yellow/.test(names))return 'gold';
 return 'neutral';
}
function outfitScore(s,recipe){
 const items=[IT[s.top],IT[s.bottom],IT[s.shoes]].filter(Boolean);
 const [top,shoe]=[items[0],IT[s.shoes]],bottom=IT[s.bottom];
 const temp=Number.parseInt($('#ptemp').textContent,10)||14;
 const warm=items.reduce((a,x)=>a+(x.warmth||2),0)/items.length;
 const formal=items.map(x=>x.formality??2);
 const moods={Work:3.4,Evening:4.1,Occasion:4.7,Weekend:1.8,Travel:1.8};
 let score=12-(Math.max(...formal)-Math.min(...formal))*1.5;
 score-=Math.abs(warm-(temp<10?3.5:temp<18?2.5:1.4));
 if(moods[S.occasion])score-=Math.abs(formal.reduce((a,b)=>a+b,0)/formal.length-moods[S.occasion])*2;
 const colors=items.map(x=>tone(x,s.tint)).filter(v=>v!=='neutral');
 score-=Math.max(0,new Set(colors).size-2)*2;
 if(colors.length && new Set(colors).size===1)score+=.8;
 if(top.volume==='relaxed' && ['wide','palazzo','cargo'].includes(bottom?.fit))score-=2;
 if(top.volume==='fitted' && ['wide','palazzo','skirt','flare'].includes(bottom?.fit))score+=1;
 if(shoe.sport && top.formality>=4)score-=3;
 if(['velvet','satin'].includes(top.material) && ['metallic','satin','leather'].includes(shoe.material))score+=1.4;
 if(['linen','cotton'].includes(top.material) && ['jute','mesh'].includes(shoe.material))score+=1;
 if(recipe){
   if(recipe.occasion===S.occasion)score+=5;
   if(recipe.season===(S.season==='Auto'?estimateSeason():S.season))score+=S.season==='Auto'?1.1:3.5;
   if(temp>=recipe.temp[0] && temp<=recipe.temp[1])score+=1.25;
   score+=recipe.traits.filter(t=>traits.includes(t)).length*.8;
 }else if(traits.includes('Bold') && colors.length>0)score+=.9;
 if(recentSuggestions.includes(sceneKey(s)))score-=5;
 return score;
}
function styleCandidate({anchor=null, shoesOnly=false}={}) {
  const held=new Set(locks);
  if(shoesOnly){held.add('top');held.add('bottom');}
  if(anchor && anchor.s!=='accessory')held.add(slotOf(anchor.s));
  const allows=s=>activeSlots.every(k=>!held.has(k)||(s[k]||null)===(S[k]||null));
  const editable=activeSlots.filter(k=>!held.has(k));
  if(!editable.length)return null;
  const candidates=new Map();
  const preferChanges=Boolean(anchor);
  function consider(next,recipe){
    if(!allows(next))return;
    const changes=editable.filter(k=>(S[k]||null)!==(next[k]||null)).length;
    if(!changes)return;
    if(shoesOnly)next.accessories=[...S.accessories];
    else if(anchor?.s==='accessory'){
      next.accessories=[...next.accessories.filter(id=>IT[id].group!==anchor.group),anchor.id];
    }
    if(held.has('top')){
      if(S.waist==='tucked' && !canTuck(next))return;
      next.waist=S.waist||'loose';
    }else if(!canTuck(next))next.waist='loose';
    if(conflict(next)||worn(next).some(id=>missing.has(IT[id].f)))return;
    next.tint={};
    for(const id of worn(next)){
      if(worn(S).includes(id) && S.tint[id])next.tint[id]=S.tint[id];
    }
    const key=sceneKey(next);
    const score=outfitScore(next,recipe);
    const prior=candidates.get(key);
    if(!prior||prior.score<score)candidates.set(key,{s:next,score,changes,name:recipe?.n||'Styled around your pieces'});
  }
  for(const recipe of LOOKS)consider(lookState(recipe),recipe);
  const maxChanges=editable.filter(k=>k!=='bottom'||S.bottom||!held.has('top')).length;
  const needsAlternatives=candidates.size<3 || (preferChanges && ![...candidates.values()].some(v=>v.changes===maxChanges));
  if(needsAlternatives){
    const tops=held.has('top')?[IT[S.top]]:[...BY('top'),...BY('dress')];
    const shoes=held.has('shoes')?[IT[S.shoes]]:BY('shoes');
    for(const top of tops){
      const bottoms=top.s==='dress'?[null]:held.has('bottom')?[IT[S.bottom]].filter(Boolean):BY('bottom');
      for(const bottom of bottoms)for(const shoe of shoes){
        const pieces=[top,bottom,shoe].filter(Boolean);
        if(pieces.some(it=>it.cat==='sleep') && !pieces.every(it=>it.cat==='sleep'))continue;
        const accessories=S.accessories.filter(id=>!IT[id].fitsTops||IT[id].fitsTops.includes(top.id));
        consider({...S,top:top.id,bottom:bottom?.id||null,shoes:shoe.id,waist:'loose',accessories},null);
      }
    }
  }
  const sorted=[...candidates.values()].sort((a,b)=>(preferChanges?b.changes-a.changes:0)||b.score-a.score);
  if(!sorted.length)return null;
  const best=sorted[0];
  const pool=sorted.slice(0,14).filter(v=>(!preferChanges||v.changes===best.changes) && v.score>=best.score-3);
  return pool[Math.floor(Math.random()*pool.length)];
}
async function useSuggestion(pick,notice){
  if(!pick){toast('Unlock a piece to try another coordinated outfit');return false;}
  if(IT[pick.s.top].s==='top')pick.s.memT=pick.s.top;
  if(pick.s.bottom)pick.s.memB=pick.s.bottom;
  const ok=await selectState(pick.s,notice||pick.name);
  if(ok){recentSuggestions.push(sceneKey(S));if(recentSuggestions.length>9)recentSuggestions.shift();}
  return ok;
}
function restylePiece(id,shoesOnly=false){
  const anchor=IT[id];
  if(!shoesOnly && (!anchor||!worn().includes(id)))return;
  if(shoesOnly && locks.has('shoes')){toast('Unlock shoes to change this pair');return;}
  spin++;
  return useSuggestion(styleCandidate({anchor,shoesOnly}),shoesOnly?'Footwear changed':anchor.n+' kept');
}
let spin=0;
$('#rand').onclick=()=>{
 const ticket=++spin,version=requested,ic=$('#randIc');ic.dataset.r=(+ic.dataset.r||0)+360;
 ic.style.transition='transform .8s';ic.style.transform='rotate('+ic.dataset.r+'deg)';
 const cards=$$('#grid .card').slice(0,8);let i=0;
 function step(){
   cards.forEach(c=>c.classList.remove('roul'));if(ticket!==spin||requested!==version)return;
   if(i<9 && cards.length){cards[i++%cards.length].classList.add('roul');setTimeout(step,48+i*5);return;}
   useSuggestion(styleCandidate());
 }
 step();
};
for(const id of ['occasion','season']){
 const select=$('#'+id);
 select.onchange=()=>{S[id]=select.value;commit();};
}

/* ---------- init ---------- */
crop($('#avatar'),98);restore();try{const raw=new URLSearchParams(location.hash.slice(1)).get('look');if(raw){const shared=normalize(JSON.parse(raw));if(shared&&!conflict(shared))S=shared;}}catch{}renderGrid();renderLib();dnaRows();ui();fill($('#realr'));
hist=[clone(S)];apply(S,false);
badge('#bCart',cart.size);
$('#bHeart').onclick=()=>{onlyFavorites=!onlyFavorites;TB[2].click();setView('outfits');sideSel('Outfits');renderGrid();};
$('#bCart').onclick=()=>{const pieces=ITEMS.flatMap(it=>it.pcs.filter((p,i)=>cart.has(it.id+i)));toast(pieces.length?pieces.length+' cart items · $'+pieces.reduce((t,p)=>t+p[2],0):'Your cart is empty');};

function place(){tabInd();sideSel('Outfits')}
document.fonts&&document.fonts.ready.then(place);place();addEventListener('load',place);
