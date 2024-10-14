// const { ipcRenderer } = require('electron');

let chatHistory = [];
let filePath = null;
let filedirty = false;
let editingIndex = null; // To track which message is being edited
let busygenerating = false;
let streambuffer = '';
let dirPath = null;
let fileTree = null;

const textarea = document.querySelector('.message-input textarea');
const roleselect = document.getElementById('role-select');
const addbutton = document.getElementById('add-button');
const messageList = document.getElementById('message-list');
const dirtreeelem = document.getElementById('dir-content');


document.getElementById('clear-chat').addEventListener('click', () => {
    filePath = null;
    filedirty = false;
    chatHistory = [];
    updateMessageList();
    document.title = 'New Chat';
});

document.getElementById('open-file').addEventListener('click', () => {
    window.electronAPI.send('open-file-dialog');
}); // () => {...} is called a callback function

window.electronAPI.on('file-opened', (path, content) => {
    chatHistory = JSON.parse(content);
    filePath = path;
    filedirty = false;
    updateMessageList();
    updateHTMLTitle();
});

document.getElementById('save-file').addEventListener('click', () => {
    if (filePath === null) {
        window.electronAPI.send('save-as-dialog', JSON.stringify(chatHistory));
    } else
    window.electronAPI.send('save-file-dialog', filePath, JSON.stringify(chatHistory));
});

window.electronAPI.on('save-successful', () => {
    filedirty = false;
    alert('Edits Saved');
});

document.getElementById('save-as').addEventListener('click', () => {
    window.electronAPI.send('save-as-dialog', JSON.stringify(chatHistory));
});

window.electronAPI.on('save-as-successful', (filePathNew) => {
    filePath = filePathNew;
    filedirty = false;
    alert('Current chat successfully saved to ' + filePathNew);
    // refresh directory tree to reflect potential new file
    if (dirPath !== null) window.electronAPI.send('open-dir', dirPath);
    updateHTMLTitle();
});

document.getElementById('open-dir').addEventListener('click', () => {
    window.electronAPI.send('open-dir-dialog');
});

window.electronAPI.on('dir-opened', (path, tree) => {
    dirPath = path;
    fileTree = JSON.parse(tree);
    console.log("fileTree = ", fileTree);
    renderdirtree();
    updateHTMLTitle();
});

// Adjust textarea height based on content
textarea.addEventListener('input', function () {
    this.style.height = 'auto'; // Reset the height
    this.style.height = Math.min(this.scrollHeight, 10 * 1.5 * 16) + 'px'; // Limit to 10 lines
});

// Register listeners in advance (before the stream starts)
api.onStreamChunk((chunk) => {
    console.log("chunk = ", chunk);
    c = messageList.children;
    c[c.length-1].children[0].innerText += chunk;
    streambuffer += chunk;
});

api.onStreamEnd(() => {
    busygenerating = false;
    addbutton.disabled = false;
    chatHistory[chatHistory.length-1].content = streambuffer;
    streambuffer = '';
});

addbutton.addEventListener('click', async () => {
    const role = roleselect.value;
    messageText = textarea.value;
    console.log("Role: ", role);
    console.log("Message: ", messageText);
    filedirty = true;

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
            // alternatively, use blocking call: const response = await api.sendPrompt(chatHistory);
            busygenerating = true;
            addbutton.disabled = true;
            api.startStream(chatHistory); // BUGFIX 2: don't put await here
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
    filedirty = true;
    chatHistory.splice(index, 1);
    updateMessageList();
}

function pathtail(path) {
    return path.split('\\').pop();
}

function tree2elem(tree) {
    if (tree == null) return null;
    const elem = document.createElement('li');
    elem.innerText = pathtail(tree.path);
    if (tree.items.length == 0) {
        elem.style.color = 'blue';
        elem.onclick = () => {
            console.log("clicked: ", tree.path);
            if (filedirty == false)
                window.electronAPI.send('open-file', tree.path);
            else {
                if (filePath !== null)
                    window.electronAPI.send('save-and-open', tree.path, filePath, JSON.stringify(chatHistory));
                else
                    window.alert("Please save or clear the current chat before opening another file.");
            }
        }
    } else {
        const ul = document.createElement('ul');
        tree.items.forEach(item => {
            if (item.items.length > 0 || item.path.endsWith('.json'))
                ul.appendChild(tree2elem(item));
        })
        elem.appendChild(ul);
    }
    return elem;
}

function renderdirtree() {
    if (fileTree == null) return;
    dirtreeelem.innerHTML = pathtail(fileTree.path);
    const ul = document.createElement('ul');
    fileTree.items.forEach(item => {
        if (item.items.length > 0 || item.path.endsWith('.json'))
            ul.appendChild(tree2elem(item));
    })
    dirtreeelem.appendChild(ul);
}

function updateHTMLTitle() {
    if (filePath === null) {
        document.title = 'New Chat';
    } else if (dirPath !== null && filePath.startsWith(dirPath)) {
        // Omit the path to directory
        const relpath = filePath.substring(dirPath.length+1);
        document.title = relpath;
    } else {
        document.title = filePath;
    }
}