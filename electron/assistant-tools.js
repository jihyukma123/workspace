function padNumber(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function truncate(text, maxLength = 2000) {
  if (!text || text.length <= maxLength) {
    return text ?? "";
  }
  return `${text.slice(0, maxLength)}\n...(truncated)`;
}

export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "list_projects",
      description:
        "List all projects in the workspace. Returns project names and IDs.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tasks",
      description:
        "Get tasks for a project. Returns title, status (backlog/in-progress/done), priority (low/medium/high), details snippet, and due date. Optionally filter by status.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          status: {
            type: "string",
            enum: ["backlog", "in-progress", "done"],
            description: "Optional: filter by task status",
          },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_issues",
      description:
        "Get issues for a project. Returns title, status (todo/in-progress/done), priority, and due date. Optionally filter by status.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          status: {
            type: "string",
            enum: ["todo", "in-progress", "done"],
            description: "Optional: filter by issue status",
          },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_issue_comments",
      description: "Get all comments for a specific issue.",
      parameters: {
        type: "object",
        properties: {
          issue_id: { type: "string", description: "Issue ID" },
        },
        required: ["issue_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wiki_pages",
      description:
        "List wiki page titles and hierarchy for a project. Returns titles, IDs, and parent relationships. Use get_wiki_page_content to read a specific page.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wiki_page_content",
      description: "Read the full text content of a specific wiki page by ID.",
      parameters: {
        type: "object",
        properties: {
          page_id: { type: "string", description: "Wiki page ID" },
        },
        required: ["page_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_memos",
      description:
        "List memo titles for a project. Returns titles and IDs only. Use get_memo_content to read a specific memo.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_memo_content",
      description: "Read the full text content of a specific memo by ID.",
      parameters: {
        type: "object",
        properties: {
          memo_id: { type: "string", description: "Memo ID" },
        },
        required: ["memo_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_daily_logs",
      description:
        "Get daily log entries for a project within a date range. Each entry has a date and text content. Defaults to the last 7 days if no range is given.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          date_from: {
            type: "string",
            description: "Start date inclusive (YYYY-MM-DD). Defaults to 7 days ago.",
          },
          date_to: {
            type: "string",
            description: "End date inclusive (YYYY-MM-DD). Defaults to today.",
          },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_reminders",
      description:
        "Get reminders for a project. Returns text, status (todo/progress/done), and scheduled remind time.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
        },
        required: ["project_id"],
      },
    },
  },
];

const handlers = {
  list_projects(db) {
    const rows = db
      .prepare("SELECT id, name FROM projects ORDER BY created_at ASC")
      .all();
    return rows.map((r) => ({ id: r.id, name: r.name }));
  },

  get_tasks(db, args) {
    let sql =
      "SELECT id, title, details, status, priority, due_date FROM tasks WHERE project_id = ?";
    const params = [args.project_id];
    if (args.status) {
      sql += " AND status = ?";
      params.push(args.status);
    }
    sql += " ORDER BY position IS NULL, position ASC, created_at ASC";
    return db
      .prepare(sql)
      .all(...params)
      .map((r) => ({
        id: r.id,
        title: r.title,
        details: truncate(r.details, 500),
        status: r.status,
        priority: r.priority,
        dueDate: r.due_date
          ? new Date(r.due_date).toISOString().split("T")[0]
          : null,
      }));
  },

  get_issues(db, args) {
    let sql =
      "SELECT id, title, status, priority, due_date FROM issues WHERE project_id = ? AND deleted_at IS NULL";
    const params = [args.project_id];
    if (args.status) {
      sql += " AND status = ?";
      params.push(args.status);
    }
    sql += " ORDER BY created_at ASC";
    return db
      .prepare(sql)
      .all(...params)
      .map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        priority: r.priority,
        dueDate: r.due_date
          ? new Date(r.due_date).toISOString().split("T")[0]
          : null,
      }));
  },

  get_issue_comments(db, args) {
    return db
      .prepare(
        "SELECT id, body, created_at FROM issue_comments WHERE issue_id = ? ORDER BY created_at ASC",
      )
      .all(args.issue_id)
      .map((r) => ({
        id: r.id,
        body: truncate(r.body, 1000),
        createdAt: new Date(r.created_at).toISOString(),
      }));
  },

  get_wiki_pages(db, args) {
    return db
      .prepare(
        "SELECT id, title, parent_id FROM wiki_pages WHERE project_id = ? AND deleted_at IS NULL ORDER BY position IS NULL, position ASC, created_at ASC",
      )
      .all(args.project_id)
      .map((r) => ({
        id: r.id,
        title: r.title,
        parentId: r.parent_id ?? null,
      }));
  },

  get_wiki_page_content(db, args) {
    const row = db
      .prepare(
        "SELECT id, title, content_text FROM wiki_pages WHERE id = ? AND deleted_at IS NULL",
      )
      .get(args.page_id);
    if (!row) {
      return { error: "Wiki page not found" };
    }
    return {
      id: row.id,
      title: row.title,
      content: truncate(row.content_text, 3000),
    };
  },

  get_memos(db, args) {
    return db
      .prepare(
        "SELECT id, title FROM memos WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
      )
      .all(args.project_id)
      .map((r) => ({ id: r.id, title: r.title }));
  },

  get_memo_content(db, args) {
    const row = db
      .prepare(
        "SELECT id, title, content_text FROM memos WHERE id = ? AND deleted_at IS NULL",
      )
      .get(args.memo_id);
    if (!row) {
      return { error: "Memo not found" };
    }
    return {
      id: row.id,
      title: row.title,
      content: truncate(row.content_text, 3000),
    };
  },

  get_daily_logs(db, args) {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const dateFrom = args.date_from ?? toDateKey(weekAgo);
    const dateTo = args.date_to ?? toDateKey(today);

    return db
      .prepare(
        "SELECT date, content_text FROM daily_logs WHERE project_id = ? AND date >= ? AND date <= ? ORDER BY date ASC",
      )
      .all(args.project_id, dateFrom, dateTo)
      .map((r) => ({
        date: r.date,
        content: truncate(r.content_text, 1500),
      }));
  },

  get_reminders(db, args) {
    return db
      .prepare(
        "SELECT id, text, status, remind_at FROM reminders WHERE project_id = ? ORDER BY created_at ASC",
      )
      .all(args.project_id)
      .map((r) => ({
        id: r.id,
        text: r.text,
        status: r.status,
        remindAt: r.remind_at ? new Date(r.remind_at).toISOString() : null,
      }));
  },
};

export function executeToolCall(db, toolName, args) {
  const handler = handlers[toolName];
  if (!handler) {
    return { error: `Unknown tool: ${toolName}` };
  }
  return handler(db, args ?? {});
}
