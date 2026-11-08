document.addEventListener("DOMContentLoaded",async()=>{
 const get=id=>document.getElementById(id), msg=get("profile-message");
 const show=(text,ok=false)=>{msg.textContent=text;msg.classList.add("visible");msg.classList.toggle("success-message",ok);msg.classList.toggle("error-message",!ok);};
 try{
  const r=await fetch("/api/profile",{credentials:"same-origin"});if(!r.ok){location.replace("/login.html");return;}const u=await r.json();
  get("profile-name").value=u.name||"";get("profile-email").value=u.email||"";get("profile-mobile").value=u.mobile||"";get("profile-college").value=u.college||"";
  get("profile-role-input").value=u.role||"";get("profile-role").textContent=(u.role||"user").toUpperCase();
  const isAdmin=String(u.role||"").toLowerCase()==="admin";
  const dashboard=isAdmin?"/admin-dashboard":"/user-dashboard";
  ["profile-overview-link","profile-back-link","profile-cancel-link"].forEach(id=>{const el=get(id);if(el)el.href=dashboard;});
  const overview=get("profile-overview-link");if(overview)overview.innerHTML=isAdmin?"▦ &nbsp; Admin overview":"▦ &nbsp; Overview";
  const sidebarLabel=document.querySelector(".sidebar-label");if(sidebarLabel&&isAdmin)sidebarLabel.textContent="ADMIN ACCOUNT";
get("profile-name-heading").textContent=u.name||"Your profile";get("profile-avatar").textContent=(u.name||"N").trim().charAt(0).toUpperCase();
  get("profile-created").value=u.created_at?new Date(u.created_at).toLocaleDateString():"—";
 }catch(e){show("Unable to load your profile. Please refresh.");}
 get("profile-form").addEventListener("submit",async e=>{
  e.preventDefault();msg.classList.remove("visible");
  const data={name:get("profile-name").value.trim(),mobile:get("profile-mobile").value.trim(),college:get("profile-college").value.trim()};
  if(!data.name){show("Please enter your name.");return;}
  try{const r=await fetch("/api/profile",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await r.json().catch(()=>({}));
   if(!r.ok){show(result.message||"Could not save your profile.");return;}
   get("profile-name-heading").textContent=data.name;get("profile-avatar").textContent=data.name.charAt(0).toUpperCase();show("Profile updated successfully.",true);
  }catch(e){show("Could not connect to the server. Please try again.");}
 });
});