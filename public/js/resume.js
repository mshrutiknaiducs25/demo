(function(){
 const form=document.getElementById("resume-form"),input=document.getElementById("resume-file"),message=document.getElementById("resume-message"),current=document.getElementById("resume-current");
 function say(text,error){message.textContent=text;message.classList.toggle("error",!!error);}
 async function refresh(){
  const r=await fetch("/api/resume",{credentials:"same-origin"});
  if(!r.ok)throw new Error("Unable to check resume.");
  const data=await r.json();
  if(data.resume){current.hidden=false;document.getElementById("resume-name").textContent=data.resume.original_name;document.getElementById("resume-date").textContent="Uploaded "+new Date(data.resume.uploaded_at).toLocaleString();document.getElementById("resume-download").href="/api/resume/download";}
  else current.hidden=true;
 }
 form.addEventListener("submit",async e=>{
  e.preventDefault();if(!input.files.length)return;
  const file=input.files[0];if(file.size>5*1024*1024){say("File exceeds the 5 MB limit.",true);return;}
  const body=new FormData();body.append("resume",file);
  try{const r=await fetch("/api/resume",{method:"POST",body,credentials:"same-origin"});const d=await r.json();if(!r.ok)throw new Error(d.message||"Upload failed.");say(d.message);form.reset();await refresh();}
  catch(err){say(err.message,true);}
 });
 document.getElementById("resume-delete").addEventListener("click",async()=>{
  if(!confirm("Delete your uploaded resume?"))return;
  try{const r=await fetch("/api/resume",{method:"DELETE",credentials:"same-origin"});const d=await r.json();if(!r.ok)throw new Error(d.message||"Delete failed.");say(d.message);await refresh();}
  catch(err){say(err.message,true);}
 });
 refresh().catch(e=>say(e.message,true));
})();