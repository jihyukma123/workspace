# Repository Guidelines

This repository is an Electron desktop app with a Vite + React + TypeScript UI, styled with Tailwind CSS and shadcn/ui (Radix). It uses CSS variables (HSL tokens) for light/dark theming.

## Project Structure
- `src/`: React app (routes in `src/pages/`, shared UI in `src/components/`, hooks in `src/hooks/`, state in `src/store/`, utilities in `src/lib/`, types in `src/types/`).
- `src/test/`: Vitest tests (example only).
- `electron/`: Electron/main-process helpers (IPC, DB wiring, migrations helpers).
- `migrations/`, `db/`: SQLite schema/migrations and related assets.
- `public/`: static assets.
- `docs/architecture/`: architecture notes.
- Build outputs (gitignored): `dist/`, `build/`, `release/`.

## Build, Test, and Development Commands
- `npm install`: installs deps and rebuilds native modules (`better-sqlite3`) via `postinstall`.
- `npm run dev`: runs the Vite dev server (port `8080`).
- `npm run electron:dev`: runs Vite + Electron together for local app development.
- `npm run build`: TypeScript project build + Vite production build.
- `npm run preview`: previews the Vite production build.
- `npm run lint`: ESLint (TypeScript/React).
- Tests: `npx vitest` (or `npx vitest run`) to execute `src/test/*.test.ts`.

## Coding Style & Naming Conventions
- Language: TypeScript/React; 2-space indentation; semicolons enforced by ESLint (`eslint.config.js`).
- Exports: prefer function declarations for exported components/hooks (arrow functions OK for callbacks).
- Naming: components `PascalCase.tsx`; hooks `useX` in `src/hooks/`; shared state in `src/store/` (Zustand).
- Imports: prefer `@/` alias for `src` (see `vite.config.ts`).
- Styling rules: no hardcoded hex/HSL; use Tailwind tokens backed by CSS variables (`src/index.css`). Use `cn()` from `@/lib/utils`, shadcn/ui components, `scrollbar-thin`, and match patterns in `ProjectSidebar`/`TabNavigation`.

## Commit & Pull Request Guidelines
- Commits in history often use prefixes like `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`; follow that pattern when possible and keep messages imperative.
- PRs should include: a short description, linked issue (if any), screenshots for UI changes, and notes for any DB/migration changes.

