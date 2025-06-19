require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
if (require('electron-squirrel-startup')) app.quit();
const fs = require('fs');
const path = require('path');
const DirTree = require('./utilities/dir-tree.js');
let mainWin = null;

let apiKey = "<your-api-key>";
let modelName = "gpt-4o";
let baseUrl = "https://api.openai.com/v1/";

const OpenAI = require('openai');
let openai = null;

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
    mainWin = win;
}

app.whenReady().then(() => {
    createWindow();
    const settings = loadSettings();
    if (settings) {
        console.log('Loaded user settings:', settings);
        ({ apiKey, modelName, baseUrl } = settings);
        mainWin.webContents.on('did-finish-load', () => {
            mainWin.webContents.send('settings-loaded', settings);
        });
    } else {
        console.log('No user settings found.');
    }
    openai = new OpenAI({apiKey: apiKey, baseURL: baseUrl});
});

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
    const dirTree = new DirTree(dirPath);
    dirTree.buildTree();
    event.reply('dir-opened', dirPath, JSON.stringify(dirTree));
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
    const dirTree = new DirTree(dirPath);
    dirTree.buildTree();
    event.reply('dir-opened', dirPath, JSON.stringify(dirTree));
});

// Settings Related

function createSettingsWindow() {
    const settingsWindow = new BrowserWindow({
        width: 500,
        height: 500,
        parent: BrowserWindow.getFocusedWindow(),
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });
    settingsWindow.loadFile('settings.html').then(() => {
        console.log("prefill settings: apiKey = ", apiKey, ", modelName = ", modelName, ", baseUrl = ", baseUrl);
        settingsWindow.webContents.send('prefill-settings', { apiKey, modelName, baseUrl });
    });
}


ipcMain.on('update-settings', async () => {
    createSettingsWindow();
})

function getSettingsFilePath() {
    return path.join(app.getPath('userData'), 'user-settings.json');
}

ipcMain.on('save-settings', (event, settings) => {
    console.log("in save-settings: settings = ", settings);
    ({ apiKey, modelName, baseUrl } = settings);
    let apiKeyToStore;
    let isEncrypted = false;
    
    if (safeStorage.isEncryptionAvailable()) {
        try {
            apiKeyToStore = safeStorage.encryptString(apiKey).toString('base64');
            isEncrypted = true;
            console.log('API key encrypted successfully');
        } catch (error) {
            console.error('Encryption failed:', error);
            apiKeyToStore = apiKey; // Fallback to unencrypted
            isEncrypted = false;
        }
    } else {
        console.warn('Encryption is not available on this system. Storing API key unencrypted.');
        apiKeyToStore = apiKey;
        isEncrypted = false;
    }
    
    const userSettings = {
        apiKey: apiKeyToStore,
        modelName,
        baseUrl,
        isEncrypted
    };
    
    try {
        fs.writeFileSync(getSettingsFilePath(), JSON.stringify(userSettings));
        console.log('Settings saved successfully');
        mainWin.webContents.send('settings-loaded', settings);
        openai = new OpenAI({apiKey: apiKey, baseURL: baseUrl});
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
});

function loadSettings() {
    const settingsFilePath = getSettingsFilePath();
    if (fs.existsSync(settingsFilePath)) {
        try {
            const data = fs.readFileSync(settingsFilePath);
            const userSettings = JSON.parse(data);
            
            let decryptedApiKey;
            
            // Check if the stored API key is encrypted
            if (userSettings.isEncrypted === true) {
                if (safeStorage.isEncryptionAvailable()) {
                    try {
                        const encryptedBuffer = Buffer.from(userSettings.apiKey, 'base64');
                        decryptedApiKey = safeStorage.decryptString(encryptedBuffer);
                        console.log('API key decrypted successfully');
                    } catch (error) {
                        console.error('Decryption failed:', error);
                        return null;
                    }
                } else {
                    console.error('Cannot decrypt API key: encryption is not available on this system.');
                    return null;
                }
            } else {
                // API key is stored unencrypted
                decryptedApiKey = userSettings.apiKey;
                console.log('Loaded unencrypted API key');
            }
            
            return {
                apiKey: decryptedApiKey,
                modelName: userSettings.modelName,
                baseUrl: userSettings.baseUrl
            };
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    } else {
        console.log('No settings file found.');
        return null;
    }
}

// API related

async function sendMessageToOpenAI(prompt) {
    console.log("in sendMessageToOpenAI: prompt = ", prompt);
    try {
        // https://platform.openai.com/docs/api-reference/chat/create?lang=node.js
        const completion = await openai.chat.completions.create({
            model: modelName,
            messages: prompt,
            // more options here
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
    try {
        const stream = await openai.chat.completions.create({
            model: modelName,
            messages: messages,
            stream: true,
        });
        for await (const chunk of stream) {
            console.log("main.js  chunk.choices[0]?.delta?.content = ",  chunk.choices[0]?.delta?.content);
            event.sender.send('stream-chunk', chunk.choices[0]?.delta?.content || "");
        }
    } catch (err) {
        console.log(err);
        event.sender.send('stream-error', err);
    }
    event.sender.send('stream-end'); // Notify that the stream is complete
});