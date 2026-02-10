import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { backupDatabaseFiles, openDatabase } from "./electron/db.js";
import { registerIpcHandlers } from "./electron/ipc.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const VITE_DEV_SERVER_URL = "http://localhost:8080";
let db = null;
let dbPath = null;
let reminderCheckInterval = null;

function checkDueReminders() {
  if (!db) return;

  try {
    const now = Date.now();
    const dueReminders = db
      .prepare(
        `SELECT r.*, p.name as project_name 
         FROM reminders r 
         LEFT JOIN projects p ON r.project_id = p.id
         WHERE r.remind_at IS NOT NULL 
           AND r.remind_at <= ? 
           AND r.notified = 0 
           AND r.status != 'done'`,
      )
      .all(now);

    for (const reminder of dueReminders) {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: `⏰ Reminder${reminder.project_name ? ` - ${reminder.project_name}` : ""}`,
          body: reminder.text,
          silent: false,
        });
        notification.show();
      }

      // Mark as notified and clear remind_at after firing
      db.prepare(
        "UPDATE reminders SET notified = 1, remind_at = NULL, updated_at = ? WHERE id = ?",
      ).run(Date.now(), reminder.id);
    }
  } catch (error) {
    console.error("Error checking due reminders:", error);
  }
}

function startReminderChecker() {
  // Check every 30 seconds
  reminderCheckInterval = setInterval(checkDueReminders, 30000);
  // Also check immediately on start
  checkDueReminders();
}

function stopReminderChecker() {
  if (reminderCheckInterval) {
    clearInterval(reminderCheckInterval);
    reminderCheckInterval = null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 960,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // In development, load from Vite dev server for HMR
  // In production, load from built files
  if (isDev) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open DevTools in development
    win.webContents.openDevTools();
  } else {
    win.loadFile("dist/index.html");
  }
}

app.whenReady().then(() => {
  const opened = openDatabase();
  db = opened.db;
  dbPath = opened.dbPath;
  registerIpcHandlers(ipcMain, db);
  createWindow();
  startReminderChecker();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopReminderChecker();
  if (db) {
    db.close();
    db = null;
  }
  if (dbPath) {
    try {
      backupDatabaseFiles({ dbPath, reason: "shutdown" });
    } catch (error) {
      console.warn("[db] Shutdown backup failed", error);
    }
  }
});
