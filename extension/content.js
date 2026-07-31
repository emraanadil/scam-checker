(function () {
  // background.js re-injects this file on every right-click, and Chrome's
  // isolated world persists for the tab's lifetime. Re-running is harmless
  // (everything below is assignment, not declaration) but pointless, so bail
  // out early once we've already set ourselves up.
  if (window.__sscInitialized) return;
  window.__sscInitialized = true;

  const HOST_ID = "__senior-scam-checker-host__";
  const AUTO_DISMISS_MS = 18000;
  let dismissTimer = null;

  function ensureHost() {
    let host = document.getElementById(HOST_ID);
    if (host && host.shadowRoot) return host.shadowRoot;

    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";
    host.style.bottom = "0";
    host.style.right = "0";
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>${CARD_CSS}</style>
      <div class="ssc-card" part="card">
        <button class="ssc-close" aria-label="Dismiss">&times;</button>
        <div class="ssc-header">
          <span class="ssc-icon"></span>
          <span class="ssc-label"></span>
        </div>
        <div class="ssc-body"></div>
        <div class="ssc-action"></div>
        <button class="ssc-cta" hidden></button>
        <div class="ssc-footer">Senior Scam Checker</div>
        <div class="ssc-progress"><div class="ssc-progress-bar"></div></div>
      </div>
    `;
    shadow.querySelector(".ssc-close").addEventListener("click", dismiss);
    return shadow;
  }

  function dismiss() {
    const host = document.getElementById(HOST_ID);
    if (!host) return;
    const card = host.shadowRoot.querySelector(".ssc-card");
    card.classList.add("ssc-leave");
    clearTimeout(dismissTimer);
    setTimeout(() => host.remove(), 220);
  }

  function setState(shadow, { state, icon, label, body, action, cta }) {
    const card = shadow.querySelector(".ssc-card");
    card.dataset.state = state;
    card.classList.remove("ssc-leave");
    card.classList.add("ssc-enter");

    shadow.querySelector(".ssc-icon").textContent = icon || "";
    shadow.querySelector(".ssc-label").textContent = label || "";
    shadow.querySelector(".ssc-body").textContent = body || "";
    shadow.querySelector(".ssc-action").textContent = action || "";

    const ctaBtn = shadow.querySelector(".ssc-cta");
    if (cta) {
      ctaBtn.hidden = false;
      ctaBtn.textContent = cta.text;
      ctaBtn.onclick = cta.onClick;
    } else {
      ctaBtn.hidden = true;
      ctaBtn.onclick = null;
    }

    const bar = shadow.querySelector(".ssc-progress-bar");
    bar.style.animation = "none";
    // eslint-disable-next-line no-unused-expressions
    bar.offsetHeight; // force reflow to restart the animation
    clearTimeout(dismissTimer);

    if (state === "loading") {
      shadow.querySelector(".ssc-progress").style.visibility = "hidden";
    } else {
      shadow.querySelector(".ssc-progress").style.visibility = "visible";
      bar.style.animation = `ssc-shrink ${AUTO_DISMISS_MS}ms linear forwards`;
      dismissTimer = setTimeout(dismiss, AUTO_DISMISS_MS);
    }
  }

  window.__sscShowLoading = function () {
    const shadow = ensureHost();
    setState(shadow, {
      state: "loading",
      icon: "🔎",
      label: "Checking…",
      body: "Senior Scam Checker is analyzing the selected text.",
    });
  };

  window.__sscShowResult = function (verdict) {
    const shadow = ensureHost();
    const tokens = VERDICT_TOKENS[verdict.verdict] || VERDICT_TOKENS.uncertain;
    setState(shadow, {
      state: verdict.verdict,
      icon: tokens.emoji,
      label: tokens.label,
      body: verdict.reason,
      action: verdict.action ? `What to do: ${verdict.action}` : "",
    });
  };

  window.__sscShowError = function (message) {
    const shadow = ensureHost();
    setState(shadow, {
      state: "error",
      icon: "⚠️",
      label: "Couldn't complete the check",
      body: message,
    });
  };

  window.__sscShowUpgrade = function () {
    const shadow = ensureHost();
    setState(shadow, {
      state: "upgrade",
      icon: "⭐",
      label: "Free checks used up this month",
      body: "Open the Senior Scam Checker toolbar icon to upgrade for unlimited checks.",
      cta: {
        text: "Open extension",
        onClick: () => {
          chrome.runtime.sendMessage({ type: "open-popup" });
          dismiss();
        },
      },
    });
  };

  const CARD_CSS = `
    :host { all: initial; }
    .ssc-card {
      all: initial;
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 340px;
      max-width: calc(100vw - 40px);
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FFFFFF;
      color: #161616;
      border-radius: 16px;
      border-left: 5px solid #0B5FFF;
      box-shadow: 0 8px 30px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
      padding: 16px 18px 14px;
      display: block;
      transform: translateY(16px) scale(0.98);
      opacity: 0;
      transition: transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease;
    }
    @media (prefers-color-scheme: dark) {
      .ssc-card { background: #1A1C20; color: #F2F3F5; }
    }
    .ssc-card.ssc-enter { transform: translateY(0) scale(1); opacity: 1; }
    .ssc-card.ssc-leave { transform: translateY(10px) scale(0.98); opacity: 0; }
    .ssc-card[data-state="scam"], .ssc-card[data-state="error"] { border-left-color: #D0342C; }
    .ssc-card[data-state="legitimate"] { border-left-color: #1E8E3E; }
    .ssc-card[data-state="uncertain"], .ssc-card[data-state="upgrade"] { border-left-color: #B8860B; }
    .ssc-card[data-state="loading"] { border-left-color: #0B5FFF; }
    .ssc-close {
      all: initial;
      position: absolute;
      top: 10px;
      right: 12px;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      color: #8A8F98;
      font-family: sans-serif;
    }
    .ssc-close:hover { color: #161616; }
    @media (prefers-color-scheme: dark) {
      .ssc-close:hover { color: #F2F3F5; }
    }
    .ssc-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      padding-right: 20px;
    }
    .ssc-icon { font-size: 18px; }
    .ssc-label { font-size: 15px; font-weight: 700; }
    .ssc-body {
      font-size: 13px;
      line-height: 1.5;
      color: #5B5F66;
      margin-bottom: 6px;
      white-space: pre-wrap;
    }
    @media (prefers-color-scheme: dark) {
      .ssc-body { color: #A7ACB3; }
    }
    .ssc-action {
      font-size: 13px;
      line-height: 1.5;
      font-weight: 600;
    }
    /* all:initial plus an explicit display resets the UA's
       [hidden] { display: none }, so the empty button rendered as a stray
       blue bar on every card. Restore hiding explicitly. */
    .ssc-cta[hidden] { display: none; }
    .ssc-cta {
      all: initial;
      display: block;
      box-sizing: border-box;
      width: 100%;
      margin-top: 10px;
      padding: 9px;
      border-radius: 8px;
      background: #0B5FFF;
      color: white;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      cursor: pointer;
      font-family: inherit;
    }
    .ssc-footer {
      margin-top: 10px;
      font-size: 10px;
      letter-spacing: 0.02em;
      color: #B0B4BB;
      text-transform: uppercase;
      font-weight: 600;
    }
    .ssc-progress {
      margin-top: 10px;
      height: 3px;
      border-radius: 2px;
      background: rgba(0,0,0,0.08);
      overflow: hidden;
    }
    @media (prefers-color-scheme: dark) {
      .ssc-progress { background: rgba(255,255,255,0.12); }
    }
    .ssc-progress-bar {
      height: 100%;
      width: 100%;
      background: currentColor;
      color: #0B5FFF;
      transform-origin: left;
    }
    @keyframes ssc-shrink {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `;
})();
