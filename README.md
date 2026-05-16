# 🚀 Task Flow — Enterprise Team Task Management SaaS

Task Flow is a modern full-stack team collaboration and task management platform built for high-performance teams and enterprise-style workflows.
It enables organizations to manage projects, assign tasks, track productivity, and collaborate efficiently with strict Role-Based Access Control (RBAC).

Designed with a premium SaaS-inspired UI and scalable architecture, Task Flow delivers a smooth and professional project management experience for both Admins and Team Members.

---

# ✨ Features

## 🔐 Authentication & Security

* Secure JWT Authentication
* Separate Admin & Member Login
* Role-Based Access Control (RBAC)
* Protected API Routes
* Session Management with Axios Interceptors

---

# 👨‍💼 Admin Capabilities

Admins have complete project and team control.

### ✅ Project Management

* Create Projects
* Edit Project Details
* Delete Projects
* Assign Members to Projects

### ✅ Task Management

* Create Tasks
* Assign Tasks to Members
* Edit Task Details
* Delete Tasks
* Set Priority & Due Dates

### ✅ Dashboard Analytics

* Global Team Statistics
* Project Completion Insights
* Overdue Task Monitoring
* Team Performance Tracking
* Real-Time Activity Feed

---

# 👨‍💻 Member Capabilities

Members have a focused and streamlined workflow.

### ✅ Member Access

* View Assigned Projects
* View Assigned Tasks
* Update Task Status

  * Pending
  * In Progress
  * Completed

### ✅ Personal Dashboard

* Personal Task Analytics
* Completion Progress
* Overdue Task Alerts
* Recent Activity Tracking

---

# 📊 Enterprise Features

* Modern SaaS UI/UX
* Real-Time Search & Filtering
* Kanban Style Workflow
* Toast Notifications
* Error Boundaries for Crash Prevention
* Optimistic UI Updates
* Responsive Design
* Secure REST APIs
* Scalable Architecture

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* Framer Motion
* Axios
* React Router DOM

## Backend

* Flask
* Flask RESTX
* Flask JWT Extended
* SQLAlchemy
* Flask Migrate
* SQLite

## Deployment

* Frontend → Vercel
* Backend → Railway

---

# 🧠 RBAC Workflow

| Feature              | Admin | Member |
| -------------------- | ----- | ------ |
| Create Projects      | ✅     | ❌      |
| Edit/Delete Projects | ✅     | ❌      |
| Create Tasks         | ✅     | ❌      |
| Assign Tasks         | ✅     | ❌      |
| Update Task Status   | ✅     | ✅      |
| View Team Analytics  | ✅     | ❌      |
| View Assigned Tasks  | ✅     | ✅      |

---

# 📂 Project Structure

```bash
task-flow/
│
├── frontend/     # React Frontend
├── backend/      # Flask Backend
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Prashant-2818/task-flow.git
```

---

# Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

Backend runs on:

```bash
http://localhost:5000
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```bash
http://localhost:3000
```

---

# 🌐 Deployment

## Backend

Deployed using Railway

## Frontend

Deployed using Vercel

---

# 📸 Core Modules

* Authentication
* Dashboard
* Projects
* Tasks
* Team Management
* Activity Tracking
* Search & Filters

---

# 🎯 Project Goal

Task Flow was built to simulate a real-world enterprise project management SaaS platform with:

* strict RBAC implementation,
* scalable frontend/backend architecture,
* professional UI,
* and production-oriented workflows.

---

# 👨‍💻 Author

Developed by Prashant Priyadarshi

GitHub:
[Prashant-2818 GitHub Profile](https://github.com/Prashant-2818?utm_source=chatgpt.com)
