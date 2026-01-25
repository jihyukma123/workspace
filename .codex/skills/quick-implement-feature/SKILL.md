---
name: quick-implement-feature
description: Fast-path implementation for small features with no planning; pass user intent verbatim to implement-agent, then review via review-agent.
---

# Quick Implement Feature

## Overview

Use this skill when the user wants a fast implementation without planning or clarification. The main chat acts as an orchestrator and delegates to sub-agents.

## Required Subagents
- implement-agent
- review-agent

## Orchestrator Mode (Mandatory)
- Main chat is the orchestrator and must **spawn sub-agents** for each stage.
- For every stage, **read the corresponding agent's SKILL.md** from the skills directory and include only the necessary guidance in the sub-agent prompt.
- Run **one sub-agent at a time**; pass the prior agent's output (or a concise summary) to the next agent.
- Do **not** complete stage work directly in main chat. Only coordinate, summarize, and decide next steps.

## Workflow

### 1) Implement
- Spawn implement-agent and pass the user intent verbatim.
- Do not ask clarification questions unless the user explicitly requests them.

### 2) Review
- Spawn review-agent after implementation.
- If review fails, feed fixes back to implement-agent and re-run review once.

## Orchestration Rules
- One agent at a time; pass the previous agent’s output forward.
- Include each agent’s output (or concise summary) in the main response before proceeding.
- If output is missing or delayed, keep waiting and polling until the agent completes or an explicit failure is reported.
