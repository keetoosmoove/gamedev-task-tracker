// Tasks are stored in the Supabase "tasks" table (no authentication yet).
const SUPABASE_URL = "https://cthtlwrglchifjwwirhs.supabase.co";
const SUPABASE_KEY = "sb_publishable_425-6JtVLwIfBYMd7osCKw_v3Gx3_pi";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

let tasks = [];

async function loadTasks() {
  emptyMessage.textContent = "Loading tasks...";
  emptyMessage.classList.remove("hidden");

  const { data, error } = await db
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    tasks = [];
    emptyMessage.textContent = "Could not load tasks: " + error.message;
    taskList.innerHTML = "";
    return;
  }

  tasks = data;
  renderTasks();
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
  if (!task.due_date || task.status === "Done") return false;
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return task.due_date < today;
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
    meta.textContent = "Due: " + formatDate(task.due_date) + (isOverdue(task) ? " (overdue)" : "");
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
  descInput.value = task.description || "";
  dueInput.value = task.due_date || "";
  statusInput.value = task.status;

  formTitle.textContent = "Edit Task";
  submitBtn.textContent = "Save Changes";
  cancelBtn.classList.remove("hidden");
  titleInput.focus();
  form.scrollIntoView({ behavior: "smooth" });
}

async function deleteTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task || !confirm(`Delete "${task.title}"?`)) return;

  const { error } = await db.from("tasks").delete().eq("id", id);
  if (error) {
    console.error(error);
    alert("Could not delete task: " + error.message);
    return;
  }

  tasks = tasks.filter((t) => t.id !== id);
  if (idInput.value === String(id)) resetForm();
  renderTasks();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  const data = {
    title,
    description: descInput.value.trim(),
    due_date: dueInput.value || null,
    status: statusInput.value,
  };

  submitBtn.disabled = true;

  const editingId = idInput.value;
  const editingTask = editingId && tasks.find((t) => String(t.id) === editingId);
  const { data: saved, error } = editingTask
    ? await db.from("tasks").update(data).eq("id", editingTask.id).select().single()
    : await db.from("tasks").insert(data).select().single();

  submitBtn.disabled = false;

  if (error) {
    console.error(error);
    alert("Could not save task: " + error.message);
    return;
  }

  if (editingTask) {
    tasks = tasks.map((t) => (t.id === saved.id ? saved : t));
  } else {
    tasks.push(saved);
  }

  resetForm();
  renderTasks();
});

cancelBtn.addEventListener("click", resetForm);
filterSelect.addEventListener("change", renderTasks);

loadTasks();
