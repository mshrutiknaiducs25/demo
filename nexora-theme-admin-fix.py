from pathlib import Path
ROOT=Path.cwd(); PUB=ROOT/'public'; VIEWS=ROOT/'views'
for name in ['index.html','about.html','login.html','register.html']:
 p=PUB/name
 if not p.exists(): continue
 html=p.read_text(encoding='utf-8')
 if 'class="theme-toggle"' not in html:
  if '<div class="header-tools">' in html:
   html=html.replace('<div class="header-tools">','<div class="header-tools"><button class="theme-toggle" type="button" aria-label="Switch to dark mode" title="Switch to dark mode">☾</button>',1)
  elif '<div class="nav-links">' in html:
   html=html.replace('<div class="nav-links">','<div class="nav-links"><button class="theme-toggle" type="button" aria-label="Switch to dark mode" title="Switch to dark mode">☾</button>',1)
  else:
   html=html.replace('</header>','<div class="header-tools"><button class="theme-toggle" type="button" aria-label="Switch to dark mode" title="Switch to dark mode">☾</button></div></header>',1)
 if '/js/site.js' not in html: html=html.replace('</body>','<script src="/js/site.js"></script></body>')
 p.write_text(html,encoding='utf-8')
p=VIEWS/'profile.html'
if p.exists():
 html=p.read_text(encoding='utf-8')
 html=html.replace('href="/user-dashboard">▦ &nbsp; Overview','href="/user-dashboard" id="profile-overview-link">▦ &nbsp; Overview')
 html=html.replace('href="/user-dashboard">← Back to dashboard','href="/user-dashboard" id="profile-back-link">← Back to dashboard')
 html=html.replace('href="/user-dashboard">Cancel','href="/user-dashboard" id="profile-cancel-link">Cancel')
 p.write_text(html,encoding='utf-8')
js=PUB/'js/profile.js'
if js.exists():
 content=js.read_text(encoding='utf-8')
 needle='get("profile-role-input").value=u.role||"";get("profile-role").textContent=(u.role||"user").toUpperCase();'
 inject=needle+'''
  const isAdmin=String(u.role||"").toLowerCase()==="admin";
  const dashboard=isAdmin?"/admin-dashboard":"/user-dashboard";
  ["profile-overview-link","profile-back-link","profile-cancel-link"].forEach(id=>{const el=get(id);if(el)el.href=dashboard;});
  const overview=get("profile-overview-link");if(overview)overview.innerHTML=isAdmin?"▦ &nbsp; Admin overview":"▦ &nbsp; Overview";
  const sidebarLabel=document.querySelector(".sidebar-label");if(sidebarLabel&&isAdmin)sidebarLabel.textContent="ADMIN ACCOUNT";
'''
 if 'const isAdmin=String(u.role' not in content and needle in content: content=content.replace(needle,inject,1)
 js.write_text(content,encoding='utf-8')
css=PUB/'css/style.css'
if css.exists():
 css.write_text(css.read_text(encoding='utf-8')+'''
/* Nexora unified theme refinement */
:root{--bg:#f3f6fb;--white:#fff;--ink:#17243a;--muted:#586981;--line:#d7e0ec;--pale:#eaf1fb;--blue:#285fe8;--blue-dark:#1d4ed8;--navy:#14233b;--shadow:0 12px 36px rgba(22,42,75,.09)}
body{background:var(--bg);color:var(--ink)}.site-header{background:rgba(255,255,255,.96);border-bottom:1px solid var(--line)}
.nav-links a{color:#43546d}.nav-links a:hover{color:var(--blue)}.theme-toggle{background:var(--white);color:var(--ink);border-color:var(--line)}
.theme-toggle:focus-visible,.btn:focus-visible,.nav-links a:focus-visible{outline:3px solid #8bb4ff;outline-offset:3px}
.auth-card,.feature-card,.content-card,.dash-card{box-shadow:var(--shadow)}.form-stack input{background:#fff;color:#17243a;border-color:#cbd6e5}.form-stack input::placeholder{color:#667891}
.profile-fields label{color:#33445d}
html[data-theme="dark"]{--bg:#0b1220;--white:#111c2e;--ink:#edf3ff;--muted:#b1bfd3;--line:#2d3d55;--pale:#1a2b45;--blue:#8bb4ff;--blue-dark:#6d9cff;--navy:#eaf1ff;--shadow:0 14px 38px rgba(0,0,0,.30)}
html[data-theme="dark"] body{background:#0b1220;color:#edf3ff}html[data-theme="dark"] .site-header{background:rgba(11,18,32,.96);border-color:#2d3d55}
html[data-theme="dark"] .site-footer{background:#0b1220;border-color:#2d3d55;color:#b1bfd3}
html[data-theme="dark"] .nav-links a{color:#c2cee0}html[data-theme="dark"] .nav-links a:hover{color:#8bb4ff}
html[data-theme="dark"] .hero p,html[data-theme="dark"] .page-hero p,html[data-theme="dark"] .about-copy p,html[data-theme="dark"] .feature-card p,html[data-theme="dark"] .dash-card p{color:#b1bfd3}
html[data-theme="dark"] .hero h1,html[data-theme="dark"] .page-hero h1,html[data-theme="dark"] .section-heading h2,html[data-theme="dark"] .about-copy h2{color:#edf3ff}
html[data-theme="dark"] .auth-card,html[data-theme="dark"] .feature-card,html[data-theme="dark"] .content-card,html[data-theme="dark"] .dash-card,html[data-theme="dark"] .sidebar,html[data-theme="dark"] .profile-chip{background:#111c2e;border-color:#2d3d55;color:#edf3ff}
html[data-theme="dark"] .form-stack label,html[data-theme="dark"] .profile-fields label{color:#cbd7e8}
html[data-theme="dark"] .form-stack input,html[data-theme="dark"] .profile-fields input{background:#0b1220;color:#edf3ff;border-color:#344762}
html[data-theme="dark"] .form-stack input::placeholder,html[data-theme="dark"] .profile-fields input::placeholder{color:#8294ae}
html[data-theme="dark"] .profile-fields input:disabled{background:#17243a;color:#9aabc3}
html[data-theme="dark"] .btn-ghost{background:#17243a;color:#edf3ff;border-color:#344762}
html[data-theme="dark"] .nav-links.open{background:#111c2e;border-color:#2d3d55}html[data-theme="dark"] .sidebar-help{background:#17243a;color:#edf3ff}
html[data-theme="dark"] .side-link{color:#c2cee0}html[data-theme="dark"] .side-link:hover,html[data-theme="dark"] .side-link.selected{background:#1a2b45;color:#8bb4ff}
html[data-theme="dark"] .page-hero{background:linear-gradient(180deg,#14233b,#0b1220)}
html[data-theme="dark"] .mock-window,html[data-theme="dark"] .float-card{background:#111c2e;border-color:#2d3d55}
html[data-theme="dark"] .mock-main h3,html[data-theme="dark"] .float-card b,html[data-theme="dark"] .mock-stats strong{color:#edf3ff}
html[data-theme="dark"] th{background:#17243a;color:#c2cee0}html[data-theme="dark"] td{border-color:#2d3d55;color:#c2cee0}html[data-theme="dark"] td:first-child{color:#edf3ff}
''',encoding='utf-8')
print('Theme and admin-profile refinements applied. Confirm /profile and /api/profile allow authenticated admin accounts too.')
