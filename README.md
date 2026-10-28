# 🤖 Multi-Agent AI Workspace

A collaborative AI workspace designed to organize, manage, and interact with multiple AI agents from a single platform.

The **Multi-Agent AI Workspace** provides a structured environment where users can create workspaces, manage members, organize agents, assign tasks, and interact with AI-powered workflows.

---

## 📌 Overview

Modern AI applications often require multiple specialized agents instead of a single general-purpose agent.

This project provides a centralized workspace where different AI agents can be organized and managed according to their responsibilities.

### Example

A workspace could contain:

- 🧠 Research Agent — collects and summarizes information
- 💻 Coding Agent — assists with programming tasks
- 📝 Documentation Agent — generates documentation
- 🧪 Testing Agent — helps validate applications
- 📊 Analysis Agent — analyzes data and produces insights

The goal is to make these agents easier to manage, organize, and use collaboratively.

---

## ✨ Features

### 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Protected routes
- Secure password handling

### 🏢 Workspace Management

- Create workspaces
- View available workspaces
- Switch between workspaces
- Manage workspace members
- Workspace-based access control

### 🤖 AI Agent Management

- Create and organize AI agents
- Display available agents
- Assign agents to specific tasks
- Agent-focused workspace interface

### 👥 Member Management

- Invite members
- Manage workspace members
- Workspace-level authorization
- Role-based access control

### 📋 Task Management

- Create and organize tasks
- Assign tasks to workflows/agents
- Track task-related information

### 🔒 Security

- JWT authentication
- Protected API routes
- Workspace authorization middleware
- Environment-based configuration

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    │   React + Vite       │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │       Backend        │
                    │   Node.js + Express  │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Authentication     Workspace        Member
           Service         Management       Management
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     PostgreSQL       │
                    │       Database       │
                    └──────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- JavaScript
- CSS
- React Router

## Backend

- Node.js
- Express.js
- JWT Authentication
- REST APIs

## Database

- PostgreSQL

## Development Tools

- Git
- GitHub
- Postman
- VS Code
- npm

---

# 📂 Project Structure

```text
Multi_Agent_AI_Workspace/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── invitationController.js
│   │   │   ├── memberController.js
│   │   │   └── workspaceController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── verifyToken.js
│   │   │   └── workspaceAccess.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── invites.js
│   │   │   └── workspaces.js
│   │   │
│   │   └── db/
│   │       └── schema.sql
│   │
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── agents/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── landing/
│   │   │   ├── layout/
│   │   │   └── workspace/
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AgentsPage.jsx
│   │   │   ├── Workspaces.jsx
│   │   │   ├── Workspace.jsx
│   │   │   ├── Members.jsx
│   │   │   ├── Tasks.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── workspace.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   └── PROGRESS.md
│
├── PRD/
│   └── Multi_Agent_AI_Workspace_PRD.html
│
├── MultiAgent_AI_Assignment_2/
├── MultiAgent_AI_Assignment_3/
├── MultiAgent_AI_Assignment_4_FINAL/
│
├── curl-tests.md
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/harendra-godara/Multi_Agent_AI_Workspace.git
cd Multi_Agent_AI_Workspace
```

---

# 🔧 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=multi_agent_workspace
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

Create the PostgreSQL database and run:

```text
backend/src/db/schema.sql
```

Start the backend:

```bash
npm start
```

For development:

```bash
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

---

# 🎨 Frontend Setup

Open a new terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔑 Authentication Flow

The application uses JWT-based authentication.

```text
User
 │
 ▼
Register / Login
 │
 ▼
Backend Authentication API
 │
 ▼
Validate Credentials
 │
 ▼
Generate JWT
 │
 ▼
Frontend Stores Token
 │
 ▼
Protected API Requests
 │
 ▼
verifyToken Middleware
 │
 ▼
Authorized Resource
```

---

# 🌐 API Structure

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Workspaces

```text
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:id
```

### Members

```text
GET    /api/workspaces/:id/members
POST   /api/workspaces/:id/members
```

### Invitations

```text
POST   /api/invites
GET    /api/invites
```

> API endpoints may evolve as the project develops.

---

# 🗄️ Database

The application uses **PostgreSQL** for persistent storage.

The database is responsible for managing information related to:

- Users
- Workspaces
- Workspace members
- Invitations
- Agents
- Tasks
- Authentication-related data

Database schema:

```text
backend/src/db/schema.sql
```

---

# 🧪 Testing

API endpoints can be tested using:

- Postman
- cURL

Example:

```bash
curl http://localhost:5000/api/workspaces
```

Project API test documentation:

```text
curl-tests.md
```

---

# 🔐 Environment Variables

Never commit your `.env` file.

The repository ignores environment files using `.gitignore`.

Example:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multi_agent_workspace
DB_USER=postgres
DB_PASSWORD=********

JWT_SECRET=********
```

---

# 🚀 Development Workflow

```text
Plan
 ↓
Design
 ↓
Database Schema
 ↓
Backend APIs
 ↓
Authentication
 ↓
Frontend
 ↓
Workspace Management
 ↓
Agent Management
 ↓
Testing
 ↓
Integration
```

---

# 📚 Project Documentation

The repository contains documentation for different stages of the project.

```text
docs/
PRD/
MultiAgent_AI_Assignment_2/
MultiAgent_AI_Assignment_3/
MultiAgent_AI_Assignment_4_FINAL/
```

These include:

- Project requirements
- System design
- Database schema
- Service architecture
- SOAP integration
- REST API design
- OpenAPI specifications
- Testing documentation
- Validation results

---

# 🎯 Future Improvements

Planned improvements include:

- [ ] Real AI agent integration
- [ ] Agent-to-agent communication
- [ ] Agent workflow orchestration
- [ ] Real-time collaboration
- [ ] WebSocket support
- [ ] Advanced role-based permissions
- [ ] Task assignment and tracking
- [ ] Agent execution history
- [ ] AI-generated workspace insights
- [ ] Usage analytics
- [ ] Agent performance monitoring
- [ ] Production deployment
- [ ] Docker support
- [ ] Automated CI/CD pipeline

---

# 🌟 Vision

The long-term goal of **Multi-Agent AI Workspace** is to provide a unified platform where users can manage multiple specialized AI agents and coordinate them to solve complex problems.

Instead of interacting with AI agents individually, users can build structured workflows where multiple agents collaborate within the same workspace.

```text
             ┌───────────────┐
             │     User      │
             └───────┬───────┘
                     │
                     ▼
          ┌─────────────────────┐
          │   AI Workspace      │
          └──────────┬──────────┘
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
 ┌──────────┐  ┌──────────┐  ┌──────────┐
 │ Research │  │  Coding  │  │ Testing  │
 │  Agent   │  │  Agent   │  │  Agent   │
 └────┬─────┘  └────┬─────┘  └────┬─────┘
      │             │             │
      └─────────────┼─────────────┘
                    ▼
             ┌─────────────┐
             │   Result    │
             └─────────────┘
```

---

# 👨‍💻 Author

**Harendra Godara**

MCA Student | Full-Stack Developer | AI & Software Engineering Enthusiast

---

# 📄 License

This project is developed for educational and academic purposes.

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.