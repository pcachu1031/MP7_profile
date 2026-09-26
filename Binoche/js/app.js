(function () {
  const nameEl = document.getElementById("profileName");
  const nameKoEl = document.getElementById("profileNameKo");
  const handleEl = document.getElementById("profileHandle");
  const bioEl = document.getElementById("profileBio");
  const postsEl = document.getElementById("statPosts");
  const followersEl = document.getElementById("statFollowers");
  const followingEl = document.getElementById("statFollowing");
  const grid = document.getElementById("grid");
  const panelPosts = document.getElementById("panelPosts");
  const panelAbout = document.getElementById("panelAbout");
  const aboutEl = document.getElementById("about");
  const viewer = document.getElementById("viewer");
  const viewerImage = document.getElementById("viewerImage");
  const viewerCaption = document.getElementById("viewerCaption");
  const viewerClose = document.getElementById("viewerClose");
  const topPin = document.getElementById("topPin");
  const topAvatar = document.getElementById("topAvatar");
  const topHandle = document.getElementById("topHandle");
  const profile = document.getElementById("profile");

  function fillProfile() {
    nameEl.textContent = PROFILE.name;
    nameKoEl.textContent = PROFILE.nameKo;
    handleEl.textContent = PROFILE.handle;
    bioEl.textContent = PROFILE.bio;
    postsEl.textContent = String(PROFILE.posts);
    followersEl.textContent = PROFILE.followers;
    followingEl.textContent = PROFILE.following;
    topAvatar.src = document.getElementById("avatar").src;
    topHandle.textContent = PROFILE.handle;
    aboutEl.innerHTML = "";
    (PROFILE.about || []).forEach((entry) => {
      if (typeof entry === "string") {
        const p = document.createElement("p");
        p.textContent = entry;
        aboutEl.appendChild(p);
        return;
      }

      if (entry.type === "title") {
        const title = document.createElement("p");
        title.className = "about-title";
        title.textContent = entry.text;
        aboutEl.appendChild(title);
        return;
      }

      const block = document.createElement("section");
      block.className = "about-block";

      if (entry.label) {
        const label = document.createElement("p");
        label.className = "about-label";
        label.textContent = entry.label;
        block.appendChild(label);
      }

      const lines = entry.lines || (entry.text ? [entry.text] : []);
      lines.forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        block.appendChild(p);
      });

      aboutEl.appendChild(block);
    });
  }

  function renderGrid() {
    grid.innerHTML = "";
    POSTS.forEach((post) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<img src="${post.src}" alt="" />`;
      button.addEventListener("click", () => openViewer(post));
      grid.appendChild(button);
    });
  }

  function openViewer(post) {
    viewerImage.src = post.src;
    const caption = (post.caption || "").trim();
    viewerCaption.textContent = caption;
    viewerCaption.hidden = !caption;
    viewer.hidden = false;
  }

  function closeViewer() {
    viewer.hidden = true;
    viewerImage.removeAttribute("src");
    viewerCaption.textContent = "";
    viewerCaption.hidden = true;
  }

  function setTab(tab) {
    document.querySelectorAll(".tab").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.tab === tab);
    });
    panelPosts.classList.toggle("is-on", tab === "posts");
    panelAbout.classList.toggle("is-on", tab === "about");
    panelAbout.hidden = tab !== "about";
  }

  function syncTopPin() {
    if (!profile) return;
    const passed = profile.getBoundingClientRect().bottom < 64;
    topPin.hidden = !passed;
  }

  document.querySelector(".tabs").addEventListener("click", (event) => {
    const tab = event.target.closest(".tab");
    if (!tab) return;
    setTab(tab.dataset.tab);
  });

  viewerClose.addEventListener("click", closeViewer);
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) closeViewer();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeViewer();
  });
  window.addEventListener("scroll", syncTopPin, { passive: true });

  fillProfile();
  renderGrid();
  syncTopPin();
})();
