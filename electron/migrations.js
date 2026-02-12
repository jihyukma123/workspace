const migrationSql = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  position INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wiki_pages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  position INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES wiki_pages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS memos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_project_status ON issues(project_id, status);
CREATE INDEX IF NOT EXISTS idx_wiki_project_parent ON wiki_pages(project_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_memos_project ON memos(project_id);
`;

export const migrations = [
  {
    id: 1,
    name: "init",
    up: migrationSql,
  },
  {
    id: 2,
    name: "feedback",
    up: `
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
    `,
  },
  {
    id: 3,
    name: "reminders",
    up: `
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        text TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_reminders_project ON reminders(project_id);
      CREATE INDEX IF NOT EXISTS idx_reminders_project_status ON reminders(project_id, status);
    `,
  },
  {
    id: 4,
    name: "daily_logs",
    up: `
      CREATE TABLE IF NOT EXISTS daily_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        date TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_logs_project_date ON daily_logs(project_id, date);
      CREATE INDEX IF NOT EXISTS idx_daily_logs_project_created ON daily_logs(project_id, created_at);
    `,
  },
  {
    id: 5,
    name: "issue_comments",
    up: `
      CREATE TABLE IF NOT EXISTS issue_comments (
        id TEXT PRIMARY KEY,
        issue_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_created ON issue_comments(issue_id, created_at);
    `,
  },
  {
    id: 6,
    name: "due_date",
    up: `
      ALTER TABLE tasks ADD COLUMN due_date INTEGER;
      ALTER TABLE issues ADD COLUMN due_date INTEGER;

      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_issues_due_date ON issues(due_date);
    `,
  },
  {
    id: 7,
    name: "reminder_notifications",
    up: `
      ALTER TABLE reminders ADD COLUMN remind_at INTEGER;
      ALTER TABLE reminders ADD COLUMN notified INTEGER DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
    `,
  },
  {
    id: 8,
    name: "remove_description_columns",
    up: `
      -- SQLite doesn't support DROP COLUMN directly, so we need to recreate the tables
      -- Projects table: remove description
      CREATE TABLE projects_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      INSERT INTO projects_new (id, name, created_at)
        SELECT id, name, created_at FROM projects;
      DROP TABLE projects;
      ALTER TABLE projects_new RENAME TO projects;

      -- Tasks table: remove description
      CREATE TABLE tasks_new (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        position INTEGER,
        due_date INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      INSERT INTO tasks_new (id, project_id, title, status, priority, created_at, updated_at, position, due_date)
        SELECT id, project_id, title, status, priority, created_at, updated_at, position, due_date FROM tasks;
      DROP TABLE tasks;
      ALTER TABLE tasks_new RENAME TO tasks;

      CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

      -- Issues table: remove description
      CREATE TABLE issues_new (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        due_date INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      INSERT INTO issues_new (id, project_id, title, status, priority, created_at, updated_at, due_date)
        SELECT id, project_id, title, status, priority, created_at, updated_at, due_date FROM issues;
      DROP TABLE issues;
      ALTER TABLE issues_new RENAME TO issues;

      CREATE INDEX IF NOT EXISTS idx_issues_project_status ON issues(project_id, status);
      CREATE INDEX IF NOT EXISTS idx_issues_due_date ON issues(due_date);
    `,
  },
  {
    id: 9,
    name: "trash_soft_delete",
    up: `
      ALTER TABLE memos ADD COLUMN deleted_at INTEGER;
      ALTER TABLE issues ADD COLUMN deleted_at INTEGER;
      ALTER TABLE wiki_pages ADD COLUMN deleted_at INTEGER;

      CREATE INDEX IF NOT EXISTS idx_memos_project_deleted ON memos(project_id, deleted_at);
      CREATE INDEX IF NOT EXISTS idx_issues_project_deleted ON issues(project_id, deleted_at);
      CREATE INDEX IF NOT EXISTS idx_wiki_project_deleted ON wiki_pages(project_id, deleted_at);
    `,
  },
];
