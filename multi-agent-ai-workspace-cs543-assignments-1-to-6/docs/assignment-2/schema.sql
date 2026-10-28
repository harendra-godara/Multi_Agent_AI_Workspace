-- Multi-Agent AI Workspace service-owned schema sketch
CREATE TABLE users (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE auth_sessions (id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL, token_hash TEXT NOT NULL, expires_at TIMESTAMP NOT NULL);
CREATE TABLE workspaces (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, owner_user_id BIGINT NOT NULL);
CREATE TABLE workspace_members (workspace_id BIGINT NOT NULL, user_id BIGINT NOT NULL, role TEXT NOT NULL, PRIMARY KEY(workspace_id,user_id));
CREATE TABLE tasks (id BIGSERIAL PRIMARY KEY, workspace_id BIGINT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE task_dependencies (task_id BIGINT NOT NULL, depends_on_task_id BIGINT NOT NULL, PRIMARY KEY(task_id,depends_on_task_id));
CREATE TABLE workflow_runs (id BIGSERIAL PRIMARY KEY, task_id BIGINT NOT NULL, status TEXT NOT NULL, started_at TIMESTAMP, completed_at TIMESTAMP);
CREATE TABLE agents (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, capability TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE agent_runs (id BIGSERIAL PRIMARY KEY, workflow_run_id BIGINT NOT NULL, agent_id BIGINT NOT NULL, status TEXT NOT NULL);
CREATE TABLE messages (id BIGSERIAL PRIMARY KEY, agent_run_id BIGINT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL);
CREATE TABLE agent_context (id BIGSERIAL PRIMARY KEY, workflow_run_id BIGINT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL);
CREATE TABLE artifacts (id BIGSERIAL PRIMARY KEY, workflow_run_id BIGINT NOT NULL, name TEXT NOT NULL, media_type TEXT NOT NULL, location TEXT NOT NULL);
CREATE TABLE reviews (id BIGSERIAL PRIMARY KEY, artifact_id BIGINT NOT NULL, verdict TEXT NOT NULL, comments TEXT);
CREATE TABLE execution_logs (id BIGSERIAL PRIMARY KEY, workflow_run_id BIGINT NOT NULL, level TEXT NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP NOT NULL);
CREATE TABLE test_runs (id BIGSERIAL PRIMARY KEY, workflow_run_id BIGINT NOT NULL, status TEXT NOT NULL, summary TEXT);

-- In the production design, these cross-service references are API-level identifiers.
-- Do not add database foreign keys across service databases.
