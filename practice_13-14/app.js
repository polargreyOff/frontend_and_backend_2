const STORAGE_KEY = "focus-notes";

const noteForm = document.getElementById("note-form");
const noteTitle = document.getElementById("note-title");
const noteBody = document.getElementById("note-body");
const notesList = document.getElementById("notes-list");
const emptyState = document.getElementById("empty-state");
const notesCount = document.getElementById("notes-count");
const clearAllButton = document.getElementById("clear-all-button");
const refreshButton = document.getElementById("refresh-button");
const installButton = document.getElementById("install-button");
const networkIndicator = document.getElementById("network-indicator");
const networkText = document.getElementById("network-text");

let deferredInstallPrompt = null;

function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Не удалось загрузить заметки:", error);
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

function renderNotes() {
  const notes = loadNotes();

  notesCount.textContent = `${notes.length} ${pluralize(notes.length)}`;
  emptyState.classList.toggle("hidden", notes.length > 0);
  notesList.innerHTML = "";

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.className = `note-item${note.completed ? " completed" : ""}`;

    item.innerHTML = `
      <div class="note-head">
        <div>
          <h3 class="note-title">${escapeHtml(note.title)}</h3>
          <p class="note-meta">Создано: ${formatDate(note.createdAt)}</p>
        </div>
        <div class="note-actions">
          <button type="button" class="small-button" data-action="toggle" data-id="${note.id}">
            ${note.completed ? "Вернуть в работу" : "Готово"}
          </button>
          <button type="button" class="small-button danger" data-action="delete" data-id="${note.id}">
            Удалить
          </button>
        </div>
      </div>
      <p class="note-body">${escapeHtml(note.body)}</p>
    `;

    notesList.appendChild(item);
  });
}

function pluralize(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "заметка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "заметки";
  return "заметок";
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addNote(title, body) {
  const notes = loadNotes();

  notes.unshift({
    id: crypto.randomUUID(),
    title,
    body,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  saveNotes(notes);
  renderNotes();
}

function toggleNote(id) {
  const notes = loadNotes().map((note) =>
    note.id === id ? { ...note, completed: !note.completed } : note
  );

  saveNotes(notes);
  renderNotes();
}

function deleteNote(id) {
  const notes = loadNotes().filter((note) => note.id !== id);
  saveNotes(notes);
  renderNotes();
}

function clearAllNotes() {
  localStorage.removeItem(STORAGE_KEY);
  renderNotes();
}

function updateNetworkState() {
  const online = navigator.onLine;
  networkIndicator.className = `status-dot ${online ? "online" : "offline"}`;
  networkText.textContent = online
    ? "Онлайн: интерфейс и кэш синхронизированы"
    : "Оффлайн: приложение работает из кэша";
}

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = noteTitle.value.trim();
  const body = noteBody.value.trim();

  if (!title || !body) return;

  addNote(title, body);
  noteForm.reset();
  noteTitle.focus();
});

notesList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "toggle") toggleNote(id);
  if (action === "delete") deleteNote(id);
});

clearAllButton.addEventListener("click", () => {
  if (window.confirm("Удалить все заметки из localStorage?")) {
    clearAllNotes();
  }
});

refreshButton.addEventListener("click", () => {
  renderNotes();
  updateNetworkState();
});

window.addEventListener("online", updateNetworkState);
window.addEventListener("offline", updateNetworkState);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.error("Ошибка регистрации Service Worker:", error);
  }
}

renderNotes();
updateNetworkState();
registerServiceWorker();
