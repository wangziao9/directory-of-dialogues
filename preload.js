// Tutorial on using preload scripts
// https://www.electronjs.org/docs/latest/tutorial/tutorial-preload

const { contextBridge, ipcRenderer } = require('electron');
const marked = require('marked');
// console.log("in preload.js, marked: ", marked);

marked.setOptions({
    gfm: true, // Enable GitHub Flavored Markdown
    breaks: true, // Convert newlines to <br> tags
});

contextBridge.exposeInMainWorld('marked', {
    render: (markdown) => marked.parse(markdown)
});

contextBridge.exposeInMainWorld('electron', {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args) // in main process, write ipcMain.handle
});