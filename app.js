// Tasks are stored in the Supabase "tasks" table. Users sign in with Supabase Auth
// (email + password) before the task manager is shown.
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

const authSection = document.getElementById("auth-section");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authMessage = document.getElementById("auth-message");
const authSwitchText = document.getElementById("auth-switch-text");
const authSwitchBtn = document.getElementById("auth-switch-btn");
const appSection = document.getElementById("app-section");
const userBar = document.getElementById("user-bar");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

let tasks = [];
let authMode = "login"; // "login" or "register"
let currentUserId = null;

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

// ---------- Authentication ----------

function showAuthMessage(text, isError) {
  authMessage.textContent = text;
  authMessage.classList.toggle("error", !!isError);
  authMessage.classList.remove("hidden");
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === "register";
  authTitle.textContent = registering ? "Register" : "Log In";
  authSubmit.textContent = registering ? "Create Account" : "Log In";
  authSwitchText.textContent = registering ? "Already have an account?" : "Don't have an account?";
  authSwitchBtn.textContent = registering ? "Log In" : "Register";
  authPassword.autocomplete = registering ? "new-password" : "current-password";
  authMessage.classList.add("hidden");
}

function showLoggedIn(user) {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  userBar.classList.remove("hidden");
  userEmail.textContent = user.email;
}

function showLoggedOut() {
  appSection.classList.add("hidden");
  userBar.classList.add("hidden");
  authSection.classList.remove("hidden");
  userEmail.textContent = "";
  tasks = [];
  taskList.innerHTML = "";
  resetForm();
  filterSelect.value = "All";
}

authSwitchBtn.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value;
  authSubmit.disabled = true;
  authMessage.classList.add("hidden");

  if (authMode === "register") {
    const { data, error } = await db.auth.signUp({ email, password });
    authSubmit.disabled = false;

    if (error) {
      showAuthMessage("Could not register: " + error.message, true);
      return;
    }
    // If email confirmation is enabled in Supabase, no session is returned yet.
    if (!data.session) {
      setAuthMode("login");
      showAuthMessage("Account created! Check your email to confirm it, then log in.");
    }
  } else {
    const { error } = await db.auth.signInWithPassword({ email, password });
    authSubmit.disabled = false;

    if (error) {
      showAuthMessage("Could not log in: " + error.message, true);
      return;
    }
  }

  authPassword.value = "";
});

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  const { error } = await db.auth.signOut();
  logoutBtn.disabled = false;
  if (error) {
    console.error(error);
    alert("Could not log out: " + error.message);
  }
});

// Fires on page load (INITIAL_SESSION), login, logout, and token refresh.
db.auth.onAuthStateChange((event, session) => {
  const user = session ? session.user : null;
  const userId = user ? user.id : null;

  if (user) {
    showLoggedIn(user);
  } else {
    showLoggedOut();
  }

  // Only reload tasks when the signed-in user actually changes (not on token refresh).
  // setTimeout avoids calling Supabase from inside the auth callback, which can deadlock.
  if (userId && userId !== currentUserId) {
    setTimeout(loadTasks, 0);
  }
  currentUserId = userId;
});
