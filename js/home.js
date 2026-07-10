(() => {
  function initHeroDepth() {
    const media = document.querySelector("[data-hero-depth]");
    if (!media) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 901px)");
    let frame = 0;

    function update() {
      frame = 0;
      if (reducedMotion.matches || !desktop.matches) {
        media.style.setProperty("--hero-shift", "0px");
        return;
      }
      const shift = Math.min(26, Math.max(0, window.scrollY * 0.045));
      media.style.setProperty("--hero-shift", `${shift}px`);
    }

    function requestUpdate() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    reducedMotion.addEventListener?.("change", requestUpdate);
    desktop.addEventListener?.("change", requestUpdate);
    update();
  }

  document.addEventListener("DOMContentLoaded", initHeroDepth);
})();
