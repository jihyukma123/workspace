---
name: fix-or-improve-feature
description: Small-scope fixes and incremental improvements (UI tweaks, minor bugs, small behavior changes). Use when the user wants quick refinements, not a full new feature. Always clarify requirements first; if scope grows, switch to feature-implementation-workflow.
---

# Fix Or Improve Feature

## Overview

Run a lightweight workflow for small changes: clarify requirements, implement, and review. Escalate to the full feature workflow when scope is bigger than a small fix.

## Required Subagents
- clarify-agent
- implement-agent
- review-agent

## Optional Subagents
- qa-agent (use when user-facing or riskier changes)

## Workflow

### 1) Clarify (Mandatory)
- Run clarify-agent to generate 2–5 questions.
- Ask the user and wait for answers.
- Summarize answers and assumptions before implementation.

### 2) Scope Gate
- If change needs multi-step UX, new data models, or spans many files/features, stop and suggest feature-implementation-workflow.
- If change is isolated (small UI/layout tweak or localized bug fix), proceed.

### 3) Implement
- Pass clarified requirements to implement-agent.
- Keep changes small and localized; avoid speculative refactors.

### 4) Review
- Run review-agent after implementation.
- If review fails, feed fixes back to implement-agent and re-run review once.

### 5) QA (Optional)
- Run qa-agent only when needed.
- Otherwise, provide 1–3 manual checks.

## Orchestration Rules
- One agent at a time; pass the previous agent’s output forward.
- Include each agent’s output (or concise summary) in the main response before proceeding.
- On missing output, retry up to 2 times; then stop and report failure.
