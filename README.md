# GameDev Task Tracker

A simple web app for planning and tracking game development tasks, built for Engineering Design 2.

**Live app:** https://gamedev-task-tracker.netlify.app

## What the App Does

GameDev Task Tracker helps a game developer keep track of the work needed to build a game, such as "Implement player jump" or "Design level 2." Each user signs in with their own account and manages a private list of tasks. Every task has a title, an optional description, an optional due date, and a status (To Do, In Progress, or Done).

Users can **create, view, edit, delete, and filter their own tasks**. Tasks are saved in a cloud database, so they are still there after the user logs out or opens the app on another device.

## Main Features

- **User accounts** – register, log in, and log out with an email and password
- **Create tasks** – add a task with a title, description, due date, and status
- **View tasks** – see all of your tasks in a list with color-coded status badges
- **Edit tasks** – update any field of an existing task
- **Delete tasks** – remove a task (with a confirmation prompt)
- **Filter tasks** – show All, To Do, In Progress, or Done tasks
- **Overdue warnings** – unfinished tasks past their due date are marked as overdue
- **Private data** – each user can only see and change their own tasks

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML | Page structure (`index.html`) |
| CSS | Styling and layout (`styles.css`) |
| JavaScript | App logic and user interaction (`app.js`) |
| Supabase | Cloud PostgreSQL database for storing tasks |
| Supabase Authentication | Email/password user accounts and sessions |
| GitHub | Version control and source code hosting |
| Netlify | Hosting and deployment of the live site |
| Claude Code | AI coding assistant used during development |

## Project Structure

```
gamedev-task-tracker/
├── index.html   # Login/register form, task form, and task list
├── styles.css   # App styles
├── app.js       # Supabase connection, authentication, and task CRUD logic
└── README.md
```

## Running Locally

The app is plain HTML, CSS, and JavaScript, so there is no build step or package install.

1. **Clone the repository**
   ```bash
   git clone https://github.com/keetoosmoove/gamedev-task-tracker.git
   cd gamedev-task-tracker
   ```
2. **Start a local web server** in the project folder (any one of these works):
   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx serve .
   ```
   You can also use the **Live Server** extension in VS Code.
3. **Open the app** at http://localhost:8000 (or the address your server prints).
4. **Register an account**, then log in and start adding tasks.

The app connects to the project's existing Supabase database using the URL and publishable key at the top of `app.js`. To use your own Supabase project instead, create the table described below and replace `SUPABASE_URL` and `SUPABASE_KEY` in `app.js` with your project's values (found in the Supabase dashboard under **Project Settings → API**).

## Database Overview

Tasks are stored in a single Supabase (PostgreSQL) table named `tasks`.

| Column | Type | Description |
|---|---|---|
| `id` | bigint (primary key) | Unique task ID, generated automatically |
| `user_id` | uuid | The owner of the task; defaults to the logged-in user (`auth.uid()`) |
| `title` | text | Task title (required) |
| `description` | text | Optional details about the task |
| `due_date` | date | Optional due date |
| `status` | text | `To Do`, `In Progress`, or `Done` |
| `created_at` | timestamptz | When the task was created; used to order the list |

**Row Level Security (RLS)** is enabled on the table, with policies that only allow a user to select, insert, update, and delete rows where `user_id` matches their own user ID. This is what keeps each user's tasks private, even though the publishable key in `app.js` is public.

Example SQL to create the table in a new Supabase project:

```sql
create table tasks (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status text not null default 'To Do',
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "Users can view their own tasks"
  on tasks for select using (auth.uid() = user_id);
create policy "Users can add their own tasks"
  on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks"
  on tasks for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks"
  on tasks for delete using (auth.uid() = user_id);
```

## Authentication Overview

Authentication is handled by **Supabase Authentication** using email and password.

- **Register:** a new user creates an account with an email and a password (at least 6 characters). If email confirmation is turned on in Supabase, the user must click the link in their email before logging in.
- **Log in:** the user signs in with their email and password. Supabase creates a session that is saved in the browser, so the user stays logged in after refreshing the page.
- **Log out:** the Log Out button ends the session and returns the user to the login screen.
- **Protected content:** the task manager is hidden until a user is logged in. The app listens for login/logout events and loads only the current user's tasks. Database security (RLS) makes sure a user cannot read or change anyone else's tasks.

## Demo Video

YouTube demo link: [ADD LINK HERE]
