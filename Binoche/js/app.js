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
  const viewerClose = document.getElementById("viewerClose");

  function fillProfile() {
    nameEl.textContent = PROFILE.name;
    nameKoEl.textContent = PROFILE.nameKo;
    handleEl.textContent = PROFILE.handle;
    bioEl.textContent = PROFILE.bio;
    postsEl.textContent = String(PROFILE.posts);
    followersEl.textContent = PROFILE.followers;
    followingEl.textContent = PROFILE.following;
    aboutEl.innerHTML = "";
    (PROFILE.about || []).forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line;
      aboutEl.appendChild(p);
    });
  }

  function renderGrid() {
    grid.innerHTML = "";
    POSTS.forEach((post) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<img src="${post.src}" alt="" />`;
      button.addEventListener("click", () => openViewer(post.src));
      grid.appendChild(button);
    });
  }

  function openViewer(src) {
    viewerImage.src = src;
    viewer.hidden = false;
  }

  function closeViewer() {
    viewer.hidden = true;
    viewerImage.removeAttribute("src");
  }

  function setTab(tab) {
    document.querySelectorAll(".tab").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.tab === tab);
    });
    panelPosts.classList.toggle("is-on", tab === "posts");
    panelAbout.classList.toggle("is-on", tab === "about");
    panelAbout.hidden = tab !== "about";
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

  fillProfile();
  renderGrid();
})();
