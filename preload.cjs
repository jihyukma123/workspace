const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('workspaceApi', {
  projects: {
    list: () => invoke('projects:list'),
    create: (input) => invoke('projects:create', input),
    update: (input) => invoke('projects:update', input),
    delete: (input) => invoke('projects:delete', input),
  },
  tasks: {
    list: (input) => invoke('tasks:list', input),
    create: (input) => invoke('tasks:create', input),
    update: (input) => invoke('tasks:update', input),
    delete: (input) => invoke('tasks:delete', input),
  },
  issues: {
    list: (input) => invoke('issues:list', input),
    create: (input) => invoke('issues:create', input),
    update: (input) => invoke('issues:update', input),
    delete: (input) => invoke('issues:delete', input),
  },
  wiki: {
    list: (input) => invoke('wiki:list', input),
    create: (input) => invoke('wiki:create', input),
    update: (input) => invoke('wiki:update', input),
    delete: (input) => invoke('wiki:delete', input),
  },
  memos: {
    list: (input) => invoke('memos:list', input),
    create: (input) => invoke('memos:create', input),
    update: (input) => invoke('memos:update', input),
    delete: (input) => invoke('memos:delete', input),
  },
});
