(() => {
  function initHeroVideo() {
    const video = document.querySelector("[data-hero-video]");
    const media = video?.closest(".home-hero__media");
    const source = video?.querySelector("source[data-src]");
    if (!video || !media || !source) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const smallScreen = window.matchMedia("(max-width: 900px)");
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    function shouldUseVideo() {
      return !reducedMotion.matches && !smallScreen.matches && !connection?.saveData;
    }

    function stopVideo() {
      video.pause();
      media.classList.remove("has-playing-video");
      if (source.hasAttribute("src")) {
        source.removeAttribute("src");
        video.load();
      }
    }

    async function startVideo() {
      if (!shouldUseVideo()) return stopVideo();
      if (!source.hasAttribute("src")) {
        source.src = source.dataset.src;
        video.load();
      }
      try {
        await video.play();
      } catch {
        media.classList.remove("has-playing-video");
      }
    }

    video.addEventListener("playing", () => media.classList.add("has-playing-video"));
    video.addEventListener("error", () => media.classList.remove("has-playing-video"));
    reducedMotion.addEventListener?.("change", startVideo);
    smallScreen.addEventListener?.("change", startVideo);
    connection?.addEventListener?.("change", startVideo);
    startVideo();
  }

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

  document.addEventListener("DOMContentLoaded", () => {
    initHeroDepth();
    initHeroVideo();
  });
})();
