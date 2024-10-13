// Tutorial on using preload scripts
// https://www.electronjs.org/docs/latest/tutorial/tutorial-preload

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendPrompt: async (prompt) => {
        return await ipcRenderer.invoke('send-prompt', prompt);
    }
});

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
});