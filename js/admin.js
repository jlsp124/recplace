(() => {
  const PASSWORD = "Pahal123";
  const STORAGE_KEY = "recplace:adminUnlocked";

  function byId(id) {
    return document.getElementById(id);
  }

  function normalizeDate(input) {
    const val = String(input || "").trim();
    if (!val) return "";
    const dt = new Date(`${val}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return "";
    return val;
  }

  function safeId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `u_${Date.now()}`;
  }

  function setError(msg) {
    const el = byId("admin-error");
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  async function initForm() {
    const form = byId("admin-form");
    const downloadBtn = byId("admin-download");
    const preview = byId("admin-preview");
    if (!form || !downloadBtn || !preview || !window.Recplace) return;

    const titleInput = byId("u-title");
    const dateInput = byId("u-date");
    const categoryInput = byId("u-category");
    const bodyInput = byId("u-body");
    const imageInput = byId("u-image");
    const imageFile = byId("u-image-file");
    const imagePreview = byId("u-image-preview");

    const seedUpdates = await window.Recplace.loadUpdatesData();
    let lastJson = JSON.stringify(seedUpdates, null, 2);
    preview.textContent = lastJson;
    downloadBtn.disabled = true;

    imageFile?.addEventListener("change", () => {
      const file = imageFile.files?.[0];
      if (!file) return;
      if (imageInput) imageInput.value = `Assets/updates/${file.name}`;
      if (!imagePreview) return;

      const reader = new FileReader();
      reader.onload = () => {
        imagePreview.src = String(reader.result || "");
        imagePreview.hidden = false;
      };
      reader.readAsDataURL(file);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setError("");

      const title = String(titleInput?.value || "").trim();
      const date = normalizeDate(dateInput?.value);
      const category = String(categoryInput?.value || "").trim() || "Notices";
      const body = String(bodyInput?.value || "").trim();
      const image = String(imageInput?.value || "").trim();

      if (!title) return setError("Title is required.");
      if (!date) return setError("Valid date (YYYY-MM-DD) is required.");
      if (!body) return setError("Body is required.");

      const existing = await window.Recplace.loadUpdatesData();
      const updates = Array.isArray(existing) ? [...existing] : [];

      const next = {
        id: safeId(),
        date,
        category,
        title,
        body,
        ...(image ? { image } : {}),
      };

      updates.unshift(next);
      updates.sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));

      lastJson = JSON.stringify(updates, null, 2);
      preview.textContent = lastJson;
      downloadBtn.disabled = false;

      downloadBtn.focus();
    });

    downloadBtn.addEventListener("click", () => {
      if (!window.Recplace) return;
      window.Recplace.downloadText("updates.json", lastJson, "application/json");
    });
  }

  function init() {
    if (!window.Recplace) return;

    window.Recplace.initGate({
      storageKey: STORAGE_KEY,
      password: PASSWORD,
      gateId: "admin",
    });

    initForm();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

