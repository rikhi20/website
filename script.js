// Smooth high-end interactions without heavy libs.
// Includes: intersection reveals, counters, tilt, scroll progress, starfield, theme, drawer.

const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];

/* Theme */
const themeBtn = $("#themeBtn");
const storedTheme = localStorage.getItem("theme");
if (storedTheme) document.documentElement.dataset.theme = storedTheme;

themeBtn?.addEventListener("click", () => {
  const curr = document.documentElement.dataset.theme;
  const next = curr === "light" ? "" : "light";
  if (next) document.documentElement.dataset.theme = next;
  else delete document.documentElement.dataset.theme;
  localStorage.setItem("theme", next || "");
});

/* Mobile drawer */
const drawer = $("#drawer");
const burgerBtn = $("#burgerBtn");
const toggleDrawer = (open) => {
  if (!drawer) return;
  const isOpen = open ?? !drawer.classList.contains("open");
  drawer.classList.toggle("open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
};
burgerBtn?.addEventListener("click", () => toggleDrawer());
$$(".drawer-link").forEach((a) => a.addEventListener("click", () => toggleDrawer(false)));

/* CTA scroll */
const jumpToContact = () => $("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
$("#ctaBtn")?.addEventListener("click", jumpToContact);
$("#drawerCta")?.addEventListener("click", () => { toggleDrawer(false); jumpToContact(); });

/* Year */
$("#year").textContent = String(new Date().getFullYear());

/* Scroll progress bar */
const progressBar = $("#progressBar");
const onScroll = () => {
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const p = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = `${p}%`;
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* Reveal on enter */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.14 }
);
$$(".reveal").forEach((el) => io.observe(el));

/* Animated counters when visible */
const counters = $$(".stat-num[data-counter]");
if (counters.length) {
  const cio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      const target = Number(el.getAttribute("data-counter") || "0");
      const start = performance.now();
      const dur = 900;

      const tick = (t) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = String(Math.round(target * eased));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    }
  }, { threshold: 0.6 });

  counters.forEach((c) => cio.observe(c));
}

/* 3D Tilt cards */
const tiltEls = $$("[data-tilt]");
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function attachTilt(el) {
  let rAF = null;
  const rect = () => el.getBoundingClientRect();

  const onMove = (ev) => {
    const e = ev.touches ? ev.touches[0] : ev;
    const b = rect();
    const px = (e.clientX - b.left) / b.width;
    const py = (e.clientY - b.top) / b.height;

    const rx = clamp((0.5 - py) * 10, -10, 10);
    const ry = clamp((px - 0.5) * 14, -14, 14);

    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });
  };

  const onLeave = () => {
    if (rAF) cancelAnimationFrame(rAF);
    el.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
  };

  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  el.addEventListener("touchmove", onMove, { passive: true });
  el.addEventListener("touchend", onLeave);
}
tiltEls.forEach(attachTilt);

/* Contact form (front-end only) */
const form = $("#contactForm");
const statusEl = $("#formStatus");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (statusEl) statusEl.textContent = "Sent (demo). Hook this up to your backend later.";
  form.reset();
});

/* Starfield canvas (lightweight) */
const canvas = $("#starfield");
const ctx = canvas?.getContext("2d");
let stars = [];
let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

function resize() {
  if (!canvas || !ctx) return;
  w = canvas.clientWidth;
  h = canvas.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.floor((w * h) / 14000); // scales by area
  stars = new Array(count).fill(0).map(() => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.6 + 0.2,
    v: Math.random() * 0.25 + 0.05,
    o: Math.random() * 0.7 + 0.15
  }));
}
window.addEventListener("resize", resize);
resize();

let last = performance.now();
function draw(t) {
  if (!ctx) return;
  const dt = Math.min(32, t - last);
  last = t;

  ctx.clearRect(0, 0, w, h);

  // subtle vignette
  const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.7);
  g.addColorStop(0, "rgba(255,255,255,0.00)");
  g.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // stars
  for (const s of stars) {
    s.y += s.v * (dt / 16);
    if (s.y > h + 10) { s.y = -10; s.x = Math.random() * w; }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.o})`;
    ctx.fill();
  }

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);