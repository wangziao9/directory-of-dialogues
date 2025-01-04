let chatHistory = [];
let filePath = null;
let filedirty = false;
let editingIndex = null; // To track which message is being edited
let busygenerating = false;
let streambuffer = '';
let dirPath = null;
let dirTree = null;

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
    electron.send('open-file-dialog');
});

electron.on('file-opened', (path, content) => {
    chatHistory = JSON.parse(content);
    filePath = path;
    filedirty = false;
    editingIndex = null;
    updateMessageList();
    updateHTMLTitle();
    adjustAddButton();
});

document.getElementById('save-file').addEventListener('click', () => {
    if (filePath === null) {
        electron.send('save-as-dialog', JSON.stringify(chatHistory));
    } else
    electron.send('save-file-dialog', filePath, JSON.stringify(chatHistory));
});

electron.on('save-successful', () => {
    filedirty = false;
    // alert('Edits Saved'); commented because it causes the glitch that the textarea cannot be selected
});

document.getElementById('save-as').addEventListener('click', () => {
    electron.send('save-as-dialog', JSON.stringify(chatHistory));
});

electron.on('save-as-successful', (filePathNew) => {
    filePath = filePathNew;
    filedirty = false;
    // alert('Current chat successfully saved to ' + filePathNew); commented because it causes glitch
    // refresh directory tree to reflect potential new file
    if (dirPath !== null) electron.send('open-dir', dirPath);
    updateHTMLTitle();
});

document.getElementById('open-dir').addEventListener('click', () => {
    electron.send('open-dir-dialog');
});

electron.on('dir-opened', (path, tree) => {
    dirPath = path;
    dirTree = JSON.parse(tree);
    console.log("dirTree = ", dirTree);
    renderdirtree();
    updateHTMLTitle();
});

// Adjust the add button
function adjustAddButton() {
    addbutton.style.backgroundColor = '#f0f0f0';
    addbutton.style.color = 'black';
    if (editingIndex != null) {
        addbutton.textContent = 'Save #' + editingIndex;
    } else if (roleselect.value == 'assistant' && textarea.value == '') {
        addbutton.textContent = 'Generate';
        addbutton.style.backgroundColor = 'purple';
        addbutton.style.color = 'white';
    } else {
        addbutton.textContent = 'Add';
    }
}

// Adjust textarea height based on content
textarea.addEventListener('input', function () {
    this.style.height = 'auto'; // Reset the height
    this.style.height = Math.min(this.scrollHeight, 10 * 1.5 * 16) + 'px'; // Limit to 10 lines
    adjustAddButton();
});

roleselect.addEventListener('change', adjustAddButton);

// Register listeners in advance (before the stream starts)
electron.on('stream-chunk', (chunk) => {
    console.log("chunk = ", chunk);
    c = messageList.children;
    c[c.length-1].children[0].innerText += chunk;
    streambuffer += chunk;
});

electron.on('stream-end', () => {
    busygenerating = false;
    addbutton.disabled = false;
    chatHistory[chatHistory.length-1].content = streambuffer;
    streambuffer = '';
    updateMessageList();
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
        textarea.value = ''; // Clear input
        textarea.style.height = 'auto'; // Reset the height
        if (chatHistory[chatHistory.length-1].role == 'user') roleselect.value = 'assistant'
        else roleselect.value = 'user';
        updateMessageList();
        adjustAddButton();
        return;
    }

    if (!messageText) {
        if (role == 'assistant') {
            // alternatively, use blocking call: const response = await electron.invoke('send-prompt', chatHistory);
            // or electron.invoke('send-prompt', chatHistory).then(response => { ... });
            busygenerating = true;
            addbutton.disabled = true;
            electron.invoke('start-stream', chatHistory);
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
    adjustAddButton();
});

function updateMessageList() {
    messageList.innerHTML = ''; // Clear existing list

    chatHistory.forEach((message, index) => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        if (message.role == 'assistant') messageItem.style.backgroundColor = '#f0f0f0';

        // Create a span to hold the message text
        const messageText = document.createElement('span');
        messageText.innerHTML = marked.render(`#${index} [${message.role}]: ${message.content}`);
        messageText.style.whiteSpace = 'pre-line'; // Preserve and collapse whitespace. If commented, will be compact.
        messageText.style.wordBreak = 'break-word'; // Ensure long words are wrapped

        // Create a container for the buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '5px';

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
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 10 * 1.5 * 16) + 'px';

    editingIndex = index; // Set the index of the message being edited
    adjustAddButton(index);
}

function deleteMessage(index) {
    filedirty = true;
    chatHistory.splice(index, 1);
    updateMessageList();
}

function pathtail(path) {
    return path.split('/').pop();
}

function tree2elem(tree) {
    if (tree == null) return null;
    const elem = document.createElement('li');
    elem.innerText = pathtail(tree.path);
    if (tree.children == null) {
        elem.style.color = 'blue';
        elem.onclick = () => {
            console.log("clicked: ", tree.path);
            if (filedirty == false)
                electron.send('open-file', tree.path);
            else {
                if (filePath !== null)
                    electron.send('save-and-open', tree.path, filePath, JSON.stringify(chatHistory));
                else
                    window.alert("Please save or clear the current chat before opening another file.");
            }
        }
    } else {
        const ul = document.createElement('ul');
        tree.children.forEach(file => {
            if (file.children != null || file.path.endsWith('.json'))
                ul.appendChild(tree2elem(file));
        })
        elem.appendChild(ul);
    }
    return elem;
}

function renderdirtree() {
    if (dirTree == null) return;
    dirtreeelem.innerHTML = pathtail(dirTree.path);
    const ul = document.createElement('ul');
    dirTree.children.forEach(file => {
        if (file.path.endsWith('.json') || (file.children && file.children.length > 0))
            ul.appendChild(tree2elem(file));
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