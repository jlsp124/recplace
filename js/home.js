(() => {
  function initStorySwitcher() {
    const root = document.querySelector("[data-story-switcher]");
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll("[data-story-tab]"));
    const panel = root.querySelector("[role='tabpanel']");
    const image = root.querySelector("[data-story-image]");
    const index = root.querySelector("[data-story-index]");
    const title = root.querySelector("[data-story-title]");
    const meta = root.querySelector("[data-story-meta]");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    if (!tabs.length || !panel || !image || !index || !title || !meta) return;

    let swapToken = 0;

    function commitTab(tab, token) {
      if (token !== swapToken) return;

      const nextSrc = tab.dataset.src;
      if (nextSrc) image.src = nextSrc;
      image.alt = tab.dataset.alt || image.alt;
      index.textContent = tab.dataset.index || "";
      title.textContent = tab.dataset.title || "";
      meta.textContent = tab.dataset.meta || "";
      panel.dataset.fit = tab.dataset.fit || "cover";
      panel.setAttribute("aria-labelledby", tab.id);
      panel.removeAttribute("aria-busy");

      window.requestAnimationFrame(() => {
        image.style.opacity = "1";
      });
    }

    function activateTab(tab, { focus = false } = {}) {
      if (!tabs.includes(tab)) return;

      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
      });

      if (focus) tab.focus();

      const nextSrc = tab.dataset.src;
      const currentSrc = image.getAttribute("src");
      const token = ++swapToken;

      if (!nextSrc || nextSrc === currentSrc || reducedMotion) {
        commitTab(tab, token);
        return;
      }

      panel.setAttribute("aria-busy", "true");
      image.style.opacity = "0";

      const candidate = new Image();
      const finish = () => commitTab(tab, token);
      candidate.addEventListener("load", finish, { once: true });
      candidate.addEventListener("error", finish, { once: true });
      candidate.src = nextSrc;

      if (candidate.complete) finish();
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (event) => {
        const currentIndex = tabs.indexOf(tab);
        let nextIndex = currentIndex;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;

        event.preventDefault();
        activateTab(tabs[nextIndex], { focus: true });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initStorySwitcher();
  });
})();
