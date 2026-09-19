(function () {
  const workspace = document.getElementById("workspace");
  const commandsEl = document.getElementById("commands");
  const skipBtn = document.getElementById("skipBtn");
  const rebootBtn = document.getElementById("rebootBtn");
  const logEl = document.getElementById("log");
  const logWrap = document.getElementById("logWrap");

  const terminal = new Terminal(logEl);
  const accessed = new Set();
  const anchors = new Map();
  const buttons = new Map();

  const IDENTS = {
    duty: {
      src: "./assets/mp7-character.jpg",
      alt: "MP7 제복 식별 이미지",
      hud: "ID: MP7 // FORMAL",
    },
    casual: {
      src: "./assets/mp7-casual.jpg",
      alt: "MP7 평소 모습",
      hud: "ID: MP7 // OFF-DUTY",
    },
  };

  const portraitImage = document.getElementById("portraitImage");
  const identHud = document.getElementById("identHud");
  const identSwitch = document.getElementById("identSwitch");
  let currentIdent = "duty";

  function setIdent(mode) {
    const ident = IDENTS[mode];
    if (!ident || currentIdent === mode) {
      if (ident && currentIdent === mode) FX.triggerScan();
      return;
    }
    currentIdent = mode;
    portraitImage.src = ident.src;
    portraitImage.alt = ident.alt;
    identHud.textContent = ident.hud;
    identSwitch.querySelectorAll(".ident-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.ident === mode);
    });
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
    CATEGORIES.forEach((category) => {
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

  function setButtonState(id, state, extraClass) {
    const button = buttons.get(id);
    if (!button) return;
    button.querySelector(".cmd-state").textContent = state;
    button.classList.remove("is-running", "is-accessed", "is-active");
    if (extraClass) button.classList.add(extraClass);
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
  }

  let booting = true;
  let busy = false;
  let interfaceReady = false;

  function skipOutput() {
    terminal.setFast(true);
    if (booting) {
      skipBtn.disabled = true;
      skipBtn.textContent = "SKIPPING...";
      document.body.classList.remove("is-booting");
    }
  }

  async function fillSpecs(instant) {
    const fields = [
      ["designation", ENTITY.designation],
      ["codename", ENTITY.codename],
      ["gender", ENTITY.gender],
      ["height", ENTITY.height],
      ["manufacturer", ENTITY.manufacturer],
      ["origin", ENTITY.origin],
      ["class", ENTITY.class],
      ["caliber", ENTITY.caliber],
      ["platform", ENTITY.platform],
      ["mobility", ENTITY.mobility],
    ];

    for (const [key, value] of fields) {
      const node = document.querySelector(`[data-field="${key}"]`);
      if (!node) continue;
      node.textContent = value;
      node.classList.add("is-filled");
      if (!instant) await terminal.sleep(TIMING.specRevealDelay);
    }
  }

  async function activateInterface() {
    if (interfaceReady) return;
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

    skipBtn.hidden = true;
    rebootBtn.hidden = false;
    FX.setStatus("READY");
    FX.setChannel("ONLINE");
    FX.setProgress(100);

    terminal.setFast(false);
    terminal.blank();
    await terminal.type("> personnel interface online. select a category.", "dim");
  }

  async function runBoot() {
    applyReducedTiming();
    FX.init();
    renderCommands();
    document.body.classList.add("is-booting");

    skipBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      skipOutput();
    });
    rebootBtn.addEventListener("click", () => window.location.reload());
    identSwitch.addEventListener("click", (event) => {
      const tab = event.target.closest(".ident-tab");
      if (!tab || tab.disabled || !interfaceReady) return;
      setIdent(tab.dataset.ident);
    });
    logWrap.addEventListener("click", () => {
      if (booting || busy) skipOutput();
    });
    document.addEventListener("keydown", (event) => {
      if (!booting && !busy) return;
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        event.preventDefault();
        skipOutput();
      }
    });

    for (let i = 0; i < BOOT_SEQUENCE.length; i += 1) {
      const step = BOOT_SEQUENCE[i];
      if (terminal.fast) {
        terminal.print(step.text, step.cls || "sys");
      } else {
        await terminal.type(step.text, step.cls || "sys");
      }
      if (typeof step.progress === "number") FX.setProgress(step.progress);
      if (step.channel) FX.setChannel(step.channel);
      if (step.status) FX.setStatus(step.status);
      if (!terminal.fast) await terminal.sleep(TIMING.bootStepDelay);
    }

    await activateInterface();
  }

  async function runQuery(category) {
    terminal.setFast(false);
    if (category.id === "traits") setIdent("casual");

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

  async function onCategoryClick(id) {
    if (!interfaceReady || busy) return;
    const category = CATEGORIES.find((item) => item.id === id);
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
    }
  }

  runBoot();
})();
