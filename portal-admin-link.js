(()=>{
'use strict';
if(window.__NADENA_PORTAL_ADMIN_LINK_V1__)return;window.__NADENA_PORTAL_ADMIN_LINK_V1__=true;
const URL='https://ojhaeccyulyrwoxgeurf.supabase.co';
const KEY='sb_publishable_JZH6Ker5-yZoNY6sQFhVTA_YKnImI3z';
const SESSION_KEY='nadena_games_session_v1';
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
async function check(){
 const s=session(),token=s?.access_token;if(!token){remove();return false}
 try{
  const u=await fetch(URL+'/auth/v1/user',{headers:{apikey:KEY,authorization:'Bearer '+token},cache:'no-store'});if(!u.ok){remove();return false}const user=await u.json();
  const r=await fetch(URL+'/rest/v1/nadena_admin_roles?user_id=eq.'+encodeURIComponent(user.id)+'&select=role&limit=1',{headers:{apikey:KEY,authorization:'Bearer '+token},cache:'no-store'});if(!r.ok){remove();return false}const rows=await r.json();const role=String(rows?.[0]?.role||'');
  if(!['owner','admin','support'].includes(role)){remove();return false}install(role);return true;
 }catch(_){remove();return false}
}
function remove(){document.querySelectorAll('[data-nadena-admin-link]').forEach(x=>x.remove())}
function install(role){
 document.querySelectorAll('.site-header nav').forEach(nav=>{if(nav.querySelector('[data-nadena-admin-link]'))return;const a=document.createElement('a');a.href='/admin.html';a.textContent='Admin';a.dataset.nadenaAdminLink='1';a.title='Nadena Administration · '+role;const auth=nav.querySelector('#headerAuthButton');if(auth)nav.insertBefore(a,auth);else nav.append(a)});
 const panel=document.querySelector('.account-panel');if(panel&&!panel.querySelector('[data-nadena-admin-link]')){const a=document.createElement('a');a.href='/admin.html';a.textContent='🛠 Nadena Administration';a.dataset.nadenaAdminLink='1';Object.assign(a.style,{display:'inline-flex',marginTop:'10px',fontWeight:'900',color:'#8fe8ff',textDecoration:'none'});panel.append(a)}
}
function boot(){void check();window.addEventListener('storage',e=>{if(e.key===SESSION_KEY)void check()});window.addEventListener('focus',()=>void check());setInterval(()=>{if(document.visibilityState==='visible')void check()},120000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
