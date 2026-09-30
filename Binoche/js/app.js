(function () {
  const nameEl = document.getElementById("profileName");
  const nameKoEl = document.getElementById("profileNameKo");
  const handleEl = document.getElementById("profileHandle");
  const bioEl = document.getElementById("profileBio");
  const avatarEl = document.getElementById("avatar");
  const postsEl = document.getElementById("statPosts");
  const followersEl = document.getElementById("statFollowers");
  const followingEl = document.getElementById("statFollowing");
  const followersBtn = document.getElementById("followersBtn");
  const followingBtn = document.getElementById("followingBtn");
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
  const followSheet = document.getElementById("followSheet");
  const followTitle = document.getElementById("followTitle");
  const followList = document.getElementById("followList");
  const followClose = document.getElementById("followClose");

  function resolveProfileId() {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("u") || params.get("user") || "").toLowerCase();
    if (raw && PROFILES[raw]) return raw;
    return DEFAULT_PROFILE_ID;
  }

  let currentId = resolveProfileId();
  let current = PROFILES[currentId];

  function profileHref(id) {
    const url = new URL(window.location.href);
    url.searchParams.set("u", id);
    return url.pathname + "?" + url.searchParams.toString();
  }

  function fillAbout(entries) {
    aboutEl.innerHTML = "";
    (entries || []).forEach((entry) => {
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

  function fillProfile() {
    document.title = current.name;
    nameEl.textContent = current.name;
    nameKoEl.textContent = current.nameKo;
    handleEl.textContent = current.handle;
    bioEl.textContent = current.bio;
    avatarEl.src = current.avatar;
    avatarEl.alt = current.name;
    postsEl.textContent = String(current.posts.length);
    followersEl.textContent = String(current.followers.length);
    followingEl.textContent = String(current.following.length);
    topAvatar.src = current.avatar;
    topAvatar.alt = current.name;
    topHandle.textContent = current.handle;
    fillAbout(current.about);
  }

  function renderGrid() {
    grid.innerHTML = "";
    if (!current.posts.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "게시물이 없습니다.";
      grid.appendChild(empty);
      return;
    }
    current.posts.forEach((post) => {
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

  function openFollowSheet(kind) {
    const ids = kind === "followers" ? current.followers : current.following;
    followTitle.textContent = kind === "followers" ? "팔로워" : "팔로잉";
    followList.innerHTML = "";

    if (!ids.length) {
      const empty = document.createElement("p");
      empty.className = "follow-empty";
      empty.textContent = "아직 없습니다.";
      followList.appendChild(empty);
    } else {
      ids.forEach((id) => {
        const person = PROFILES[id];
        if (!person) return;
        const link = document.createElement("a");
        link.className = "follow-row";
        link.href = profileHref(id);
        link.innerHTML = `
          <img src="${person.avatar}" alt="" />
          <span>
            <strong>${person.name}</strong>
            <em>${person.handle}</em>
          </span>
        `;
        followList.appendChild(link);
      });
    }

    followSheet.hidden = false;
  }

  function closeFollowSheet() {
    followSheet.hidden = true;
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

  followersBtn.addEventListener("click", () => openFollowSheet("followers"));
  followingBtn.addEventListener("click", () => openFollowSheet("following"));
  followClose.addEventListener("click", closeFollowSheet);
  followSheet.addEventListener("click", (event) => {
    if (event.target === followSheet) closeFollowSheet();
  });

  viewerClose.addEventListener("click", closeViewer);
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) closeViewer();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeViewer();
      closeFollowSheet();
    }
  });
  window.addEventListener("scroll", syncTopPin, { passive: true });

  fillProfile();
  renderGrid();
  syncTopPin();
})();
