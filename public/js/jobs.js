document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const grid = $("jobs-grid");
  const adminPanel = $("admin-panel");
  let isAdmin = false;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Request failed.");
    return body;
  }

  async function loadAccount() {
    try {
      const user = await api("/api/me");
      isAdmin = user.role === "admin";
      $("jobs-user-name").textContent = user.name || "Your account";
      $("jobs-avatar").textContent = (user.name || "N").trim().charAt(0).toUpperCase();
      $("jobs-user-role").textContent = isAdmin ? "ADMIN ACCOUNT" : "USER ACCOUNT";
      if (isAdmin) {
        adminPanel.hidden = false;
        $("jobs-sidebar-label").textContent = "ADMIN ACCOUNT";
        $("jobs-overview-link").href = "/admin-dashboard";
        $("jobs-overview-link").innerHTML = "▦ &nbsp; Admin overview";
      }
    } catch (_) {
      window.location.replace("/login.html");
    }
  }

  function jobCard(job) {
    const applied = Boolean(Number(job.applied));
    const action = isAdmin
      ? `<button class="jobs-secondary-btn" data-applicants="${Number(job.id)}" type="button">View applicants</button>`
      : applied
        ? `<button class="jobs-applied-btn" type="button" disabled>✓ Applied</button>`
        : `<form class="jobs-apply-form" data-job-id="${Number(job.id)}">
             <label class="jobs-cgpa-label">Your CGPA
               <input name="applicant_cgpa" type="number" min="0" max="10" step="0.01" placeholder="e.g. 8.20" required>
             </label>
             <button class="jobs-primary-btn jobs-apply-btn" type="submit">Apply <span>→</span></button>
             <p class="jobs-feedback jobs-card-feedback" role="status"></p>
           </form>`;
    return `<article class="job-card">
      <div class="job-card-top"><span class="job-icon">✦</span><span class="job-posted">NEXORA LISTING</span></div>
      <h3>${esc(job.job_name)}</h3>
      <p class="job-location">⌖ &nbsp; ${esc(job.location)}</p>
      <div class="job-details">
        <div><span>MINIMUM CGPA</span><strong>${Number(job.min_cgpa).toFixed(2)}<small> / 10</small></strong></div>
        <div><span>OFFERING CTC</span><strong>₹${Number(job.offering_ctc).toFixed(2)}<small> LPA</small></strong></div>
      </div>
      <div class="job-card-bottom"><span class="job-poster">Posted by ${esc(job.posted_by || "Nexora Admin")}</span>${action}</div>
    </article>`;
  }

  async function loadJobs() {
    grid.innerHTML = `<div class="jobs-empty">Loading opportunities…</div>`;
    try {
      const jobs = await api("/api/jobs");
      $("jobs-count").textContent = `${jobs.length} ${jobs.length === 1 ? "position" : "positions"}`;
      grid.innerHTML = jobs.length ? jobs.map(jobCard).join("") :
        `<div class="jobs-empty"><span>✦</span><h3>No listings yet</h3><p>New opportunities will appear here when published.</p></div>`;
    } catch (error) {
      grid.innerHTML = `<div class="jobs-empty jobs-error">${esc(error.message)}</div>`;
    }
  }

  $("job-create-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = $("admin-feedback");
    feedback.textContent = "";
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await api("/api/admin/jobs", { method: "POST", body: JSON.stringify(data) });
      feedback.textContent = result.message;
      feedback.className = "jobs-feedback success";
      form.reset();
      await loadJobs();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = "jobs-feedback error";
    }
  });

  grid.addEventListener("submit", async (event) => {
    const form = event.target.closest(".jobs-apply-form");
    if (!form) return;
    event.preventDefault();
    const feedback = form.querySelector(".jobs-card-feedback");
    const data = { applicant_cgpa: form.elements.applicant_cgpa.value };
    try {
      const result = await api(`/api/jobs/${form.dataset.jobId}/apply`, {
        method: "POST", body: JSON.stringify(data)
      });
      feedback.textContent = result.message;
      feedback.className = "jobs-feedback jobs-card-feedback success";
      await loadJobs();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = "jobs-feedback jobs-card-feedback error";
    }
  });

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-applicants]");
    if (!button) return;
    const id = button.dataset.applicants;
    $("applicants-panel").hidden = false;
    $("applicants-title").textContent = "Applicants";
    $("applicants-list").innerHTML = `<div class="jobs-empty">Loading applications…</div>`;
    try {
      const applicants = await api(`/api/admin/jobs/${id}/applications`);
      $("applicants-title").textContent = `Applicants (${applicants.length})`;
      $("applicants-list").innerHTML = applicants.length ? applicants.map((a) =>
        `<article class="applicant-row"><div><strong>${esc(a.name)}</strong><span>${esc(a.email)}</span><small>${esc(a.college || "College not provided")}</small></div><div class="applicant-cgpa"><span>CGPA</span><strong>${Number(a.applicant_cgpa).toFixed(2)}</strong></div><time>${esc(new Date(a.applied_at).toLocaleDateString())}</time></article>`
      ).join("") : `<div class="jobs-empty">No applications received for this listing yet.</div>`;
      $("applicants-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      $("applicants-list").innerHTML = `<div class="jobs-empty jobs-error">${esc(error.message)}</div>`;
    }
  });

  $("close-applicants").addEventListener("click", () => { $("applicants-panel").hidden = true; });

  document.querySelectorAll("[data-year]").forEach((el) => el.textContent = new Date().getFullYear());
  loadAccount().then(loadJobs);
});
