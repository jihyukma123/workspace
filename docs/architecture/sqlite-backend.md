# Local SQLite Backend Design (Electron)

## Purpose
Document the local backend design for persisting all workspace data with SQLite. The Electron main process owns the database connection and exposes a small IPC API to the renderer.

## Goals
- Persist all workspace data locally per user.
- Scope all data to a project.
- Avoid a separate server process.
- Keep a clean UI/storage boundary.
- Support future migrations without data loss.

## Non-Goals (for now)
- Multi-device sync.
- Multi-user access on one database file.
- Remote API hosting.

## Data Model Overview
All content is owned by a project. Primary entities:
- Project
- Task (project-scoped)
- Issue (project-scoped)
- Wiki Page (project-scoped, hierarchical)
- Memo (project-scoped)

Relationships:
- One project has many tasks, issues, wiki pages, and memos.
- Wiki pages can reference a parent wiki page (self-relation).

## Proposed Tables (Conceptual)
Use TEXT IDs (string/UUID) to match current app usage.

### projects
- id (TEXT, PK)
- name (TEXT, required)
- description (TEXT, optional)
- created_at (INTEGER or TEXT, required)

### tasks
- id (TEXT, PK)
- project_id (TEXT, FK -> projects.id, required)
- title (TEXT, required)
- description (TEXT, optional)
- status (TEXT, required: backlog | in-progress | done)
- priority (TEXT, required: low | medium | high)
- created_at (INTEGER or TEXT, required)
- updated_at (INTEGER or TEXT, optional)
- position (INTEGER, optional; order within a column)

### issues
- id (TEXT, PK)
- project_id (TEXT, FK -> projects.id, required)
- title (TEXT, required)
- description (TEXT, optional)
- status (TEXT, required: todo | in-progress | done)
- priority (TEXT, required: low | medium | high)
- created_at (INTEGER or TEXT, required)
- updated_at (INTEGER or TEXT, required)

### wiki_pages
- id (TEXT, PK)
- project_id (TEXT, FK -> projects.id, required)
- title (TEXT, required)
- content (TEXT, required)
- parent_id (TEXT, FK -> wiki_pages.id, nullable)
- created_at (INTEGER or TEXT, required)
- updated_at (INTEGER or TEXT, required)
- position (INTEGER, optional; order within a parent)

### memos
- id (TEXT, PK)
- project_id (TEXT, FK -> projects.id, required)
- title (TEXT, required)
- content (TEXT, required)
- created_at (INTEGER or TEXT, required)
- updated_at (INTEGER or TEXT, nullable)

Notes:
- Memo UI status (saved/unsaved/saving) is UI state and does not need to be stored.
- Timestamps should use a single format across tables (recommended: INTEGER unix ms).

## Indexes (Recommended)
- tasks(project_id, status)
- issues(project_id, status)
- wiki_pages(project_id, parent_id)
- memos(project_id)
- Optional: updated_at indexes where list sorting is common.

## Electron Integration Architecture

### Runtime Roles
- Main process: owns the SQLite connection and executes queries.
- Preload script: exposes a small API surface via contextBridge.
- Renderer (React): calls the exposed API and updates Zustand state.

### Data Flow
1) App start: main process opens the SQLite file and runs migrations.
2) UI action: renderer calls IPC (e.g., tasks:list for a project).
3) Main process queries SQLite and returns serialized data.
4) Renderer updates UI state with the results.

### IPC Boundary
- Use ipcMain.handle for request/response patterns.
- Use ipcRenderer.invoke for renderer calls.
- Expose only whitelisted functions via preload for security.

Example IPC surface (conceptual):
- projects:list
- projects:create
- tasks:list
- tasks:create
- tasks:update
- tasks:delete
- issues:list
- issues:create
- issues:update
- issues:delete
- wiki:list
- wiki:create
- wiki:update
- wiki:delete
- memos:list
- memos:create
- memos:update
- memos:delete

## Storage Location
Use a file in the user data directory:
- app.getPath("userData")/app.db

This keeps data local per user and avoids permissions issues.

## Migrations
- Maintain a simple migrations table (versioned).
- Run migrations at startup before any queries.
- Keep migrations additive when possible.

## Error Handling
- Main process should return structured errors for UI display.
- Renderer should handle empty states and retryable errors gracefully.

## Security Considerations
- Keep nodeIntegration off in renderer (default in secure Electron apps).
- Only expose needed IPC methods in preload.
- Validate inputs in the main process before running SQL.

## Open Decisions
- Choice of DB library (better-sqlite3, sqlite3, or an ORM like Prisma).
- ID generation strategy (uuid vs time-based string).
- Ordering strategy for tasks and wiki pages (position column vs updated_at).

## Next Steps
- Confirm DB library and migration strategy.
- Translate this design into actual CREATE TABLE migrations.
- Implement IPC handlers and preload API.
- Wire Zustand store to load/save via IPC.
