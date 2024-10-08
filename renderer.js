const { ipcRenderer } = require('electron');

document.getElementById('open-file').addEventListener('click', () => {
    ipcRenderer.send('open-file-dialog');
});

ipcRenderer.on('file-opened', (event, content) => {
    const chatHistory = JSON.parse(content);
    const chatView = document.getElementById('chat-viewer');

    let formattedChat = chatHistory.map(entry => {
        return `[${entry.role}]: ${entry.content}`;
    }).join('\n\n');

    chatView.value = formattedChat;
});