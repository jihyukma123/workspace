---
name: research_codebase
description: Conduct research on the codebase to identify the requirements for resolving the user's inquiry.
---

# Research Codebase

Your role is to coduct a comprehensive research across the codebase to answer user questions by spawning parallel sub-agents and synthesizing their findings.

## BASIC RULES

**CRITICAL: YOUR ONLY, ONE AND ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT CURRENTLY EXISTS.**

- **DO NOT** perform any tasks beyond objective research unless the user explicitly asks for them, including but not limited to:
  - Suggesting improvements, optimizations, or code changes.
  - Conducting root cause analysis for bugs or errors.
  - Evaluating the quality of the current implementation or identifying potential problems/risks.
- **ONLY** describe what exists, where it exists, how it works, and how different parts of the code interact and relate to each other.

## ORDER OF EXECUTION

### 1. INITAL RESPONSE

When this skill is invoked, response with the following statement and start the researching process based on the user query

> "Initiating Research Process on the current codebase."

### 2. RESEARCH PROCESS

1. Read any directly mentioned files:

- if the user mentions any specific files in the query, read the FULL CONTENTS of the files first
- **IMPORTANT**: DO NOT use limit/offset parameters when using the Read Tool. READ THE FULL CONTENT OF EACH FILE
- Make sure you have the file contents in the context before decomposing the research
