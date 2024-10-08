const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simplicity, not recommended for production
        },
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('open-file-dialog', async (event) => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (result.canceled) return;
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    event.reply('file-opened', content);
});