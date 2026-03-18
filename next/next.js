(() => {
  function initPlanSwitchers() {
    document.querySelectorAll("[data-plan-switcher]").forEach((switcher) => {
      const buttons = Array.from(switcher.querySelectorAll("[data-plan-tab]"));
      const image = switcher.querySelector("[data-plan-image]");
      const title = switcher.querySelector("[data-plan-title]");
      const meta = switcher.querySelector("[data-plan-meta]");
      const caption = switcher.querySelector("[data-plan-caption]");
      const sheet = switcher.querySelector("[data-plan-sheet]");

      if (!buttons.length || !image || !title || !meta || !caption) return;

      const setActive = (button) => {
        buttons.forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });

        image.style.opacity = "0.15";

        window.setTimeout(() => {
          image.src = button.dataset.src || image.src;
          image.alt = button.dataset.alt || image.alt;
          title.textContent = button.dataset.title || title.textContent;
          meta.textContent = button.dataset.meta || meta.textContent;
          caption.textContent = button.dataset.caption || caption.textContent;

          if (sheet && button.dataset.sheet) {
            sheet.textContent = button.dataset.sheet;
          }

          image.style.opacity = "1";
        }, 80);
      };

      buttons.forEach((button) => {
        button.addEventListener("click", () => setActive(button));
      });
    });
  }

  function initFloorNavSpy() {
    const nav = document.querySelector("[data-floor-nav]");
    if (!nav || !("IntersectionObserver" in window)) return;

    const links = Array.from(nav.querySelectorAll("a[href^='#']"));
    const map = new Map();

    links.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const section = id ? document.getElementById(id) : null;
      if (!section) return;
      map.set(section, link);
    });

    if (!map.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        links.forEach((link) => link.removeAttribute("aria-current"));
        map.get(visible.target)?.setAttribute("aria-current", "true");
      },
      {
        threshold: [0.2, 0.45, 0.7],
        rootMargin: "-18% 0px -55% 0px",
      }
    );

    map.forEach((_link, section) => observer.observe(section));
  }

  function initStickyDeferral() {
    const sticky = document.querySelector("[data-sticky-actions]");
    const leadSection = document.querySelector("main > .section");
    if (!sticky || !leadSection || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        sticky.classList.toggle("sticky-actions--deferred", entry.isIntersecting && entry.intersectionRatio > 0.24);
      },
      {
        threshold: [0, 0.24, 0.45, 0.7],
        rootMargin: "0px 0px -22% 0px",
      }
    );

    observer.observe(leadSection);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initPlanSwitchers();
    initFloorNavSpy();
    initStickyDeferral();
  });
})();
