(() => {
  function initHeroVideo() {
    const video = document.querySelector("[data-hero-video]");
    const media = video?.closest(".home-hero__media");
    const source = video?.querySelector("source[data-src-desktop]");
    if (!video || !media || !source) return;
    const playback = media.querySelector('[data-hero-playback]');
    let userPaused = false;
    let inView = false;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileScreen = window.matchMedia("(max-width: 900px)");
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    function shouldUseVideo() {
      return !reducedMotion.matches && !connection?.saveData;
    }

    function desiredSource() {
      return mobileScreen.matches ? source.dataset.srcMobile : source.dataset.srcDesktop;
    }

    function stopVideo() {
      video.pause();
      media.classList.remove("has-playing-video");
      if (source.hasAttribute("src")) {
        source.removeAttribute("src");
        video.load();
      }
      updatePlayback();
    }

    async function startVideo() {
      if (!shouldUseVideo()) return stopVideo();
      if (!inView || document.hidden || userPaused) { video.pause(); return; }
      const nextSource = desiredSource();
      if (!nextSource) return stopVideo();
      if (source.getAttribute("src") !== nextSource) {
        media.classList.remove("has-playing-video");
        source.src = nextSource;
        video.load();
      }
      try {
        await video.play();
      } catch {
        media.classList.remove("has-playing-video");
        updatePlayback();
      }
    }

    function updatePlayback() {
      if (!playback) return;
      playback.hidden = !source.hasAttribute('src');
      playback.textContent = video.paused ? 'Play video' : 'Pause video';
      playback.setAttribute('aria-label', video.paused ? 'Play construction video' : 'Pause construction video');
    }
    video.addEventListener("playing", () => { media.classList.add("has-playing-video"); updatePlayback(); });
    video.addEventListener('pause', updatePlayback);
    video.addEventListener("error", () => { media.classList.remove("has-playing-video"); if (playback) playback.hidden = true; });
    playback?.addEventListener('click', () => {
      userPaused = !video.paused;
      if (userPaused) video.pause(); else startVideo();
    });
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      startVideo();
    }, { threshold: .05 }).observe(media);
    document.addEventListener('visibilitychange', startVideo);
    reducedMotion.addEventListener?.("change", startVideo);
    mobileScreen.addEventListener?.("change", startVideo);
    connection?.addEventListener?.("change", startVideo);
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
