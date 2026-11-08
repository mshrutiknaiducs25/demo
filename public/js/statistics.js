(async function(){
 const errorEl=document.getElementById("stats-error");
 try{
  const response=await fetch("/api/statistics",{credentials:"same-origin"});
  if(!response.ok)throw new Error("Could not load statistics.");
  const data=await response.json();
  document.getElementById("total-apps").textContent=data.totalApplications;
  document.getElementById("jobs-total").textContent=data.totalJobs;
  document.getElementById("active-month").textContent=data.applicationsThisMonth;
  const labels=data.monthly.map(x=>x.month);
  const values=data.monthly.map(x=>Number(x.count));
  new Chart(document.getElementById("monthlyChart"),{type:"bar",data:{labels,datasets:[{label:"Applications",data:values,borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}}});
  new Chart(document.getElementById("summaryChart"),{type:"doughnut",data:{labels:["Submitted applications","No application yet"],datasets:[{data:[data.totalApplications,Math.max(data.totalJobs-data.totalApplications,0)],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}}}});
 }catch(e){errorEl.textContent=e.message+" Please refresh the page.";}
})();