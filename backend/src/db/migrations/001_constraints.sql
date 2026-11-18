-- Optional hardening. The API already enforces these rules in code; this makes the database enforce them too.
CREATE UNIQUE INDEX IF NOT EXISTS task_dependencies_unique_pair
  ON task_dependencies (task_id, depends_on_task_id);

CREATE INDEX IF NOT EXISTS auth_sessions_token_hash_idx ON auth_sessions (token_hash);
CREATE INDEX IF NOT EXISTS tasks_workspace_idx ON tasks (workspace_id);
CREATE INDEX IF NOT EXISTS workflow_runs_task_idx ON workflow_runs (task_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_no_self') THEN
    ALTER TABLE task_dependencies ADD CONSTRAINT task_dependencies_no_self CHECK (task_id <> depends_on_task_id);
  END IF;
END $$;
