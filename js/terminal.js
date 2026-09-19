const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%<>/\\|";

class Terminal {
  constructor(root) {
    this.root = root;
    this.fast = false;
    this.waiters = [];
    this.cursor = document.createElement("div");
    this.cursor.className = "line cursor-line";
    this.cursor.innerHTML = '<span class="prompt-mark">&gt;</span> <span class="cursor">█</span>';
    this.root.appendChild(this.cursor);
  }

  setFast(value) {
    this.fast = value;
    if (!value) return;
    const pending = this.waiters.splice(0, this.waiters.length);
    pending.forEach((wake) => wake());
  }

  sleep(ms) {
    if (this.fast) return Promise.resolve();
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.waiters = this.waiters.filter((wake) => wake !== finish);
        resolve();
      };
      const timer = setTimeout(finish, ms);
      this.waiters.push(finish);
    });
  }

  scroll() {
    this.root.scrollTop = this.root.scrollHeight;
  }

  line(cls = "") {
    const el = document.createElement("div");
    el.className = `line ${cls}`.trim();
    if (!this.cursor || this.cursor.parentNode !== this.root) {
      this.cursor = document.createElement("div");
      this.cursor.className = "line cursor-line";
      this.cursor.innerHTML = '<span class="prompt-mark">&gt;</span> <span class="cursor">█</span>';
      this.root.appendChild(this.cursor);
    }
    this.root.insertBefore(el, this.cursor);
    this.scroll();
    return el;
  }

  print(text, cls = "", options = {}) {
    const el = this.line(cls);
    if (options.anchor) el.id = options.anchor;
    el.textContent = text;
    this.scroll();
    return el;
  }

  async type(text, cls = "", options = {}) {
    if (this.fast || !text) {
      return this.print(text, cls, options);
    }

    const el = this.line(cls);
    if (options.anchor) el.id = options.anchor;

    for (let i = 0; i < text.length; i += 1) {
      if (this.fast) {
        el.textContent = text;
        this.scroll();
        return el;
      }
      el.textContent = text.slice(0, i + 1);
      this.scroll();
      await this.sleep(TIMING.charDelay);
    }

    await this.sleep(TIMING.lineDelay);
    return el;
  }

  async scrambleTo(text, cls = "") {
    if (this.fast) {
      return this.print(text, `${cls} data-body`.trim());
    }

    const el = this.line(`${cls} data-body`.trim());
    const frames = Math.max(8, Math.floor(TIMING.scrambleDuration / 32));
    for (let frame = 0; frame < frames; frame += 1) {
      if (this.fast) break;
      const revealed = Math.floor((frame / frames) * text.length);
      let out = text.slice(0, revealed);
      for (let i = revealed; i < text.length; i += 1) {
        const ch = text[i];
        out += ch === " " ? " " : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      el.textContent = out;
      this.scroll();
      await this.sleep(28);
    }

    el.textContent = text;
    this.scroll();
    await this.sleep(TIMING.lineDelay);
    return el;
  }

  blank() {
    this.line("blank");
  }

  clear() {
    this.fast = false;
    this.waiters.splice(0, this.waiters.length);
    this.root.innerHTML = "";
    this.cursor = document.createElement("div");
    this.cursor.className = "line cursor-line";
    this.cursor.innerHTML = '<span class="prompt-mark">&gt;</span> <span class="cursor">█</span>';
    this.root.appendChild(this.cursor);
  }
}
