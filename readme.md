# Manage your Chat Sessions in a Directory

## Getting Started

The current release includes the app as a zip file that works out-of-the-box on Windows. It's not an installer but the app itself. Currently, there is no official support for other platforms, but you might be able to build the app from source.

### Initial Setup: API key, base url and model name

Before you start chatting, you'll need to provide the API key, base url and model name by clicking the "Update Settings" button.

- Example base-url: https://api.openai.com/v1/
- Example model-name: gpt-4o

Note that the API key, base url and model name are stored on your platform. For example on Windows, they might be stored in `C:\Users\<Username>\AppData\Roaming\one-chat\user-settings.json`. Please take note of this to avoid leaking your API key.

### Features

View your chat sessions in a directory tree and switch between chats

![img](demo-gifs/switch-files.gif)

Create a new chat or continue a previous chat, using ChatGPT to generate response

![img](demo-gifs/continue-chat.gif)

Save your chat sessions as a JSON file in the directory tree

![img](demo-gifs/save-as.gif)

## Running the application from source

1. `npm install`
2. `npm start`

## Packaging the project as a desktop application

1. `npm install`
2. `npm run make`
3. the packaged application is in the out/ folder

## Next Steps

1. Let users add their own API key. (Done)
2. Handle errors from OpenAI API. (Done)
3. Support the app on Linux platforms.