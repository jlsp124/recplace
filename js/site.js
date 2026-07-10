(() => {
  document.documentElement.classList.add("js");

  const config = Object.freeze({
    siteName: "RECPLACE Professional Centre",
    listingUrl: "https://www.realtor.ca/real-estate/28883424/2740-recplace-drive-prince-george",
    mirrorUrl: "https://highamwalker.com/mylistings.html/listing.c8072356-2740-recplace-drive-prince-george-v2n-1t7.106896467",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=2740+Recplace+Drive,+Prince+George,+BC+V2N+1T7",
    mlsId: "C8072356",
    address: "2740 Recplace Drive, Prince George, BC V2N 1T7",
    coords: { lat: 53.897384795, lng: -122.771398006 },
    contacts: {
      jen: { name: "Jen Higham", phone: "2506137207", phoneLabel: "(250) 613-7207", email: "jen@realtypg.com" },
      rod: { name: "Rod Walker", phone: "2506178090", phoneLabel: "(250) 617-8090", email: "rod@realtypg.com" },
    },
  });

  const navItems = Object.freeze([
    { href: "index.html", label: "Home" },
    { href: "leasing.html", label: "Leasing" },
    { href: "updates.html", label: "Updates" },
  ]);

  function getPathContext() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const page = (segments.at(-1) || "index.html").toLowerCase();
    const inNextDirectory = segments.map((segment) => segment.toLowerCase()).includes("next");
    return {
      page: page.includes(".") ? page : "index.html",
      prefix: inNextDirectory ? "../" : "",
    };
  }

  function resolveHref(href, context) {
    if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) return href;
    return `${context.prefix}${href}`;
  }

  function renderHeader(context) {
    const navLinks = navItems
      .map(({ href, label }) => {
        const current = context.page === href ? ' aria-current="page"' : "";
        return `<a class="nav-link" data-nav-link href="${resolveHref(href, context)}"${current}>${label}</a>`;
      })
      .join("");
    const contactCurrent = context.page === "contact.html" ? ' aria-current="page"' : "";

    return `
      <div class="container site-header__inner">
        <a class="site-brand" href="${resolveHref("index.html", context)}" aria-label="RECPLACE Professional Centre home">
          <span class="site-brand__mark">RECPLACE</span>
          <span class="site-brand__descriptor">Professional Centre<br>Prince George, BC</span>
        </a>
        <nav class="site-nav" data-nav-root aria-label="Primary navigation">
          <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav-panel">Menu</button>
          <button class="nav-scrim" type="button" data-nav-scrim aria-label="Close navigation" tabindex="-1"></button>
          <div class="site-nav__panel" id="site-nav-panel" data-nav-panel>
            <div class="site-nav__links">${navLinks}</div>
            <a class="site-nav__contact" href="${resolveHref("contact.html", context)}"${contactCurrent}>Contact</a>
          </div>
        </nav>
      </div>`;
  }

  function renderFooter(context) {
    const footerLinks = [...navItems, { href: "contact.html", label: "Contact" }]
      .map(({ href, label }) => `<a href="${resolveHref(href, context)}">${label}</a>`)
      .join("");

    return `
      <div class="container">
        <div class="site-footer__top">
          <div class="site-footer__identity">
            <div class="site-footer__name">RECPLACE <span>Professional Centre</span></div>
            <p class="site-footer__address">
              <a data-link="maps" href="${config.mapsUrl}">${config.address}</a><br>
              Leasing via Royal LePage Aspire Realty.
            </p>
          </div>
          <div>
            <div class="site-footer__heading">Explore</div>
            <nav class="site-footer__links" aria-label="Footer navigation">${footerLinks}</nav>
          </div>
          <div>
            <div class="site-footer__heading">Leasing</div>
            <div class="site-footer__links">
              <a data-call="jen" href="tel:${config.contacts.jen.phone}">${config.contacts.jen.phoneLabel}</a>
              <a data-email="jen" href="mailto:${config.contacts.jen.email}">${config.contacts.jen.email}</a>
              <a data-link="listing" href="${config.listingUrl}">View listing</a>
            </div>
          </div>
        </div>
        <div class="site-footer__base">
          <span>RECPLACE Professional Centre</span>
          <span>2740 Recplace Drive · Prince George, British Columbia</span>
        </div>
      </div>`;
  }

  function hydrateLinks() {
    const linkTargets = {
      listing: config.listingUrl,
      mirror: config.mirrorUrl,
      maps: config.mapsUrl,
    };

    document.querySelectorAll("[data-link]").forEach((element) => {
      const target = linkTargets[element.dataset.link];
      if (!target) return;
      element.href = target;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    });

    document.querySelectorAll("[data-call]").forEach((element) => {
      const contact = config.contacts[element.dataset.call];
      if (contact) element.href = `tel:${contact.phone}`;
    });

    document.querySelectorAll("[data-email]").forEach((element) => {
      const contact = config.contacts[element.dataset.email];
      if (contact) element.href = `mailto:${contact.email}`;
    });

    document.querySelectorAll("[data-text='address']").forEach((element) => {
      element.textContent = config.address;
    });

    document.querySelectorAll("[data-text='coords']").forEach((element) => {
      element.textContent = `${config.coords.lat.toFixed(6)}, ${config.coords.lng.toFixed(6)}`;
    });
  }

  function initHeaderState() {
    const header = document.getElementById("site-header");
    if (!header) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      header.classList.toggle("is-scrolled", window.scrollY > 18);
    };

    window.addEventListener(
      "scroll",
      () => {
        if (frame) return;
        frame = window.requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  function initNavigation() {
    const root = document.querySelector("[data-nav-root]");
    const toggle = root?.querySelector("[data-nav-toggle]");
    const panel = root?.querySelector("[data-nav-panel]");
    const scrim = root?.querySelector("[data-nav-scrim]");
    if (!root || !toggle || !panel || !scrim) return;

    const desktop = window.matchMedia("(min-width: 901px)");
    let lastFocused = null;
    let interactionTimer = 0;
    let lockedScrollY = 0;
    let bodyLockStyles = null;

    const focusable = () =>
      Array.from(panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));

    function lockPageScroll() {
      if (bodyLockStyles) return;
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      bodyLockStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      };
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    }

    function unlockPageScroll() {
      if (!bodyLockStyles) return;
      const restoreY = lockedScrollY;
      Object.assign(document.body.style, bodyLockStyles);
      bodyLockStyles = null;
      lockedScrollY = 0;
      window.scrollTo(0, restoreY);
    }

    function close({ returnFocus = true } = {}) {
      const wasOpen = root.classList.contains("is-open");
      window.clearTimeout(interactionTimer);
      root.classList.remove("is-open", "is-interactive");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      scrim.tabIndex = -1;
      unlockPageScroll();
      if (wasOpen && returnFocus) {
        const focusTarget = lastFocused instanceof HTMLElement && lastFocused !== document.body ? lastFocused : toggle;
        focusTarget.focus();
      }
    }

    function open() {
      if (desktop.matches) return;
      lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      window.clearTimeout(interactionTimer);
      root.classList.remove("is-interactive");
      root.classList.add("is-open");
      document.body.classList.add("nav-open");
      lockPageScroll();
      toggle.setAttribute("aria-expanded", "true");
      scrim.tabIndex = 0;
      interactionTimer = window.setTimeout(() => {
        if (root.classList.contains("is-open")) root.classList.add("is-interactive");
      }, 340);
      window.setTimeout(() => {
        if (root.classList.contains("is-open")) focusable()[0]?.focus();
      }, 30);
    }

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (root.classList.contains("is-open")) close();
      else open();
    });

    scrim.addEventListener("click", (event) => {
      event.preventDefault();
      close();
    });
    panel.addEventListener("click", (event) => {
      if (!root.classList.contains("is-interactive")) {
        event.preventDefault();
        return;
      }
      if (event.target.closest("a")) close({ returnFocus: false });
    });

    document.addEventListener("keydown", (event) => {
      if (!root.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const onDesktopChange = () => close({ returnFocus: false });
    if (desktop.addEventListener) desktop.addEventListener("change", onDesktopChange);
    else desktop.addListener(onDesktopChange);
  }

  function initRevealAnimations() {
    const targets = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!targets.length) return;
    targets.forEach((target) => target.classList.add("reveal"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    targets.forEach((target) => observer.observe(target));
  }

  function initLayout() {
    const context = getPathContext();
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    if (header) header.innerHTML = renderHeader(context);
    if (footer) footer.innerHTML = renderFooter(context);
    hydrateLinks();
    initHeaderState();
    initNavigation();
    initRevealAnimations();
  }

  function safeParseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async function loadUpdatesData() {
    const context = getPathContext();
    try {
      const response = await fetch(`${context.prefix}data/updates.json`, { cache: "no-store" });
      if (!response.ok) return [];
      const parsed = await response.json();
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      const embedded = document.getElementById("updates-data");
      const parsed = embedded?.textContent ? safeParseJson(embedded.textContent) : null;
      return Array.isArray(parsed) ? parsed : [];
    }
  }

  function downloadText(filename, text, mime = "application/json") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function initGate({ storageKey, password, gateId }) {
    const gate = document.querySelector(`[data-gate='${gateId}']`);
    const content = document.querySelector(`[data-gated='${gateId}']`);
    if (!gate || !content) return;

    const form = gate.querySelector("form");
    const input = gate.querySelector("input[type='password']");
    const error = gate.querySelector("[data-gate-error]");
    const lockButton = content.querySelector("[data-gate-lock]");

    const setLocked = (locked) => {
      gate.hidden = !locked;
      content.hidden = locked;
      if (error) error.hidden = true;
      if (input) input.value = "";
    };

    setLocked(localStorage.getItem(storageKey) !== "1");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      if ((input?.value || "").trim() === password) {
        localStorage.setItem(storageKey, "1");
        setLocked(false);
      } else if (error) {
        error.hidden = false;
        error.textContent = "Incorrect password.";
        input?.focus();
        input?.select?.();
      }
    });
    lockButton?.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      setLocked(true);
    });
  }

  const api = Object.freeze({ config, initLayout, initGate, loadUpdatesData, downloadText });
  window.recplace = api;
  window.Recplace = api;
  document.addEventListener("DOMContentLoaded", initLayout);
})();
