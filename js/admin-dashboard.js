async function checkSession(){
  try{
    const r=await fetch('/api/auth?action=me',{credentials:'include'});
    if(!r.ok){location.href='/admin/';return}
    const d=await r.json();
    document.getElementById('email').textContent=d.email;
  }catch{location.href='/admin/'}
}
document.getElementById('logout').addEventListener('click',async()=>{
  await fetch('/api/auth?action=logout',{method:'POST',credentials:'include'});
  location.href='/admin/';
});
checkSession();