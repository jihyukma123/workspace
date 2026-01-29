---
name: quick-fix
description: Handle very small, low-risk code or UI tweaks and micro copy edits fast while strictly following existing style and coding conventions. Use for requests like changing a button color, fixing small spacing/alignment, or adjusting a short text label where no deep planning, redesign, or multi-file refactor is needed.
---

# Quick Fix

## Overview

Apply tiny, localized changes quickly while preserving existing patterns, styles, and conventions. Keep scope minimal and avoid redesigns or refactors.

## Workflow

### 1) Confirm scope is truly small

Proceed only when the request is a micro change:
- Single UI tweak: color, spacing, alignment, small sizing
- Micro copy/label updates (short text)
- 1–3 lines of logic or config adjustments

If the change looks like a redesign, multi-component refactor, or new feature, stop and recommend switching to a broader workflow.

### 2) Locate existing patterns first

Before editing:
- Open the nearest similar component or style file
- Reuse existing tokens, classes, utilities, or helpers
- Follow current formatting, lint, and naming conventions

### 3) Make the smallest possible edit

Guidelines:
- Prefer surgical edits over rewrites
- Avoid introducing new abstractions
- Keep diffs tiny and local

### 4) Quick sanity check

Validate that:
- The change respects the project style guide
- No side effects on sibling components
- The fix is consistent in light/dark modes if applicable

If tests are easy or already in place, suggest the most relevant command.

## Example triggers

- "버튼 색상 수정해줘"
- "버튼 길이가 안맞아"
- "텍스트 색상 변경해줘"
