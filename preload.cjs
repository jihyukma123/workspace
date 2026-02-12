const { contextBridge, ipcRenderer } = require("electron");

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld("workspaceApi", {
  projects: {
    list: () => invoke("projects:list"),
    create: (input) => invoke("projects:create", input),
    update: (input) => invoke("projects:update", input),
    delete: (input) => invoke("projects:delete", input),
  },
  tasks: {
    list: (input) => invoke("tasks:list", input),
    create: (input) => invoke("tasks:create", input),
    update: (input) => invoke("tasks:update", input),
    delete: (input) => invoke("tasks:delete", input),
  },
  issues: {
    list: (input) => invoke("issues:list", input),
    create: (input) => invoke("issues:create", input),
    update: (input) => invoke("issues:update", input),
    delete: (input) => invoke("issues:delete", input),
  },
  issueComments: {
    list: (input) => invoke("issueComments:list", input),
    create: (input) => invoke("issueComments:create", input),
    delete: (input) => invoke("issueComments:delete", input),
  },
  wiki: {
    list: (input) => invoke("wiki:list", input),
    create: (input) => invoke("wiki:create", input),
    update: (input) => invoke("wiki:update", input),
    delete: (input) => invoke("wiki:delete", input),
  },
  memos: {
    list: (input) => invoke("memos:list", input),
    create: (input) => invoke("memos:create", input),
    update: (input) => invoke("memos:update", input),
    delete: (input) => invoke("memos:delete", input),
  },
  dailyLogs: {
    list: (input) => invoke("dailyLogs:list", input),
    create: (input) => invoke("dailyLogs:create", input),
    update: (input) => invoke("dailyLogs:update", input),
    delete: (input) => invoke("dailyLogs:delete", input),
  },
  reminders: {
    list: (input) => invoke("reminders:list", input),
    create: (input) => invoke("reminders:create", input),
    update: (input) => invoke("reminders:update", input),
    delete: (input) => invoke("reminders:delete", input),
  },
  feedback: {
    create: (input) => invoke("feedback:create", input),
    list: (input) => invoke("feedback:list", input),
  },
  trash: {
    list: (input) => invoke("trash:list", input),
    restore: (input) => invoke("trash:restore", input),
    deletePermanent: (input) => invoke("trash:deletePermanent", input),
    emptyExpired: (input) => invoke("trash:emptyExpired", input),
  },
});
