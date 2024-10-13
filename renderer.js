// const { ipcRenderer } = require('electron');

let chatHistory = [];
let editingIndex = null; // To track which message is being edited

const textarea = document.querySelector('.message-input textarea');
const roleselect = document.getElementById('role-select');
const addbutton = document.getElementById('add-button');

document.getElementById('clear-chat').addEventListener('click', () => {
    chatHistory = [];
    updateMessageList();
});

document.getElementById('open-file').addEventListener('click', () => {
    window.electronAPI.send('open-file-dialog');
}); // () => {...} is called a callback function

window.electronAPI.on('file-opened', (content) => {
    chatHistory = JSON.parse(content);
    updateMessageList();
});

document.getElementById('save-file').addEventListener('click', () => {
    window.electronAPI.send('save-file-dialog', JSON.stringify(chatHistory));
});

window.electronAPI.on('file-save-successful', (filePath) => {
    alert('Current chat successfully saved to ' + filePath);
});

// Adjust textarea height based on content
textarea.addEventListener('input', function () {
    this.style.height = 'auto'; // Reset the height
    this.style.height = Math.min(this.scrollHeight, 10 * 1.5 * 16) + 'px'; // Limit to 10 lines
});


addbutton.addEventListener('click', async () => {
    const role = roleselect.value;
    messageText = textarea.value;
    console.log("Role: ", role);
    console.log("Message: ", messageText);

    if (editingIndex !== null) {
        // Update the existing message
        chatHistory[editingIndex] = { role, content: messageText };
        editingIndex = null; // Reset the editing index
        addbutton.textContent = 'Add';
        textarea.value = ''; // Clear input
        textarea.style.height = 'auto'; // Reset the height
        updateMessageList();
        return;
    }
    if (!messageText) {
        if (role == 'assistant') {
            // Let ChatGPT generate a message as a 'assistant'
            console.log("Trying to generate");
            const response = await api.sendPrompt(chatHistory);
            console.log("type of response: ", typeof response);
            console.log("Response: ", response);
            messageText = response;
        } else {
            alert('Please enter a message to send');
            return;
        }
    }

    chatHistory.push({ role, content: messageText });
    textarea.value = ''; // Clear input
    textarea.style.height = 'auto'; // Reset the height
    updateMessageList();

    if (role == 'assistant' || role == 'system') {
        roleselect.value = 'user';
    } else {
        roleselect.value = 'assistant';
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
        messageItem.style.paddingTop = '10px';
        messageItem.style.paddingBottom = '10px';

        // Create a span to hold the message text
        const messageText = document.createElement('span');
        messageText.innerText = `#${index} [${message.role}]: ${message.content}`;
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
    roleselect.value = message.role;
    textarea.value = message.content;

    editingIndex = index; // Set the index of the message being edited
    addbutton.textContent = 'Save #' + index;
}

function deleteMessage(index) {
    chatHistory.splice(index, 1);
    updateMessageList();
}