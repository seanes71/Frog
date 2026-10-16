(function () {
  "use strict";
  const params = new URLSearchParams(location.search);
  if (params.get("from") !== "faceoff") return;

  function verifiedLobby(raw) {
    try {
      if (!raw) return null;
      const url = new URL(raw);
      const allowed = new Set([
        "froggy-faceoff-mobile.web.app",
        "froggy-faceoff-mobile.firebaseapp.com",
        "seanes71.github.io"
      ]);
      if (url.protocol !== "https:" || !allowed.has(url.hostname)) return null;
      if (url.hostname === "seanes71.github.io" && !url.pathname.startsWith("/Frog")) return null;
      return url.origin + url.pathname;
    } catch (_) { return null; }
  }
  function addReturnButton() {
    if (document.getElementById("v122-back-to-faceoff")) return;
    const back = document.createElement("button");
    back.type = "button";
    back.id = "v122-back-to-faceoff";
    back.textContent = "‹ Faceoff";
    back.setAttribute("aria-label", "Return to Froggy Faceoff Mobile");
    Object.assign(back.style, {
      position: "fixed", top: "calc(env(safe-area-inset-top, 0px) + 8px)",
      left: "calc(env(safe-area-inset-left, 0px) + 8px)",
      zIndex: "9999", padding: "8px 11px", borderRadius: "12px",
      border: "1px solid #dfb95b", background: "rgba(6,20,38,0.88)",
      color: "#ffe8aa", font: "600 13px system-ui, sans-serif",
      cursor: "pointer", touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent"
    });
    back.addEventListener("click", () => {
      if (!confirm("Return to Froggy Faceoff? If a match is underway, first use Quit inside the game so your forfeit is recorded.")) return;
      const target = verifiedLobby(params.get("returnTo"));
      if (target) location.assign(target);
      else alert("Open Froggy Faceoff Mobile using your original home-screen link.");
    });
    document.body.appendChild(back);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addReturnButton, {once:true});
  else addReturnButton();
})();