document.addEventListener("DOMContentLoaded", () => {
 const form=document.getElementById("login-form"), msg=document.getElementById("login-error"), btn=document.getElementById("login-submit");
 if(!form||!msg||!btn)return;
 form.addEventListener("submit",async e=>{
  e.preventDefault();msg.textContent="";msg.classList.remove("visible");btn.disabled=true;const original=btn.innerHTML;btn.textContent="Signing in…";
  try{
   const response=await fetch("/login",{method:"POST",body:new URLSearchParams(new FormData(form)),headers:{"Content-Type":"application/x-www-form-urlencoded"},credentials:"same-origin",redirect:"follow"});
   if(response.redirected){window.location.assign(response.url);return;}
   if(response.ok){window.location.assign(response.url||"/user-dashboard");return;}
   let text="Incorrect email or password. Please try again.";
   const ct=response.headers.get("content-type")||"";
   if(ct.includes("application/json")){const data=await response.json();text=data.message||text;}
   else if(response.status>=500)text="Something went wrong on the server. Please try again.";
   msg.textContent=text;msg.classList.add("visible");
  }catch(err){msg.textContent="Could not connect to the server. Please check your connection and try again.";msg.classList.add("visible");}
  finally{btn.disabled=false;btn.innerHTML=original;}
 });
});