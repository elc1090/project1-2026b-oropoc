const DB_NAME = "attendance-local-db";
const DB_VERSION = 1;

let db;
let pendingImport = null;
let currentClass = null;
let currentStudents = [];
let currentSession = null;
let attendanceMap = new Map();
let currentFilter = "all";

const $ = (id) => document.getElementById(id);

const el = {
  emptyState: $("emptyState"),
  dashboard: $("dashboard"),
  csvInput: $("csvInput"),
  dialogCsvInput: $("dialogCsvInput"),
  loadSampleBtn: $("loadSampleBtn"),
  classSelect: $("classSelect"),
  sessionDate: $("sessionDate"),
  startSessionBtn: $("startSessionBtn"),
  sessionArea: $("sessionArea"),
  sessionMeta: $("sessionMeta"),
  sessionTitle: $("sessionTitle"),
  progressText: $("progressText"),
  totalCount: $("totalCount"),
  presentCount: $("presentCount"),
  absentCount: $("absentCount"),
  searchInput: $("searchInput"),
  studentList: $("studentList"),
  markAllPresentBtn: $("markAllPresentBtn"),
  saveState: $("saveState"),
  exportCsvBtn: $("exportCsvBtn"),
  exportJsonBtn: $("exportJsonBtn"),
  manageClassesBtn: $("manageClassesBtn"),
  classDialog: $("classDialog"),
  closeDialogBtn: $("closeDialogBtn"),
  classList: $("classList"),
  importDialog: $("importDialog"),
  importForm: $("importForm"),
  classNameInput: $("classNameInput"),
  importSummary: $("importSummary"),
  cancelImportBtn: $("cancelImportBtn"),
  cancelImportTextBtn: $("cancelImportTextBtn"),
  toast: $("toast"),
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  db = await openDatabase();
  el.sessionDate.value = todayLocal();
  bindEvents();
  await refreshClasses();
}

function bindEvents() {
  el.csvInput.addEventListener("change", (e) => handleFileInput(e.target));
  el.dialogCsvInput.addEventListener("change", (e) => handleFileInput(e.target));
  el.loadSampleBtn.addEventListener("click", loadSampleClass);
  el.startSessionBtn.addEventListener("click", openSession);
  el.classSelect.addEventListener("change", () => {
    el.sessionArea.classList.add("hidden");
    currentSession = null;
  });
  el.sessionDate.addEventListener("change", () => {
    el.sessionArea.classList.add("hidden");
    currentSession = null;
  });
  el.searchInput.addEventListener("input", renderStudents);
  el.markAllPresentBtn.addEventListener("click", markAllPresent);
  el.exportCsvBtn.addEventListener("click", exportCsv);
  el.exportJsonBtn.addEventListener("click", exportJson);

  el.manageClassesBtn.addEventListener("click", async () => {
    await renderClassManager();
    el.classDialog.showModal();
  });
  el.closeDialogBtn.addEventListener("click", () => el.classDialog.close());

  el.importForm.addEventListener("submit", confirmImport);
  el.cancelImportBtn.addEventListener("click", cancelImport);
  el.cancelImportTextBtn.addEventListener("click", cancelImport);

  document.querySelectorAll(".summary-action").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      document.querySelectorAll(".summary-action").forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      renderStudents();
    });
  });

  document.querySelector('.summary-action[data-filter="all"]').classList.add("active");
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("classes")) {
        db.createObjectStore("classes", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("students")) {
        const store = db.createObjectStore("students", { keyPath: "key" });
        store.createIndex("classId", "classId", { unique: false });
      }

      if (!db.objectStoreNames.contains("sessions")) {
        const store = db.createObjectStore("sessions", { keyPath: "id" });
        store.createIndex("classId", "classId", { unique: false });
        store.createIndex("date", "date", { unique: false });
      }

      if (!db.objectStoreNames.contains("attendance")) {
        const store = db.createObjectStore("attendance", { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
        store.createIndex("studentKey", "studentKey", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(storeName, mode = "readonly") {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll(storeName) {
  return requestToPromise(tx(storeName).getAll());
}

async function getByIndex(storeName, indexName, value) {
  return requestToPromise(tx(storeName).index(indexName).getAll(value));
}

async function put(storeName, value) {
  return requestToPromise(tx(storeName, "readwrite").put(value));
}

async function deleteRecord(storeName, key) {
  return requestToPromise(tx(storeName, "readwrite").delete(key));
}

async function refreshClasses(preferredId = null) {
  const classes = (await getAll("classes")).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  el.classSelect.innerHTML = "";
  for (const klass of classes) {
    const option = document.createElement("option");
    option.value = klass.id;
    option.textContent = klass.name;
    el.classSelect.append(option);
  }

  const hasClasses = classes.length > 0;
  el.emptyState.classList.toggle("hidden", hasClasses);
  el.dashboard.classList.toggle("hidden", !hasClasses);

  if (hasClasses) {
    const targetId = preferredId && classes.some(c => c.id === preferredId)
      ? preferredId
      : classes[0].id;
    el.classSelect.value = targetId;
  }
}

async function handleFileInput(input) {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  try {
    const text = await file.text();
    const students = parseCsv(text);
    if (!students.length) throw new Error("Nenhum estudante encontrado.");

    pendingImport = { fileName: file.name, students };
    el.classNameInput.value = file.name.replace(/\.csv$/i, "").replace(/[-_]+/g, " ").trim();
    el.importSummary.textContent = `${students.length} estudante${students.length === 1 ? "" : "s"} encontrado${students.length === 1 ? "" : "s"}.`;
    if (el.classDialog.open) el.classDialog.close();
    el.importDialog.showModal();
    setTimeout(() => el.classNameInput.focus(), 50);
  } catch (error) {
    showToast(error.message || "Não foi possível importar o CSV.");
  }
}

function parseCsv(text) {
  const normalized = text.replace(/^\uFEFF/, "").trim();
  if (!normalized) return [];

  const lines = normalized.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error("O CSV precisa ter cabeçalho e pelo menos um estudante.");

  const delimiter = detectDelimiter(lines[0]);
  const header = parseCsvLine(lines[0], delimiter).map(v => normalizeHeader(v));
  const idIndex = header.indexOf("id");
  const nameIndex = header.indexOf("nome");

  if (idIndex === -1 || nameIndex === -1) {
    throw new Error('Use exatamente as colunas "id" e "nome".');
  }

  const seen = new Set();
  const students = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i], delimiter);
    const id = (row[idIndex] ?? "").trim();
    const name = (row[nameIndex] ?? "").trim();

    if (!id && !name) continue;
    if (!id || !name) throw new Error(`Linha ${i + 1}: id e nome são obrigatórios.`);
    if (seen.has(id)) throw new Error(`ID duplicado no CSV: ${id}`);

    seen.add(id);
    students.push({ id, name });
  }

  return students;
}

function detectDelimiter(headerLine) {
  const commas = (headerLine.match(/,/g) || []).length;
  const semicolons = (headerLine.match(/;/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

function parseCsvLine(line, delimiter) {
  const result = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function confirmImport(event) {
  event.preventDefault();
  if (!pendingImport) return;

  const name = el.classNameInput.value.trim();
  if (!name) return;

  const classId = crypto.randomUUID();

  await put("classes", {
    id: classId,
    name,
    importedAt: new Date().toISOString(),
    studentCount: pendingImport.students.length
  });

  const transaction = db.transaction("students", "readwrite");
  const store = transaction.objectStore("students");

  for (const student of pendingImport.students) {
    store.put({
      key: `${classId}:${student.id}`,
      id: student.id,
      classId,
      name: student.name
    });
  }

  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  pendingImport = null;
  el.importDialog.close();
  await refreshClasses(classId);
  showToast("Turma importada.");
}

function cancelImport() {
  pendingImport = null;
  el.importDialog.close();
}

async function loadSampleClass() {
  const sampleName = "Desenvolvimento Web 2026A";
  const classId = crypto.randomUUID();
  const students = [
    ["2026001", "Ana Silva"],
    ["2026002", "Bruno Souza"],
    ["2026003", "Carla Mendes"],
    ["2026004", "Diego Lima"],
    ["2026005", "Eduarda Martins"],
    ["2026006", "Felipe Rocha"],
    ["2026007", "Gabriela Costa"],
    ["2026008", "Henrique Alves"]
  ];

  await put("classes", {
    id: classId,
    name: sampleName,
    importedAt: new Date().toISOString(),
    studentCount: students.length
  });

  const transaction = db.transaction("students", "readwrite");
  const store = transaction.objectStore("students");
  students.forEach(([id, name]) => {
    store.put({ key: `${classId}:${id}`, id, classId, name });
  });

  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  await refreshClasses(classId);
  showToast("Turma de exemplo criada.");
}

async function openSession() {
  const classId = el.classSelect.value;
  const date = el.sessionDate.value;

  if (!classId || !date) {
    showToast("Selecione turma e data.");
    return;
  }

  currentClass = await requestToPromise(tx("classes").get(classId));
  currentStudents = (await getByIndex("students", "classId", classId))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const sessionId = `${classId}:${date}`;
  currentSession = await requestToPromise(tx("sessions").get(sessionId));

  if (!currentSession) {
    currentSession = {
      id: sessionId,
      classId,
      date,
      createdAt: new Date().toISOString()
    };
    await put("sessions", currentSession);
  }

  const attendance = await getByIndex("attendance", "sessionId", sessionId);
  attendanceMap = new Map(attendance.map(item => [item.studentKey, item.status]));

  el.sessionMeta.textContent = formatDate(date);
  el.sessionTitle.textContent = currentClass.name;
  el.searchInput.value = "";
  currentFilter = "all";
  document.querySelectorAll(".summary-action").forEach((b) => b.classList.toggle("active", b.dataset.filter === "all"));

  el.sessionArea.classList.remove("hidden");
  renderStudents();
  updateSummary();
}

function renderStudents() {
  if (!currentSession) return;

  const search = el.searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const filtered = currentStudents.filter(student => {
    const isPresent = attendanceMap.get(student.key) !== "absent";
    const matchesSearch =
      student.name.toLocaleLowerCase("pt-BR").includes(search) ||
      student.id.toLocaleLowerCase("pt-BR").includes(search);

    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "present" && isPresent) ||
      (currentFilter === "absent" && !isPresent);

    return matchesSearch && matchesFilter;
  });

  el.studentList.innerHTML = "";

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-list";
    empty.textContent = "Nenhum estudante neste filtro.";
    el.studentList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const student of filtered) {
    const isPresent = attendanceMap.get(student.key) !== "absent";
    const row = document.createElement("article");
    row.className = `student-row ${isPresent ? "present" : "absent"}`;

    row.innerHTML = `
      <label class="attendance-check">
        <input class="presence-checkbox" type="checkbox" ${isPresent ? "checked" : ""} />
        <span class="checkmark" aria-hidden="true"></span>
        <span class="student-name">
          <strong>${escapeHtml(student.name)}</strong>
          <span>${escapeHtml(student.id)}</span>
        </span>
        <span class="status-text">${isPresent ? "Presente" : "Ausente"}</span>
      </label>
    `;

    row.querySelector(".presence-checkbox").addEventListener("change", (event) => {
      setPresence(student, event.target.checked);
    });

    fragment.append(row);
  }

  el.studentList.append(fragment);
}

async function setPresence(student, isPresent) {
  if (isPresent) {
    attendanceMap.delete(student.key);
    await deleteRecord("attendance", `${currentSession.id}:${student.key}`);
  } else {
    attendanceMap.set(student.key, "absent");
    await put("attendance", {
      id: `${currentSession.id}:${student.key}`,
      sessionId: currentSession.id,
      classId: currentClass.id,
      date: currentSession.date,
      studentKey: student.key,
      studentId: student.id,
      studentName: student.name,
      status: "absent",
      updatedAt: new Date().toISOString()
    });
  }

  flashSaved();
  renderStudents();
  updateSummary();
}

async function markAllPresent() {
  const records = await getByIndex("attendance", "sessionId", currentSession.id);
  const transaction = db.transaction("attendance", "readwrite");
  const store = transaction.objectStore("attendance");
  records.forEach(record => store.delete(record.id));

  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  attendanceMap.clear();
  flashSaved();
  renderStudents();
  updateSummary();
}

function updateSummary() {
  const total = currentStudents.length;
  let absent = 0;

  for (const student of currentStudents) {
    if (attendanceMap.get(student.key) === "absent") absent++;
  }

  const present = total - absent;

  el.totalCount.textContent = total;
  el.presentCount.textContent = present;
  el.absentCount.textContent = absent;
  el.progressText.textContent = `${present} presente${present === 1 ? "" : "s"} · ${absent} ausente${absent === 1 ? "" : "s"}`;
}

async function renderClassManager() {
  const classes = (await getAll("classes")).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  el.classList.innerHTML = "";

  if (!classes.length) {
    el.classList.innerHTML = `<div class="empty-list">Nenhuma turma importada.</div>`;
    return;
  }

  for (const klass of classes) {
    const item = document.createElement("div");
    item.className = "class-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(klass.name)}</strong>
        <span>${klass.studentCount} estudante${klass.studentCount === 1 ? "" : "s"}</span>
      </div>
      <button class="delete-class" type="button">Excluir</button>
    `;

    item.querySelector(".delete-class").addEventListener("click", async () => {
      await deleteClass(klass.id);
      await renderClassManager();
      await refreshClasses();
    });

    el.classList.append(item);
  }
}

async function deleteClass(classId) {
  const students = await getByIndex("students", "classId", classId);
  const sessions = await getByIndex("sessions", "classId", classId);

  const transaction = db.transaction(["classes", "students", "sessions", "attendance"], "readwrite");
  transaction.objectStore("classes").delete(classId);

  const studentStore = transaction.objectStore("students");
  students.forEach(student => studentStore.delete(student.key));

  const sessionStore = transaction.objectStore("sessions");
  const attendanceStore = transaction.objectStore("attendance");

  for (const session of sessions) {
    sessionStore.delete(session.id);
    const attendance = await getByIndex("attendance", "sessionId", session.id);
    attendance.forEach(item => attendanceStore.delete(item.id));
  }

  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  el.sessionArea.classList.add("hidden");
  showToast("Turma excluída.");
}

function exportCsv() {
  if (!currentSession) return;

  const rows = [["id", "nome", "data", "status"]];
  currentStudents.forEach(student => {
    rows.push([
      student.id,
      student.name,
      currentSession.date,
      attendanceMap.get(student.key) === "absent" ? "absent" : "present"
    ]);
  });

  const csv = rows.map(row => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, `${safeFileName(currentClass.name)}-${currentSession.date}.csv`, "text/csv;charset=utf-8");
}

function exportJson() {
  if (!currentSession) return;

  const data = {
    turma: {
      id: currentClass.id,
      nome: currentClass.name
    },
    data: currentSession.date,
    presencas: currentStudents.map(student => ({
      id: student.id,
      nome: student.name,
      status: attendanceMap.get(student.key) === "absent" ? "absent" : "present"
    }))
  };

  downloadBlob(JSON.stringify(data, null, 2), `${safeFileName(currentClass.name)}-${currentSession.date}.json`, "application/json");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function flashSaved() {
  el.saveState.textContent = "Salvando…";
  window.setTimeout(() => {
    el.saveState.textContent = "Salvo neste navegador";
  }, 220);
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 1800);
}

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${isoDate}T12:00:00`));
}

function safeFileName(name) {
  return name.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
