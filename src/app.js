import { startThreeBackground } from "./three-bg.js";

const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];

/**
 * Compute the "site base" for GitHub Pages project sites.
 * Example:
 *   https://rikhi20.github.io/website/blog.html -> base = https://rikhi20.github.io/website/
 *   https://example.com/blog.html               -> base = https://example.com/
 */
function getSiteBase() {
  const { origin, pathname } = window.location;

  // If running on GitHub Pages user domain, the first segment is the repo name.
  // Example: /website/blog.html -> ["website", "blog.html"]
  const parts = pathname.split("/").filter(Boolean);

  if (origin.endsWith("github.io") && parts.length >= 1) {
    return `${origin}/${parts[0]}/`;
  }

  // Non-GitHub hosting (root site)
  return `${origin}/`;
}

const SITE_BASE = getSiteBase();

/**
 * Resolve an href (as written in HTML) into an absolute URL,
 * but keep it within our site base for internal navigation.
 */
function resolveInternalUrl(href) {
  if (!href) return null;

  if (href.startsWith("#")) return new URL(href, window.location.href);

  if (href.startsWith("mailto:") || href.startsWith("tel:")) return new URL(href);

  if (/^https?:\/\//i.test(href)) return new URL(href);

  if (href.startsWith("//")) return new URL(window.location.protocol + href);

  // If someone wrote "/blog.html", treat it as "/<repo>/blog.html" on GitHub Pages.
  if (href.startsWith("/")) {
    const clean = href.replace(/^\/+/, "");
    return new URL(clean, SITE_BASE);
  }

  return new URL(href, window.location.href);
}

function setActiveNav() {
  const curr = (location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();

  $$('nav.links a, .drawer a').forEach((a) => {
    const raw = a.getAttribute("href") || "";
    const target = raw.split("/").filter(Boolean).pop()?.toLowerCase();
    if (!target) return;

    if (target === curr) a.setAttribute("aria-current", "page");
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

$$(".drawer-link").forEach((a) => a.addEventListener("click", () => toggleDrawer(false)));

drawer?.addEventListener("click", (e) => {
  if (e.target === drawer) toggleDrawer(false);
});

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

/* Spotlight cards */
$$(".card").forEach((c) => c.classList.add("spotlight"));
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
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "45%");
  });
});

/* Magnetic CTA */
function magnetic(el) {
  if (!el || prefersReduced) return;
  const strength = 10;
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

/* Page transitions */
const fade = document.createElement("div");
fade.className = "page-fade on"; // start ON so initial paint is consistent
document.body.appendChild(fade);

const clearFade = () => fade.classList.remove("on");

// Fade in on initial load
requestAnimationFrame(clearFade);

// ✅ Fix: Back/Forward cache (bfcache) restores DOM as-is; ensure overlay is cleared
window.addEventListener("pageshow", clearFade);

// ✅ Fix: If user switches tabs and comes back while overlay is on
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) clearFade();
});

document.addEventListener("click", (e) => {
  const a = e.target?.closest?.("a");
  if (!a) return;

  const rawHref = a.getAttribute("href");
  if (!rawHref) return;
  if (rawHref.startsWith("#")) return;
  if (a.target === "_blank") return;

  const url = resolveInternalUrl(rawHref);
  if (!url) return;

  // External site? let browser handle
  if (url.origin !== window.location.origin) return;

  // Internal nav: keep within SITE_BASE
  const internalUrl = url.href.startsWith(SITE_BASE) ? url : new URL(url.pathname.replace(/^\/+/, ""), SITE_BASE);

  e.preventDefault();
  fade.classList.add("on");
  setTimeout(() => {
    window.location.href = internalUrl.href;
  }, 220);
});

/* Year */
const year = $("#year");
if (year) year.textContent = String(new Date().getFullYear());

/* Contact (Formspree) */
const form = $("#contactForm");
const statusEl = $("#formStatus");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xwvnaaqb";

  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  if (statusEl) statusEl.textContent = "Sending…";

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
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
  startThreeBackground(canvas);
}
