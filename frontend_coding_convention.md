# Coding Convention

This document captures the current conventions observed in the codebase and the UI/style rules from AGENTS.md. When adding new code, follow these rules and mirror the closest existing file.

## Language and formatting
- TypeScript + React (Vite). Files are `.ts`/`.tsx`.
- Indentation: 2 spaces.
- Semicolons are used.
- Keep code readable: early returns, small helpers, and descriptive names.

## File and naming
- React components: `PascalCase.tsx` in `src/components` or `src/pages`.
- Hooks: `use-*.ts(x)` in `src/hooks`, exported as `useX`.
- Types: `src/types`.
- State: `src/store` (Zustand).

## Imports
- Prefer path alias `@/` for `src` imports.
- Order imports roughly: external libs, internal `@/` modules, then relative imports.
- Keep related imports grouped; split long destructuring across lines when needed.

## React + TypeScript
- Prefer function declarations for exported components and hooks (common in `src/components` and `src/hooks`).
- Arrow functions are fine for callbacks and local helpers.
- Use `useMemo`/`useCallback` when derived data or handlers would otherwise re-create heavy work.
- Keep component state local unless it is shared; shared state goes to `src/store`.

## State (Zustand)
- Centralize shared state in `src/store/workspaceStore.ts`.
- Actions live alongside state, with explicit typing in the store interface.
- Updates are immutable via `set` and map/filter patterns.

## Styling and UI (Tailwind + shadcn/ui)
- Use Tailwind classes; no hardcoded HSL/Hex. Always use CSS variables via Tailwind tokens.
- Use `cn()` from `@/lib/utils` for conditional class names.
- Prefer shadcn/ui components over custom primitives.
- Interactive elements: `transition-all duration-200` + `hover:bg-{color}/30` or `hover:bg-sidebar-accent`.
- Focus/disabled: `focus-visible:ring-ring`, `disabled:opacity-50` (or `opacity-50`).
- Headers: `font-mono text-lg font-bold` with primary color.
- Cards: `rounded-lg border bg-card text-card-foreground shadow-sm`.
- Sidebar: `bg-sidebar`, `border-sidebar-border`, `text-sidebar-foreground`.
- Scroll areas: `scrollbar-thin`.
- Animations: `animate-fade-in`, `animate-slide-in`, `animate-accordion-down/up`.
- Maintain consistency with `ProjectSidebar` and `TabNavigation`.

## Testing
- Current tests live in `src/test` (example only). If adding tests, keep them near `src/test` or a `__tests__` folder and align with the runner once configured.

## Defaults when unsure
- Follow the nearest file in the same folder.
- Keep conventions consistent within the file you are editing.
