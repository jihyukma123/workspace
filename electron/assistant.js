import { Codex } from "@openai/codex-sdk";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const codex = new Codex();

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function startOfWeekContaining(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const offsetFromMonday = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - offsetFromMonday);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDisplayDate(dateKey) {
  return WEEKDAY_FORMATTER.format(new Date(`${dateKey}T00:00:00`));
}

function buildWeeklyLogContext(logs, weekStart) {
  return Array.from({ length: 7 }, (_, index) => {
    const currentDate = addDays(weekStart, index);
    const dateKey = toDateKey(currentDate);
    const entry = logs.find((log) => log.date === dateKey);
    const content = entry?.contentText?.trim() || "No daily log entry.";

    return [`## ${dateKey} (${formatDisplayDate(dateKey)})`, content].join("\n");
  }).join("\n\n");
}

function buildPrompt({
  prompt,
  projectName,
  weekStartKey,
  weekEndKey,
  weeklyLogContext,
}) {
  return `
You are the assistant inside the Workspace desktop app.

Your current preview capability is limited to summarizing the current week's daily logs for one project.
If the user asks for something unrelated, clearly say that this preview only supports summarizing this week's daily logs.

Respond in Korean.
Use the exact week range ${weekStartKey} to ${weekEndKey}.
Keep the answer concise but useful.

Structure the answer like this:
1. A short overall summary.
2. A day-by-day bullet list for the meaningful entries in this week.
3. A short section for blockers, follow-ups, or missing information if relevant.

Project: ${projectName ?? "Unknown project"}

User request:
${prompt}

Daily log context for the current week:
${weeklyLogContext}
`.trim();
}

function normalizeAssistantError(error) {
  const message = error instanceof Error ? error.message : "Unknown assistant error";

  if (/auth|login|sign in|api key/i.test(message)) {
    return `${message}\n\nCodex authentication is required. Sign in to Codex with ChatGPT or configure an OpenAI API key first.`;
  }

  return message;
}

export async function summarizeWeeklyDailyLogs({ db, projectId, prompt, threadId }) {
  const today = new Date();
  const weekStart = startOfWeekContaining(today);
  const weekEnd = addDays(weekStart, 6);
  const weekStartKey = toDateKey(weekStart);
  const weekEndKey = toDateKey(weekEnd);

  const projectRow = db.prepare("SELECT name FROM projects WHERE id = ?").get(projectId);
  const projectName = typeof projectRow?.name === "string" ? projectRow.name : null;

  const logs = db
    .prepare(
      `
        SELECT date, content_text
        FROM daily_logs
        WHERE project_id = ?
          AND date >= ?
          AND date <= ?
        ORDER BY date ASC
      `,
    )
    .all(projectId, weekStartKey, weekEndKey)
    .map((row) => ({
      date: row.date,
      contentText: row.content_text ?? "",
    }));

  if (logs.length === 0) {
    return {
      threadId: threadId ?? null,
      response: `이번 주(${weekStartKey} ~ ${weekEndKey}) Daily log가 아직 없습니다.`,
      weekStart: weekStartKey,
      weekEnd: weekEndKey,
      logCount: 0,
      projectName,
    };
  }

  const threadOptions = {
    approvalPolicy: "never",
    sandboxMode: "read-only",
    skipGitRepoCheck: true,
    workingDirectory: process.cwd(),
    modelReasoningEffort: "low",
    webSearchEnabled: false,
  };

  const thread = threadId
    ? codex.resumeThread(threadId, threadOptions)
    : codex.startThread(threadOptions);

  try {
    const turn = await thread.run(
      buildPrompt({
        prompt,
        projectName,
        weekStartKey,
        weekEndKey,
        weeklyLogContext: buildWeeklyLogContext(logs, weekStart),
      }),
    );

    return {
      threadId: thread.id,
      response: turn.finalResponse.trim(),
      weekStart: weekStartKey,
      weekEnd: weekEndKey,
      logCount: logs.length,
      projectName,
    };
  } catch (error) {
    throw new Error(normalizeAssistantError(error));
  }
}
