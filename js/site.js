(() => {
  const config = Object.freeze({
    siteName: "Recplace Professional Centre",
    listingUrl:
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
    { href: "plans.html", label: "Plans" },
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
      .map((i) => `<a class="nav-link" data-nav href="${i.href}">${i.label}</a>`)
      .join("");

    return `
      <div class="container">
        <nav class="nav" data-nav-root>
          <a class="brand" href="index.html" aria-label="${config.siteName}">
            <span class="brand-mark" aria-hidden="true"></span>
            <span>RecplacePro</span>
          </a>
          <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav">
            Menu
          </button>
          <div class="nav-links" id="site-nav">
            ${navLinks}
          </div>
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
            <div class="brand" style="gap:12px">
              <span class="brand-mark" aria-hidden="true"></span>
              <span>${config.siteName}</span>
            </div>
            <div class="footer-legal">
              Information subject to change. Leasing via Royal LePage Aspire Realty.
            </div>
          </div>
          <div>
            <div class="footer-links">
              ${links}
            </div>
            <div style="margin-top:14px">
              <a class="btn btn--primary btn-block" data-link="listing" href="#" target="_blank" rel="noopener">
                View External MLS Listing
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderStickyActions() {
    return `
      <div class="sticky-actions" role="region" aria-label="Quick actions">
        <a class="btn btn--primary" data-link="listing" href="#" target="_blank" rel="noopener">View MLS Listing</a>
        <a class="btn" href="contact.html">Contact Realtors</a>
        <a class="btn" href="plans.html">Building Plans</a>
      </div>
    `;
  }

  function bubbleize(el) {
    const text = el.getAttribute("data-bubbles") ?? el.textContent ?? "";
    el.setAttribute("aria-label", text);
    el.textContent = "";
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = ch === " " ? "bubble bubble--space" : "bubble";
      span.textContent = ch === " " ? " " : ch;
      el.append(span);
    }
  }

  function hydrateLinks() {
    const linkTargets = {
      listing: config.listingUrl,
      maps: config.mapsUrl,
    };

    document.querySelectorAll("[data-link]").forEach((el) => {
      const key = el.getAttribute("data-link");
      const href = linkTargets[key];
      if (!href) return;
      el.setAttribute("href", href);
      if (key === "listing" || key === "maps") {
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
    if (!navRoot || !toggle) return;

    function setOpen(isOpen) {
      navRoot.classList.toggle("nav--open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    }

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!navRoot.classList.contains("nav--open")) return;
      if (navRoot.contains(e.target)) return;
      setOpen(false);
    });
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

    document.querySelectorAll("[data-bubbles]").forEach(bubbleize);
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
    } catch {
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

  window.Recplace = Object.freeze({
    config,
    initLayout,
    initGate,
    loadUpdatesData,
    downloadText,
  });

  document.addEventListener("DOMContentLoaded", initLayout);
})();
