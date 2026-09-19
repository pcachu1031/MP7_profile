const FX = {
  reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,

  els: {},

  init() {
    this.els = {
      clock: document.getElementById("clock"),
      led: document.getElementById("led"),
      channel: document.getElementById("channelState"),
      opStatus: document.getElementById("opStatus"),
      progressFill: document.getElementById("progressFill"),
      progressLabel: document.getElementById("progressLabel"),
      hash: document.getElementById("hashReadout"),
      glitch: document.getElementById("glitch"),
      identity: document.getElementById("identity"),
      portrait: document.getElementById("portrait"),
      vaultPortrait: document.getElementById("vaultPortrait"),
      scanLabel: document.getElementById("scanLabel"),
      scanPct: document.getElementById("scanPct"),
    };

    this.setChannel("OFFLINE");
    this.setStatus("STANDBY");
    this.setProgress(0);
    this.tickClock();
    setInterval(() => this.tickClock(), 1000);
    this.hashTimer = setInterval(() => this.tickHash(), 90);
  },

  tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    this.els.clock.textContent = `${hh}:${mm}:${ss}`;
  },

  tickHash() {
    if (!this.els.hash) return;
    const hex = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .toUpperCase()
      .padStart(6, "0");
    this.els.hash.textContent = `HASH ${hex}`;
  },

  setChannel(state) {
    this.els.channel.textContent = state;
    this.els.led.dataset.state = state;
    this.els.led.classList.toggle("is-live", state === "ONLINE");
    this.els.led.classList.toggle("is-warn", state === "HANDSHAKE");
  },

  setStatus(text) {
    this.els.opStatus.textContent = text;
    this.els.opStatus.classList.toggle("is-busy", text === "DECRYPTING" || text === "RUNNING");
  },

  setProgress(pct) {
    const value = Math.max(0, Math.min(100, Math.round(pct)));
    this.els.progressFill.style.width = `${value}%`;
    this.els.progressLabel.textContent = `${String(value).padStart(3, "0")}%`;
  },

  glitch() {
    if (this.reduceMotion) return;
    this.els.glitch.classList.remove("is-on");
    void this.els.glitch.offsetWidth;
    this.els.glitch.classList.add("is-on");
    window.setTimeout(() => this.els.glitch.classList.remove("is-on"), 480);
  },

  triggerScan() {
    [this.els.portrait, this.els.vaultPortrait].forEach((el) => {
      if (!el) return;
      el.classList.remove("is-scanning");
      void el.offsetWidth;
      el.classList.add("is-scanning");
    });
    this.els.scanLabel.textContent = "SCANNING";
    this.animateScanPct();
  },

  animateScanPct() {
    const label = this.els.scanPct;
    if (this.reduceMotion) {
      label.textContent = "SCAN 100%";
      this.els.scanLabel.textContent = "IDENT LOCKED";
      return;
    }

    let pct = 0;
    const timer = setInterval(() => {
      pct += 7;
      if (pct >= 100) {
        pct = 100;
        clearInterval(timer);
        this.els.scanLabel.textContent = "IDENT LOCKED";
      }
      label.textContent = `SCAN ${String(pct).padStart(3, "0")}%`;
    }, 40);
  },
};
