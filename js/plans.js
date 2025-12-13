(() => {
  const PASSWORD = "RecPlacePro2740";
  const STORAGE_KEY = "recplace:plansUnlocked";

  function initModal() {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("image-modal-img");
    const closeBtn = document.getElementById("image-modal-close");
    if (!modal || !modalImg || !closeBtn) return;

    function close() {
      modal.setAttribute("aria-hidden", "true");
      modalImg.src = "";
    }

    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open-image]");
      if (!btn) return;
      const src = btn.getAttribute("data-open-image");
      if (!src) return;
      modalImg.src = src;
      modal.setAttribute("aria-hidden", "false");
    });
  }

  function init() {
    if (!window.Recplace) return;

    window.Recplace.initGate({
      storageKey: STORAGE_KEY,
      password: PASSWORD,
      gateId: "plans",
    });

    initModal();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

