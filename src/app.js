import { startThreeBackground } from "./three-bg.js";

const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];

function setActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  $$('nav.links a, .drawer a').forEach(a => {
    const href = (a.getAttribute("href") || "").split("/").pop();
    if (!href) return;
    if (href === path) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

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

/* Drawer */
const drawer = $("#drawer");
const burgerBtn = $("#burgerBtn");

const toggleDrawer = (open) => {
  if (!drawer) return;
  const isOpen = open ?? !drawer.classList.contains("open");
  drawer.classList.toggle("open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("drawer-open", isOpen);
};

burgerBtn?.addEventListener("click", () => toggleDrawer());

// close after clicking any drawer link
$$(".drawer-link").forEach((a) =>
  a.addEventListener("click", () => toggleDrawer(false))
);

// optional: close drawer if you click outside the inner panel
drawer?.addEventListener("click", (e) => {
  if (e.target === drawer) toggleDrawer(false);
});

// optional: close on Escape
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") toggleDrawer(false);
});

/* Scroll progress */
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

/* Reveal + STAGGER */
const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;

      // Stagger children inside reveal groups (nice premium feel)
      const el = e.target;
      el.classList.add("in");

      const kids = [...el.querySelectorAll("[data-stagger]")];
      if (kids.length && !prefersReduced) {
        kids.forEach((k, i) => {
          k.style.transitionDelay = `${i * 80}ms`;
          k.classList.add("in");
        });
      }

      io.unobserve(el);
    }
  },
  { threshold: 0.14 }
);
$$(".reveal").forEach((el) => io.observe(el));

/* Tilt */
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

    // drive spotlight CSS vars
    if (el.classList.contains("spotlight")) {
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    }
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
$$("[data-tilt]").forEach(attachTilt);

/* Spotlight cards: add class automatically */
$$(".card").forEach(c => c.classList.add("spotlight"));
// Spotlight follow for all cards (even without tilt)
$$(".card.spotlight").forEach((card) => {
  let rAF = null;

  const setVars = (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => {
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
    });
  };

  card.addEventListener("mousemove", setVars, { passive: true });
  card.addEventListener("mouseleave", () => {
    // reset to center so there's no giant "stuck" hotspot
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "45%");
  });
});

/* Magnetic CTA (subtle) */
function magnetic(el) {
  if (!el || prefersReduced) return;
  const strength = 10; // px
  let rAF = null;

  const move = (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    const dx = clamp(x / (r.width / 2), -1, 1) * strength;
    const dy = clamp(y / (r.height / 2), -1, 1) * strength;

    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => {
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  };

  const leave = () => {
    if (rAF) cancelAnimationFrame(rAF);
    el.style.transform = "translate(0px, 0px)";
  };

  el.addEventListener("mousemove", move);
  el.addEventListener("mouseleave", leave);
}
magnetic(document.querySelector(".pill.primary"));

/* Page transitions (multi-page luxury) */
const fade = document.createElement("div");
fade.className = "page-fade";
document.body.appendChild(fade);

// fade in on load
requestAnimationFrame(() => {
  fade.classList.remove("on");
});

// fade out on internal nav
document.addEventListener("click", (e) => {
  const a = e.target?.closest?.("a");
  if (!a) return;

  const href = a.getAttribute("href");
  if (!href) return;
  if (href.startsWith("#")) return; // in-page anchor
  if (a.target === "_blank") return;
  if (href.startsWith("http")) return;

  e.preventDefault();
  fade.classList.add("on");
  setTimeout(() => (location.href = href), 220);
});

/* Year */
const year = $("#year");
if (year) year.textContent = String(new Date().getFullYear());

/* Contact (Formspree) */
const form = $("#contactForm");
const statusEl = $("#formStatus");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Replace with your Formspree endpoint:
  // https://formspree.io/f/xxxxxxx
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xwvnaaqb";

  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  if (statusEl) statusEl.textContent = "Sending…";

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Non-200 response");
    if (statusEl) statusEl.textContent = "Sent ✅ I’ll get back to you soon.";
    form.reset();
  } catch {
    if (statusEl) statusEl.textContent = "Could not send. Check your Formspree ID / network.";
  }
});

setActiveNav();

/* Three.js background */
const canvas = $("#webgl");
if (canvas) {
  // pass scroll coupling signal
  const cleanup = startThreeBackground(canvas);

  // optional if you ever want to stop it later:
  // window.addEventListener("beforeunload", cleanup);
}
