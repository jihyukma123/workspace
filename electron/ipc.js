import { err, ok } from './result.js';
import { parseInput, schemas } from './validation.js';

const mapProject = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  createdAt: row.created_at,
});

const mapTask = (row) => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  description: row.description ?? '',
  status: row.status,
  priority: row.priority,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
  position: row.position ?? null,
});

const mapIssue = (row) => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  description: row.description ?? '',
  status: row.status,
  priority: row.priority,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapWikiPage = (row) => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  content: row.content,
  parentId: row.parent_id ?? null,
  children: [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  position: row.position ?? null,
});

const mapMemo = (row) => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
});

const mapDailyLog = (row) => ({
  id: row.id,
  projectId: row.project_id,
  date: row.date,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
});

const mapReminder = (row) => ({
  id: row.id,
  projectId: row.project_id,
  text: row.text,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
});

const mapFeedback = (row) => ({
  id: row.id,
  body: row.body,
  createdAt: row.created_at,
});

const handleDbError = (error, message) => {
  return err('DB_ERROR', message, {
    message: error?.message ?? 'Unknown database error',
  });
};

export const registerIpcHandlers = (ipcMain, db) => {
  ipcMain.handle('projects:list', () => {
    try {
      const rows = db.prepare('SELECT * FROM projects ORDER BY created_at ASC').all();
      return ok(rows.map(mapProject));
    } catch (error) {
      return handleDbError(error, 'Failed to load projects');
    }
  });

  ipcMain.handle('projects:create', (_event, input) => {
    const parsed = parseInput(schemas.projectCreate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const payload = parsed.data;
      db.prepare(
        'INSERT INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)' 
      ).run(payload.id, payload.name, payload.description ?? null, payload.createdAt);
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(payload.id);
      return ok(mapProject(row));
    } catch (error) {
      return handleDbError(error, 'Failed to create project');
    }
  });

  ipcMain.handle('projects:update', (_event, input) => {
    const parsed = parseInput(schemas.projectUpdate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const { id, updates } = parsed.data;
      const fields = [];
      const values = [];
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      values.push(id);
      const statement = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;
      const info = db.prepare(statement).run(...values);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Project not found');
      }
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
      return ok(mapProject(row));
    } catch (error) {
      return handleDbError(error, 'Failed to update project');
    }
  });

  ipcMain.handle('projects:delete', (_event, input) => {
    const parsed = parseInput(schemas.projectDelete, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const info = db.prepare('DELETE FROM projects WHERE id = ?').run(parsed.data.id);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Project not found');
      }
      return ok({ id: parsed.data.id });
    } catch (error) {
      return handleDbError(error, 'Failed to delete project');
    }
  });

  ipcMain.handle('tasks:list', (_event, input) => {
    const parsed = parseInput(schemas.projectId, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const rows = db
        .prepare(
          `SELECT * FROM tasks
           WHERE project_id = ?
           ORDER BY position IS NULL, position ASC, created_at ASC`
        )
        .all(parsed.data.projectId);
      return ok(rows.map(mapTask));
    } catch (error) {
      return handleDbError(error, 'Failed to load tasks');
    }
  });

  ipcMain.handle('tasks:create', (_event, input) => {
    const parsed = parseInput(schemas.taskCreate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const payload = parsed.data;
      db.prepare(
        `INSERT INTO tasks
          (id, project_id, title, description, status, priority, created_at, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.projectId,
        payload.title,
        payload.description ?? null,
        payload.status,
        payload.priority,
        payload.createdAt,
        payload.position ?? null
      );
      const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(payload.id);
      return ok(mapTask(row));
    } catch (error) {
      return handleDbError(error, 'Failed to create task');
    }
  });

  ipcMain.handle('tasks:update', (_event, input) => {
    const parsed = parseInput(schemas.taskUpdate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const { id, updates } = parsed.data;
      const fields = [];
      const values = [];
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.priority !== undefined) {
        fields.push('priority = ?');
        values.push(updates.priority);
      }
      if (updates.position !== undefined) {
        fields.push('position = ?');
        values.push(updates.position);
      }
      fields.push('updated_at = ?');
      values.push(Date.now());

      values.push(id);
      const statement = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
      const info = db.prepare(statement).run(...values);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Task not found');
      }
      const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      return ok(mapTask(row));
    } catch (error) {
      return handleDbError(error, 'Failed to update task');
    }
  });

  ipcMain.handle('tasks:delete', (_event, input) => {
    const parsed = parseInput(schemas.taskDelete, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(parsed.data.id);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Task not found');
      }
      return ok({ id: parsed.data.id });
    } catch (error) {
      return handleDbError(error, 'Failed to delete task');
    }
  });

  ipcMain.handle('issues:list', (_event, input) => {
    const parsed = parseInput(schemas.projectId, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const rows = db
        .prepare('SELECT * FROM issues WHERE project_id = ? ORDER BY created_at ASC')
        .all(parsed.data.projectId);
      return ok(rows.map(mapIssue));
    } catch (error) {
      return handleDbError(error, 'Failed to load issues');
    }
  });

  ipcMain.handle('issues:create', (_event, input) => {
    const parsed = parseInput(schemas.issueCreate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const payload = parsed.data;
      db.prepare(
        `INSERT INTO issues
          (id, project_id, title, description, status, priority, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.projectId,
        payload.title,
        payload.description ?? null,
        payload.status,
        payload.priority,
        payload.createdAt,
        payload.updatedAt
      );
      const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(payload.id);
      return ok(mapIssue(row));
    } catch (error) {
      return handleDbError(error, 'Failed to create issue');
    }
  });

  ipcMain.handle('issues:update', (_event, input) => {
    const parsed = parseInput(schemas.issueUpdate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const { id, updates } = parsed.data;
      const fields = [];
      const values = [];
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.priority !== undefined) {
        fields.push('priority = ?');
        values.push(updates.priority);
      }
      fields.push('updated_at = ?');
      values.push(Date.now());

      values.push(id);
      const statement = `UPDATE issues SET ${fields.join(', ')} WHERE id = ?`;
      const info = db.prepare(statement).run(...values);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Issue not found');
      }
      const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
      return ok(mapIssue(row));
    } catch (error) {
      return handleDbError(error, 'Failed to update issue');
    }
  });

  ipcMain.handle('issues:delete', (_event, input) => {
    const parsed = parseInput(schemas.issueDelete, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const info = db.prepare('DELETE FROM issues WHERE id = ?').run(parsed.data.id);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Issue not found');
      }
      return ok({ id: parsed.data.id });
    } catch (error) {
      return handleDbError(error, 'Failed to delete issue');
    }
  });

  ipcMain.handle('wiki:list', (_event, input) => {
    const parsed = parseInput(schemas.projectId, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const rows = db
        .prepare(
          `SELECT * FROM wiki_pages
           WHERE project_id = ?
           ORDER BY position IS NULL, position ASC, created_at ASC`
        )
        .all(parsed.data.projectId);
      return ok(rows.map(mapWikiPage));
    } catch (error) {
      return handleDbError(error, 'Failed to load wiki pages');
    }
  });

  ipcMain.handle('wiki:create', (_event, input) => {
    const parsed = parseInput(schemas.wikiCreate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const payload = parsed.data;
      db.prepare(
        `INSERT INTO wiki_pages
          (id, project_id, title, content, parent_id, created_at, updated_at, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.projectId,
        payload.title,
        payload.content,
        payload.parentId ?? null,
        payload.createdAt,
        payload.updatedAt,
        payload.position ?? null
      );
      const row = db.prepare('SELECT * FROM wiki_pages WHERE id = ?').get(payload.id);
      return ok(mapWikiPage(row));
    } catch (error) {
      return handleDbError(error, 'Failed to create wiki page');
    }
  });

  ipcMain.handle('wiki:update', (_event, input) => {
    const parsed = parseInput(schemas.wikiUpdate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const { id, updates } = parsed.data;
      const fields = [];
      const values = [];
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.content !== undefined) {
        fields.push('content = ?');
        values.push(updates.content);
      }
      if (updates.parentId !== undefined) {
        fields.push('parent_id = ?');
        values.push(updates.parentId);
      }
      if (updates.position !== undefined) {
        fields.push('position = ?');
        values.push(updates.position);
      }
      fields.push('updated_at = ?');
      values.push(Date.now());

      values.push(id);
      const statement = `UPDATE wiki_pages SET ${fields.join(', ')} WHERE id = ?`;
      const info = db.prepare(statement).run(...values);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Wiki page not found');
      }
      const row = db.prepare('SELECT * FROM wiki_pages WHERE id = ?').get(id);
      return ok(mapWikiPage(row));
    } catch (error) {
      return handleDbError(error, 'Failed to update wiki page');
    }
  });

  ipcMain.handle('wiki:delete', (_event, input) => {
    const parsed = parseInput(schemas.wikiDelete, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const info = db.prepare('DELETE FROM wiki_pages WHERE id = ?').run(parsed.data.id);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Wiki page not found');
      }
      return ok({ id: parsed.data.id });
    } catch (error) {
      return handleDbError(error, 'Failed to delete wiki page');
    }
  });

  ipcMain.handle('memos:list', (_event, input) => {
    const parsed = parseInput(schemas.projectId, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const rows = db
        .prepare('SELECT * FROM memos WHERE project_id = ? ORDER BY created_at ASC')
        .all(parsed.data.projectId);
      return ok(rows.map(mapMemo));
    } catch (error) {
      return handleDbError(error, 'Failed to load memos');
    }
  });

  ipcMain.handle('memos:create', (_event, input) => {
    const parsed = parseInput(schemas.memoCreate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const payload = parsed.data;
      db.prepare(
        `INSERT INTO memos
          (id, project_id, title, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.projectId,
        payload.title,
        payload.content,
        payload.createdAt,
        payload.updatedAt ?? null
      );
      const row = db.prepare('SELECT * FROM memos WHERE id = ?').get(payload.id);
      return ok(mapMemo(row));
    } catch (error) {
      return handleDbError(error, 'Failed to create memo');
    }
  });

  ipcMain.handle('feedback:create', (_event, input) => {
    const parsed = parseInput(schemas.feedbackCreate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const payload = parsed.data;
      db.prepare(
        'INSERT INTO feedback (id, body, created_at) VALUES (?, ?, ?)'
      ).run(payload.id, payload.body, payload.createdAt);
      const row = db.prepare('SELECT * FROM feedback WHERE id = ?').get(payload.id);
      return ok(mapFeedback(row));
    } catch (error) {
      return handleDbError(error, 'Failed to save feedback');
    }
  });

  ipcMain.handle('memos:update', (_event, input) => {
    const parsed = parseInput(schemas.memoUpdate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const { id, updates } = parsed.data;
      const fields = [];
      const values = [];
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.content !== undefined) {
        fields.push('content = ?');
        values.push(updates.content);
      }
      const updatedAt = updates.updatedAt ?? Date.now();
      fields.push('updated_at = ?');
      values.push(updatedAt);

      values.push(id);
      const statement = `UPDATE memos SET ${fields.join(', ')} WHERE id = ?`;
      const info = db.prepare(statement).run(...values);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Memo not found');
      }
      const row = db.prepare('SELECT * FROM memos WHERE id = ?').get(id);
      return ok(mapMemo(row));
    } catch (error) {
      return handleDbError(error, 'Failed to update memo');
    }
  });

  ipcMain.handle('memos:delete', (_event, input) => {
    const parsed = parseInput(schemas.memoDelete, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const info = db.prepare('DELETE FROM memos WHERE id = ?').run(parsed.data.id);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Memo not found');
      }
      return ok({ id: parsed.data.id });
    } catch (error) {
      return handleDbError(error, 'Failed to delete memo');
    }
  });

  ipcMain.handle('dailyLogs:list', (_event, input) => {
    const parsed = parseInput(schemas.projectId, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const rows = db
        .prepare('SELECT * FROM daily_logs WHERE project_id = ? ORDER BY date DESC')
        .all(parsed.data.projectId);
      return ok(rows.map(mapDailyLog));
    } catch (error) {
      return handleDbError(error, 'Failed to load daily logs');
    }
  });

  ipcMain.handle('dailyLogs:create', (_event, input) => {
    const parsed = parseInput(schemas.dailyLogCreate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const payload = parsed.data;
      db.prepare(
        `INSERT INTO daily_logs
          (id, project_id, date, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.projectId,
        payload.date,
        payload.content,
        payload.createdAt,
        payload.updatedAt ?? null
      );
      const row = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(payload.id);
      return ok(mapDailyLog(row));
    } catch (error) {
      return handleDbError(error, 'Failed to create daily log');
    }
  });

  ipcMain.handle('dailyLogs:update', (_event, input) => {
    const parsed = parseInput(schemas.dailyLogUpdate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const { id, updates } = parsed.data;
      const fields = [];
      const values = [];
      if (updates.content !== undefined) {
        fields.push('content = ?');
        values.push(updates.content);
      }
      const updatedAt = updates.updatedAt ?? Date.now();
      fields.push('updated_at = ?');
      values.push(updatedAt);

      values.push(id);
      const statement = `UPDATE daily_logs SET ${fields.join(', ')} WHERE id = ?`;
      const info = db.prepare(statement).run(...values);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Daily log not found');
      }
      const row = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(id);
      return ok(mapDailyLog(row));
    } catch (error) {
      return handleDbError(error, 'Failed to update daily log');
    }
  });

  ipcMain.handle('dailyLogs:delete', (_event, input) => {
    const parsed = parseInput(schemas.dailyLogDelete, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const info = db.prepare('DELETE FROM daily_logs WHERE id = ?').run(parsed.data.id);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Daily log not found');
      }
      return ok({ id: parsed.data.id });
    } catch (error) {
      return handleDbError(error, 'Failed to delete daily log');
    }
  });

  ipcMain.handle('reminders:list', (_event, input) => {
    const parsed = parseInput(schemas.projectId, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const rows = db
        .prepare('SELECT * FROM reminders WHERE project_id = ? ORDER BY created_at ASC')
        .all(parsed.data.projectId);
      return ok(rows.map(mapReminder));
    } catch (error) {
      return handleDbError(error, 'Failed to load reminders');
    }
  });

  ipcMain.handle('reminders:create', (_event, input) => {
    const parsed = parseInput(schemas.reminderCreate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const payload = parsed.data;
      db.prepare(
        `INSERT INTO reminders
          (id, project_id, text, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.projectId,
        payload.text,
        payload.status,
        payload.createdAt,
        payload.updatedAt ?? null
      );
      const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(payload.id);
      return ok(mapReminder(row));
    } catch (error) {
      return handleDbError(error, 'Failed to create reminder');
    }
  });

  ipcMain.handle('reminders:update', (_event, input) => {
    const parsed = parseInput(schemas.reminderUpdate, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const { id, updates } = parsed.data;
      const fields = [];
      const values = [];
      if (updates.text !== undefined) {
        fields.push('text = ?');
        values.push(updates.text);
      }
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      const updatedAt = updates.updatedAt ?? Date.now();
      fields.push('updated_at = ?');
      values.push(updatedAt);

      values.push(id);
      const statement = `UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`;
      const info = db.prepare(statement).run(...values);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Reminder not found');
      }
      const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
      return ok(mapReminder(row));
    } catch (error) {
      return handleDbError(error, 'Failed to update reminder');
    }
  });

  ipcMain.handle('reminders:delete', (_event, input) => {
    const parsed = parseInput(schemas.reminderDelete, input);
    if (!parsed.ok) {
      return parsed;
    }
    try {
      const info = db.prepare('DELETE FROM reminders WHERE id = ?').run(parsed.data.id);
      if (info.changes === 0) {
        return err('NOT_FOUND', 'Reminder not found');
      }
      return ok({ id: parsed.data.id });
    } catch (error) {
      return handleDbError(error, 'Failed to delete reminder');
    }
  });
};
