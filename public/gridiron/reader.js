(async () => {
 const get=id=>document.getElementById(id), data=await fetch('./episodes.json').then(r=>{if(!r.ok)throw Error('pages');return r.json()});
 const select=get('episodes'), pic=get('art'), nav=get('next');
 const pages=data.flatMap(e=>e.pages.map((file,i)=>({file,e:e.episode,p:i+1,title:e.title,total:e.pages.length})));
 for(const e of data)select.add(new Option(e.episode+' · '+e.title,e.episode));
 let i=0,source=new URLSearchParams(location.search).get('via');
 if(!['hand','catch'].includes(source))source='direct';
 const visited=new Set(),sent=new Set();
 function report(target){
  if(sent.has(target)||!consented())return;
  let id;try{id=sessionStorage.as_analytics_sid ||= crypto.randomUUID()}catch{return}
  const payload={event_type:'click',session_id:id,path:'/gridiron/',target,metadata:{source,campaign:'opening-five'}};
  sent.add(target);
  fetch('https://scjatmhkwcrqwssyypkd.supabase.co/rest/v1/analytics_events',{method:'POST',headers:{'Content-Type':'application/json',apikey:'sb_publishable_G3clskZ5uiIOyIye5wMIow_E5tjujLu',Authorization:'Bearer sb_publishable_G3clskZ5uiIOyIye5wMIow_E5tjujLu'},body:JSON.stringify(payload),keepalive:true}).then(r=>{if(!r.ok)sent.delete(target)}).catch(()=>sent.delete(target));
 }
 function consented(){try{if(navigator.globalPrivacyControl)return false;
  const existing=JSON.parse(localStorage.getItem('rwc-cookie-consent-v1')||'null');
  if(existing && existing.policyVersion==='2026.08.20')return existing.analytics===true;
  return sessionStorage.gzSamplerConsent==='yes'
 }catch{return false}}
 function pref(){const p=get('prefs');p.replaceChildren();let site=false;try{site=JSON.parse(localStorage.getItem('rwc-cookie-consent-v1')||'null')?.policyVersion==='2026.08.20'}catch{}
  if(site || navigator.globalPrivacyControl){p.textContent='Reader analytics follow your site privacy preferences.';return}
  const b=document.createElement('button');b.textContent=consented()?'Turn off reader analytics':'Allow anonymous reading stats this visit';b.onclick=()=>{sessionStorage.gzSamplerConsent=consented()?'no':'yes';pref();report('sampler-open')};p.append(b)}
 function move(n){if(n<0||n>=pages.length)return;const p=pages[n];location.hash=p.e+'-'+p.p}
 function draw(){const hash=location.hash.slice(1);i=Math.max(0,pages.findIndex(p=>hash===p.e+'-'+p.p));const p=pages[i];
  pic.onload=()=>{visited.add(i);report('sampler-open')};pic.alt=p.title+', episode '+p.e+', page '+p.p+' of '+p.total;pic.src=p.file;get('zoom').href=p.file;
  get('counter').textContent='Page '+p.p+' of '+p.total;select.value=p.e;get('prev').disabled=!i;nav.hidden=false;get('end').hidden=true;
  nav.textContent=p.p<p.total?'Next page →':(i===pages.length-1?'Finish sampler':'Read Episode '+(p.e+1)+' →');
  document.title=p.title+' · Page '+p.p+' | Gridiron Zero';window.scrollTo(0,0)}
 function next(){const p=pages[i];if(p.p===p.total && pages.every((q,k)=>q.e!==p.e||visited.has(k)))report('episode-'+p.e+'-complete');
  if(i<pages.length-1)move(i+1);else{get('end').hidden=false;nav.hidden=true;get('end').scrollIntoView()}}
 select.onchange=()=>move(pages.findIndex(p=>p.e===+select.value));get('prev').onclick=()=>move(i-1);nav.onclick=next;
 document.addEventListener('keydown',e=>{if(e.target.matches('select,button,input')||e.altKey||e.metaKey||e.ctrlKey)return;if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')move(i-1)});
 window.addEventListener('hashchange',draw);pref();draw()
})().catch(()=>document.getElementById('counter').textContent='Pages could not load. Refresh to try again.');
