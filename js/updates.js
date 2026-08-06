(() => {
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    const monthOnly = /^(\d{4})-(\d{2})$/.exec(value);
    if (monthOnly) {
      const date = new Date(Number(monthOnly[1]), Number(monthOnly[2]) - 1, 1);
      return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "long",
      }).format(date);
    }
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  function renderUpdate(update) {
    const title = escapeHtml(update.title || "Project update");
    const category = escapeHtml(update.category || "Update");
    const date = escapeHtml(formatDate(update.date || ""));
    const body = escapeHtml(update.body || "").replaceAll("\n", "<br>");
    const imageWidth = Number.isFinite(Number(update.imageWidth)) ? Number(update.imageWidth) : 1600;
    const imageSmallWidth = Number.isFinite(Number(update.imageSmallWidth)) ? Number(update.imageSmallWidth) : 960;
    const imageHeight = Number.isFinite(Number(update.imageHeight)) ? Number(update.imageHeight) : 900;
    const image = update.image
      ? `<picture class="journal-entry__media">
          ${update.imageSmall ? `<source srcset="${escapeHtml(update.imageSmall)} ${imageSmallWidth}w, ${escapeHtml(update.image)} ${imageWidth}w" sizes="(max-width: 680px) 100vw, (max-width: 900px) 72vw, 68vw" type="image/webp">` : ""}
          <img class="journal-entry__image" src="${escapeHtml(update.image)}" alt="${escapeHtml(update.imageAlt || "")}" width="${imageWidth}" height="${imageHeight}" loading="lazy" decoding="async">
        </picture>`
      : "";

    return `
      <article class="journal-entry" data-reveal>
        <div class="journal-entry__meta"><time datetime="${escapeHtml(update.date || "")}">${date}</time><span>${category}</span></div>
        <h2>${title}</h2>
        <div class="journal-entry__body"><p>${body}</p></div>
        ${image}
      </article>`;
  }

  async function init() {
    const host = document.getElementById("updates-list");
    const loadMore = document.getElementById("updates-load-more");
    if (!host || !window.Recplace) return;

    const data = await window.Recplace.loadUpdatesData();
    const updates = data.filter(Boolean).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    if (!updates.length) {
      host.innerHTML = '<p class="updates-empty">No project updates have been published yet.</p>';
      loadMore?.setAttribute("hidden", "");
      return;
    }

    const pageSize = 6;
    let visible = Math.min(pageSize, updates.length);

    function render() {
      host.innerHTML = updates.slice(0, visible).map(renderUpdate).join("");
      host.querySelectorAll("[data-reveal]").forEach((entry) => {
        entry.classList.add("reveal");
        window.requestAnimationFrame(() => entry.classList.add("is-visible"));
      });
      if (loadMore) loadMore.hidden = visible >= updates.length;
    }

    loadMore?.addEventListener("click", () => {
      visible = Math.min(visible + pageSize, updates.length);
      render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
