import fs from 'fs';
import path from 'path';
import { ipcMain } from 'electron';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const TABLE_CONFIG = {
  projects: {
    table: 'projects',
    columns: ['name', 'description', 'status'],
    required: ['name'],
    sortable: ['name', 'status', 'created_at', 'updated_at']
  },
  tasks: {
    table: 'tasks',
    columns: ['project_id', 'title', 'description', 'status', 'priority', 'assignee', 'due_at'],
    required: ['project_id', 'title'],
    sortable: ['title', 'status', 'priority', 'due_at', 'created_at', 'updated_at']
  },
  issues: {
    table: 'issues',
    columns: ['project_id', 'title', 'body', 'status', 'severity'],
    required: ['project_id', 'title'],
    sortable: ['title', 'status', 'severity', 'created_at', 'updated_at']
  },
  wiki: {
    table: 'wiki',
    columns: ['project_id', 'title', 'body', 'slug'],
    required: ['project_id', 'title', 'body'],
    sortable: ['title', 'created_at', 'updated_at']
  },
  memos: {
    table: 'memos',
    columns: ['project_id', 'title', 'body', 'tags'],
    required: ['title', 'body'],
    sortable: ['title', 'created_at', 'updated_at']
  }
};

const ok = (data) => ({ ok: true, data });
const fail = (code, message, details) => ({
  ok: false,
  error: { code, message, details }
});

const nowIso = () => new Date().toISOString();

const getSchemaVersion = (db) => {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version');
  return row ? Number(row.value) : 0;
};

const setSchemaVersion = (db, version) => {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run('schema_version', String(version));
};

const ensureMetaTable = (db) => {
  db.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
};

const parseMigrationVersion = (filename) => {
  const match = filename.match(/^(\d+)_/);
  if (!match) {
    return null;
  }
  return Number(match[1]);
};

const runMigrations = (db, migrationsDir) => {
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .map((file) => ({
      file,
      version: parseMigrationVersion(file)
    }))
    .filter((entry) => Number.isInteger(entry.version))
    .sort((a, b) => a.version - b.version);

  let currentVersion = getSchemaVersion(db);

  for (const entry of files) {
    if (entry.version <= currentVersion) {
      continue;
    }
    const sqlPath = path.join(migrationsDir, entry.file);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const run = db.transaction(() => {
      db.exec(sql);
      setSchemaVersion(db, entry.version);
    });
    run();
    currentVersion = entry.version;
  }
};

export const initDb = ({ dbPath, migrationsDir }) => {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  ensureMetaTable(db);
  runMigrations(db, migrationsDir);

  return db;
};

const buildListQuery = (config, payload = {}) => {
  const where = [];
  const params = {};

  if (payload.projectId && config.columns.includes('project_id')) {
    where.push('project_id = @project_id');
    params.project_id = payload.projectId;
  }

  const limit = Math.min(Math.max(Number(payload.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(Number(payload.offset) || 0, 0);

  let orderBy = 'updated_at';
  let direction = 'DESC';
  if (payload.sort && config.sortable.includes(payload.sort.by)) {
    orderBy = payload.sort.by;
    direction = payload.sort.direction === 'ASC' ? 'ASC' : 'DESC';
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT * FROM ${config.table} ${whereClause} ORDER BY ${orderBy} ${direction} LIMIT @limit OFFSET @offset`;

  return {
    sql,
    params: {
      ...params,
      limit,
      offset
    }
  };
};

const normalizePayload = (payload) => (payload && typeof payload === 'object' ? payload : {});

const ensureRequired = (data, required) => {
  const missing = required.filter((key) => data[key] === undefined || data[key] === null || data[key] === '');
  return missing.length ? missing : null;
};

const pickFields = (data, columns) => {
  const result = {};
  for (const key of columns) {
    if (data[key] !== undefined) {
      result[key] = data[key];
    }
  }
  return result;
};

const insertRow = (db, config, data) => {
  const fields = pickFields(data, config.columns);
  const missing = ensureRequired({ ...data, ...fields }, config.required);
  if (missing) {
    return fail('VALIDATION_ERROR', `Missing required fields: ${missing.join(', ')}`);
  }

  const id = randomUUID();
  const timestamp = nowIso();
  const columns = ['id', 'created_at', 'updated_at', ...Object.keys(fields)];
  const placeholders = columns.map((key) => `@${key}`);

  const statement = db.prepare(`INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`);
  statement.run({
    id,
    created_at: timestamp,
    updated_at: timestamp,
    ...fields
  });

  const row = db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(id);
  return ok(row);
};

const updateRow = (db, config, id, data) => {
  const fields = pickFields(data, config.columns);
  if (!Object.keys(fields).length) {
    return fail('VALIDATION_ERROR', 'No fields provided for update');
  }

  const timestamp = nowIso();
  const sets = Object.keys(fields).map((key) => `${key} = @${key}`);
  sets.push('updated_at = @updated_at');

  const statement = db.prepare(`UPDATE ${config.table} SET ${sets.join(', ')} WHERE id = @id`);
  const info = statement.run({
    id,
    updated_at: timestamp,
    ...fields
  });

  if (info.changes === 0) {
    return fail('NOT_FOUND', `${config.table} not found`);
  }

  const row = db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(id);
  return ok(row);
};

const deleteRow = (db, config, id) => {
  const statement = db.prepare(`DELETE FROM ${config.table} WHERE id = ?`);
  const info = statement.run(id);
  if (info.changes === 0) {
    return fail('NOT_FOUND', `${config.table} not found`);
  }
  return ok({ id });
};

export const registerIpcHandlers = (db) => {
  Object.entries(TABLE_CONFIG).forEach(([key, config]) => {
    ipcMain.handle(`db:${key}:list`, (_event, payload) => {
      const normalized = normalizePayload(payload);
      const query = buildListQuery(config, normalized);
      const rows = db.prepare(query.sql).all(query.params);
      return ok(rows);
    });

    ipcMain.handle(`db:${key}:get`, (_event, payload) => {
      const normalized = normalizePayload(payload);
      if (!normalized.id) {
        return fail('VALIDATION_ERROR', 'Missing id');
      }
      const row = db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(normalized.id);
      if (!row) {
        return fail('NOT_FOUND', `${config.table} not found`);
      }
      return ok(row);
    });

    ipcMain.handle(`db:${key}:create`, (_event, payload) => {
      const normalized = normalizePayload(payload);
      return insertRow(db, config, normalized.data || {});
    });

    ipcMain.handle(`db:${key}:update`, (_event, payload) => {
      const normalized = normalizePayload(payload);
      if (!normalized.id) {
        return fail('VALIDATION_ERROR', 'Missing id');
      }
      return updateRow(db, config, normalized.id, normalized.data || {});
    });

    ipcMain.handle(`db:${key}:delete`, (_event, payload) => {
      const normalized = normalizePayload(payload);
      if (!normalized.id) {
        return fail('VALIDATION_ERROR', 'Missing id');
      }
      return deleteRow(db, config, normalized.id);
    });
  });
};
