(function () {
  const workspace = document.getElementById("workspace");
  const commandsEl = document.getElementById("commands");
  const skipBtn = document.getElementById("skipBtn");
  const backBtn = document.getElementById("backBtn");
  const rebootBtn = document.getElementById("rebootBtn");
  const logEl = document.getElementById("log");
  const logWrap = document.getElementById("logWrap");

  const terminal = new Terminal(logEl);
  const accessed = new Set();
  const anchors = new Map();
  const buttons = new Map();

  let currentCharacterId = typeof CHARACTERS !== "undefined" && CHARACTERS[0]?.id ? CHARACTERS[0].id : "";

  function site() {
    return typeof SITE !== "undefined" && SITE
      ? SITE
      : {
          mark: "MEP",
          name: "MEPIRIT ARCHIVE",
          node: "MEPIRIT",
          scheme: "mepirit://archive",
          uplink: "UPLINK // MEPIRIT",
          classified: "CLASSIFIED // MEPIRIT",
          roster: "MEPIRIT ROSTER",
          nodeOnline: "MEPIRIT NODE ONLINE // AWAITING CREDENTIAL",
        };
  }

  function emptyProfile() {
    return {
      entity: typeof ENTITY !== "undefined" ? ENTITY : {},
      stills: [],
      categories: typeof CATEGORIES !== "undefined" ? CATEGORIES : [],
      idents: {
        duty: { src: "", alt: "", hud: "ID: — // —" },
        casual: { src: "", alt: "", hud: "ID: — // —" },
      },
    };
  }

  function activeProfile() {
    const fallbackId = typeof CHARACTERS !== "undefined" ? CHARACTERS[0]?.id : "";
    return (
      (typeof PROFILES !== "undefined" && (PROFILES[currentCharacterId] || PROFILES[fallbackId])) ||
      emptyProfile()
    );
  }

  function applyCharacter(character) {
    currentCharacterId = character?.id || currentCharacterId || (typeof CHARACTERS !== "undefined" && CHARACTERS[0]?.id) || "";
  }

  function idents() {
    return activeProfile().idents;
  }

  const portraitImage = document.getElementById("portraitImage");
  const identHud = document.getElementById("identHud");
  const identSwitch = document.getElementById("identSwitch");
  const identViewBtn = document.getElementById("identViewBtn");
  const visualDeck = document.getElementById("visualDeck");
  const vaultTabs = document.getElementById("vaultTabs");
  const stillsEl = document.getElementById("stills");
  const stillPreview = document.getElementById("stillPreview");
  const stillEmpty = document.getElementById("stillEmpty");
  const stillCaption = document.getElementById("stillCaption");
  const stillPrev = document.getElementById("stillPrev");
  const stillNext = document.getElementById("stillNext");
  const stillFrame = document.getElementById("stillFrame");
  const vaultPortrait = document.getElementById("vaultPortrait");
  const viewerHint = document.getElementById("viewerHint");
  const stillViewer = document.getElementById("stillViewer");
  const viewerStage = document.getElementById("viewerStage");
  const viewerImage = document.getElementById("viewerImage");
  const viewerCaption = document.getElementById("viewerCaption");
  const viewerClose = document.getElementById("viewerClose");
  const viewerZoomIn = document.getElementById("viewerZoomIn");
  const viewerZoomOut = document.getElementById("viewerZoomOut");
  const viewerPrev = document.getElementById("viewerPrev");
  const viewerNext = document.getElementById("viewerNext");
  const viewerSidePrev = document.getElementById("viewerSidePrev");
  const viewerSideNext = document.getElementById("viewerSideNext");
  const vaultNote = document.getElementById("vaultNote");
  const vaultScan = document.getElementById("vaultScan");
  const vaultChannel = document.getElementById("vaultChannel");
  const stillLogEl = document.getElementById("stillLog");
  const stillLogWrap = document.getElementById("stillLogWrap");
  const stillTerminal = new Terminal(stillLogEl);
  const stillButtons = new Map();
  const trackBoard = document.getElementById("trackBoard");
  const trackStage = document.getElementById("trackStage");
  const trackStatus = document.getElementById("trackStatus");
  let currentIdent = "duty";
  let visualOpen = false;
  let trackingOpen = false;
  let trackGeneration = 0;
  let trackZ = 20;
  let vaultTab = "field";
  let currentStill = null;
  let currentFrame = 0;
  let stillRevealGen = 0;
  let viewerMode = "still";
  const vaultSwipe = { active: false, x: 0, y: 0, swiped: false };
  const viewerState = {
    scale: 1,
    x: 0,
    y: 0,
    min: 1,
    max: 4,
    dragging: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
  };

  const VAULT_COPY = {
    field: {
      label: "GENERAL",
      note: "식별 사진과 분리된 일반 기록입니다. 19+ 로그는 RESTRICTED 탭에서 엽니다.",
      empty: "GENERAL ARCHIVE EMPTY",
    },
    restricted: {
      label: "RESTRICTED // 19+",
      note: "19+ 전용 슬롯입니다. 이쪽 스틸은 식별 화면과 일반 탭에 올라가지 않습니다.",
      empty: "RESTRICTED ARCHIVE EMPTY // AWAITING 19+ STILLS",
    },
  };

  function stillsForTab(tab) {
    return activeProfile().stills.filter((still) => (still.rating || "field") === tab);
  }

  function showVisualView() {
    visualOpen = true;
    hideTrackBoard();
    document.body.classList.add("is-visual");
    workspace.classList.add("is-hidden");
    visualDeck.classList.remove("is-hidden");
    backBtn.hidden = false;
    FX.triggerScan();
  }

  function hideVisualView() {
    visualOpen = false;
    document.body.classList.remove("is-visual");
    visualDeck.classList.add("is-hidden");
    closeStillViewer();
    if (!trackingOpen) {
      workspace.classList.remove("is-hidden");
      backBtn.hidden = true;
    }
  }

  const TRACK_LAYOUT = [
    { top: "4%", left: "2%", width: "30%", rotate: "-1.2deg", z: 3 },
    { top: "7%", left: "35%", width: "30%", rotate: "0.9deg", z: 4 },
    { top: "3%", left: "68%", width: "30%", rotate: "-0.6deg", z: 5 },
    { top: "51%", left: "3%", width: "30%", rotate: "0.8deg", z: 6 },
    { top: "55%", left: "36%", width: "30%", rotate: "-0.9deg", z: 7 },
    { top: "49%", left: "69%", width: "30%", rotate: "1.1deg", z: 8 },
  ];

  function hideTrackBoard() {
    trackGeneration += 1;
    trackingOpen = false;
    document.body.classList.remove("is-tracking");
    trackBoard.hidden = true;
    trackBoard.classList.add("is-hidden");
    trackStage.innerHTML = "";
    trackStage.classList.remove("has-focus");
    if (currentStill && currentStill.rating === "track") {
      currentStill = null;
      currentFrame = 0;
    }
    closeStillViewer();
    if (!visualOpen) {
      workspace.classList.remove("is-hidden");
      backBtn.hidden = true;
    }
  }

  function showTrackBoard() {
    trackingOpen = true;
    hideVisualView();
    document.body.classList.add("is-tracking");
    workspace.classList.add("is-hidden");
    trackBoard.hidden = false;
    trackBoard.classList.remove("is-hidden");
    backBtn.hidden = false;
  }

  function returnToProfileView() {
    if (visualOpen) {
      if (busy) stillTerminal.setFast(true);
      hideVisualView();
      return;
    }
    if (trackingOpen) hideTrackBoard();
  }

  function pinTrackWindow(item, index) {
    const layout = TRACK_LAYOUT[index % TRACK_LAYOUT.length];
    const win = document.createElement("button");
    win.type = "button";
    win.className = "track-win" + (item.kind === "subject" ? " is-subject" : "");
    win.style.setProperty("--tt", layout.top);
    win.style.setProperty("--tl", layout.left);
    win.style.setProperty("--tw", layout.width);
    win.style.setProperty("--tr", layout.rotate);
    win.style.setProperty("--tz", String(layout.z));
    if (item.kind === "subject") win.dataset.ident = "duty";
    else win.dataset.still = item.id;
    const cam = String(index + 1).padStart(2, "0");
    win.innerHTML = `
      <span class="track-win-head"><span>CAM ${cam}</span><span>${item.code}</span></span>
      <img src="${item.src}" alt="${item.title}" />
      <span class="track-win-foot">${item.title}</span>
    `;
    win.addEventListener("click", () => {
      trackZ += 1;
      win.style.setProperty("--tz", String(trackZ));
      const alreadyHot = win.classList.contains("is-hot");
      trackStage.querySelectorAll(".track-win").forEach((node) => node.classList.remove("is-hot"));
      win.classList.add("is-hot");
      trackStage.classList.add("has-focus");
      if (!alreadyHot) return;
      if (item.kind === "subject") {
        openIdentViewer();
        return;
      }
      const still = activeProfile().stills.find((entry) => entry.id === item.id);
      if (!still) return;
      currentStill = still;
      currentFrame = 0;
      updateStillNav();
      viewerCaption.textContent = `${still.code} // ${still.title}`;
      openStillViewer();
    });
    trackStage.appendChild(win);
    return win;
  }

  async function populateTrackBoard() {
    trackGeneration += 1;
    const gen = trackGeneration;
    trackStage.innerHTML = "";
    trackStage.classList.remove("has-focus");
    trackZ = 20;
    const pins = stillsForTab("track").map((still) => ({
      kind: "still",
      id: still.id,
      code: still.code,
      title: still.title,
      src: stillCover(still),
    }));
    if (trackStatus) trackStatus.textContent = `PINS ${String(pins.length).padStart(2, "0")}`;
    for (let i = 0; i < pins.length; i += 1) {
      if (gen !== trackGeneration) return;
      const win = pinTrackWindow(pins[i], i);
      if (FX.reduceMotion) {
        win.classList.add("is-on");
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 90));
        if (gen !== trackGeneration) return;
        win.classList.add("is-on");
      }
    }
  }

  function stillFrames(still) {
    if (!still) return [];
    if (Array.isArray(still.images) && still.images.length) return still.images;
    return still.image ? [still.image] : [];
  }

  function stillCover(still) {
    return stillFrames(still)[0] || "";
  }

  function frameLabel() {
    const frames = stillFrames(currentStill);
    if (frames.length < 2) return "";
    const n = String(currentFrame + 1).padStart(2, "0");
    const total = String(frames.length).padStart(2, "0");
    return `${n} / ${total}`;
  }

  function updateStillNav() {
    const multi = stillFrames(currentStill).length > 1;
    stillPrev.hidden = !multi;
    stillNext.hidden = !multi;
    stillFrame.hidden = !multi;
    viewerPrev.hidden = !multi;
    viewerNext.hidden = !multi;
    viewerSidePrev.hidden = !multi;
    viewerSideNext.hidden = !multi;
    if (multi) stillFrame.textContent = frameLabel();
  }

  function loadFrameImage(img, src, onReady) {
    const apply = () => {
      if (img.getAttribute("src") !== src) return;
      onReady?.();
    };
    if (img.getAttribute("src") === src && img.complete && img.naturalWidth) {
      apply();
      return;
    }
    img.addEventListener("load", apply, { once: true });
    img.src = src;
  }

  function showStillFrame(index, { reveal = true } = {}) {
    if (!currentStill) return;
    const frames = stillFrames(currentStill);
    if (!frames.length) return;
    currentFrame = ((index % frames.length) + frames.length) % frames.length;
    const src = frames[currentFrame];
    const label = frameLabel();
    stillPreview.alt = currentStill.title;
    stillPreview.hidden = false;
    stillEmpty.hidden = true;
    viewerHint.hidden = false;
    vaultPortrait.classList.add("has-still");
    stillCaption.textContent = label
      ? `${currentStill.code} // ${currentStill.title} // ${label}`
      : `${currentStill.code} // ${currentStill.title}`;
    viewerCaption.textContent = label
      ? `${currentStill.code} // ${currentStill.title} // FRAME ${label}`
      : `${currentStill.code} // ${currentStill.title} // ORIGINAL`;
    updateStillNav();
    const gen = ++stillRevealGen;
    loadFrameImage(stillPreview, src, () => {
      if (gen !== stillRevealGen) return;
      if (reveal) playStillReveal(stillPreview);
    });
    if (!stillViewer.hidden) {
      viewerImage.alt = currentStill.title;
      loadFrameImage(viewerImage, src, () => {
        if (gen !== stillRevealGen) return;
        fitViewerOriginal();
        if (reveal) playStillReveal(viewerImage);
      });
    }
  }

  function shiftStillFrame(delta) {
    if (viewerMode !== "still") return;
    if (stillFrames(currentStill).length < 2) return;
    showStillFrame(currentFrame + delta);
  }

  function closeStillViewer() {
    stillViewer.classList.add("is-hidden");
    stillViewer.hidden = true;
    viewerImage.removeAttribute("src");
    viewerImage.style.transform = "";
    viewerState.dragging = false;
    viewerStage.classList.remove("is-dragging");
  }

  function applyViewerTransform() {
    clampViewerPan();
    viewerImage.style.transform = `translate(-50%, -50%) translate(${viewerState.x}px, ${viewerState.y}px) scale(${viewerState.scale})`;
  }

  function clampViewerPan() {
    const stage = viewerStage.getBoundingClientRect();
    const width = viewerImage.naturalWidth * viewerState.scale;
    const height = viewerImage.naturalHeight * viewerState.scale;
    const maxX = Math.max(0, (width - stage.width) / 2);
    const maxY = Math.max(0, (height - stage.height) / 2);
    viewerState.x = Math.min(maxX, Math.max(-maxX, viewerState.x));
    viewerState.y = Math.min(maxY, Math.max(-maxY, viewerState.y));
  }

  function fitViewerOriginal() {
    const stage = viewerStage.getBoundingClientRect();
    const width = viewerImage.naturalWidth;
    const height = viewerImage.naturalHeight;
    if (!width || !height || !stage.width || !stage.height) return;
    const contain = Math.min(stage.width / width, stage.height / height);
    viewerState.min = contain;
    viewerState.max = Math.max(contain * 4, 3);
    viewerState.scale = contain;
    viewerState.x = 0;
    viewerState.y = 0;
    applyViewerTransform();
  }

  function zoomViewer(nextScale, clientX, clientY) {
    const stage = viewerStage.getBoundingClientRect();
    const centerX = stage.left + stage.width / 2;
    const centerY = stage.top + stage.height / 2;
    const cx = (clientX ?? centerX) - centerX;
    const cy = (clientY ?? centerY) - centerY;
    const previous = viewerState.scale;
    const scale = Math.min(viewerState.max, Math.max(viewerState.min, nextScale));
    if (previous === 0) return;
    const ratio = scale / previous;
    viewerState.x = cx - (cx - viewerState.x) * ratio;
    viewerState.y = cy - (cy - viewerState.y) * ratio;
    viewerState.scale = scale;
    applyViewerTransform();
  }

  function openStillViewer() {
    if (!currentStill) return;
    viewerMode = "still";
    const src = stillFrames(currentStill)[currentFrame] || currentStill.image;
    stillViewer.hidden = false;
    stillViewer.classList.remove("is-hidden");
    viewerImage.alt = currentStill.title;
    updateStillNav();
    const applyFit = () => {
      fitViewerOriginal();
      playStillReveal(viewerImage);
    };
    if (viewerImage.getAttribute("src") === src && viewerImage.complete && viewerImage.naturalWidth) {
      applyFit();
      return;
    }
    viewerImage.addEventListener("load", applyFit, { once: true });
    viewerImage.src = src;
  }

  function openIdentViewer() {
    if (!interfaceReady) return;
    viewerMode = "ident";
    const src = portraitImage.getAttribute("src");
    const entity = activeProfile().entity;
    viewerCaption.textContent = `VISUAL IDENT // ${entity.designation} // ${entity.codename}`;
    stillViewer.hidden = false;
    stillViewer.classList.remove("is-hidden");
    viewerImage.alt = portraitImage.alt || "VISUAL IDENT";
    stillPrev.hidden = true;
    stillNext.hidden = true;
    stillFrame.hidden = true;
    viewerPrev.hidden = true;
    viewerNext.hidden = true;
    viewerSidePrev.hidden = true;
    viewerSideNext.hidden = true;
    const applyFit = () => {
      fitViewerOriginal();
      playStillReveal(viewerImage);
    };
    if (viewerImage.getAttribute("src") === src && viewerImage.complete && viewerImage.naturalWidth) {
      applyFit();
      return;
    }
    viewerImage.addEventListener("load", applyFit, { once: true });
    viewerImage.src = src;
  }

  function resetVaultPreview() {
    currentStill = null;
    currentFrame = 0;
    stillPreview.hidden = true;
    stillPreview.removeAttribute("src");
    stillPreview.alt = "";
    stillEmpty.hidden = false;
    stillCaption.textContent = "VISUAL LOG";
    viewerHint.hidden = true;
    vaultPortrait.classList.remove("has-still");
    updateStillNav();
    closeStillViewer();
    stillsEl.querySelectorAll(".still-card").forEach((card) => {
      card.classList.remove("is-active");
    });
  }

  function setVaultTab(tab) {
    if (!VAULT_COPY[tab]) return;
    vaultTab = tab;
    const copy = VAULT_COPY[tab];
    vaultTabs.querySelectorAll(".ident-tab").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.vault === tab);
    });
    vaultScan.textContent = copy.label;
    vaultChannel.textContent = copy.label;
    vaultNote.textContent = copy.note;
    resetVaultPreview();
    renderStills();
    stillEmpty.textContent = stillsForTab(tab).length ? "SELECT A STILL" : copy.empty;
    if (interfaceReady) {
      stillButtons.forEach((card) => {
        card.disabled = busy;
      });
    }
  }

  function setIdent(mode) {
    const ident = idents()[mode];
    if (!ident) return;
    const same = currentIdent === mode;
    currentIdent = mode;
    if (ident.src) portraitImage.src = ident.src;
    else portraitImage.removeAttribute("src");
    portraitImage.alt = ident.alt;
    identHud.textContent = ident.hud;
    document.documentElement.classList.toggle("theme-civilian", mode === "casual");
    identSwitch.querySelectorAll(".ident-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.ident === mode);
    });
    FX.triggerScan();
    if (same) return;
  }

  function playStillReveal(img) {
    if (!img || FX.reduceMotion) return;
    img.classList.remove("is-revealing");
    void img.offsetWidth;
    img.classList.add("is-revealing");
  }

  function setStill(still) {
    currentStill = still;
    currentFrame = 0;
    stillButtons.forEach((card) => card.classList.remove("is-active"));
    stillButtons.get(still.id)?.classList.add("is-active");
    showStillFrame(0);
    stillButtons.get(still.id)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    FX.triggerScan();
  }

  function applyReducedTiming() {
    if (!FX.reduceMotion) return;
    TIMING.charDelay = 0;
    TIMING.lineDelay = 30;
    TIMING.bootStepDelay = 20;
    TIMING.scrambleDuration = 0;
    TIMING.specRevealDelay = 0;
  }

  function renderCommands() {
    commandsEl.innerHTML = "";
    activeProfile().categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cmd";
      button.dataset.id = category.id;
      button.disabled = true;
      button.innerHTML = `
        <span class="cmd-key">[ ${category.label} ]</span>
        <span class="cmd-state">LOCKED</span>
      `;
      button.addEventListener("click", () => onCategoryClick(category.id));
      commandsEl.appendChild(button);
      buttons.set(category.id, button);
    });
  }

  function renderStills() {
    stillsEl.innerHTML = "";
    stillButtons.clear();
    const list = stillsForTab(vaultTab);
    if (!list.length) {
      const empty = document.createElement("p");
      empty.className = "vault-empty";
      empty.textContent = VAULT_COPY[vaultTab].empty;
      stillsEl.appendChild(empty);
      return;
    }
    list.forEach((still) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "still-card";
      card.disabled = !interfaceReady || busy;
      card.innerHTML = `<img src="${stillCover(still)}" alt="${still.title}" /><span>${still.code}<br>${still.title}</span>`;
      card.addEventListener("click", () => onStillClick(still.id));
      stillsEl.appendChild(card);
      stillButtons.set(still.id, card);
    });
  }

  function setButtonState(id, state, extraClass) {
    const button = buttons.get(id);
    if (!button) return;
    button.querySelector(".cmd-state").textContent = state;
    button.classList.remove("is-running", "is-accessed", "is-active");
    if (extraClass) {
      extraClass.split(/\s+/).forEach((name) => {
        if (name) button.classList.add(name);
      });
    }
  }

  function lockCommands(locked) {
    buttons.forEach((button, id) => {
      button.disabled = locked || !interfaceReady;
      if (!interfaceReady) return;
      if (locked && button.classList.contains("is-running")) return;
      if (!locked && accessed.has(id) && !button.classList.contains("is-active")) {
        setButtonState(id, "ACCESSED", "is-accessed");
      }
    });
    stillButtons.forEach((card) => {
      card.disabled = locked || !interfaceReady;
    });
    vaultTabs.querySelectorAll(".ident-tab").forEach((tab) => {
      tab.disabled = locked || !interfaceReady;
    });
  }

  const screenLogin = document.getElementById("screenLogin");
  const screenLoading = document.getElementById("screenLoading");
  const screenSelect = document.getElementById("screenSelect");
  const screenTerminal = document.getElementById("screenTerminal");
  const loginForm = document.getElementById("loginForm");
  const loginFrame = document.getElementById("loginFrame");
  const connectLog = document.getElementById("connectLog");
  const loginKicker = document.getElementById("loginKicker");
  const loginTitle = document.getElementById("loginTitle");
  const loginSub = document.getElementById("loginSub");
  const loginFoot = document.getElementById("loginFoot");
  const passwordInput = document.getElementById("passwordInput");
  const loginMsg = document.getElementById("loginMsg");
  const rosterEl = document.getElementById("roster");
  const signOutBtn = document.getElementById("signOutBtn");
  const exitBtn = document.getElementById("exitBtn");

  let booting = false;
  let busy = false;
  let connecting = false;
  let connectSkip = false;
  let interfaceReady = false;
  let currentScreen = "login";
  let listenersBound = false;
  let bootGeneration = 0;
  let connectGeneration = 0;

  function connectLines() {
    return [
      { text: `Resolving ${site().scheme}`, delay: 160, cls: "is-sys" },
      { text: "Opening uplink // SYN", delay: 200 },
      { text: "Handshake ACK // cipher OK", delay: 240, cls: "is-ok" },
      { text: "Secure channel ONLINE", delay: 180, cls: "is-ok" },
      { text: "Mounting operator gate", delay: 200, cls: "is-sys" },
    ];
  }

  function showScreen(name) {
    currentScreen = name;
    screenLogin.classList.toggle("is-on", name === "login");
    screenLoading.classList.toggle("is-on", name === "loading");
    screenSelect.classList.toggle("is-on", name === "select");
    screenTerminal.classList.toggle("is-hidden", name !== "terminal");
    document.body.classList.toggle("is-terminal", name === "terminal");
    if (name === "login") {
      loginMsg.textContent = "";
      loginMsg.className = "login-msg";
      passwordInput.value = "";
      loginFrame.classList.remove("is-granted", "is-denied");
      loginForm.classList.remove("is-out");
      document.querySelector(".login-row")?.classList.remove("is-out");
      document.querySelector(".login-submit")?.classList.remove("is-out");
      FX.setCore("GATE");
    } else if (name === "loading") {
      FX.setCore("MOUNT");
    } else if (name === "select") {
      FX.setCore("ROSTER");
    } else if (name === "terminal") {
      FX.setCore(interfaceReady ? "LIVE" : "INIT");
    }
  }

  function waitConnect(ms) {
    return new Promise((resolve) => {
      if (connectSkip || FX.reduceMotion) {
        resolve();
        return;
      }
      const start = Date.now();
      const timer = window.setInterval(() => {
        if (connectSkip || FX.reduceMotion || Date.now() - start >= ms) {
          window.clearInterval(timer);
          resolve();
        }
      }, 16);
    });
  }

  function resetConnectChrome() {
    loginFrame.classList.add("is-connecting");
    loginFrame.classList.remove("is-linked", "is-granted", "is-denied");
    loginForm.hidden = true;
    loginForm.classList.remove("is-out");
    connectLog.innerHTML = "";
    loginKicker.textContent = site().uplink;
    loginTitle.textContent = "ESTABLISHING CHANNEL";
    loginSub.textContent = site().scheme;
    loginFoot.textContent = "SEARCHING NODE // CLICK TO SKIP";
    passwordInput.disabled = false;
    loginForm.querySelector(".login-submit")?.removeAttribute("disabled");
    FX.setCore("SYNC");
  }

  function revealLoginGate() {
    connecting = false;
    connectSkip = true;
    loginFrame.classList.remove("is-connecting");
    loginFrame.classList.add("is-linked");
    loginForm.hidden = false;
    loginKicker.textContent = site().classified;
    loginTitle.textContent = site().name;
    loginSub.textContent = "OPERATOR AUTHENTICATION REQUIRED";
    loginFoot.textContent = site().nodeOnline;
    FX.setCore("GATE");
    window.setTimeout(() => passwordInput.focus(), 40);
  }

  async function runConnectGate() {
    connectGeneration += 1;
    const gen = connectGeneration;
    connecting = true;
    connectSkip = FX.reduceMotion;
    resetConnectChrome();
    window.setTimeout(() => {
      if (gen === connectGeneration && connecting) skipConnect();
    }, 3600);

    try {
      if (!FX.reduceMotion) {
        for (const line of connectLines()) {
          if (gen !== connectGeneration) return;
          if (connectSkip) break;
          const p = document.createElement("p");
          p.className = "connect-line" + (line.cls ? ` ${line.cls}` : "");
          connectLog.appendChild(p);
          for (let i = 0; i < line.text.length; i += 1) {
            if (connectSkip || gen !== connectGeneration) break;
            p.textContent = line.text.slice(0, i + 1);
            await waitConnect(9);
          }
          p.textContent = line.text;
          await waitConnect(line.delay);
        }
      }
    } finally {
      if (gen === connectGeneration) revealLoginGate();
    }
  }

  function skipConnect() {
    if (!connecting) return;
    connectSkip = true;
  }

  function skipOutput() {
    if (currentScreen !== "terminal") return;
    if (!booting && !busy) return;
    terminal.setFast(true);
    stillTerminal.setFast(true);
    if (booting) {
      skipBtn.disabled = true;
      skipBtn.textContent = "SKIPPING...";
      document.body.classList.remove("is-booting");
    }
  }

  function renderRoster() {
    rosterEl.innerHTML = "";
    const sub = document.querySelector("#screenSelect .login-sub");
    if (sub) {
      sub.textContent = `REGISTERED: ${CHARACTERS.length} // EMPTY SLOTS AVAILABLE`;
    }
    CHARACTERS.forEach((character) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "entity-card";
      card.innerHTML = `
        <span class="entity-shot">
          <span class="entity-reticle" aria-hidden="true"></span>
          <img src="${character.portrait}" alt="${character.codename} 식별 이미지" />
        </span>
        <span class="entity-meta">
          <span class="entity-code">${character.designation} // ${character.codename}</span>
          <span class="entity-name">${character.name}</span>
          <span class="entity-sub">${character.summary} // ${character.status}</span>
        </span>
      `;
      card.addEventListener("click", () => enterCharacter(character));
      rosterEl.appendChild(card);
    });

    for (let i = 0; i < EMPTY_ROSTER_SLOTS; i += 1) {
      const empty = document.createElement("button");
      empty.type = "button";
      empty.className = "entity-card is-locked";
      empty.disabled = true;
      empty.innerHTML = `
        <span class="entity-bay" aria-hidden="true"></span>
        <span class="entity-meta">
          <span class="entity-code">SLOT 0${CHARACTERS.length + i + 1}</span>
          <span class="entity-name">UNALLOCATED</span>
          <span class="entity-sub">EMPTY CORE</span>
        </span>
      `;
      rosterEl.appendChild(empty);
    }
  }

  function resetSession() {
    bootGeneration += 1;
    booting = false;
    busy = false;
    interfaceReady = false;
    terminal.clear();
    terminal.setFast(false);
    accessed.clear();
    anchors.clear();
    buttons.clear();
    commandsEl.innerHTML = "";
    stillButtons.clear();
    stillsEl.innerHTML = "";
    stillTerminal.clear();
    resetVaultPreview();
    hideVisualView();
    hideTrackBoard();
    setVaultTab("field");
    workspace.classList.add("is-locked");
    workspace.classList.remove("is-ready");
    document.body.classList.remove("is-booting", "is-busy");
    skipBtn.hidden = false;
    skipBtn.disabled = false;
    skipBtn.textContent = "SKIP BOOT";
    backBtn.hidden = true;
    rebootBtn.hidden = true;
    exitBtn.hidden = true;
    identSwitch.querySelectorAll(".ident-tab").forEach((tab) => {
      tab.disabled = true;
      tab.classList.toggle("is-active", tab.dataset.ident === "duty");
    });
    vaultTabs.querySelectorAll(".ident-tab").forEach((tab) => {
      tab.disabled = true;
    });
    currentIdent = "";
    setIdent("duty");
    identViewBtn.hidden = true;
    document.querySelectorAll("[data-field]").forEach((node) => {
      node.textContent = "—";
      node.classList.remove("is-filled");
    });
    FX.setProgress(0);
    FX.setStatus("STANDBY");
    FX.setChannel("OFFLINE");
    document.getElementById("scanLabel").textContent = "LOCKED";
    document.getElementById("scanPct").textContent = "SCAN 000%";
  }

  function sleepMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function runRosterLoad() {
    showScreen("loading");
    const fill = document.getElementById("gateProgressFill");
    const label = document.getElementById("gateProgressLabel");
    const msg = document.getElementById("gateLoadMsg");
    const steps = [
      { pct: 16, text: "Opening secure index..." },
      { pct: 42, text: "Decrypting roster table..." },
      { pct: 73, text: "Verifying entity slots..." },
      { pct: 100, text: "Roster ready." },
    ];
    fill.style.width = "0%";
    label.textContent = "000%";
    await sleepMs(280);
    for (const step of steps) {
      msg.textContent = step.text;
      fill.style.width = `${step.pct}%`;
      label.textContent = `${String(step.pct).padStart(3, "0")}%`;
      await sleepMs(400);
    }
    await sleepMs(250);
    showScreen("select");
  }

  async function enterCharacter(character) {
    if (character) applyCharacter(character);
    resetSession();
    showScreen("terminal");
    await runBoot();
  }

  function returnToSelect() {
    resetSession();
    showScreen("select");
  }

  function returnToLogin() {
    resetSession();
    showScreen("login");
    runConnectGate();
  }

  async function fillSpecs(instant) {
    const entity = activeProfile().entity;
    const fields = [
      ["sheet-code", `${entity.designation} // ${entity.codename}`],
      ["sheet-name", entity.name],
      ["sheet-sub", `${entity.class} // ${entity.manufacturer}`],
      ["sheet-status", currentCharacterId === "viera" ? "PARTIAL" : "ONLINE"],
      ["height", entity.height],
      ["gender", entity.gender],
      ["origin", entity.origin],
      ["class", entity.class],
      ["caliber", entity.caliber],
      ["manufacturer", entity.manufacturer],
      ["platform", entity.platform],
      ["mobility", entity.mobility],
    ];

    for (const [key, value] of fields) {
      const nodes = document.querySelectorAll(`[data-field="${key}"]`);
      nodes.forEach((node) => {
        node.textContent = value;
        node.classList.add("is-filled");
      });
      if (!instant && nodes.length) await terminal.sleep(TIMING.specRevealDelay);
    }
  }

  async function activateInterface() {
    if (interfaceReady || currentScreen !== "terminal") return;
    interfaceReady = true;
    booting = false;
    document.body.classList.remove("is-booting");

    FX.glitch();
    workspace.classList.remove("is-locked");
    workspace.classList.add("is-ready");
    FX.triggerScan();
    await fillSpecs(terminal.fast);

    buttons.forEach((button, id) => {
      button.disabled = false;
      setButtonState(id, "STANDBY");
    });
    identSwitch.querySelectorAll(".ident-tab").forEach((tab) => {
      tab.disabled = false;
    });
    identViewBtn.hidden = false;
    vaultTabs.querySelectorAll(".ident-tab").forEach((tab) => {
      tab.disabled = false;
    });
    stillButtons.forEach((card) => {
      card.disabled = false;
    });
    stillTerminal.setFast(false);

    skipBtn.hidden = true;
    rebootBtn.hidden = false;
    exitBtn.hidden = false;
    FX.setStatus("READY");
    FX.setChannel("ONLINE");
    FX.setProgress(100);
    FX.setCore("LIVE");

    terminal.setFast(false);
    terminal.blank();
    await terminal.type("> personnel interface online. select a category.", "dim");
  }

  async function runBoot() {
    const gen = bootGeneration;
    applyReducedTiming();
    renderCommands();
    renderStills();
    booting = true;
    document.body.classList.add("is-booting");
    FX.setProgress(0);
    FX.setStatus("INIT");
    FX.setChannel("OFFLINE");

    for (let i = 0; i < BOOT_SEQUENCE.length; i += 1) {
      if (gen !== bootGeneration || currentScreen !== "terminal") return;
      const step = BOOT_SEQUENCE[i];
      const text = /^Query:/.test(step.text)
        ? `Query: ${activeProfile().entity?.designation || site().node || "UNKNOWN"}`
        : step.text;
      if (terminal.fast) {
        terminal.print(text, step.cls || "sys");
      } else {
        await terminal.type(text, step.cls || "sys");
      }
      if (gen !== bootGeneration || currentScreen !== "terminal") return;
      if (typeof step.progress === "number") FX.setProgress(step.progress);
      if (step.channel) FX.setChannel(step.channel);
      if (step.status) FX.setStatus(step.status);
      if (!terminal.fast) await terminal.sleep(TIMING.bootStepDelay);
    }

    if (gen !== bootGeneration || currentScreen !== "terminal") return;
    await activateInterface();
  }

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;

    skipBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      skipOutput();
    });
    rebootBtn.addEventListener("click", () => enterCharacter());
    backBtn.addEventListener("click", returnToProfileView);
    exitBtn.addEventListener("click", returnToSelect);
    identSwitch.addEventListener("click", (event) => {
      const tab = event.target.closest(".ident-tab");
      if (!tab || tab.disabled || !interfaceReady) return;
      setIdent(tab.dataset.ident);
    });
    identViewBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openIdentViewer();
    });
    trackStage.addEventListener("click", (event) => {
      if (event.target !== trackStage) return;
      trackStage.classList.remove("has-focus");
      trackStage.querySelectorAll(".track-win").forEach((node) => node.classList.remove("is-hot"));
    });
    vaultTabs.addEventListener("click", (event) => {
      const tab = event.target.closest(".ident-tab");
      if (!tab || tab.disabled || !interfaceReady || busy) return;
      if (tab.dataset.vault === vaultTab) return;
      setVaultTab(tab.dataset.vault);
    });
    logWrap.addEventListener("click", () => {
      if (booting || busy) skipOutput();
    });
    stillLogWrap.addEventListener("click", () => {
      if (busy) skipOutput();
    });
    vaultPortrait.addEventListener("click", (event) => {
      if (!interfaceReady || !currentStill) return;
      if (event.target.closest(".still-nav")) return;
      if (vaultSwipe.swiped) return;
      openStillViewer();
    });
    vaultPortrait.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".still-nav")) return;
      vaultSwipe.active = true;
      vaultSwipe.swiped = false;
      vaultSwipe.x = event.clientX;
      vaultSwipe.y = event.clientY;
    });
    vaultPortrait.addEventListener("pointerup", (event) => {
      if (!vaultSwipe.active) return;
      vaultSwipe.active = false;
      const dx = event.clientX - vaultSwipe.x;
      const dy = event.clientY - vaultSwipe.y;
      if (stillFrames(currentStill).length > 1 && Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        vaultSwipe.swiped = true;
        shiftStillFrame(dx < 0 ? 1 : -1);
      }
    });
    function bindFrameNav(button, delta) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        shiftStillFrame(delta);
      });
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
    }
    bindFrameNav(stillPrev, -1);
    bindFrameNav(stillNext, 1);
    bindFrameNav(viewerPrev, -1);
    bindFrameNav(viewerNext, 1);
    bindFrameNav(viewerSidePrev, -1);
    bindFrameNav(viewerSideNext, 1);
    viewerClose.addEventListener("click", (event) => {
      event.stopPropagation();
      closeStillViewer();
    });
    viewerZoomIn.addEventListener("click", (event) => {
      event.stopPropagation();
      zoomViewer(viewerState.scale * 1.25);
    });
    viewerZoomOut.addEventListener("click", (event) => {
      event.stopPropagation();
      zoomViewer(viewerState.scale / 1.25);
    });
    viewerStage.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        zoomViewer(viewerState.scale * (event.deltaY > 0 ? 0.9 : 1.1), event.clientX, event.clientY);
      },
      { passive: false }
    );
    viewerStage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest(".still-nav")) return;
      viewerState.dragging = true;
      viewerState.startX = event.clientX;
      viewerState.startY = event.clientY;
      viewerState.lastX = event.clientX;
      viewerState.lastY = event.clientY;
      viewerStage.setPointerCapture(event.pointerId);
      viewerStage.classList.add("is-dragging");
    });
    viewerStage.addEventListener("pointermove", (event) => {
      if (!viewerState.dragging) return;
      viewerState.x += event.clientX - viewerState.lastX;
      viewerState.y += event.clientY - viewerState.lastY;
      viewerState.lastX = event.clientX;
      viewerState.lastY = event.clientY;
      applyViewerTransform();
    });
    const endViewerDrag = (event) => {
      if (viewerState.dragging && event) {
        const dx = (event.clientX || viewerState.lastX) - viewerState.startX;
        const dy = (event.clientY || viewerState.lastY) - viewerState.startY;
        const atFit = viewerState.scale <= viewerState.min + 0.02;
        if (
          atFit &&
          stillFrames(currentStill).length > 1 &&
          Math.abs(dx) > 72 &&
          Math.abs(dx) > Math.abs(dy) * 1.2
        ) {
          shiftStillFrame(dx < 0 ? 1 : -1);
        }
      }
      viewerState.dragging = false;
      viewerStage.classList.remove("is-dragging");
    };
    viewerStage.addEventListener("pointerup", endViewerDrag);
    viewerStage.addEventListener("pointercancel", endViewerDrag);
    viewerStage.addEventListener("dblclick", () => fitViewerOriginal());
    document.addEventListener("keydown", (event) => {
      if (currentScreen === "login" && connecting) {
        skipConnect();
        return;
      }
      if (!stillViewer.hidden) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeStillViewer();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          shiftStillFrame(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          shiftStillFrame(1);
        } else if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          zoomViewer(viewerState.scale * 1.25);
        } else if (event.key === "-" || event.key === "_") {
          event.preventDefault();
          zoomViewer(viewerState.scale / 1.25);
        } else if (event.key === "0") {
          event.preventDefault();
          fitViewerOriginal();
        }
        return;
      }
      if (visualOpen && currentStill && stillFrames(currentStill).length > 1) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          shiftStillFrame(-1);
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          shiftStillFrame(1);
          return;
        }
      }
      if (currentScreen !== "terminal") return;
      if (!booting && !busy) return;
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        event.preventDefault();
        skipOutput();
      }
    });
    screenLogin.addEventListener("click", () => {
      skipConnect();
    });
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const typed = passwordInput.value.trim();
      const expected = AUTH.password;
      const ok = typed.toLowerCase() === expected.toLowerCase();
      const frame = loginFrame;
      if (!ok) {
        loginMsg.textContent = "ACCESS DENIED.";
        loginMsg.className = "login-msg is-bad";
        frame.classList.remove("is-denied");
        void frame.offsetWidth;
        frame.classList.add("is-denied");
        passwordInput.value = "";
        passwordInput.focus();
        FX.glitch();
        return;
      }
      loginMsg.textContent = "ACCESS GRANTED.";
      loginMsg.className = "login-msg is-ok";
      frame.classList.remove("is-denied");
      frame.classList.add("is-granted");
      document.querySelector(".login-row")?.classList.add("is-out");
      document.querySelector(".login-submit")?.classList.add("is-out");
      passwordInput.disabled = true;
      if (event.submitter) event.submitter.disabled = true;
      window.setTimeout(() => {
        passwordInput.disabled = false;
        if (event.submitter) event.submitter.disabled = false;
        runRosterLoad();
      }, 620);
    });
    signOutBtn.addEventListener("click", returnToLogin);
    document.querySelectorAll(".type-size").forEach((group) => {
      group.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-size]");
        if (!button) return;
        applyTypeSize(button.dataset.size);
      });
    });
  }

  function applyTypeSize(size) {
    const large = size === "large";
    document.documentElement.classList.toggle("font-large", large);
    window.localStorage.setItem("mepirit-type-size", large ? "large" : "normal");
    document.querySelectorAll(".type-size button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.size === (large ? "large" : "normal"));
    });
  }

  async function runQuery(category) {
    terminal.setFast(false);
    if (category.id === "traits") setIdent("casual");
    if (category.id === "stills") {
      await openVisualArchive();
      return;
    }
    if (category.id === "tracking") {
      await openTrackBoard();
      return;
    }

    FX.setStatus("DECRYPTING");
    FX.triggerScan();
    setButtonState(category.id, "RUNNING", "is-running");
    lockCommands(true);

    await terminal.blank();
    await terminal.type(`> ${category.command}`, "cmd");

    for (const line of category.processLines) {
      await terminal.type(line, "sys");
    }

    await terminal.type("Decrypting payload...", "sys");

    const anchorId = `record-${category.id}-${Date.now()}`;
    anchors.set(category.id, anchorId);

    for (let i = 0; i < category.content.length; i += 1) {
      const line = category.content[i];
      const options = i === 0 ? { anchor: anchorId } : {};
      if (!line) {
        terminal.blank();
      } else if (i === 0) {
        await terminal.type(line, "hdr", options);
      } else if (line.endsWith(":") && line.length <= 8) {
        await terminal.type(line, "section");
      } else {
        await terminal.scrambleTo(line, "data");
      }
    }

    accessed.add(category.id);
    buttons.forEach((_, id) => {
      if (id === category.id) setButtonState(id, "ACCESSED", "is-accessed is-active");
      else if (accessed.has(id)) setButtonState(id, "ACCESSED", "is-accessed");
    });

    FX.setStatus("READY");
    lockCommands(false);
    terminal.setFast(false);
  }

  async function openTrackBoard() {
    showTrackBoard();
    setButtonState("tracking", "RUNNING", "is-running");
    lockCommands(true);
    accessed.add("tracking");
    buttons.forEach((_, id) => {
      if (id === "tracking") setButtonState(id, "ACCESSED", "is-accessed is-active");
      else if (accessed.has(id)) setButtonState(id, "ACCESSED", "is-accessed");
    });

    terminal.print("> query --category surveillance", "cmd");
    terminal.print("Track board opened. BACK returns to personnel interface.", "dim");
    FX.setStatus("LIVE");
    lockCommands(false);
    await populateTrackBoard();
  }

  async function openVisualArchive() {
    showVisualView();
    setButtonState("stills", "RUNNING", "is-running");
    lockCommands(true);
    accessed.add("stills");
    buttons.forEach((_, id) => {
      if (id === "stills") setButtonState(id, "ACCESSED", "is-accessed is-active");
      else if (accessed.has(id)) setButtonState(id, "ACCESSED", "is-accessed");
    });

    terminal.print("> query --category stills", "cmd");
    terminal.print("Visual archive opened. BACK returns to personnel interface.", "dim");

    FX.setStatus("DECRYPTING");
    stillTerminal.setFast(false);
    stillTerminal.print("> visual archive online.", "cmd");
    stillTerminal.print("Select GENERAL or RESTRICTED. BACK returns to profile.", "dim");
    FX.setStatus("READY");
    lockCommands(false);
  }

  async function onCategoryClick(id) {
    if (!interfaceReady || busy) return;
    const category = activeProfile().categories.find((item) => item.id === id);
    if (!category) return;

    busy = true;
    document.body.classList.add("is-busy");
    try {
      await runQuery(category);
    } finally {
      busy = false;
      document.body.classList.remove("is-busy");
      lockCommands(false);
      terminal.setFast(false);
      stillTerminal.setFast(false);
    }
  }

  async function onStillClick(id) {
    if (!interfaceReady || busy) return;
    const still = activeProfile().stills.find((item) => item.id === id);
    if (!still) return;

    busy = true;
    document.body.classList.add("is-busy");
    lockCommands(true);
    setStill(still);
    FX.setStatus("DECRYPTING");
    stillTerminal.setFast(false);

    try {
      await stillTerminal.blank();
      await stillTerminal.type(`> ${still.command}`, "cmd");
      for (const line of still.processLines) {
        await stillTerminal.type(line, "sys");
      }
      await stillTerminal.type("Decrypting payload...", "sys");
      for (let i = 0; i < still.content.length; i += 1) {
        const line = still.content[i];
        if (!line) stillTerminal.blank();
        else if (i === 0) await stillTerminal.type(line, "hdr");
        else if (line.endsWith(":") && line.length <= 8) await stillTerminal.type(line, "section");
        else await stillTerminal.scrambleTo(line, "data");
      }
    } finally {
      busy = false;
      document.body.classList.remove("is-busy");
      FX.setStatus("READY");
      lockCommands(false);
      stillTerminal.setFast(false);
    }
  }

  applyReducedTiming();
  FX.init();
  bindListeners();
  applyTypeSize(window.localStorage.getItem("mepirit-type-size") || "normal");
  renderRoster();
  showScreen("login");
  runConnectGate();
})();
