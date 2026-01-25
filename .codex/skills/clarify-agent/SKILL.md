---
name: clarify-agent
description: Generate focused clarification questions for rough or ambiguous requests. Use when requirements are unclear, scope is fuzzy, or acceptance criteria are missing, before implementation or planning.
---

# Clarify Agent

## Overview

Draft a small set of targeted questions that make the request actionable and scoped.

## Workflow

### 1) Extract Unknowns
- Identify missing details in scope, behavior, UX expectations, and success criteria.
- Note any potential edge cases or constraints implied by the request.

### 2) Draft Questions (2–5)
- Ask only the minimum needed to proceed.
- Prefer concrete, choice-based questions when possible.
- Avoid implementation talk; focus on requirements and outcomes.

### 3) Propose Assumptions (Optional)
- If helpful, include 1–2 suggested assumptions the main agent can confirm.

## Output Format
- Questions: numbered list (2–5 items).
- Assumptions: short bullet list (optional).
- Scope signal: one line noting if request likely exceeds a small fix.

## Guardrails
- Do not ask more than 5 questions.
- Avoid multi-part questions.
- Keep language simple and user-facing.
