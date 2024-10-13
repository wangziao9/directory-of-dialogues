require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true, // For simplicity, not recommended for production
            preload: path.join(__dirname, 'preload.js'),
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

/*
const { Configuration, OpenAIApi } = require('openai');
console.log(Configuration, OpenAIApi);
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Use environment variable for security
});
const openai = new OpenAIApi(configuration);
*/

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