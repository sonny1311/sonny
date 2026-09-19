(()=>{
'use strict';
if(window.__NADENA_PORTAL_ADMIN_LINK_V1__)return;window.__NADENA_PORTAL_ADMIN_LINK_V1__=true;
const API='/api/nadena';
const SESSION_KEY='nadena_games_session_v1';
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
async function check(){
 const s=session(),token=s?.access_token;if(!token){remove();return false}
 try{
  const r=await fetch(API+'/admin-role',{headers:{authorization:'Bearer '+token},cache:'no-store'});if(!r.ok){remove();return false}const data=await r.json();const role=String(data?.role||'');
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
