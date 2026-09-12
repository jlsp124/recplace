// Only this small controller loads with the page. The engine and GLB are fetched
// after activation, or directly on the dedicated Explore page.
(() => {
  document.querySelectorAll('[data-recplace-3d]').forEach((root) => {
    const stage = root.querySelector('[data-3d-stage]');
    const launch = root.querySelector('[data-3d-launch]');
    const poster = root.querySelector('[data-3d-poster]');
    const controls = root.querySelector('[data-3d-controls]');
    const status = root.querySelector('[data-3d-status]');
    const stop = root.querySelector('[data-3d-stop]');
    const orbit = root.querySelector('[data-3d-orbit]');
    const expand = root.querySelector('[data-3d-expand]');
    let expanded = false;
    let savedOverflow = '';
    let viewer;
    let engine;
    let engineAttempt = 0;
    let request;
    let timeout;
    let state = 'poster';

    function setState(next) {
      state = next;
      root.dataset.state = next;
      stage.setAttribute('aria-busy', String(next === 'loading'));
      poster.hidden = next === 'ready';
      controls.hidden = next !== 'ready';
      stop.hidden = next !== 'ready' && next !== 'loading';
      launch.hidden = next === 'ready';
      launch.disabled = next === 'loading';
    }

    function restore(message, failed = false) {
      endExpanded();
      clearTimeout(timeout);
      request?.abort();
      viewer?.dispose();
      viewer = null;
      setState(failed ? 'fallback' : 'poster');
      launch.textContent = failed ? 'Try 3D again' : 'Explore in 3D';
      status.textContent = message;
    }

    function resetOrbit() { orbit?.setAttribute('aria-pressed', 'false'); }
    function endExpanded() {
      if (!expanded) return;
      expanded = false;
      root.classList.remove('is-expanded');
      root.removeAttribute('role');
      root.removeAttribute('aria-modal');
      root.removeAttribute('aria-label');
      document.body.style.overflow = savedOverflow;
      expand.textContent = 'Expand view';
      expand.setAttribute('aria-expanded', 'false');
      expand.focus({ preventScroll: true });
    }
    expand?.addEventListener('click', () => {
      if (expanded) return endExpanded();
      savedOverflow = document.body.style.overflow;
      expanded = true;
      root.classList.add('is-expanded');
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'RECPLACE expanded 3D view');
      document.body.style.overflow = 'hidden';
      expand.textContent = 'Close expanded view';
      expand.setAttribute('aria-expanded', 'true');
      expand.focus({ preventScroll: true });
    });
    root.addEventListener('keydown', (event) => {
      if (!expanded) return;
      if (event.key === 'Escape') { event.preventDefault(); endExpanded(); }
      if (event.key === 'Tab') {
        const items = [...root.querySelectorAll('button:not(:disabled), a[href], canvas')].filter((el) => el.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    orbit?.addEventListener('click', () => {
      const active = viewer?.setOrbit(orbit.getAttribute('aria-pressed') !== 'true');
      orbit.setAttribute('aria-pressed', String(Boolean(active)));
    });

    launch.hidden = false;
    launch.addEventListener('click', async () => {
      if (state === 'loading' || state === 'ready') return;
      request = new AbortController();
      const current = request;
      setState('loading');
      launch.textContent = 'Loading the building…';
      status.textContent = 'Loading the interactive exterior. You can keep scrolling.';
      const fail = () => {
        if (current !== request || current.signal.aborted) return;
        const hadFocus = root.contains(document.activeElement);
        restore('3D is unavailable right now. The architectural rendering and floor overview are still available.', true);
        if (hadFocus) launch.focus({ preventScroll: true });
      };
      timeout = setTimeout(fail, 25000);
      try {
        // Browsers remember failed module imports for the current document.
        // A new URL lets an explicit retry recover from a failed engine request;
        // successful imports remain reusable when the visitor reopens the model.
        if (!engine) {
          const suffix = engineAttempt ? `?retry=${engineAttempt}` : '';
          engineAttempt += 1;
          engine = await import(`/js/3d/recplace-viewer.bundle.js${suffix}`);
        }
        const { createViewer } = engine;
        if (current.signal.aborted) return;
        const loaded = await createViewer(stage, { signal: current.signal, onFailure: fail, onInteraction: resetOrbit });
        if (current.signal.aborted) { loaded.dispose(); return; }
        viewer = loaded;
        clearTimeout(timeout);
        const shouldFocus = document.activeElement === launch;
        setState('ready');
        resetOrbit();
        status.textContent = '3D exterior ready. Illustrative model; final details may vary.';
        if (shouldFocus) stage.querySelector('canvas').focus({ preventScroll: true });
        root.dispatchEvent(new CustomEvent('recplace:viewer-ready', { detail: { viewer } }));
      } catch (error) {
        if (!current.signal.aborted) fail();
      }
    });

    root.querySelectorAll('[data-3d-view]').forEach((button) => button.addEventListener('click', () => {
      viewer?.setView(button.dataset['3dView']);
      resetOrbit();
      status.textContent = `${button.textContent.trim()} view. Illustrative model; final details may vary.`;
    }));
    root.querySelector('[data-3d-zoom-in]').addEventListener('click', () => viewer?.zoom(1.15));
    root.querySelector('[data-3d-zoom-out]').addEventListener('click', () => viewer?.zoom(1 / 1.15));
    stop.addEventListener('click', () => {
      restore('Architectural rendering. Select Explore in 3D to return to the model.');
      launch.focus({ preventScroll: true });
    });
    window.addEventListener('pagehide', () => restore('Select Explore in 3D to explore the building.'));
    if (root.hasAttribute('data-3d-autostart')) launch.click();
  });
})();
