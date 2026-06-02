import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

export async function initDatabase(): Promise<void> {
  if (_db) return;

  _db = await SQLite.openDatabaseAsync('coraline-nails.db');

  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await _db
    .getFirstAsync<{ version: number } | null>(
      'SELECT MAX(version) as version FROM _migrations'
    )
    .catch(() => null);

  const currentVersion = versionRow?.version ?? -1;

  for (let i = currentVersion + 1; i < MIGRATIONS.length; i++) {
    await _db.execAsync(MIGRATIONS[i]);
    await _db.runAsync(
      'INSERT INTO _migrations (version, applied_at) VALUES (?, ?)',
      [i, new Date().toISOString()]
    );
  }
}
