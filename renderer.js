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
        messageItem.style.display = 'flex';
        messageItem.style.justifyContent = 'space-between';
        messageItem.style.alignItems = 'center';

        // Create a span to hold the message text
        const messageText = document.createElement('span');
        messageText.innerText = `[${message.role}]: ${message.content}`;
        messageText.style.whiteSpace = 'pre-wrap'; // Ensure long words are wrapped
        messageText.style.wordBreak = 'break-word'; // Ensure long words are wrapped
        messageText.style.flexGrow = '1';

        // Create a container for the buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';

        // Create Edit button
        const editButton = document.createElement('button');
        editButton.innerText = 'Edit';
        editButton.onclick = () => editMessage(index);

        // Create Delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = () => deleteMessage(index);

        // Append buttons to the button container
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        // Append text and button container to the message item
        messageItem.appendChild(messageText);
        messageItem.appendChild(buttonContainer);
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