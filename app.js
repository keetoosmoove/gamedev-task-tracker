// Tasks are stored in localStorage for now (no backend yet).
const STORAGE_KEY = "gamedev-tasks";

const form = document.getElementById("task-form");
const formTitle = document.getElementById("form-title");
const idInput = document.getElementById("task-id");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const dueInput = document.getElementById("due-date");
const statusInput = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const filterSelect = document.getElementById("filter");
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");

let tasks = loadTasks();

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function statusClass(status) {
  if (status === "In Progress") return "in-progress";
  if (status === "Done") return "done";
  return "todo";
}

function formatDate(dateStr) {
  if (!dateStr) return "No due date";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "Done") return false;
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return task.dueDate < today;
}

function renderTasks() {
  const filter = filterSelect.value;
  const visible = tasks.filter((t) => filter === "All" || t.status === filter);

  taskList.innerHTML = "";
  emptyMessage.textContent = tasks.length === 0 ? "No tasks yet. Add one above!" : "No tasks match this filter.";
  emptyMessage.classList.toggle("hidden", visible.length > 0);

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task" + (task.status === "Done" ? " is-done" : "");

    const top = document.createElement("div");
    top.className = "task-top";

    const title = document.createElement("h3");
    title.textContent = task.title;

    const badge = document.createElement("span");
    badge.className = "badge " + statusClass(task.status);
    badge.textContent = task.status;

    top.append(title, badge);
    li.append(top);

    if (task.description) {
      const desc = document.createElement("p");
      desc.textContent = task.description;
      li.append(desc);
    }

    const meta = document.createElement("div");
    meta.className = "task-meta" + (isOverdue(task) ? " overdue" : "");
    meta.textContent = "Due: " + formatDate(task.dueDate) + (isOverdue(task) ? " (overdue)" : "");
    li.append(meta);

    const buttons = document.createElement("div");
    buttons.className = "task-buttons";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEdit(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "danger";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    buttons.append(editBtn, deleteBtn);
    li.append(buttons);

    taskList.append(li);
  });
}

function resetForm() {
  form.reset();
  idInput.value = "";
  formTitle.textContent = "Add Task";
  submitBtn.textContent = "Add Task";
  cancelBtn.classList.add("hidden");
}

function startEdit(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  idInput.value = task.id;
  titleInput.value = task.title;
  descInput.value = task.description;
  dueInput.value = task.dueDate;
  statusInput.value = task.status;

  formTitle.textContent = "Edit Task";
  submitBtn.textContent = "Save Changes";
  cancelBtn.classList.remove("hidden");
  titleInput.focus();
  form.scrollIntoView({ behavior: "smooth" });
}

function deleteTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task || !confirm(`Delete "${task.title}"?`)) return;

  tasks = tasks.filter((t) => t.id !== id);
  if (idInput.value === id) resetForm();
  saveTasks();
  renderTasks();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  const data = {
    title,
    description: descInput.value.trim(),
    dueDate: dueInput.value,
    status: statusInput.value,
  };

  const editingId = idInput.value;
  if (editingId) {
    tasks = tasks.map((t) => (t.id === editingId ? { ...t, ...data } : t));
  } else {
    tasks.push({ id: Date.now().toString(), ...data });
  }

  saveTasks();
  resetForm();
  renderTasks();
});

cancelBtn.addEventListener("click", resetForm);
filterSelect.addEventListener("change", renderTasks);

renderTasks();
