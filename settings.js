document.getElementById('settings-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const apiKey = document.getElementById('api-key').value;
    const modelName = document.getElementById('model-name').value;
    const baseUrl = document.getElementById('base-url').value;

    // Send the settings to the main process for storage
    console.log("sending save-settings: apiKey = ", apiKey, ", modelName = ", modelName, ", baseUrl = ", baseUrl);
    electron.send('save-settings', { apiKey, modelName, baseUrl });
    window.close();
});

electron.on('prefill-settings', (settings) => {
    console.log("in prefill-settings: settings = ", settings);
    document.getElementById('api-key').value = settings.apiKey;
    document.getElementById('model-name').value = settings.modelName;
    document.getElementById('base-url').value = settings.baseUrl;
});