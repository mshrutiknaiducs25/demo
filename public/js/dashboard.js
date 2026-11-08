document.addEventListener("DOMContentLoaded", async () => {
  const put = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  try {
    const response = await fetch("/api/me", { credentials: "same-origin" });
    if (!response.ok) {
      window.location.replace("/login.html");
      return;
    }
    const me = await response.json();
    put("welcome", `Welcome, ${me.name}.`);
    put("top-name", me.name);
    put("avatar", (me.name || "N").trim().charAt(0).toUpperCase());
    put("user-name", me.name);
    put("user-email", me.email);

    const body = document.getElementById("users-body");
    if (body) {
      const usersResponse = await fetch("/api/admin/users", { credentials: "same-origin" });
      if (!usersResponse.ok) throw new Error("Could not load account directory.");
      const users = await usersResponse.json();
      put("total-users", users.length);
      put("regular-users", users.filter(u => u.role === "user").length);
      put("admin-users", users.filter(u => u.role === "admin").length);
      body.replaceChildren();
      if (!users.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4; cell.className = "empty-state"; cell.textContent = "No accounts found yet.";
        row.appendChild(cell); body.appendChild(row);
      } else {
        users.forEach(user => {
          const row = document.createElement("tr");
          [user.name, user.email].forEach(value => {
            const cell = document.createElement("td"); cell.textContent = value || "—"; row.appendChild(cell);
          });
          const roleCell = document.createElement("td");
          const tag = document.createElement("span");
          tag.className = "role-tag" + (user.role === "admin" ? " admin" : "");
          tag.textContent = user.role; roleCell.appendChild(tag); row.appendChild(roleCell);
          const dateCell = document.createElement("td");
          const date = user.created_at ? new Date(user.created_at) : null;
          dateCell.textContent = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "—";
          row.appendChild(dateCell); body.appendChild(row);
        });
      }
    }
  } catch (error) {
    console.error(error);
    const body = document.getElementById("users-body");
    if (body) body.innerHTML = '<tr><td colspan="4" class="empty-state">Unable to load accounts. Please refresh.</td></tr>';
  }
});
