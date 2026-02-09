import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { migrations } from './migrations.js';

const DEFAULT_MAX_BACKUPS = 20;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getDatabasePath = () => path.join(app.getPath('userData'), 'app.db');

const sanitizeBackupLabel = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'backup';

const getBackupsDir = (dbPath) => path.join(path.dirname(dbPath), 'backups');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const listBackupDirs = (backupsDir) => {
  if (!fs.existsSync(backupsDir)) {
    return [];
  }

  return fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupsDir, entry.name));
};

const getMtimeMsSafe = (dirPath) => {
  try {
    return fs.statSync(dirPath).mtimeMs;
  } catch {
    return 0;
  }
};

const pruneBackups = ({ backupsDir, maxBackups }) => {
  const dirs = listBackupDirs(backupsDir)
    .sort((a, b) => getMtimeMsSafe(b) - getMtimeMsSafe(a));

  const excess = dirs.slice(maxBackups);
  for (const dirPath of excess) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.warn('[db] Failed to prune backup', dirPath, error);
    }
  }
};

const copyIfExists = (sourcePath, destPath) => {
  if (!fs.existsSync(sourcePath)) {
    return false;
  }
  fs.copyFileSync(sourcePath, destPath);
  return true;
};

export const backupDatabaseFiles = ({ dbPath, reason }) => {
  if (!dbPath || typeof dbPath !== 'string') {
    return null;
  }

  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const backupsDir = getBackupsDir(dbPath);
  ensureDir(backupsDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const label = sanitizeBackupLabel(reason);
  const backupDir = path.join(backupsDir, `${timestamp}-${label}`);
  ensureDir(backupDir);

  const dbBase = path.basename(dbPath);
  const copied = {
    db: copyIfExists(dbPath, path.join(backupDir, dbBase)),
    wal: copyIfExists(`${dbPath}-wal`, path.join(backupDir, `${dbBase}-wal`)),
    shm: copyIfExists(`${dbPath}-shm`, path.join(backupDir, `${dbBase}-shm`)),
  };

  try {
    fs.writeFileSync(
      path.join(backupDir, 'meta.json'),
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          reason: reason || null,
          source: dbPath,
          files: copied,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (error) {
    console.warn('[db] Failed to write backup metadata', error);
  }

  const maxBackups = toPositiveInt(process.env.WORKSPACE_DB_MAX_BACKUPS, DEFAULT_MAX_BACKUPS);
  pruneBackups({ backupsDir, maxBackups });

  return backupDir;
};

const ensureMigrationsTable = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
};

const runMigrations = (db) => {
  ensureMigrationsTable(db);
  const appliedRows = db.prepare('SELECT id FROM migrations').all();
  const applied = new Set(appliedRows.map((row) => row.id));

  const insertMigration = db.prepare(
    'INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, ?)' 
  );

  const applyMigration = db.transaction((migration) => {
    db.exec(migration.up);
    insertMigration.run(migration.id, migration.name, Date.now());
  });

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }
    applyMigration(migration);
  }
};

export const openDatabase = () => {
  const dbPath = getDatabasePath();
  try {
    backupDatabaseFiles({ dbPath, reason: 'startup' });
  } catch (error) {
    console.warn('[db] Startup backup failed', error);
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return { db, dbPath };
};
