// Tutorial on using preload scripts
// https://www.electronjs.org/docs/latest/tutorial/tutorial-preload

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendPrompt: async (prompt) => {
        return await ipcRenderer.invoke('send-prompt', prompt);
    },
    startStream: async (prompt) => {
        console.log('Setting up startStream');
        await ipcRenderer.invoke('start-stream', prompt);
    },
    onStreamChunk: (callback) => {
        console.log('Setting up onStreamChunk');
        ipcRenderer.on('stream-chunk', (event, chunk) => {
            console.log('Received chunk in preload.js');
            callback(chunk);
        });
    },
    onStreamEnd: (callback) => {
        console.log('Setting up onStreamEnd');
        ipcRenderer.on('stream-end', () => {
            console.log('Received stream end in preload.js');
            callback();
        });
    },
});

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
});