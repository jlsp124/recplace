// Only this small controller loads with the page. The engine and GLB are fetched
// after a visitor explicitly chooses to explore.
(() => {
  document.querySelectorAll('[data-recplace-3d]').forEach((root) => {
    const stage = root.querySelector('[data-3d-stage]');
    const launch = root.querySelector('[data-3d-launch]');
    const poster = root.querySelector('[data-3d-poster]');
    const controls = root.querySelector('[data-3d-controls]');
    const status = root.querySelector('[data-3d-status]');
    const stop = root.querySelector('[data-3d-stop]');
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
      clearTimeout(timeout);
      request?.abort();
      viewer?.dispose();
      viewer = null;
      setState(failed ? 'fallback' : 'poster');
      launch.textContent = failed ? 'Try 3D again' : 'Explore in 3D';
      status.textContent = message;
    }

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
        const loaded = await createViewer(stage, { signal: current.signal, onFailure: fail });
        if (current.signal.aborted) { loaded.dispose(); return; }
        viewer = loaded;
        clearTimeout(timeout);
        const shouldFocus = document.activeElement === launch;
        setState('ready');
        status.textContent = '3D exterior ready. Illustrative model; final details may vary.';
        if (shouldFocus) stage.querySelector('canvas').focus({ preventScroll: true });
        root.dispatchEvent(new CustomEvent('recplace:viewer-ready', { detail: { viewer } }));
      } catch (error) {
        if (!current.signal.aborted) fail();
      }
    });

    root.querySelectorAll('[data-3d-view]').forEach((button) => button.addEventListener('click', () => {
      viewer?.setView(button.dataset['3dView']);
      status.textContent = `${button.textContent.trim()} view. Illustrative model; final details may vary.`;
    }));
    root.querySelector('[data-3d-zoom-in]').addEventListener('click', () => viewer?.zoom(1.15));
    root.querySelector('[data-3d-zoom-out]').addEventListener('click', () => viewer?.zoom(1 / 1.15));
    stop.addEventListener('click', () => {
      restore('Architectural rendering. Select Explore in 3D to return to the model.');
      launch.focus({ preventScroll: true });
    });
    window.addEventListener('pagehide', () => restore('Select Explore in 3D to explore the building.'));
  });
})();
