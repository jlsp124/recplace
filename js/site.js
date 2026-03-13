(() => {
  const config = Object.freeze({
    siteName: "Recplace Professional Centre",
    brochurePath: "Assets/recplace-leasing-brochure.pdf",
    architecturalSetPath: "Assets/recplace-full-architectural-set.pdf",
    listingUrl: "https://www.realtor.ca/real-estate/28883424/2740-recplace-drive-prince-george",
    mirrorUrl:
      "https://highamwalker.com/mylistings.html/listing.c8072356-2740-recplace-drive-prince-george-v2n-1t7.106896467",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=53.897384795,-122.771398006",
    mlsId: "C8072356",
    address: "2740 Recplace Drive, Prince George, BC V2N 1T7",
    coords: { lat: 53.897384795, lng: -122.771398006 },
    contacts: {
      jen: { name: "Jen Higham", phone: "2506137207", phoneLabel: "(250) 613-7207", email: "jen@realtypg.com" },
      rod: { name: "Rod Walker", phone: "2506178090", phoneLabel: "(250) 617-8090", email: "rod@realtypg.com" },
    },
  });

  const mirroredPages = new Set(["index.html", "leasing.html", "plans.html", "location.html", "contact.html"]);

  const navItems = [
    { href: "index.html", label: "Home" },
    { href: "leasing.html", label: "Leasing" },
    { href: "plans.html", label: "Plans" },
    { href: "location.html", label: "Location" },
    { href: "contact.html", label: "Contact" },
  ];

  function getPathContext() {
    const segments = location.pathname
      .split("/")
      .map((segment) => segment.trim().toLowerCase())
      .filter(Boolean);
    const last = segments[segments.length - 1] || "";
    const page = last && last.includes(".") ? last : "index.html";
    const isNextVersion = segments.includes("next");

    return Object.freeze({
      page,
      isNextVersion,
      isSwitchable: mirroredPages.has(page),
      prefix: isNextVersion ? "../" : "",
    });
  }

  function resolveSiteHref(href, context) {
    const [page, hash = ""] = href.split("#");
    const normalizedPage = (page || "index.html").toLowerCase();
    const resolvedPage = context.isNextVersion && mirroredPages.has(normalizedPage) ? page : `${context.prefix}${page}`;
    return hash ? `${resolvedPage}#${hash}` : resolvedPage;
  }

  function resolveAssetHref(assetPath, context) {
    return `${context.prefix}${assetPath}`;
  }

  function resolveVersionHref(context) {
    if (!context.isSwitchable) return "";
    return context.isNextVersion ? `../${context.page}` : `next/${context.page}`;
  }

  function setActiveNav(root, context) {
    root.querySelectorAll("a[data-nav]").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("#")[0];
      const hrefPage = (href.split("/").pop() || "index.html").toLowerCase();
      if (hrefPage === context.page) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function renderHeader(context) {
    const navLinks = navItems
      .map((item) => `<a class="nav-link" data-nav href="${resolveSiteHref(item.href, context)}">${item.label}</a>`)
      .join("");

    return `
      <div class="container">
        <div class="nav-shell">
          <a class="nav-brand" href="${resolveSiteHref("index.html", context)}" aria-label="${config.siteName} home">
            <span class="nav-brand-mark" aria-hidden="true"></span>
            <span class="nav-brand-text">
              <span class="nav-brand-name">${config.siteName}</span>
              <span class="nav-brand-meta">Prince George, BC</span>
            </span>
          </a>
          <nav class="nav" data-nav-root aria-label="Primary">
            <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav">
              Menu
            </button>
            <div class="nav-scrim" data-nav-scrim aria-hidden="true"></div>
            <div class="nav-links" id="site-nav">${navLinks}</div>
          </nav>
        </div>
      </div>
    `;
  }

  function renderFooter(context) {
    const links = navItems.map((item) => `<a href="${resolveSiteHref(item.href, context)}">${item.label}</a>`).join("");
    const contactLabel = context.isNextVersion ? "Contact Leasing" : "Contact Realtors";

    return `
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-title">${config.siteName}</div>
            <div class="footer-address">${config.address}</div>
            <div class="footer-legal">Leasing via Royal LePage Aspire Realty.</div>
          </div>
          <div>
            <div class="footer-links">
              ${links}
            </div>
            <div class="footer-actions">
              <a class="btn btn--primary" href="${resolveSiteHref("contact.html", context)}">${contactLabel}</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderStickyActions(context) {
    if (context.isNextVersion) {
      if (context.page === "plans.html") {
        return `
          <div class="sticky-actions" data-sticky-actions role="region" aria-label="Quick actions">
            <a class="btn" data-link="architectural" href="${resolveAssetHref(config.architecturalSetPath, context)}" target="_blank" rel="noopener">Architectural Set</a>
            <a class="btn btn--primary" href="${resolveSiteHref("contact.html", context)}">Contact Leasing</a>
          </div>
        `;
      }

      if (context.page === "contact.html") {
        return `
          <div class="sticky-actions" data-sticky-actions role="region" aria-label="Quick actions">
            <a class="btn" data-link="brochure" href="${resolveAssetHref(config.brochurePath, context)}" target="_blank" rel="noopener">Leasing Package</a>
            <a class="btn btn--primary" href="${resolveSiteHref("plans.html", context)}">View Plans</a>
          </div>
        `;
      }

      return `
        <div class="sticky-actions" data-sticky-actions role="region" aria-label="Quick actions">
          <a class="btn" data-link="brochure" href="${resolveAssetHref(config.brochurePath, context)}" target="_blank" rel="noopener">Leasing Package</a>
          <a class="btn btn--primary" href="${resolveSiteHref("contact.html", context)}">Contact Leasing</a>
        </div>
      `;
    }

    return `
      <div class="sticky-actions" data-sticky-actions role="region" aria-label="Quick actions">
        <a class="btn" data-link="listing" href="${config.listingUrl}" target="_blank" rel="noopener">MLS Listing</a>
        <a class="btn btn--primary" href="${resolveSiteHref("contact.html", context)}">Contact Realtors</a>
        <a class="btn" data-link="maps" href="${config.mapsUrl}" target="_blank" rel="noopener">Open Map</a>
      </div>
    `;
  }

  function renderVersionSwitch(context) {
    const href = resolveVersionHref(context);
    if (!href) return "";
    const label = context.isNextVersion ? "View Current Live Site" : "View Next Version";
    return `<a class="version-switch" href="${href}" aria-label="${label} for this page">${label}</a>`;
  }

  function initRevealAnimations() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    const targets = [
      ...document.querySelectorAll("main .hero-content > *, main .section-title, main .section-subtitle, main .card, main .list > li"),
    ];

    if (!targets.length) return;

    targets.forEach((el) => {
      if (!el.classList.contains("reveal")) el.classList.add("reveal");
    });

    document.querySelectorAll(".facts-grid, .agent-grid, .btn-row").forEach((container) => {
      const children = Array.from(container.children).filter((el) => el.classList.contains("reveal"));
      children.forEach((el, idx) => {
        el.style.setProperty("--reveal-delay", `${Math.min(idx * 18, 72)}ms`);
      });
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -4% 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  function hydrateLinks(context) {
    const linkTargets = {
      listing: config.listingUrl,
      mirror: config.mirrorUrl,
      maps: config.mapsUrl,
      brochure: resolveAssetHref(config.brochurePath, context),
      architectural: resolveAssetHref(config.architecturalSetPath, context),
    };

    document.querySelectorAll("[data-link]").forEach((el) => {
      const key = el.getAttribute("data-link");
      const href = linkTargets[key];
      if (!href) return;
      el.setAttribute("href", href);
      if (key === "listing" || key === "mirror" || key === "maps" || key === "brochure" || key === "architectural") {
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
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", isOpen);
    }

    toggle.setAttribute("aria-label", "Open menu");

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
    else {
      video.addEventListener("canplay", setReady, { once: true });
      video.addEventListener("error", setReady, { once: true });
    }
  }

  function initStickyActions() {
    const sticky = document.querySelector("[data-sticky-actions]");
    if (!sticky) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      sticky.classList.remove("is-hidden");
      return;
    }

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

  function initSignatureSequence() {
    const section = document.querySelector("[data-signature]");
    if (!section) return;

    const steps = Array.from(section.querySelectorAll("[data-signature-step]"));
    if (!steps.length) return;

    const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const desktopQuery = window.matchMedia?.("(min-width: 901px)");
    let observer = null;
    let activeIndex = 0;

    function setActive(index) {
      if (!Number.isInteger(index) || index < 0 || index >= steps.length) return;
      activeIndex = index;
      section.dataset.signatureStage = String(index);
      steps.forEach((step, stepIndex) => {
        step.classList.toggle("is-active", stepIndex === index);
      });
    }

    function disconnectObserver() {
      observer?.disconnect();
      observer = null;
    }

    function setStaticMode() {
      disconnectObserver();
      section.dataset.signatureMode = "static";
      setActive(0);
    }

    function setMotionMode() {
      if (!("IntersectionObserver" in window)) {
        setStaticMode();
        return;
      }

      disconnectObserver();
      section.dataset.signatureMode = "motion";
      setActive(activeIndex);

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!visible) return;

          const nextIndex = Number(visible.target.getAttribute("data-signature-step"));
          if (Number.isInteger(nextIndex)) setActive(nextIndex);
        },
        {
          threshold: [0.24, 0.48, 0.72],
          rootMargin: "-16% 0px -28% 0px",
        }
      );

      steps.forEach((step) => observer.observe(step));
    }

    function applyMode() {
      const reduced = reducedMotionQuery?.matches ?? false;
      const desktop = desktopQuery?.matches ?? true;
      if (reduced || !desktop) {
        setStaticMode();
        return;
      }
      setMotionMode();
    }

    function bindMediaListener(query, handler) {
      if (!query) return;
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", handler);
        return;
      }
      if (typeof query.addListener === "function") query.addListener(handler);
    }

    bindMediaListener(reducedMotionQuery, applyMode);
    bindMediaListener(desktopQuery, applyMode);
    applyMode();
  }

  function initLayout() {
    const context = getPathContext();
    document.body.dataset.siteVersion = context.isNextVersion ? "next" : "current";

    const switchMarkup = renderVersionSwitch(context);
    if (switchMarkup) {
      document.body.classList.add("has-version-switch");
      document.body.insertAdjacentHTML("afterbegin", switchMarkup);
    }

    const header = document.getElementById("site-header");
    if (header) {
      header.classList.add("site-header");
      header.innerHTML = renderHeader(context);
      setActiveNav(header, context);
    }

    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.classList.add("site-footer");
      footer.innerHTML = renderFooter(context);
    }

    const sticky = document.getElementById("site-cta");
    if (sticky) sticky.innerHTML = renderStickyActions(context);

    hydrateLinks(context);
    initNavToggle();
    initHeroVideo();
    initStickyActions();
    initRevealAnimations();
    initSignatureSequence();
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
