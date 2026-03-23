#!/usr/bin/env python3
import argparse
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def to_iso(value):
    if value is None:
        return None
    millis = int(value)
    return datetime.fromtimestamp(millis / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def fetch_all(conn, query):
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query)
    return [dict(row) for row in cur.fetchall()]


def main():
    home = Path.home()
    parser = argparse.ArgumentParser(description="Export workspace app.db into workspace_native seed JSON.")
    parser.add_argument(
        "--src",
        default=str(home / "Library/Application Support/workspace/app.db"),
        help="Source SQLite path",
    )
    parser.add_argument(
        "--out",
        default=str(home / "Library/Application Support/workspace_native/workspace_seed.json"),
        help="Output seed JSON path",
    )
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    if not src.exists():
        raise SystemExit(f"[seed-export] Source DB not found: {src}")

    conn = sqlite3.connect(src)

    projects = [
        {
            "id": row["id"],
            "name": row["name"],
            "createdAt": to_iso(row["created_at"]),
        }
        for row in fetch_all(conn, "SELECT id, name, created_at FROM projects ORDER BY created_at ASC")
    ]

    tasks = [
        {
            "id": row["id"],
            "projectId": row["project_id"],
            "title": row["title"],
            "details": row["details"],
            "status": row["status"],
            "priority": row["priority"],
            "createdAt": to_iso(row["created_at"]),
            "updatedAt": to_iso(row["updated_at"]),
            "position": row["position"],
            "dueDate": to_iso(row["due_date"]),
        }
        for row in fetch_all(
            conn,
            """
            SELECT id, project_id, title, details, status, priority, created_at, updated_at, position, due_date
            FROM tasks
            ORDER BY created_at ASC
            """,
        )
    ]

    issues = [
        {
            "id": row["id"],
            "projectId": row["project_id"],
            "title": row["title"],
            "status": row["status"],
            "priority": row["priority"],
            "createdAt": to_iso(row["created_at"]),
            "updatedAt": to_iso(row["updated_at"]),
            "dueDate": to_iso(row["due_date"]),
            "deletedAt": to_iso(row["deleted_at"]),
        }
        for row in fetch_all(
            conn,
            """
            SELECT id, project_id, title, status, priority, created_at, updated_at, due_date, deleted_at
            FROM issues
            ORDER BY created_at ASC
            """,
        )
    ]

    issue_comments = [
        {
            "id": row["id"],
            "issueId": row["issue_id"],
            "body": row["body"],
            "createdAt": to_iso(row["created_at"]),
        }
        for row in fetch_all(
            conn,
            "SELECT id, issue_id, body, created_at FROM issue_comments ORDER BY created_at ASC",
        )
    ]

    wiki_pages = [
        {
            "id": row["id"],
            "projectId": row["project_id"],
            "title": row["title"],
            "content": row["content"],
            "parentId": row["parent_id"],
            "createdAt": to_iso(row["created_at"]),
            "updatedAt": to_iso(row["updated_at"]),
            "position": row["position"],
            "status": "saved",
            "deletedAt": to_iso(row["deleted_at"]),
        }
        for row in fetch_all(
            conn,
            """
            SELECT id, project_id, title, content, parent_id, created_at, updated_at, position, deleted_at
            FROM wiki_pages
            ORDER BY created_at ASC
            """,
        )
    ]

    memos = [
        {
            "id": row["id"],
            "projectId": row["project_id"],
            "title": row["title"],
            "content": row["content"],
            "createdAt": to_iso(row["created_at"]),
            "updatedAt": to_iso(row["updated_at"]),
            "status": "saved",
            "deletedAt": to_iso(row["deleted_at"]),
        }
        for row in fetch_all(
            conn,
            """
            SELECT id, project_id, title, content, created_at, updated_at, deleted_at
            FROM memos
            ORDER BY created_at ASC
            """,
        )
    ]

    reminders = [
        {
            "id": row["id"],
            "projectId": row["project_id"],
            "text": row["text"],
            "status": row["status"],
            "createdAt": to_iso(row["created_at"]),
            "updatedAt": to_iso(row["updated_at"]),
            "remindAt": to_iso(row["remind_at"]),
            "notified": bool(row["notified"]),
        }
        for row in fetch_all(
            conn,
            """
            SELECT id, project_id, text, status, created_at, updated_at, remind_at, notified
            FROM reminders
            ORDER BY created_at ASC
            """,
        )
    ]

    daily_logs = [
        {
            "id": row["id"],
            "projectId": row["project_id"],
            "date": row["date"],
            "content": row["content"],
            "createdAt": to_iso(row["created_at"]),
            "updatedAt": to_iso(row["updated_at"]),
        }
        for row in fetch_all(
            conn,
            """
            SELECT id, project_id, date, content, created_at, updated_at
            FROM daily_logs
            ORDER BY date DESC
            """,
        )
    ]

    feedback = [
        {
            "id": row["id"],
            "body": row["body"],
            "createdAt": to_iso(row["created_at"]),
        }
        for row in fetch_all(
            conn,
            "SELECT id, body, created_at FROM feedback ORDER BY created_at DESC",
        )
    ]

    selected_project_id = projects[0]["id"] if projects else None
    selected_wiki_page_id = next(
        (
            page["id"]
            for page in wiki_pages
            if page["projectId"] == selected_project_id and page["deletedAt"] is None
        ),
        None,
    )
    selected_memo_id = next(
        (
            memo["id"]
            for memo in memos
            if memo["projectId"] == selected_project_id and memo["deletedAt"] is None
        ),
        None,
    )

    snapshot = {
        "projects": projects,
        "selectedProjectId": selected_project_id,
        "tasks": tasks,
        "issues": issues,
        "issueComments": issue_comments,
        "wikiPages": wiki_pages,
        "selectedWikiPageId": selected_wiki_page_id,
        "memos": memos,
        "selectedMemoId": selected_memo_id,
        "reminders": reminders,
        "dailyLogs": daily_logs,
        "feedback": feedback,
        "tabOrder": ["board", "wiki", "memo", "issues", "calendar"],
        "primaryColorId": "default",
        "activeScreen": "board",
    }

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    conn.close()

    print(f"[seed-export] Source: {src}")
    print(f"[seed-export] Output: {out}")
    print(
        "[seed-export] Counts -> "
        f"projects={len(projects)}, tasks={len(tasks)}, issues={len(issues)}, "
        f"wiki={len(wiki_pages)}, memos={len(memos)}"
    )


if __name__ == "__main__":
    main()
