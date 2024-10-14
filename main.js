require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const FileTree = require('./utilities/filetree.js');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('open-file-dialog', async (event) => { // must be async because dialog.showOpenDialog is a IO
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (result.canceled) return;
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    event.reply('file-opened', filePath, content);
});

ipcMain.on('save-file-dialog', async (event, path, content) => {
    console.log("in save-file-dialog: path = ", path);
    console.log("in save-file-dialog: content = ", content);
    fs.writeFileSync(path, content, 'utf-8');
    event.reply('save-successful');
});

ipcMain.on('save-as-dialog', async (event, content) => {
    const result = await dialog.showSaveDialog({
        properties: ['showOverwriteConfirmation', 'showHiddenFiles'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (result.canceled) return;
    fs.writeFileSync(result.filePath, content, 'utf-8');
    event.reply('save-as-successful', result.filePath);
});

ipcMain.on('open-dir-dialog', async (event) => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });

    if (result.canceled) return;
    const dirPath = result.filePaths[0];
    const fileTree = new FileTree(dirPath);
    fileTree.build();
    event.reply('dir-opened', dirPath, JSON.stringify(fileTree));
});

ipcMain.on('open-file', async (event, filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    event.reply('file-opened', filePath, content);
});

ipcMain.on('save-and-open', async (event, newpath, oldpath, content) => {
    const result = await dialog.showMessageBox({
        message: 'Save current chat and open new chat?',
        type: 'question',
        buttons: ['Save', 'Cancel'],
    })
    if (result.response === 0) {
        fs.writeFileSync(oldpath, content, 'utf-8');
        event.reply('file-opened', newpath, fs.readFileSync(newpath, 'utf-8'));
    }
});

ipcMain.on('open-dir', async (event, dirPath) => {
    const fileTree = new FileTree(dirPath);
    fileTree.build();
    event.reply('dir-opened', dirPath, JSON.stringify(fileTree));
});

const OpenAI = require('openai');
const openai = new OpenAI(api_key = process.env.OPENAI_API_KEY);

async function sendMessageToOpenAI(prompt) {
    console.log("in sendMessageToOpenAI: prompt = ", prompt);
    try {
        // https://platform.openai.com/docs/api-reference/chat/create?lang=node.js
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: prompt,
            // max_tokens: 100,
        });
        console.log("completion: ", completion);
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        return 'Error fetching response';
    }
}

// Handle messages from renderer process
ipcMain.handle('send-prompt', async (event, chatHistory) => {
    console.log("handling send-prompt: chatHistory = ", chatHistory);
    const response = await sendMessageToOpenAI(chatHistory);
    return response;
});

ipcMain.handle('start-stream', async (event, messages) => {
    const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        stream: true,
    });

    for await (const chunk of stream) {
        console.log("main.js  chunk.choices[0]?.delta?.content = ",  chunk.choices[0]?.delta?.content);
        event.sender.send('stream-chunk', chunk.choices[0]?.delta?.content || "");
    }

    event.sender.send('stream-end'); // Notify that the stream is complete
});