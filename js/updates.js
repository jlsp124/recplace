(() => {
  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(isoDate) {
    const dt = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return isoDate;
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(dt);
  }

  function renderUpdate(u) {
    const title = escapeHtml(u.title ?? "");
    const body = escapeHtml(u.body ?? "").replaceAll("\n", "<br>");
    const category = escapeHtml(u.category ?? "Update");
    const dateLabel = formatDate(u.date ?? "");
    const image = u.image ? `<img src="${escapeHtml(u.image)}" alt="" loading="lazy">` : "";

    return `
      <article class="card" style="margin-bottom:12px">
        ${image}
        <div class="card-body">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap">
            <div>
              <h3 class="card-title">${title}</h3>
              <div class="muted mono">${escapeHtml(dateLabel)}</div>
            </div>
            <span class="tag">${category}</span>
          </div>
          <div class="divider" style="margin:14px 0"></div>
          <p class="card-text">${body}</p>
        </div>
      </article>
    `;
  }

  async function init() {
    const host = document.getElementById("updates-list");
    if (!host || !window.Recplace) return;

    const data = await window.Recplace.loadUpdatesData();
    const updates = [...data].filter(Boolean);
    updates.sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));

    if (!updates.length) {
      host.innerHTML = `<div class="card"><div class="card-body"><p class="card-text">No updates yet.</p></div></div>`;
      return;
    }

    host.innerHTML = updates.map(renderUpdate).join("");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

