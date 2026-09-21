document.addEventListener('DOMContentLoaded', () => {
  const form=document.getElementById('login'), status=document.getElementById('status');
  const email=document.getElementById('email'), password=document.getElementById('password');
  document.getElementById('show').addEventListener('click',()=>{
    password.type=password.type==='password'?'text':'password';
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault(); status.textContent='Signing in…'; status.className='status';
    try{
      const r=await fetch('/api/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:email.value.trim(),password:password.value})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Login failed');
      status.textContent='Signed in. Redirecting…'; status.className='status success';
      location.href='/admin/dashboard.html';
    }catch(err){status.textContent=err.message;status.className='status error'}
  });
});