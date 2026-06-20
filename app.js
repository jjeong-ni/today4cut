(function () {
  "use strict";

  const PHOTO_W = 720;
  const PHOTO_H = 960;
  const PAD = 28;
  const GAP = 16;
  const BORDER = 8;
  const SHOT_TOTAL = 4;

  const USERS_KEY = "today4cut_users_v1";
  const SESSION_KEY = "today4cut_session_v1";
  const DB_NAME = "today4cut_library_v1";
  const DB_VERSION = 1;
  const PHOTO_STORE = "photos";

  const filters = {
    normal: {
      css: "sepia(0.18) contrast(1.1) brightness(1.08) saturate(0.92)",
      blur: 0.25
    },
    bw: {
      css: "grayscale(1) contrast(1.16) brightness(1.08) sepia(0.2)",
      blur: 0.25
    },
    ccd: {
      css: "brightness(1.22) contrast(1.25) saturate(0.78)",
      blur: 0.35
    },
    blurry: {
      css: "brightness(1.25) contrast(0.92) saturate(0.76) hue-rotate(5deg)",
      blur: 0.35
    }
  };

  const layoutPresets = {
    classic: {
      label: "세로 4컷",
      className: "layout-classic"
    },
    grid: {
      label: "2 x 2",
      className: "layout-grid"
    },
    split: {
      label: "큰컷 + 3컷",
      className: "layout-split"
    }
  };

  const themePresets = {
    black: {
      label: "Black",
      type: "solid",
      outer: "#09090b",
      middle: "#fff7fb",
      inner: "#111113",
      stroke: "rgba(255, 255, 255, 0.34)"
    },
    white: {
      label: "White",
      type: "solid",
      outer: "#fffdf8",
      middle: "#111113",
      inner: "#fffaf0",
      stroke: "rgba(17, 17, 19, 0.18)"
    },
    kyungheeKuong1: {
      label: "경희X쿠옹 1",
      type: "image",
      frameOnly: true,
      width: 1053,
      height: 1493,
      src: "./assets/theme-kyunghee-kuong-1.png",
      background: "#a80d18",
      photoArea: { x: 108, y: 130, w: 837, h: 1220 },
      slots: [],
      customRects: {
        classic: [
          { x: 108, y: 130, w: 837, h: 290, r: 18 },
          { x: 108, y: 440, w: 837, h: 290, r: 18 },
          { x: 108, y: 750, w: 837, h: 290, r: 18 },
          { x: 108, y: 1060, w: 837, h: 290, r: 18 }
        ],
        grid: [
          { x: 108, y: 130, w: 408, h: 600, r: 18 },
          { x: 536, y: 130, w: 409, h: 600, r: 18 },
          { x: 108, y: 750, w: 408, h: 600, r: 18 },
          { x: 536, y: 750, w: 409, h: 600, r: 18 }
        ],
        split: [
          { x: 108, y: 130, w: 410, h: 1220, r: 18 },
          { x: 538, y: 130, w: 407, h: 393, r: 18 },
          { x: 538, y: 543, w: 407, h: 393, r: 18 },
          { x: 538, y: 956, w: 407, h: 394, r: 18 }
        ]
      }
    },
    kuong2: {
      label: "쿠옹이 2",
      type: "image",
      frameOnly: true,
      width: 1086,
      height: 1448,
      src: "./assets/theme-kuong-2.png",
      background: "#f8b7cc",
      photoArea: { x: 110, y: 260, w: 866, h: 1030 },
      slots: [],
      customRects: {
        classic: [
          { x: 110, y: 260, w: 866, h: 242, r: 18 },
          { x: 110, y: 522, w: 866, h: 242, r: 18 },
          { x: 110, y: 784, w: 866, h: 242, r: 18 },
          { x: 110, y: 1046, w: 866, h: 242, r: 18 }
        ],
        grid: [
          { x: 110, y: 260, w: 423, h: 505, r: 18 },
          { x: 553, y: 260, w: 423, h: 505, r: 18 },
          { x: 110, y: 785, w: 423, h: 505, r: 18 },
          { x: 553, y: 785, w: 423, h: 505, r: 18 }
        ],
        split: [
          { x: 110, y: 260, w: 420, h: 1030, r: 18 },
          { x: 550, y: 260, w: 426, h: 330, r: 18 },
          { x: 550, y: 610, w: 426, h: 330, r: 18 },
          { x: 550, y: 960, w: 426, h: 330, r: 18 }
        ]
      }
    }
  };

  const screens = Array.from(document.querySelectorAll("[data-screen]"));
  const video = document.getElementById("video");
  const workCanvas = document.getElementById("workCanvas");
  const workCtx = workCanvas.getContext("2d", { willReadFrequently: true });
  const previewCanvas = document.getElementById("previewCanvas");
  const previewCtx = previewCanvas.getContext("2d");
  const imageThemeImages = {};
  Object.entries(themePresets).forEach(([name, theme]) => {
    if (!theme.src) return;
    const image = new Image();
    image.decoding = "async";
    image.src = theme.src;
    imageThemeImages[name] = image;
  });
  const countdownEl = document.getElementById("countdown");
  const flashEl = document.getElementById("flash");
  const shotCountEl = document.getElementById("shotCount");
  const cameraMessage = document.getElementById("cameraMessage");
  const saveMessage = document.getElementById("saveMessage");
  const printImage = document.getElementById("printImage");
  const finalImage = document.getElementById("finalImage");
  const authStatus = document.getElementById("authStatus");
  const libraryStatus = document.getElementById("libraryStatus");
  const libraryGrid = document.getElementById("libraryGrid");
  const libraryEmpty = document.getElementById("libraryEmpty");
  const authModal = document.getElementById("authModal");
  const authTitle = document.getElementById("authTitle");
  const authForm = document.getElementById("authForm");
  const authUserId = document.getElementById("authUserId");
  const authDisplayName = document.getElementById("authDisplayName");
  const authPassword = document.getElementById("authPassword");
  const authMessage = document.getElementById("authMessage");
  const displayNameField = document.getElementById("displayNameField");
  const cameraGrid = document.getElementById("cameraGrid");
  const cameraSlots = Array.from(document.querySelectorAll(".camera-slot"));
  const cameraHelp = document.getElementById("cameraHelp");
  const cameraHelpText = document.getElementById("cameraHelpText");
  const layoutCameraHint = document.getElementById("layoutCameraHint");
  const accountFab = document.getElementById("accountFab");
  const accountPanel = document.getElementById("accountPanel");
  const accountPanelStatus = document.getElementById("accountPanelStatus");

  const startBtn = document.getElementById("startBtn");
  const layoutHomeBtn = document.getElementById("layoutHomeBtn");
  const layoutStartBtn = document.getElementById("layoutStartBtn");
  const themeHomeBtn = document.getElementById("themeHomeBtn");
  const themeBackBtn = document.getElementById("themeBackBtn");
  const themeStartBtn = document.getElementById("themeStartBtn");
  const shutterBtn = document.getElementById("shutterBtn");
  const cameraHomeBtn = document.getElementById("cameraHomeBtn");
  const retakeBtn = document.getElementById("retakeBtn");
  const retakeIconBtn = document.getElementById("retakeIconBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const toSaveBtn = document.getElementById("toSaveBtn");
  const saveHomeBtn = document.getElementById("saveHomeBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const shareBtn = document.getElementById("shareBtn");
  const librarySaveBtn = document.getElementById("librarySaveBtn");
  const saveLibraryOpenBtn = document.getElementById("saveLibraryOpenBtn");
  const libraryOpenBtn = document.getElementById("libraryOpenBtn");
  const libraryHomeBtn = document.getElementById("libraryHomeBtn");
  const libraryShootBtn = document.getElementById("libraryShootBtn");
  const loginOpenBtn = document.getElementById("loginOpenBtn");
  const signupOpenBtn = document.getElementById("signupOpenBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const authCloseBtn = document.getElementById("authCloseBtn");
  const authLoginTab = document.getElementById("authLoginTab");
  const authSignupTab = document.getElementById("authSignupTab");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
  const layoutButtons = Array.from(document.querySelectorAll(".layout-option"));
  const themeButtons = Array.from(document.querySelectorAll(".theme-option"));
  const retryCameraBtn = document.getElementById("retryCameraBtn");

  let stream = null;
  let currentFilter = "normal";
  let shots = [];
  let stripBlob = null;
  let stripUrl = "";
  let isShooting = false;
  let currentUser = null;
  let authMode = "login";
  let pendingAfterAuth = null;
  let currentSavedPhotoId = null;
  let libraryObjectUrls = [];
  let currentLayout = "classic";
  let currentTheme = "black";
  let cameraPrimed = false;
  const imageThemeLoadPromises = {};
  const imageThemeCanvases = {};
  const imageThemeFailed = {};

  function setScreen(name) {
    screens.forEach((screen) => {
      screen.classList.toggle("is-active", screen.dataset.screen === name);
    });

    const active = document.querySelector(`[data-screen="${name}"]`);
    const focusTarget = active && active.querySelector("button:not(:disabled)");
    if (focusTarget) {
      window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 30);
    }
  }

  function setBusy(isBusy) {
    shutterBtn.disabled = isBusy;
    filterButtons.forEach((button) => {
      button.disabled = isBusy;
    });
  }

  function updateShotCount() {
    shotCountEl.textContent = `${shots.length}/${SHOT_TOTAL}`;
  }

  function setFilter(filterName) {
    currentFilter = filterName;
    video.style.filter = filters[filterName].css;

    filterButtons.forEach((button) => {
      const isSelected = button.dataset.filter === filterName;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function setLayout(layoutName) {
    currentLayout = layoutPresets[layoutName] ? layoutName : "classic";
    const preset = layoutPresets[currentLayout];

    cameraGrid.className = `camera-grid ${preset.className}`;
    layoutButtons.forEach((button) => {
      const isSelected = button.dataset.layout === currentLayout;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-checked", String(isSelected));
    });

  }

  function setTheme(themeName) {
    currentTheme = themePresets[themeName] ? themeName : "black";

    themeButtons.forEach((button) => {
      const isSelected = button.dataset.theme === currentTheme;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-checked", String(isSelected));
    });
  }

  function clearCameraSlots() {
    cameraSlots.forEach((slot) => {
      slot.classList.remove("is-active", "is-complete");
      slot.querySelectorAll("img").forEach((image) => image.remove());
    });
  }

  function setActiveShotSlot(index) {
    cameraSlots.forEach((slot, slotIndex) => {
      slot.classList.toggle("is-active", slotIndex === index);
    });

    const activeSlot = cameraSlots[index];
    if (activeSlot) {
      activeSlot.appendChild(video);
      activeSlot.appendChild(countdownEl);
      activeSlot.appendChild(flashEl);
    }
  }

  function showShotInSlot(index, canvas) {
    const slot = cameraSlots[index];
    if (!slot) return;

    const image = document.createElement("img");
    image.alt = `${index + 1}번 컷 촬영 결과`;
    image.src = canvas.toDataURL("image/jpeg", 0.86);
    slot.appendChild(image);
    slot.classList.remove("is-active");
    slot.classList.add("is-complete");
  }

  function showCameraHelp(message) {
    cameraHelpText.textContent = message;
    cameraHelp.classList.remove("is-hidden");
  }

  function hideCameraHelp() {
    cameraHelp.classList.add("is-hidden");
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function revokeStripUrl() {
    if (stripUrl) {
      URL.revokeObjectURL(stripUrl);
      stripUrl = "";
    }
  }

  function revokeLibraryObjectUrls() {
    libraryObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    libraryObjectUrls = [];
  }

  function resetOutput() {
    revokeStripUrl();
    shots = [];
    stripBlob = null;
    currentSavedPhotoId = null;
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    printImage.removeAttribute("src");
    finalImage.removeAttribute("src");
    confirmBtn.disabled = true;
    toSaveBtn.disabled = true;
    saveMessage.textContent = "";
    hideCameraHelp();
    clearCameraSlots();
    updateShotCount();
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    video.srcObject = null;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeUserId(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  }

  function makeSalt() {
    const bytes = new Uint8Array(16);
    if (crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function sha256(value) {
    if (crypto.subtle && window.TextEncoder) {
      const data = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return `fallback-${Math.abs(hash)}`;
  }

  function publicUser(user) {
    return {
      id: user.id,
      displayName: user.displayName,
      createdAt: user.createdAt
    };
  }

  function loadSession() {
    const session = readJson(SESSION_KEY, null);
    const users = readJson(USERS_KEY, {});
    if (session && session.userId && users[session.userId]) {
      currentUser = publicUser(users[session.userId]);
    }
  }

  function updateAuthUi() {
    if (currentUser) {
      authStatus.textContent = `${currentUser.displayName} 로그인 중`;
      accountPanelStatus.textContent = `${currentUser.displayName} 로그인 중`;
      loginOpenBtn.classList.add("is-hidden");
      signupOpenBtn.classList.add("is-hidden");
      logoutBtn.classList.remove("is-hidden");
      libraryOpenBtn.classList.remove("is-hidden");
      librarySaveBtn.textContent = currentSavedPhotoId ? "보관함 저장됨" : "보관함 저장";
    } else {
      authStatus.textContent = "비회원 모드";
      accountPanelStatus.textContent = "비회원도 촬영과 저장 가능";
      loginOpenBtn.classList.remove("is-hidden");
      signupOpenBtn.classList.remove("is-hidden");
      logoutBtn.classList.add("is-hidden");
      libraryOpenBtn.classList.add("is-hidden");
      librarySaveBtn.textContent = "로그인 후 보관함 저장";
    }
  }

  function closeAccountPanel() {
    accountPanel.classList.add("is-hidden");
    accountFab.setAttribute("aria-expanded", "false");
  }

  function toggleAccountPanel() {
    const shouldOpen = accountPanel.classList.contains("is-hidden");
    accountPanel.classList.toggle("is-hidden", !shouldOpen);
    accountFab.setAttribute("aria-expanded", String(shouldOpen));
  }

  function openAuthModal(mode, afterAuth) {
    authMode = mode;
    pendingAfterAuth = afterAuth || null;
    authTitle.textContent = mode === "signup" ? "회원가입" : "로그인";
    authSubmitBtn.textContent = mode === "signup" ? "회원가입" : "로그인";
    authLoginTab.classList.toggle("is-selected", mode === "login");
    authSignupTab.classList.toggle("is-selected", mode === "signup");
    displayNameField.classList.toggle("is-hidden", mode !== "signup");
    authPassword.autocomplete = mode === "signup" ? "new-password" : "current-password";
    authMessage.textContent = "";
    authForm.reset();
    authModal.classList.remove("is-hidden");
    window.setTimeout(() => authUserId.focus({ preventScroll: true }), 30);
  }

  function closeAuthModal() {
    authModal.classList.add("is-hidden");
    pendingAfterAuth = null;
  }

  async function signup(userId, displayName, password) {
    const id = normalizeUserId(userId);
    if (id.length < 3) {
      throw new Error("아이디는 영문, 숫자, ., _, - 조합으로 3자 이상 입력해주세요.");
    }
    if (password.length < 4) {
      throw new Error("비밀번호는 4자 이상 입력해주세요.");
    }

    const users = readJson(USERS_KEY, {});
    if (users[id]) {
      throw new Error("이미 사용 중인 아이디입니다.");
    }

    const salt = makeSalt();
    users[id] = {
      id,
      displayName: displayName.trim() || id,
      salt,
      passwordHash: await sha256(`${salt}:${password}`),
      createdAt: new Date().toISOString()
    };
    writeJson(USERS_KEY, users);
    writeJson(SESSION_KEY, { userId: id });
    currentUser = publicUser(users[id]);
  }

  async function login(userId, password) {
    const id = normalizeUserId(userId);
    const users = readJson(USERS_KEY, {});
    const user = users[id];
    if (!user) {
      throw new Error("가입된 아이디를 찾을 수 없습니다.");
    }

    const passwordHash = await sha256(`${user.salt}:${password}`);
    if (passwordHash !== user.passwordHash) {
      throw new Error("비밀번호가 맞지 않습니다.");
    }

    writeJson(SESSION_KEY, { userId: id });
    currentUser = publicUser(user);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    currentSavedPhotoId = null;
    updateAuthUi();
    if (document.querySelector("[data-screen='library']").classList.contains("is-active")) {
      setScreen("start");
    }
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          const store = db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
          store.createIndex("userId", "userId", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, callback) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE, mode);
      const store = transaction.objectStore(PHOTO_STORE);
      const result = callback(store);
      transaction.oncomplete = () => {
        db.close();
        resolve(result);
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function savePhotoToLibrary() {
    if (!currentUser || !stripBlob) return null;
    if (currentSavedPhotoId) return currentSavedPhotoId;

    const id = `${currentUser.id}-${Date.now()}`;
    const record = {
      id,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      filter: currentFilter,
      theme: currentTheme,
      blob: stripBlob
    };

    await withStore("readwrite", (store) => {
      store.put(record);
    });

    currentSavedPhotoId = id;
    updateAuthUi();
    return id;
  }

  async function getLibraryPhotos() {
    if (!currentUser) return [];
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE, "readonly");
      const index = transaction.objectStore(PHOTO_STORE).index("userId");
      const request = index.getAll(currentUser.id);
      request.onsuccess = () => {
        db.close();
        resolve(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  async function deleteLibraryPhoto(id) {
    await withStore("readwrite", (store) => {
      store.delete(id);
    });
    if (currentSavedPhotoId === id) {
      currentSavedPhotoId = null;
    }
  }

  async function getLibraryPhoto(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE, "readonly");
      const request = transaction.objectStore(PHOTO_STORE).get(id);
      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  function formatDate(iso) {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function dateStamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function renderLibrary() {
    if (!currentUser) {
      openAuthModal("login");
      return;
    }

    const photos = await getLibraryPhotos();
    revokeLibraryObjectUrls();
    libraryGrid.innerHTML = "";
    libraryStatus.textContent = `${currentUser.displayName}님의 보관함 · ${photos.length}장`;
    libraryEmpty.classList.toggle("is-hidden", photos.length > 0);

    photos.forEach((photo) => {
      const url = URL.createObjectURL(photo.blob);
      libraryObjectUrls.push(url);

      const card = document.createElement("article");
      card.className = "photo-card";
      const themeLabel = themePresets[photo.theme]?.label || themePresets.black.label;
      card.innerHTML = `
        <img src="${url}" alt="보관함에 저장된 4컷 사진">
        <time datetime="${photo.createdAt}">${formatDate(photo.createdAt)} · ${photo.filter.toUpperCase()} · ${themeLabel}</time>
        <div class="card-actions">
          <button class="small-button" type="button" data-download="${photo.id}">저장</button>
          <button class="small-button danger" type="button" data-delete="${photo.id}">삭제</button>
        </div>
      `;
      libraryGrid.appendChild(card);
    });

    setScreen("library");
  }

  async function openLibrary() {
    if (!currentUser) {
      openAuthModal("login");
      return;
    }
    try {
      await renderLibrary();
    } catch (error) {
      console.warn(error);
      saveMessage.textContent = "보관함을 열지 못했어요.";
    }
  }

  async function saveCurrentPhotoToLibrary() {
    if (!stripBlob) return;
    if (!currentUser) {
      openAuthModal("login", "save-current-photo");
      return;
    }

    try {
      await savePhotoToLibrary();
      saveMessage.textContent = "보관함에 저장했어요. 다음 접속 때도 확인할 수 있습니다.";
    } catch (error) {
      console.warn(error);
      saveMessage.textContent = "보관함 저장 공간이 부족하거나 사용할 수 없어요.";
    }
  }

  async function requestCameraStream() {
    const attempts = [
      {
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      },
      {
        video: {
          facingMode: { ideal: "user" }
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let lastError = null;
    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        lastError = error;
        if (error.name === "NotAllowedError" || error.name === "SecurityError") {
          break;
        }
      }
    }
    throw lastError;
  }

  function cameraErrorMessage(error) {
    if (!window.isSecureContext) {
      return "카메라는 HTTPS 또는 127.0.0.1/localhost에서만 열 수 있어요. 지금 주소가 127.0.0.1인지 확인해주세요.";
    }

    if (!error) {
      return "카메라를 열 수 없어요. 브라우저 권한을 확인한 뒤 다시 시도해주세요.";
    }

    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "카메라 권한이 차단되어 있어요. 주소창 왼쪽의 권한 아이콘에서 카메라를 허용한 뒤 다시 눌러주세요.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "연결된 카메라를 찾지 못했어요. 카메라가 연결되어 있는지 확인해주세요.";
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "다른 앱이 카메라를 사용 중일 수 있어요. 화상회의 앱이나 카메라 앱을 닫고 다시 시도해주세요.";
    }

    return "카메라를 열지 못했어요. 권한을 허용하거나 다른 브라우저에서 다시 시도해주세요.";
  }

  async function startCamera() {
    resetOutput();
    cameraMessage.textContent = "카메라를 준비 중이에요.";
    shutterBtn.disabled = true;
    setLayout(currentLayout);
    clearCameraSlots();
    setActiveShotSlot(0);
    setScreen("camera");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const message = "이 브라우저는 카메라 기능을 지원하지 않아요. Chrome, Edge, Safari에서 다시 열어주세요.";
      cameraMessage.textContent = message;
      showCameraHelp(message);
      return;
    }

    stopCamera();

    try {
      stream = await requestCameraStream();
      cameraPrimed = true;
      video.srcObject = stream;
      await video.play();
      setFilter(currentFilter);
      setActiveShotSlot(0);
      hideCameraHelp();
      setBusy(false);
      cameraMessage.textContent = "1번 칸부터 차례대로 촬영해요.";
    } catch (error) {
      const message = cameraErrorMessage(error);
      cameraMessage.textContent = message;
      showCameraHelp(message);
      console.warn(error);
    }
  }

  async function primeCameraPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("이 브라우저는 카메라 기능을 지원하지 않아요. Chrome, Edge, Safari에서 다시 열어주세요.");
    }

    if (cameraPrimed) return;

    const testStream = await requestCameraStream();
    testStream.getTracks().forEach((track) => track.stop());
    cameraPrimed = true;
  }

  async function beginStartFlow() {
    closeAccountPanel();
    setScreen("layout");

    if (!layoutCameraHint) return;

    layoutCameraHint.textContent = "내장 카메라 권한을 확인 중이에요.";
    try {
      await primeCameraPermission();
      layoutCameraHint.textContent = "카메라 준비 완료. 원하는 컷 구성을 고르면 바로 촬영 화면으로 이동해요.";
    } catch (error) {
      layoutCameraHint.textContent = cameraErrorMessage(error);
      console.warn(error);
    }
  }

  async function runCountdown() {
    for (let i = 3; i >= 1; i -= 1) {
      countdownEl.textContent = i;
      countdownEl.classList.add("is-visible");
      await sleep(760);
      countdownEl.classList.remove("is-visible");
      await sleep(220);
    }
  }

  async function flash() {
    flashEl.classList.remove("is-on");
    void flashEl.offsetWidth;
    flashEl.classList.add("is-on");
    await sleep(330);
  }

  function clamp(value) {
    return Math.max(0, Math.min(255, value));
  }

  function applyPixelFilter(ctx, filterName) {
    const imageData = ctx.getImageData(0, 0, PHOTO_W, PHOTO_H);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (filterName === "normal") {
        r *= 1.08;
        g *= 1.08;
        b *= 1.08;
        r = ((r / 255 - 0.5) * 1.1 + 0.5) * 255;
        g = ((g / 255 - 0.5) * 1.1 + 0.5) * 255;
        b = ((b / 255 - 0.5) * 1.1 + 0.5) * 255;
        const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
        r = lum + (r - lum) * 0.92;
        g = lum + (g - lum) * 0.92;
        b = lum + (b - lum) * 0.92;
        const sr = r * 0.393 + g * 0.769 + b * 0.189;
        const sg = r * 0.349 + g * 0.686 + b * 0.168;
        const sb = r * 0.272 + g * 0.534 + b * 0.131;
        r = r * 0.82 + sr * 0.18;
        g = g * 0.82 + sg * 0.18;
        b = b * 0.82 + sb * 0.18;
      }

      if (filterName === "bw") {
        const gray = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 1.08;
        r = ((gray / 255 - 0.5) * 1.16 + 0.5) * 255;
        g = ((gray / 255 - 0.5) * 1.16 + 0.5) * 255;
        b = ((gray / 255 - 0.5) * 1.16 + 0.5) * 255;
        const sr = r * 0.393 + g * 0.769 + b * 0.189;
        const sg = r * 0.349 + g * 0.686 + b * 0.168;
        const sb = r * 0.272 + g * 0.534 + b * 0.131;
        r = r * 0.82 + sr * 0.18;
        g = g * 0.82 + sg * 0.18;
        b = b * 0.82 + sb * 0.18;
      }

      if (filterName === "ccd") {
        r *= 1.22;
        g *= 1.22;
        b *= 1.22;
        r = ((r / 255 - 0.5) * 1.25 + 0.5) * 255;
        g = ((g / 255 - 0.5) * 1.25 + 0.5) * 255;
        b = ((b / 255 - 0.5) * 1.25 + 0.5) * 255;
        const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
        r = lum + (r - lum) * 0.78;
        g = lum + (g - lum) * 0.78;
        b = lum + (b - lum) * 0.78;
      }

      if (filterName === "blurry") {
        r *= 1.25;
        g *= 1.25;
        b *= 1.25;
        r = ((r / 255 - 0.5) * 0.92 + 0.5) * 255;
        g = ((g / 255 - 0.5) * 0.92 + 0.5) * 255;
        b = ((b / 255 - 0.5) * 0.92 + 0.5) * 255;
        const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
        r = lum + (r - lum) * 0.76;
        g = lum + (g - lum) * 0.76;
        b = lum + (b - lum) * 0.76;
        r = r * 0.86 + 11;
        g = g * 0.86 + 10;
        b = b * 0.86 + 12;
        const noise = (Math.random() - 0.5) * 18;
        r += noise;
        g += noise * 0.9;
        b += noise * 0.8;
      }

      data[i] = clamp(r);
      data[i + 1] = clamp(g);
      data[i + 2] = clamp(b);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function cropVideoToPortrait(ctx) {
    const videoW = video.videoWidth;
    const videoH = video.videoHeight;
    const videoRatio = videoW / videoH;
    const targetRatio = PHOTO_W / PHOTO_H;
    let sx = 0;
    let sy = 0;
    let sw = videoW;
    let sh = videoH;

    if (videoRatio > targetRatio) {
      sw = sh * targetRatio;
      sx = (videoW - sw) / 2;
    } else {
      sh = sw / targetRatio;
      sy = (videoH - sh) / 2;
    }

    ctx.save();
    ctx.translate(PHOTO_W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PHOTO_W, PHOTO_H);
    ctx.restore();
  }

  function captureFrame() {
    const capture = document.createElement("canvas");
    capture.width = PHOTO_W;
    capture.height = PHOTO_H;
    const ctx = capture.getContext("2d", { willReadFrequently: true });

    ctx.clearRect(0, 0, PHOTO_W, PHOTO_H);
    cropVideoToPortrait(ctx);
    applyPixelFilter(ctx, currentFilter);

    const blur = filters[currentFilter].blur;
    if (blur > 0 && "filter" in ctx) {
      workCtx.clearRect(0, 0, PHOTO_W, PHOTO_H);
      workCtx.filter = `blur(${blur}px)`;
      workCtx.drawImage(capture, 0, 0);
      workCtx.filter = "none";
      ctx.clearRect(0, 0, PHOTO_W, PHOTO_H);
      ctx.drawImage(workCanvas, 0, 0);
    }

    return capture;
  }

  function drawVignette(ctx, x, y, width, height) {
    const gradient = ctx.createRadialGradient(
      x + width / 2,
      y + height / 2,
      Math.min(width, height) * 0.42,
      x + width / 2,
      y + height / 2,
      Math.max(width, height) * 0.72
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.42)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }

  function getOutputLayout() {
    const x0 = BORDER + PAD;
    const y0 = BORDER + PAD;

    if (currentLayout === "grid") {
      const width = PHOTO_W * 2 + GAP + PAD * 2 + BORDER * 2;
      const height = PHOTO_H * 2 + GAP + PAD * 2 + BORDER * 2;
      return {
        width,
        height,
        rects: [
          { x: x0, y: y0, w: PHOTO_W, h: PHOTO_H },
          { x: x0 + PHOTO_W + GAP, y: y0, w: PHOTO_W, h: PHOTO_H },
          { x: x0, y: y0 + PHOTO_H + GAP, w: PHOTO_W, h: PHOTO_H },
          { x: x0 + PHOTO_W + GAP, y: y0 + PHOTO_H + GAP, w: PHOTO_W, h: PHOTO_H }
        ]
      };
    }

    if (currentLayout === "split") {
      const smallW = Math.round(PHOTO_W * 0.56);
      const smallH = Math.round(PHOTO_H * 0.56);
      const bigH = smallH * 3 + GAP * 2;
      const width = PHOTO_W + GAP + smallW + PAD * 2 + BORDER * 2;
      const height = bigH + PAD * 2 + BORDER * 2;
      return {
        width,
        height,
        rects: [
          { x: x0, y: y0, w: PHOTO_W, h: bigH },
          { x: x0 + PHOTO_W + GAP, y: y0, w: smallW, h: smallH },
          { x: x0 + PHOTO_W + GAP, y: y0 + smallH + GAP, w: smallW, h: smallH },
          { x: x0 + PHOTO_W + GAP, y: y0 + (smallH + GAP) * 2, w: smallW, h: smallH }
        ]
      };
    }

    const width = PHOTO_W + PAD * 2 + BORDER * 2;
    const height = PHOTO_H * SHOT_TOTAL + GAP * (SHOT_TOTAL - 1) + PAD * 2 + BORDER * 2;
    return {
      width,
      height,
      rects: Array.from({ length: SHOT_TOTAL }, (_, index) => ({
        x: x0,
        y: y0 + index * (PHOTO_H + GAP),
        w: PHOTO_W,
        h: PHOTO_H
      }))
    };
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawImageCover(ctx, image, x, y, width, height) {
    const sourceRatio = image.width / image.height;
    const targetRatio = width / height;
    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (sourceRatio > targetRatio) {
      sw = sh * targetRatio;
      sx = (image.width - sw) / 2;
    } else {
      sh = sw / targetRatio;
      sy = (image.height - sh) / 2;
    }

    ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  }

  function drawImageContain(ctx, image, x, y, width, height) {
    const scale = Math.min(width / image.width, height / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const drawX = x + (width - drawW) / 2;
    const drawY = y + (height - drawH) / 2;

    ctx.drawImage(image, drawX, drawY, drawW, drawH);
  }

  function drawImageSmartFit(ctx, image, x, y, width, height) {
    const sourceRatio = image.width / image.height;
    const targetRatio = width / height;
    const ratioGap = Math.abs(Math.log(targetRatio / sourceRatio));

    if (ratioGap < 0.45) {
      drawImageCover(ctx, image, x, y, width, height);
      return;
    }

    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.filter = "blur(18px) saturate(1.05)";
    drawImageCover(ctx, image, x - 18, y - 18, width + 36, height + 36);
    ctx.restore();

    drawImageContain(ctx, image, x, y, width, height);
  }

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }

  function getImageThemeLayout(theme) {
    if (theme.customRects) {
      const rects = theme.customRects[currentLayout] || theme.customRects.classic;
      return { width: theme.width, height: theme.height, rects };
    }

    const area = theme.photoArea;

    if (currentLayout === "grid") {
      const gap = 20;
      const w = Math.round((area.w - gap) / 2);
      const h = Math.round((area.h - gap) / 2);
      return {
        width: theme.width,
        height: theme.height,
        rects: [
          { x: area.x, y: area.y, w, h, r: 22 },
          { x: area.x + w + gap, y: area.y, w, h, r: 22 },
          { x: area.x, y: area.y + h + gap, w, h, r: 22 },
          { x: area.x + w + gap, y: area.y + h + gap, w, h, r: 22 }
        ]
      };
    }

    if (currentLayout === "split") {
      const gap = 18;
      const smallW = Math.round(area.w * 0.38);
      const bigW = area.w - smallW - gap;
      const smallH = Math.round((area.h - gap * 2) / 3);
      return {
        width: theme.width,
        height: theme.height,
        rects: [
          { x: area.x, y: area.y, w: bigW, h: area.h, r: 24 },
          { x: area.x + bigW + gap, y: area.y, w: smallW, h: smallH, r: 22 },
          { x: area.x + bigW + gap, y: area.y + smallH + gap, w: smallW, h: smallH, r: 22 },
          { x: area.x + bigW + gap, y: area.y + (smallH + gap) * 2, w: smallW, h: smallH, r: 22 }
        ]
      };
    }

    const gap = 24;
    const h = Math.round((area.h - gap * 3) / 4);
    return {
      width: theme.width,
      height: theme.height,
      rects: Array.from({ length: SHOT_TOTAL }, (_, index) => ({
        x: area.x,
        y: area.y + index * (h + gap),
        w: area.w,
        h,
        r: 24
      }))
    };
  }

  function collectThemeSlotMask(theme, imageData) {
    const { data, width, height } = imageData;
    const mask = new Uint8Array(width * height);
    const visited = new Uint8Array(width * height);
    const isSlotWhite = (index) => {
      const offset = index * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      return max > 244 && max - min < 14;
    };

    theme.slots.forEach((slot) => {
      const x0 = Math.max(0, Math.floor(slot.x));
      const y0 = Math.max(0, Math.floor(slot.y));
      const x1 = Math.min(width - 1, Math.ceil(slot.x + slot.w));
      const y1 = Math.min(height - 1, Math.ceil(slot.y + slot.h));
      const startX = Math.min(width - 1, Math.max(0, Math.floor(slot.x + slot.w / 2)));
      const startY = Math.min(height - 1, Math.max(0, Math.floor(slot.y + slot.h / 2)));
      const stack = [startY * width + startX];

      while (stack.length > 0) {
        const index = stack.pop();
        if (visited[index]) continue;
        visited[index] = 1;

        const x = index % width;
        const y = Math.floor(index / width);
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        if (!isSlotWhite(index)) continue;

        mask[index] = 1;

        if (x > x0) stack.push(index - 1);
        if (x < x1) stack.push(index + 1);
        if (y > y0) stack.push(index - width);
        if (y < y1) stack.push(index + width);
      }
    });

    return mask;
  }

  function buildImageThemeCanvases(themeName) {
    if (imageThemeCanvases[themeName]) return imageThemeCanvases[themeName];

    const theme = themePresets[themeName];
    const image = imageThemeImages[themeName];
    if (!theme || !image || !image.naturalWidth) return null;

    const width = theme.width || image.naturalWidth;
    const height = theme.height || image.naturalHeight;
    const base = document.createElement("canvas");
    const overlay = document.createElement("canvas");
    base.width = overlay.width = width;
    base.height = overlay.height = height;

    const baseCtx = base.getContext("2d", { willReadFrequently: true });
    const overlayCtx = overlay.getContext("2d", { willReadFrequently: true });
    baseCtx.drawImage(image, 0, 0, width, height);
    overlayCtx.drawImage(image, 0, 0, width, height);

    const overlayData = overlayCtx.getImageData(0, 0, width, height);

    if (theme.frameOnly) {
      // Flood-fill background starting from each photo rect center.
      // Only pixels connected to known-background seeds are made transparent,
      // so characters embedded in the frame are never erased.
      // Collect seeds from ALL layout rects so every photo area (classic/grid/split) gets reached
      const allRects = Object.values(theme.customRects || {}).flat();
      const seedSet = new Set();
      const seeds = [];
      allRects.forEach((r) => {
        const sx = Math.floor(r.x + r.w / 2);
        const sy = Math.floor(r.y + r.h / 2);
        const key = sy * width + sx;
        if (!seedSet.has(key)) { seedSet.add(key); seeds.push({ x: sx, y: sy }); }
      });
      if (seeds.length > 0) {
        const threshold = 40;
        const visited = new Uint8Array(width * height);
        // Each seed uses its OWN color as reference so color variations between areas don't block fill
        seeds.forEach(({ x, y }) => {
          const startIdx = y * width + x;
          if (visited[startIdx]) return;
          const si = startIdx * 4;
          const fillR = overlayData.data[si];
          const fillG = overlayData.data[si + 1];
          const fillB = overlayData.data[si + 2];
          const queue = [startIdx];
          visited[startIdx] = 1;
          let head = 0;
          while (head < queue.length) {
            const idx = queue[head++];
            overlayData.data[idx * 4 + 3] = 0;
            const px = idx % width;
            const py = (idx / width) | 0;
            if (px > 0) {
              const ni = idx - 1; if (!visited[ni]) { const o = ni*4; if (Math.abs(overlayData.data[o]-fillR)+Math.abs(overlayData.data[o+1]-fillG)+Math.abs(overlayData.data[o+2]-fillB) < threshold) { visited[ni]=1; queue.push(ni); } }
            }
            if (px < width - 1) {
              const ni = idx + 1; if (!visited[ni]) { const o = ni*4; if (Math.abs(overlayData.data[o]-fillR)+Math.abs(overlayData.data[o+1]-fillG)+Math.abs(overlayData.data[o+2]-fillB) < threshold) { visited[ni]=1; queue.push(ni); } }
            }
            if (py > 0) {
              const ni = idx - width; if (!visited[ni]) { const o = ni*4; if (Math.abs(overlayData.data[o]-fillR)+Math.abs(overlayData.data[o+1]-fillG)+Math.abs(overlayData.data[o+2]-fillB) < threshold) { visited[ni]=1; queue.push(ni); } }
            }
            if (py < height - 1) {
              const ni = idx + width; if (!visited[ni]) { const o = ni*4; if (Math.abs(overlayData.data[o]-fillR)+Math.abs(overlayData.data[o+1]-fillG)+Math.abs(overlayData.data[o+2]-fillB) < threshold) { visited[ni]=1; queue.push(ni); } }
            }
          }
        });
      }
    } else {
      const baseData = baseCtx.getImageData(0, 0, width, height);
      const slotMask = collectThemeSlotMask(theme, baseData);
      const fill = hexToRgb(theme.background);

      for (let index = 0; index < slotMask.length; index += 1) {
        if (!slotMask[index]) continue;
        const offset = index * 4;
        baseData.data[offset] = fill.r;
        baseData.data[offset + 1] = fill.g;
        baseData.data[offset + 2] = fill.b;
        baseData.data[offset + 3] = 255;
        overlayData.data[offset + 3] = 0;
      }

      baseCtx.putImageData(baseData, 0, 0);
    }

    overlayCtx.putImageData(overlayData, 0, 0);
    imageThemeCanvases[themeName] = { base, overlay };
    return imageThemeCanvases[themeName];
  }

  function ensureImageThemeReady() {
    const themeName = currentTheme;
    const theme = themePresets[themeName];
    if (!theme || theme.type !== "image" || imageThemeFailed[themeName]) return Promise.resolve();

    const image = imageThemeImages[themeName];
    if (!image) return Promise.resolve();

    if (image.complete && image.naturalWidth) {
      buildImageThemeCanvases(themeName);
      return Promise.resolve();
    }

    if (image.complete && !image.naturalWidth) {
      imageThemeFailed[themeName] = true;
      return Promise.resolve();
    }

    if (!imageThemeLoadPromises[themeName]) {
      imageThemeLoadPromises[themeName] = new Promise((resolve) => {
        image.addEventListener("load", () => {
          buildImageThemeCanvases(themeName);
          resolve();
        }, { once: true });
        image.addEventListener("error", () => {
          imageThemeFailed[themeName] = true;
          resolve();
        }, { once: true });
      });
    }

    return imageThemeLoadPromises[themeName];
  }

  function drawPhotoInRect(ctx, shot, rect, theme) {
    const inset = theme.type === "image" ? 7 : 0;
    const x = rect.x + inset;
    const y = rect.y + inset;
    const w = rect.w - inset * 2;
    const h = rect.h - inset * 2;
    const r = Math.max(0, (rect.r || 0) - inset);

    if (theme.type === "image") {
      ctx.save();
      ctx.shadowColor = "rgba(17, 17, 19, 0.28)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.r || 22);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    if (r > 0) {
      roundedRect(ctx, x, y, w, h, r);
      ctx.clip();
    }
    drawImageSmartFit(ctx, shot, x, y, w, h);
    if (currentFilter === "normal" || currentFilter === "bw") {
      drawVignette(ctx, x, y, w, h);
    }
    ctx.restore();

    if (theme.type === "image") {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
      roundedRect(ctx, x, y, w, h, r);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawOverlayOutsideRects(ctx, overlay, rects, width, height) {
    const visibleOverlay = document.createElement("canvas");
    visibleOverlay.width = width;
    visibleOverlay.height = height;
    const overlayCtx = visibleOverlay.getContext("2d");
    overlayCtx.drawImage(overlay, 0, 0, width, height);

    rects.forEach((rect) => {
      overlayCtx.clearRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
    });

    ctx.drawImage(visibleOverlay, 0, 0, width, height);
  }

  function drawSolidStrip() {
    const layout = getOutputLayout();
    const theme = themePresets[currentTheme]?.type === "solid" ? themePresets[currentTheme] : themePresets.black;

    previewCanvas.width = layout.width;
    previewCanvas.height = layout.height;
    previewCtx.fillStyle = theme.outer;
    previewCtx.fillRect(0, 0, layout.width, layout.height);
    previewCtx.fillStyle = theme.middle;
    previewCtx.fillRect(BORDER, BORDER, layout.width - BORDER * 2, layout.height - BORDER * 2);
    previewCtx.fillStyle = theme.inner;
    previewCtx.fillRect(BORDER + PAD / 2, BORDER + PAD / 2, layout.width - BORDER * 2 - PAD, layout.height - BORDER * 2 - PAD);

    shots.forEach((shot, index) => {
      const rect = layout.rects[index];
      if (!rect) return;

      drawPhotoInRect(previewCtx, shot, rect, theme);
    });
  }

  function drawImageThemeStrip() {
    const theme = themePresets[currentTheme];
    const canvases = buildImageThemeCanvases(currentTheme);

    if (!theme || !canvases || imageThemeFailed[currentTheme]) {
      drawSolidStrip();
      return;
    }

    const layout = getImageThemeLayout(theme);
    previewCanvas.width = layout.width;
    previewCanvas.height = layout.height;
    previewCtx.clearRect(0, 0, layout.width, layout.height);
    previewCtx.drawImage(canvases.base, 0, 0, layout.width, layout.height);

    shots.forEach((shot, index) => {
      const rect = layout.rects[index];
      if (!rect) return;
      drawPhotoInRect(previewCtx, shot, rect, theme);
    });

    if (theme.frameOnly) {
      previewCtx.drawImage(canvases.overlay, 0, 0, layout.width, layout.height);
    } else {
      drawOverlayOutsideRects(previewCtx, canvases.overlay, layout.rects, layout.width, layout.height);
    }
  }

  function drawStrip() {
    const theme = themePresets[currentTheme];
    if (theme?.type === "image") {
      drawImageThemeStrip();
      return;
    }

    drawSolidStrip();
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  async function buildStrip() {
    const layoutAtBuild = currentLayout;
    await ensureImageThemeReady();
    if (currentLayout !== layoutAtBuild) {
      currentLayout = layoutAtBuild;
    }
    console.log("[today4cut] buildStrip layout:", currentLayout, "theme:", currentTheme);
    drawStrip();
    stripBlob = await canvasToBlob(previewCanvas, "image/png");
    revokeStripUrl();
    stripUrl = URL.createObjectURL(stripBlob);
    printImage.src = stripUrl;
    finalImage.src = stripUrl;
    confirmBtn.disabled = false;
    updateAuthUi();
  }

  async function shootSequence() {
    if (isShooting || !stream) return;
    isShooting = true;
    shots = [];
    clearCameraSlots();
    updateShotCount();
    setBusy(true);
    confirmBtn.disabled = true;
    cameraMessage.textContent = "";

    for (let i = 0; i < SHOT_TOTAL; i += 1) {
      setActiveShotSlot(i);
      cameraMessage.textContent = `${i + 1}번 컷 준비`;
      await runCountdown();
      await flash();
      const shot = captureFrame();
      shots.push(shot);
      showShotInSlot(i, shot);
      updateShotCount();
      if (i < SHOT_TOTAL - 1) {
        setActiveShotSlot(i + 1);
        await sleep(430);
      }
    }

    stopCamera();
    await buildStrip();
    isShooting = false;
    setBusy(false);
    cameraMessage.textContent = "촬영 완료!";
    setScreen("preview");
  }

  async function showPrintScreen() {
    if (!stripUrl) return;
    toSaveBtn.disabled = true;
    printImage.classList.remove("is-printing");
    void printImage.offsetWidth;
    setScreen("print");
    window.setTimeout(() => {
      printImage.classList.add("is-printing");
    }, 80);
    await sleep(2680);
    toSaveBtn.disabled = false;
    toSaveBtn.focus({ preventScroll: true });
  }

  async function showSaveScreen() {
    setScreen("save");
    if (currentUser && stripBlob && !currentSavedPhotoId) {
      await saveCurrentPhotoToLibrary();
    } else if (!currentUser) {
      saveMessage.textContent = "비회원도 저장할 수 있어요. 로그인하면 보관함에 남길 수 있습니다.";
    }
  }

  function goHome() {
    stopCamera();
    resetOutput();
    setScreen("start");
  }

  function downloadStrip() {
    if (!stripBlob) return;
    downloadBlob(stripBlob, `today4cut-${dateStamp()}.png`);
    saveMessage.textContent = "저장 파일을 만들었어요.";
  }

  async function shareStrip() {
    if (!stripBlob) return;

    const file = new File([stripBlob], `today4cut-${dateStamp()}.png`, {
      type: "image/png"
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "TODAY 4 CUT"
        });
        saveMessage.textContent = "공유 화면을 열었어요.";
      } catch (error) {
        if (error.name !== "AbortError") {
          saveMessage.textContent = "공유를 완료하지 못했어요.";
        }
      }
    } else {
      downloadStrip();
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    authSubmitBtn.disabled = true;
    authMessage.textContent = "";

    try {
      if (authMode === "signup") {
        await signup(authUserId.value, authDisplayName.value, authPassword.value);
        authMessage.textContent = "회원가입이 완료됐어요.";
      } else {
        await login(authUserId.value, authPassword.value);
        authMessage.textContent = "로그인했어요.";
      }

      updateAuthUi();
      const action = pendingAfterAuth;
      closeAuthModal();

      if (action === "save-current-photo") {
        await saveCurrentPhotoToLibrary();
      }
    } catch (error) {
      authMessage.textContent = error.message || "처리하지 못했어요.";
    } finally {
      authSubmitBtn.disabled = false;
    }
  }

  startBtn.addEventListener("click", beginStartFlow);
  layoutHomeBtn.addEventListener("click", goHome);
  layoutStartBtn.addEventListener("click", () => setScreen("theme"));
  themeHomeBtn.addEventListener("click", goHome);
  themeBackBtn.addEventListener("click", () => setScreen("layout"));
  themeStartBtn.addEventListener("click", startCamera);
  shutterBtn.addEventListener("click", shootSequence);
  cameraHomeBtn.addEventListener("click", goHome);
  retakeBtn.addEventListener("click", startCamera);
  retakeIconBtn.addEventListener("click", startCamera);
  confirmBtn.addEventListener("click", showPrintScreen);
  toSaveBtn.addEventListener("click", showSaveScreen);
  saveHomeBtn.addEventListener("click", goHome);
  downloadBtn.addEventListener("click", downloadStrip);
  shareBtn.addEventListener("click", shareStrip);
  librarySaveBtn.addEventListener("click", saveCurrentPhotoToLibrary);
  saveLibraryOpenBtn.addEventListener("click", openLibrary);
  accountFab.addEventListener("click", toggleAccountPanel);
  libraryOpenBtn.addEventListener("click", () => {
    closeAccountPanel();
    openLibrary();
  });
  libraryHomeBtn.addEventListener("click", goHome);
  libraryShootBtn.addEventListener("click", startCamera);
  loginOpenBtn.addEventListener("click", () => {
    closeAccountPanel();
    openAuthModal("login");
  });
  signupOpenBtn.addEventListener("click", () => {
    closeAccountPanel();
    openAuthModal("signup");
  });
  logoutBtn.addEventListener("click", () => {
    closeAccountPanel();
    logout();
  });
  authCloseBtn.addEventListener("click", closeAuthModal);
  authLoginTab.addEventListener("click", () => openAuthModal("login", pendingAfterAuth));
  authSignupTab.addEventListener("click", () => openAuthModal("signup", pendingAfterAuth));
  authForm.addEventListener("submit", handleAuthSubmit);

  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !accountPanel.classList.contains("is-hidden") &&
      !accountPanel.contains(event.target) &&
      !accountFab.contains(event.target)
    ) {
      closeAccountPanel();
    }
  });

  libraryGrid.addEventListener("click", async (event) => {
    const downloadId = event.target.dataset.download;
    const deleteId = event.target.dataset.delete;

    if (downloadId) {
      const photo = await getLibraryPhoto(downloadId);
      if (photo && photo.userId === currentUser.id) {
        downloadBlob(photo.blob, `today4cut-${downloadId}.png`);
      }
    }

    if (deleteId && confirm("이 사진을 보관함에서 삭제할까요?")) {
      await deleteLibraryPhoto(deleteId);
      await renderLibrary();
    }
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  layoutButtons.forEach((button) => {
    button.addEventListener("click", () => setLayout(button.dataset.layout));
  });

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.theme));
  });

  retryCameraBtn.addEventListener("click", startCamera);

  window.addEventListener("pagehide", stopCamera);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && document.querySelector("[data-screen='camera']").classList.contains("is-active")) {
      stopCamera();
    }
  });

  loadSession();
  updateAuthUi();
  setFilter(currentFilter);
  setLayout(currentLayout);
  setTheme(currentTheme);
})();
