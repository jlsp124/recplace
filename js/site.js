(() => {
  document.documentElement.classList.add("js");

  const config = Object.freeze({
    siteName: "RECPLACE Professional Centre",
    jenProfileUrl: "https://royallepageaspirerealty.com/teams/jen-higham/",
    jenWebsiteUrl: "https://jenhigham.com/",
    jenFacebookUrl: "https://facebook.com/jenhighamrealestateagent",
    aspireRealtyUrl: "https://royallepageaspirerealty.com/",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=2740+Recplace+Drive,+Prince+George,+BC+V2N+1T7",
    address: "2740 Recplace Drive, Prince George, BC V2N 1T7",
    contacts: {
      jen: { name: "Jen Higham", phone: "+12506137207", phoneLabel: "(250) 613-7207", email: "jen@realtypg.com" },
    },
  });

  const navItems = Object.freeze([
    { href: "/", label: "Home", route: "home" },
    { href: "/leasing/", label: "Leasing", route: "leasing" },
    { href: "/updates/", label: "Updates", route: "updates" },
  ]);

  const footerItems = Object.freeze([
    ...navItems.slice(0, 2),
    { href: "/location/", label: "Location", route: "location" },
    { href: "/plans/", label: "Plans", route: "plans" },
    { href: "/design/", label: "Design", route: "design" },
    navItems[2],
    { href: "/contact/", label: "Contact", route: "contact" },
  ]);

  function getPathContext() {
    const normalizedPath = window.location.pathname.replace(/\/index\.html$/i, "/");
    const segments = normalizedPath.split("/").filter(Boolean);
    const leaf = (segments.at(-1) || "home").toLowerCase();
    return { route: leaf.replace(/\.html$/i, "") };
  }

  function resolveHref(href, context) {
    if (/^(?:https?:|mailto:|tel:|#|\/)/i.test(href)) return href;
    return `/${href.replace(/^\.\//, "")}`;
  }

  function renderHeader(context) {
    const navLinks = navItems
      .map(({ href, label, route }) => {
        const current = context.route === route ? ' aria-current="page"' : "";
        return `<a class="nav-link" data-nav-link href="${resolveHref(href, context)}"${current}>${label}</a>`;
      })
      .join("");
    const contactCurrent = context.route === "contact" ? ' aria-current="page"' : "";

    return `
      <div class="container site-header__inner">
        <a class="site-brand" href="${resolveHref("/", context)}" aria-label="RECPLACE Professional Centre home">
          <span class="site-brand__mark">RECPLACE</span>
          <span class="site-brand__descriptor">Professional Centre<br>Prince George, BC</span>
        </a>
        <nav class="site-nav" data-nav-root aria-label="Primary navigation">
          <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav-panel">Menu</button>
          <button class="nav-scrim" type="button" data-nav-scrim aria-label="Close navigation" tabindex="-1"></button>
          <div class="site-nav__panel" id="site-nav-panel" data-nav-panel>
            <div class="site-nav__links">${navLinks}</div>
            <a class="site-nav__contact" href="${resolveHref("/contact/", context)}"${contactCurrent}>Contact</a>
          </div>
        </nav>
      </div>`;
  }

  function renderFooter(context) {
    const footerLinks = footerItems
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
              <a data-link="jen-profile" href="${config.jenProfileUrl}">Jen Higham profile</a>
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
      "jen-profile": config.jenProfileUrl,
      "jen-website": config.jenWebsiteUrl,
      "jen-facebook": config.jenFacebookUrl,
      "aspire-realty": config.aspireRealtyUrl,
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
        if (!root.classList.contains("is-open")) return;
        root.classList.add("is-interactive");
        focusable()[0]?.focus();
      }, 340);
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
      if (!desktop.matches && !root.classList.contains("is-interactive")) {
        event.preventDefault();
        return;
      }
      if (!desktop.matches && event.target.closest("a")) close({ returnFocus: false });
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

  function initMediaLightbox() {
    const main = document.querySelector("main");
    if (!main) return;

    const lightbox = document.createElement("div");
    lightbox.className = "media-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Image preview");
    lightbox.innerHTML = `
      <button class="media-lightbox__close" type="button" data-lightbox-close>
        <span>Close</span><span aria-hidden="true">&times;</span>
      </button>
      <div class="media-lightbox__stage">
        <img class="media-lightbox__image" alt="">
        <p class="media-lightbox__caption" id="media-lightbox-caption"></p>
      </div>`;
    document.body.append(lightbox);

    const closeButton = lightbox.querySelector("[data-lightbox-close]");
    const preview = lightbox.querySelector(".media-lightbox__image");
    const caption = lightbox.querySelector(".media-lightbox__caption");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeImage = null;
    let closeTimer = 0;

    function isExpandable(image) {
      return image instanceof HTMLImageElement
        && Boolean(image.alt.trim())
        && !image.closest("a, button, [aria-hidden='true'], .home-hero__media, .contact-person__visual, .partner-row");
    }

    function enhance(image) {
      if (!isExpandable(image) || image.dataset.lightboxReady === "true") return;
      image.dataset.lightboxReady = "true";
      image.classList.add("is-expandable");
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-haspopup", "dialog");
      image.setAttribute("aria-label", `View larger: ${image.alt.trim()}`);
    }

    function enhanceWithin(root) {
      if (root instanceof HTMLImageElement) enhance(root);
      root.querySelectorAll?.("img").forEach(enhance);
    }

    function open(image) {
      if (!isExpandable(image)) return;
      window.clearTimeout(closeTimer);
      activeImage = image;
      const source = image.getAttribute("src");
      if (!source) return;
      preview.src = new URL(source, window.location.href).href;
      preview.alt = image.alt;
      caption.textContent = image.alt;
      lightbox.hidden = false;
      document.body.classList.add("media-lightbox-open");
      window.requestAnimationFrame(() => {
        lightbox.classList.add("is-open");
        closeButton.focus({ preventScroll: true });
      });
    }

    function finishClose() {
      if (lightbox.classList.contains("is-open")) return;
      lightbox.hidden = true;
      preview.removeAttribute("src");
      preview.alt = "";
      caption.textContent = "";
      activeImage?.focus({ preventScroll: true });
      activeImage = null;
    }

    function close() {
      if (lightbox.hidden) return;
      lightbox.classList.remove("is-open");
      document.body.classList.remove("media-lightbox-open");
      window.clearTimeout(closeTimer);
      if (reduceMotion.matches) finishClose();
      else closeTimer = window.setTimeout(finishClose, 220);
    }

    enhanceWithin(main);
    if ("MutationObserver" in window) {
      const observer = new MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach((node) => {
          if (node instanceof Element) enhanceWithin(node);
        }));
      });
      observer.observe(main, { childList: true, subtree: true });
    }

    main.addEventListener("click", (event) => {
      const image = event.target.closest?.("img.is-expandable");
      if (image) open(image);
    });
    main.addEventListener("keydown", (event) => {
      const image = event.target.closest?.("img.is-expandable");
      if (!image || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      open(image);
    });
    closeButton.addEventListener("click", close);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) close();
    });
    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButton.focus();
      }
    });
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
    initMediaLightbox();
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
      const response = await fetch("/data/updates.json", { cache: "no-store" });
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
