-- Multi-Agent AI Orchestration Platform
-- Assignment 2 — CREATE TABLE sketch
-- Cross-service IDs marked as external are intentionally not declared
-- as database foreign keys across service boundaries.

CREATE DATABASE IF NOT EXISTS multi_agent_ai;
USE multi_agent_ai;

-- Identity & Access Service
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_sessions (
    session_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL, -- external reference to users.user_id
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspace & Task Service
CREATE TABLE workspaces (
    workspace_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    owner_id BIGINT NOT NULL, -- external reference to users.user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspace_members (
    member_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL, -- external reference to users.user_id
    role ENUM('owner','member') NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id),
    UNIQUE (workspace_id, user_id)
);

CREATE TABLE tasks (
    task_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL, -- external reference to users.user_id
    description TEXT NOT NULL,
    status ENUM('queued','running','completed','failed','cancelled')
        NOT NULL DEFAULT 'queued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id)
);

CREATE TABLE task_dependencies (
    dependency_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    depends_on_task_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id),
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(task_id)
);

CREATE TABLE workflow_runs (
    run_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    status ENUM('queued','running','completed','failed','cancelled')
        NOT NULL DEFAULT 'queued',
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- AI Agent Service
CREATE TABLE agents (
    agent_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('orchestrator','research','database','coding','testing','review') NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE agent_runs (
    agent_run_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    run_id BIGINT NOT NULL, -- external reference to workflow_runs.run_id
    agent_id BIGINT NOT NULL,
    status ENUM('queued','running','completed','failed')
        NOT NULL DEFAULT 'queued',
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

CREATE TABLE messages (
    message_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agent_run_id BIGINT NOT NULL,
    sender_type ENUM('user','agent','system') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_run_id) REFERENCES agent_runs(agent_run_id)
);

CREATE TABLE agent_context (
    context_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    run_id BIGINT NOT NULL, -- external reference to workflow_runs.run_id
    context_key VARCHAR(120) NOT NULL,
    context_value JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Execution & Artifact Service
CREATE TABLE artifacts (
    artifact_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    run_id BIGINT NOT NULL, -- external reference to workflow_runs.run_id
    type ENUM('research','database','code','test','review','final') NOT NULL,
    name VARCHAR(180) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    review_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    run_id BIGINT NOT NULL, -- external reference to workflow_runs.run_id
    reviewer_agent_id BIGINT NOT NULL, -- external reference to agents.agent_id
    status ENUM('pending','approved','changes_requested','rejected')
        NOT NULL DEFAULT 'pending',
    feedback TEXT
);

CREATE TABLE execution_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    run_id BIGINT NOT NULL, -- external reference to workflow_runs.run_id
    level ENUM('info','warning','error') NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
