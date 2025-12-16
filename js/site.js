(() => {
  const config = Object.freeze({
    siteName: "Recplace Professional Centre",
    listingUrl: "https://www.realtor.ca/real-estate/28883424/2740-recplace-drive-prince-george",
    mirrorUrl:
      "https://highamwalker.com/mylistings.html/listing.c8072356-2740-recplace-drive-prince-george-v2n-1t7.106896467",
    mapsUrl: "https://maps.app.goo.gl/nV1y135FPTTEjvGS9",
    mlsId: "C8072356",
    address: "2740 Recplace Drive, Prince George, BC V2N 1T7",
    coords: { lat: 53.897384795, lng: -122.771398006 },
    contacts: {
      jen: { name: "Jen Higham", phone: "2506137207", phoneLabel: "(250) 613-7207", email: "jen@realtypg.com" },
      rod: { name: "Rod Walker", phone: "2506178090", phoneLabel: "(250) 617-8090", email: "rod@realtypg.com" },
    },
  });

  const navItems = [
    { href: "index.html", label: "Home" },
    { href: "leasing.html", label: "Leasing" },
    { href: "design.html", label: "Design" },
    { href: "location.html", label: "Location" },
    { href: "updates.html", label: "Updates" },
    { href: "contact.html", label: "Contact" },
  ];

  function setActiveNav(root) {
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    root.querySelectorAll("a[data-nav]").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function renderHeader() {
    const navLinks = navItems
      .map((i, idx) => {
        const isLast = idx === navItems.length - 1;
        const cls = isLast ? "nav-link nav-link--last" : "nav-link";
        return `<a class="${cls}" data-nav href="${i.href}"><span class="nav-label">${i.label}</span></a>`;
      })
      .join("");

    return `
      <div class="container">
        <nav class="nav" data-nav-root>
          <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav">
            Menu
          </button>
          <div class="nav-scrim" data-nav-scrim aria-hidden="true"></div>
          <div class="nav-links" id="site-nav">${navLinks}</div>
        </nav>
      </div>
    `;
  }

  function renderFooter() {
    const links = navItems
      .map((i) => `<a href="${i.href}">${i.label}</a>`)
      .join("");

    return `
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="section-title" style="margin:0">RECPLACE PROFESSIONAL CENTRE</div>
            <div class="footer-legal">Leasing via Royal LePage Aspire Realty.</div>
          </div>
          <div>
            <div class="footer-links">
              ${links}
            </div>
            <div style="margin-top:14px">
              <a class="btn btn--primary btn-block" href="contact.html">Contact Realtors</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderStickyActions() {
    return `
      <div class="sticky-actions" data-sticky-actions role="region" aria-label="Quick actions">
        <a class="btn" data-link="listing" href="#" target="_blank" rel="noopener">View MLS Listing</a>
        <a class="btn btn--primary" href="contact.html">Contact Realtors</a>
        <a class="btn" data-link="maps" href="#" target="_blank" rel="noopener">Google Maps</a>
      </div>
    `;
  }

  function initRevealAnimations() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    const targets = [
      ...document.querySelectorAll(
        "main .hero-kicker, main .hero-title, main .hero-quote, main .hero .btn, main .section-title, main .section-subtitle, main .card, main .logo-tile, main .pill, main .tag, main .list li"
      ),
    ];

    targets.forEach((el) => {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal");
    });

    function applyStagger(selector, stepMs, maxMs) {
      document.querySelectorAll(selector).forEach((container) => {
        const children = Array.from(container.children).filter((el) => el.classList.contains("reveal"));
        children.forEach((el, idx) => {
          const delay = Math.min(idx * stepMs, maxMs);
          el.style.setProperty("--reveal-delay", `${delay}ms`);
        });
      });
    }

    function applyFlyIn(selector, baseX, stepX, baseRot, stepRot) {
      document.querySelectorAll(selector).forEach((container) => {
        const children = Array.from(container.children).filter((el) => el.classList.contains("reveal"));
        children.forEach((el, idx) => {
          const sign = idx % 2 === 0 ? -1 : 1;
          const x = sign * (baseX + (idx % 3) * stepX);
          const rot = sign * (baseRot + (idx % 3) * stepRot);
          el.style.setProperty("--reveal-x", `${x}px`);
          el.style.setProperty("--reveal-rot", `${rot}deg`);
        });
      });
    }

    applyStagger(".facts-grid", 38, 220);
    applyStagger(".pill-grid", 22, 220);
    applyStagger(".logo-grid", 48, 240);
    applyStagger(".btn-row", 60, 180);

    applyFlyIn(".facts-grid", 22, 10, 0.6, 0.25);
    applyFlyIn(".pill-grid", 14, 6, 0.35, 0.18);
    applyFlyIn(".logo-grid", 18, 10, 0.45, 0.2);

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.14 }
    );

    targets.forEach((el) => observer.observe(el));
  }

  function hydrateLinks() {
    const linkTargets = {
      listing: config.listingUrl,
      mirror: config.mirrorUrl,
      maps: config.mapsUrl,
    };

    document.querySelectorAll("[data-link]").forEach((el) => {
      const key = el.getAttribute("data-link");
      const href = linkTargets[key];
      if (!href) return;
      el.setAttribute("href", href);
      if (key === "listing" || key === "mirror" || key === "maps") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      }
    });

    document.querySelectorAll("[data-call]").forEach((el) => {
      const key = el.getAttribute("data-call");
      const person = config.contacts[key];
      if (!person) return;
      el.setAttribute("href", `tel:${person.phone}`);
    });

    document.querySelectorAll("[data-email]").forEach((el) => {
      const key = el.getAttribute("data-email");
      const person = config.contacts[key];
      if (!person) return;
      el.setAttribute("href", `mailto:${person.email}`);
    });

    document.querySelectorAll("[data-text='address']").forEach((el) => {
      el.textContent = config.address;
    });

    document.querySelectorAll("[data-text='coords']").forEach((el) => {
      el.textContent = `${config.coords.lat.toFixed(6)}, ${config.coords.lng.toFixed(6)}`;
    });
  }

  function initNavToggle() {
    const navRoot = document.querySelector("[data-nav-root]");
    const toggle = document.querySelector("[data-nav-toggle]");
    const scrim = document.querySelector("[data-nav-scrim]");
    if (!navRoot || !toggle) return;

    function setOpen(isOpen) {
      navRoot.classList.toggle("nav--open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("nav-open", isOpen);
    }

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!isOpen);
    });

    scrim?.addEventListener("click", () => setOpen(false));

    navRoot.addEventListener("click", (e) => {
      if (!navRoot.classList.contains("nav--open")) return;
      const link = e.target?.closest?.("a[data-nav]");
      if (link) setOpen(false);
    });

    document.addEventListener("click", (e) => {
      if (!navRoot.classList.contains("nav--open")) return;
      if (navRoot.contains(e.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!navRoot.classList.contains("nav--open")) return;
      setOpen(false);
    });
  }

  function initHeroVideo() {
    const heroMedia = document.querySelector(".hero-media");
    const video = heroMedia?.querySelector("video");
    if (!heroMedia || !video) return;

    const setReady = () => heroMedia.classList.add("is-ready");
    if (video.readyState >= 2) setReady();
    else video.addEventListener("canplay", setReady, { once: true });
  }

  function initStickyActions() {
    const sticky = document.querySelector("[data-sticky-actions]");
    if (!sticky) return;

    const minY = 120;
    let lastY = window.scrollY;
    let raf = 0;

    function setHidden(hidden) {
      sticky.classList.toggle("is-hidden", hidden);
    }

    setHidden(window.scrollY < minY);

    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;

      if (y < minY) {
        setHidden(true);
        return;
      }

      if (Math.abs(delta) < 6) return;
      if (delta < 0) setHidden(true);
      else setHidden(false);
    }

    window.addEventListener(
      "scroll",
      () => {
        if (raf) return;
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          onScroll();
        });
      },
      { passive: true }
    );
  }

  function initParallaxImages() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    const items = Array.from(document.querySelectorAll(".parallax-img"));
    if (!items.length) return;

    let raf = 0;

    function update() {
      const vh = window.innerHeight || 1;
      const viewMid = vh / 2;

      for (const el of items) {
        const rect = el.getBoundingClientRect();
        if (rect.height <= 0) continue;
        const mid = rect.top + rect.height / 2;
        const dist = (mid - viewMid) / vh;
        const y = Math.max(-22, Math.min(22, dist * -26));
        el.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
      }
    }

    update();

    function schedule() {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }

  function initPointerGlow() {
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches) return;

    let raf = 0;
    let lastEvent = null;

    function update() {
      raf = 0;
      const e = lastEvent;
      if (!e) return;

      const card = e.target?.closest?.(".card");
      if (!card) return;

      const rect = card.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      card.style.setProperty("--mx", `${clampedX.toFixed(2)}%`);
      card.style.setProperty("--my", `${clampedY.toFixed(2)}%`);
    }

    document.addEventListener(
      "pointermove",
      (e) => {
        lastEvent = e;
        if (raf) return;
        raf = window.requestAnimationFrame(update);
      },
      { passive: true }
    );
  }

  function initLayout() {
    const header = document.getElementById("site-header");
    if (header) {
      header.classList.add("site-header");
      header.innerHTML = renderHeader();
      setActiveNav(header);
    }

    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.classList.add("site-footer");
      footer.innerHTML = renderFooter();
    }

    const sticky = document.getElementById("site-cta");
    if (sticky) sticky.innerHTML = renderStickyActions();

    hydrateLinks();
    initNavToggle();
    initHeroVideo();
    initStickyActions();
    initRevealAnimations();
    initParallaxImages();
    initPointerGlow();
  }

  function safeParseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async function loadUpdatesData() {
    try {
      const res = await fetch("data/updates.json", { cache: "no-store" });
      if (!res.ok) return [];
      const parsed = await res.json();
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      const embedded = document.getElementById("updates-data");
      if (embedded?.textContent) {
        const parsed = safeParseJson(embedded.textContent);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    }
  }

  function downloadText(filename, text, mime = "application/json") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function initGate({ storageKey, password, gateId }) {
    const gate = document.querySelector(`[data-gate='${gateId}']`);
    const content = document.querySelector(`[data-gated='${gateId}']`);
    if (!gate || !content) return;

    const form = gate.querySelector("form");
    const input = gate.querySelector("input[type='password']");
    const error = gate.querySelector("[data-gate-error]");
    const lockBtn = content.querySelector("[data-gate-lock]");

    function showUnlocked() {
      gate.hidden = true;
      content.hidden = false;
      if (error) error.hidden = true;
      if (input) input.value = "";
    }

    function showLocked() {
      gate.hidden = false;
      content.hidden = true;
      if (error) error.hidden = true;
      if (input) input.value = "";
    }

    const unlocked = localStorage.getItem(storageKey) === "1";
    if (unlocked) showUnlocked();
    else showLocked();

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (input?.value || "").trim();
      if (val === password) {
        localStorage.setItem(storageKey, "1");
        showUnlocked();
        return;
      }
      if (error) {
        error.hidden = false;
        error.textContent = "Incorrect password.";
      }
      input?.focus();
      input?.select?.();
    });

    lockBtn?.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      showLocked();
    });
  }

  const api = Object.freeze({
    config,
    initLayout,
    initGate,
    loadUpdatesData,
    downloadText,
  });

  window.recplace = api;
  window.Recplace = api;

  document.addEventListener("DOMContentLoaded", initLayout);
})();
