import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function parseArgs(argv) {
  const args = { src: null, out: null };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if ((token === "--src" || token === "-s") && argv[i + 1]) {
      args.src = argv[i + 1];
      i += 1;
      continue;
    }
    if ((token === "--out" || token === "-o") && argv[i + 1]) {
      args.out = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return args;
}

const cli = parseArgs(process.argv);
const srcDb =
  cli.src ??
  path.join(os.homedir(), "Library/Application Support/workspace/app.db");
const outJson =
  cli.out ??
  path.join(
    os.homedir(),
    "Library/Application Support/workspace_native/workspace_seed.json",
  );

if (!fs.existsSync(srcDb)) {
  console.error(`[seed-export] Source DB not found: ${srcDb}`);
  process.exit(1);
}

const db = new Database(srcDb, { readonly: true });
const toIso = (value) =>
  value == null ? null : new Date(Number(value)).toISOString();

const projects = db
  .prepare("SELECT id, name, created_at FROM projects ORDER BY created_at ASC")
  .all()
  .map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: toIso(row.created_at),
  }));

const tasks = db
  .prepare(
    `
      SELECT id, project_id, title, details, status, priority, created_at, updated_at, position, due_date
      FROM tasks
      ORDER BY created_at ASC
    `,
  )
  .all()
  .map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    details: row.details ?? null,
    status: row.status,
    priority: row.priority,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    position: row.position ?? null,
    dueDate: toIso(row.due_date),
  }));

const issues = db
  .prepare(
    `
      SELECT id, project_id, title, status, priority, created_at, updated_at, due_date, deleted_at
      FROM issues
      ORDER BY created_at ASC
    `,
  )
  .all()
  .map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    dueDate: toIso(row.due_date),
    deletedAt: toIso(row.deleted_at),
  }));

const issueComments = db
  .prepare(
    `
      SELECT id, issue_id, body, created_at
      FROM issue_comments
      ORDER BY created_at ASC
    `,
  )
  .all()
  .map((row) => ({
    id: row.id,
    issueId: row.issue_id,
    body: row.body,
    createdAt: toIso(row.created_at),
  }));

const wikiPages = db
  .prepare(
    `
      SELECT id, project_id, title, content, parent_id, created_at, updated_at, position, deleted_at
      FROM wiki_pages
      ORDER BY created_at ASC
    `,
  )
  .all()
  .map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    parentId: row.parent_id ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    position: row.position ?? null,
    status: "saved",
    deletedAt: toIso(row.deleted_at),
  }));

const memos = db
  .prepare(
    `
      SELECT id, project_id, title, content, created_at, updated_at, deleted_at
      FROM memos
      ORDER BY created_at ASC
    `,
  )
  .all()
  .map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    status: "saved",
    deletedAt: toIso(row.deleted_at),
  }));

const reminders = db
  .prepare(
    `
      SELECT id, project_id, text, status, created_at, updated_at, remind_at, notified
      FROM reminders
      ORDER BY created_at ASC
    `,
  )
  .all()
  .map((row) => ({
    id: row.id,
    projectId: row.project_id,
    text: row.text,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    remindAt: toIso(row.remind_at),
    notified: Boolean(row.notified),
  }));

const dailyLogs = db
  .prepare(
    `
      SELECT id, project_id, date, content, created_at, updated_at
      FROM daily_logs
      ORDER BY date DESC
    `,
  )
  .all()
  .map((row) => ({
    id: row.id,
    projectId: row.project_id,
    date: row.date,
    content: row.content,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }));

const feedback = db
  .prepare(
    `
      SELECT id, body, created_at
      FROM feedback
      ORDER BY created_at DESC
    `,
  )
  .all()
  .map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: toIso(row.created_at),
  }));

const selectedProjectId = projects[0]?.id ?? null;
const selectedWikiPageId =
  wikiPages.find(
    (page) => page.projectId === selectedProjectId && page.deletedAt == null,
  )?.id ?? null;
const selectedMemoId =
  memos.find(
    (memo) => memo.projectId === selectedProjectId && memo.deletedAt == null,
  )?.id ?? null;

const snapshot = {
  projects,
  selectedProjectId,
  tasks,
  issues,
  issueComments,
  wikiPages,
  selectedWikiPageId,
  memos,
  selectedMemoId,
  reminders,
  dailyLogs,
  feedback,
  tabOrder: ["board", "wiki", "memo", "issues", "calendar"],
  primaryColorId: "default",
  activeScreen: "board",
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
db.close();

console.log(`[seed-export] Source: ${srcDb}`);
console.log(`[seed-export] Output: ${outJson}`);
console.log(
  `[seed-export] Counts -> projects=${projects.length}, tasks=${tasks.length}, issues=${issues.length}, wiki=${wikiPages.length}, memos=${memos.length}`,
);
