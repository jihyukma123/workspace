---
name: feature-implementation-workflow
description: Orchestrate end-to-end feature development using subagents (spec, design, plan, implement, review, qa). Use when the user asks to build or implement a new feature and wants the full workflow to run.
---

# Feature Implementation Workflow

## Goal
- Run the standard feature development workflow via subagents.

## Required Subagents
- spec-agent
- design-agent
- plan-agent
- implement-agent
- review-agent
- qa-agent

## Orchestration Rules
- Start with Spec Agent even if the request is rough.
- Always pass the previous agent's output as context to the next.
- MUST DO: Always pass the previous agent's output as context to the next workflow step; do not ask later agents to look for plans in the repo.
- After Implement Agent, run Review Agent.
- If Review Agent returns FAIL, pass required fixes back to Implement Agent and repeat review.
- If Review Agent returns PASS, proceed to QA Agent.
- One agent at a time; do not overlap agent runs.
- Wait for agent completion and capture full output before moving on.
- If output is missing or delayed, keep waiting and polling until the agent completes or an explicit failure is reported.
- In the main chat response, include each agent's output (or a concise, faithful summary) before starting the next agent.

## Input Expectations
- User provides a rough feature idea; the workflow clarifies and implements it.

## Output Expectations
- Final deliverable should include implementation status, review result, and QA plan/results.
- If any agent output is missing or partial, note which step failed and what was attempted to recover.
