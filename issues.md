# ISSUES

## 기술부채
- [ ] `src/components/layout/AppSidebar.tsx` has menu routes (`/wiki`, `/memo`, `/issues`) that are not defined in `src/App.tsx`, so navigation leads to NotFound or broken state.
- [ ] `src/components/layout/AppSidebar.tsx` navigates by route while `src/pages/Index.tsx` uses local tab state (`activeTab`); decide on a single navigation model to avoid split UI state.
- [ ] `src/components/ProjectSidebar.tsx` is unused (not imported anywhere), indicating duplicate/abandoned sidebar logic that should be removed or integrated.
- [ ] `src/store/workspaceStore.ts` stores tasks/wiki/memo without any project linkage, so multi-project views cannot be isolated; add `projectId` scoping and data partitioning.
- [ ] `src/store/workspaceStore.ts` uses in-memory demo data with `Date` objects and `Date.now()` IDs; state is non-serializable and non-persistent, making hydration/storage/error recovery harder.
- [ ] `src/components/WikiEditor.tsx` handles `- [ ]` and `- [x]` after the generic `- ` branch, so checkbox markdown never renders; reorder conditions or adopt a real markdown parser.
- [ ] `src/test/example.test.ts` is a placeholder-only test; add coverage for store actions and UI flows (task CRUD, drag/drop, wiki edit, memo save).
