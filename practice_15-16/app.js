const STORAGE_KEY = "focus-notes-15-16";
const DEFAULT_PAGE = "home";

const contentRoot = document.getElementById("app-content");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const pageStatus = document.getElementById("page-status");
const networkIndicator = document.getElementById("network-indicator");
const networkText = document.getElementById("network-text");
const enablePushButton = document.getElementById("enable-push");
const disablePushButton = document.getElementById("disable-push");
const refreshShellButton = document.getElementById("refresh-shell");
const navButtons = [...document.querySelectorAll("[data-page]")];

let currentPage = DEFAULT_PAGE;
let socket = null;
let currentSocketId = null;

function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Не удалось прочитать заметки:", error);
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pluralize(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "заметка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "заметки";
  return "заметок";
}

function setShellMeta(page) {
  const config = {
    home: {
      title: "Главная",
      subtitle: "Добавляй заметки, проверяй офлайн-режим, realtime-синхронизацию и push.",
      status: "App Shell + WebSocket + Push",
    },
    about: {
      title: "О приложении",
      subtitle: "Короткая справка о приложении",
      status: "HTTPS + PWA",
    },
  };

  const meta = config[page] || config.home;
  if (pageTitle) pageTitle.textContent = meta.title;
  if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;
  if (pageStatus) pageStatus.textContent = meta.status;
}

function setActivePage(page) {
  currentPage = page;
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  setShellMeta(page);
}

async function loadContent(page) {
  try {
    setActivePage(page);
    const response = await fetch(`./content/${page}.html`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Не удалось загрузить ${page}.html`);
    }

    contentRoot.innerHTML = await response.text();

    if (page === "home") {
      initHomePage();
    }
  } catch (error) {
    console.error(error);
    contentRoot.innerHTML = `
      <section class="inner-card">
        <h2>Ошибка загрузки</h2>
        <p class="muted">Не удалось подгрузить содержимое страницы. Попробуй обновить shell или проверь сервер.</p>
      </section>
    `;
  }
}

function renderNotes() {
  const list = document.getElementById("notes-list");
  const count = document.getElementById("notes-count");
  const empty = document.getElementById("notes-empty");

  if (!list || !count || !empty) {
    return;
  }

  const notes = loadNotes();
  count.textContent = `${notes.length} ${pluralize(notes.length)}`;
  empty.hidden = notes.length > 0;
  list.innerHTML = "";

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.className = "note-item";
    item.innerHTML = `
      <div class="note-row">
        <div>
          <h3>${escapeHtml(note.title)}</h3>
          <p class="muted">${formatDate(note.createdAt)}</p>
        </div>
        <button class="mini-button danger" data-action="delete" data-id="${note.id}" type="button">
          Удалить
        </button>
      </div>
      <p>${escapeHtml(note.body)}</p>
    `;
    list.appendChild(item);
  });
}

function addNote({ id = crypto.randomUUID(), title, body, createdAt = new Date().toISOString() }) {
  const notes = loadNotes();

  if (notes.some((note) => note.id === id)) {
    return null;
  }

  const note = { id, title, body, createdAt };
  notes.unshift(note);
  saveNotes(notes);
  renderNotes();

  if (socket) {
    socket.emit("newTask", note);
  }

  return note;
}

function removeNote(id) {
  const notes = loadNotes().filter((note) => note.id !== id);
  saveNotes(notes);
  renderNotes();
}

function initHomePage() {
  const form = document.getElementById("note-form");
  const titleInput = document.getElementById("note-title");
  const bodyInput = document.getElementById("note-body");
  const clearButton = document.getElementById("clear-notes");
  const list = document.getElementById("notes-list");

  renderNotes();

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title || !body) {
      return;
    }

    addNote({ title, body });
    form.reset();
    titleInput.focus();
  });

  clearButton?.addEventListener("click", () => {
    if (!window.confirm("Удалить все заметки из localStorage?")) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    renderNotes();
  });

  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='delete']");
    if (!button) {
      return;
    }

    removeNote(button.dataset.id);
  });
}

function showToast(message, variant = "default") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${variant}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 220);
  }, 3000);
}

function updateNetworkState() {
  const online = navigator.onLine;
  if (networkIndicator) {
    networkIndicator.className = `status-dot ${online ? "online" : "offline"}`;
  }

  if (networkText) {
    networkText.textContent = online
      ? "Онлайн: shell и realtime-канал доступны"
      : "Оффлайн: shell и заметки работают из кэша";
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function getPushPublicKey() {
  const response = await fetch("./push-public-key");
  if (!response.ok) {
    throw new Error("Не удалось получить публичный VAPID-ключ");
  }

  const data = await response.json();
  return data.publicKey;
}

async function syncPushButtons() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    enablePushButton.hidden = true;
    disablePushButton.hidden = true;
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  enablePushButton.hidden = Boolean(subscription);
  disablePushButton.hidden = !subscription;
}

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const publicKey = await getPushPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await fetch("./subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });

  await syncPushButtons();
  showToast("Push-уведомления включены", "success");
}

async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    await syncPushButtons();
    return;
  }

  await fetch("./unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
  await syncPushButtons();
  showToast("Push-уведомления отключены", "default");
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
    await syncPushButtons();
  } catch (error) {
    console.error("Ошибка регистрации Service Worker:", error);
  }
}

function initSocket() {
  if (typeof window.io !== "function") {
    console.warn("Socket.IO client library is not loaded");
    return;
  }

  socket = window.io();

  socket.on("connect", () => {
    currentSocketId = socket.id;
  });

  socket.on("taskAdded", (task) => {
    const exists = loadNotes().some((note) => note.id === task.id);

    if (!exists) {
      const notes = loadNotes();
      notes.unshift(task);
      saveNotes(notes);

      if (currentPage === "home") {
        renderNotes();
      }
    }

    if (task.sourceSocketId !== currentSocketId) {
      showToast(`Новая заметка от другого клиента: ${task.title}`, "info");
    }
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loadContent(button.dataset.page);
  });
});

refreshShellButton?.addEventListener("click", () => {
  loadContent(currentPage);
});

enablePushButton?.addEventListener("click", async () => {
  try {
    if (Notification.permission === "denied") {
      alert("Уведомления заблокированы в браузере. Разреши их в настройках сайта.");
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Для push-уведомлений нужно разрешить уведомления.");
        return;
      }
    }

    await subscribeToPush();
  } catch (error) {
    console.error(error);
    showToast("Не удалось включить push-уведомления", "error");
  }
});

disablePushButton?.addEventListener("click", async () => {
  try {
    await unsubscribeFromPush();
  } catch (error) {
    console.error(error);
    showToast("Не удалось отключить push-уведомления", "error");
  }
});

window.addEventListener("online", updateNetworkState);
window.addEventListener("offline", updateNetworkState);

setShellMeta(DEFAULT_PAGE);
updateNetworkState();
initSocket();
registerServiceWorker();
loadContent(DEFAULT_PAGE);
