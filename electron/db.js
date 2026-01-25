import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { migrations } from './migrations.js';

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
  const dbPath = path.join(app.getPath('userData'), 'app.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
};
