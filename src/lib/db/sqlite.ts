import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'data', 'survey.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeTables(db);
  }
  return db;
}

function initializeTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS survey_submissions (
      id TEXT PRIMARY KEY,
      responses TEXT NOT NULL,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT
    );
  `);

  try {
    db.exec(`ALTER TABLE survey_submissions ADD COLUMN language TEXT DEFAULT 'ko';`);
  } catch {
    // Column already exists, ignore
  }
}

export function saveSubmission(responses: Record<string, unknown>, language: string = 'ko'): string {
  const database = getDb();
  const id = crypto.randomUUID();
  database.prepare(
    'INSERT INTO survey_submissions (id, responses, language) VALUES (?, ?, ?)'
  ).run(id, JSON.stringify(responses), language);
  return id;
}

export function getSubmission(id: string) {
  const database = getDb();
  const row = database.prepare(
    'SELECT * FROM survey_submissions WHERE id = ?'
  ).get(id) as { id: string; responses: string; submitted_at: string } | undefined;

  if (!row) return null;
  return {
    ...row,
    responses: JSON.parse(row.responses),
  };
}

export function getAllSubmissions() {
  const database = getDb();
  const rows = database.prepare(
    'SELECT * FROM survey_submissions ORDER BY submitted_at DESC'
  ).all() as Array<{ id: string; responses: string; submitted_at: string }>;

  return rows.map((row) => ({
    ...row,
    responses: JSON.parse(row.responses),
  }));
}
