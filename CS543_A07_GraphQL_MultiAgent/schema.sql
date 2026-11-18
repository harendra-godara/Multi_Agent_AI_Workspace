-- Run with:  psql "$DATABASE_URL" -f schema.sql
DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  assigned_agent VARCHAR(100),
  status         VARCHAR(20)  NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'in_progress', 'done')),
  priority       INTEGER      NOT NULL DEFAULT 1
);

INSERT INTO tasks (title, assigned_agent, status, priority) VALUES
  ('Summarise project requirements', 'Research Agent', 'done',        2),
  ('Generate REST API boilerplate',  'Code Agent',     'in_progress', 3),
  ('Write unit tests for auth',      'Test Agent',     'pending',     1),
  ('Draft deployment notes',         'Docs Agent',     'pending',     1);
