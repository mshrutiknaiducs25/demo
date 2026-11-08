document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  if (toggle && nav) toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  const savedTheme = localStorage.getItem("nexora-theme");
  if (savedTheme === "light") document.documentElement.dataset.theme = "light";
  else document.documentElement.removeAttribute("data-theme");
  document.querySelectorAll(".theme-toggle").forEach(button => {
    const sync = () => {
      const light = document.documentElement.dataset.theme === "light";
      button.textContent = light ? "☀" : "☾";
      button.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      button.title = light ? "Switch to dark mode" : "Switch to light mode";
    };
    sync();
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      if (next === "light") document.documentElement.dataset.theme = "light";
      else document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("nexora-theme", next);
      sync();
    });
  });
});
