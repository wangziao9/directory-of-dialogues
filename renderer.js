const { ipcRenderer } = require('electron');

let chatHistory = [];
let editingIndex = null; // To track which message is being edited

document.getElementById('open-file').addEventListener('click', () => {
    ipcRenderer.send('open-file-dialog');
});

ipcRenderer.on('file-opened', (event, content) => {
    chatHistory = JSON.parse(content);
    updateMessageList();
});

document.getElementById('add-message').addEventListener('click', () => {
    const role = document.getElementById('role-select').value;
    const messageText = document.getElementById('message-input-field').value;

    if (messageText) {
        if (editingIndex !== null) {
            // Update the existing message
            chatHistory[editingIndex] = { role, content: messageText };
            editingIndex = null; // Reset the editing index
        } else {
            // Add a new message
            chatHistory.push({ role, content: messageText });
        }
        
        document.getElementById('message-input-field').value = ''; // Clear input
        updateMessageList();
    }
});

function updateMessageList() {
    const messageList = document.getElementById('message-list');
    messageList.innerHTML = ''; // Clear existing list

    chatHistory.forEach((message, index) => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        messageItem.innerText = `[${message.role}]: ${message.content}`;
        
        const editButton = document.createElement('button');
        editButton.innerText = 'Edit';
        editButton.onclick = () => editMessage(index);

        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = () => deleteMessage(index);

        messageItem.appendChild(editButton);
        messageItem.appendChild(deleteButton);
        messageList.appendChild(messageItem);
    });
}

function editMessage(index) {
    const message = chatHistory[index];
    document.getElementById('role-select').value = message.role;
    document.getElementById('message-input-field').value = message.content;

    editingIndex = index; // Set the index of the message being edited
}

function deleteMessage(index) {
    chatHistory.splice(index, 1);
    updateMessageList();
}