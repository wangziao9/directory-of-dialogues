# Manage your Chat Sessions in a Directory

## Demonstrations

View your chat sessions in a directory tree and switch between chats

![img](demo-gifs/switch-files.gif)

Create a new chat or continue a previous chat, using ChatGPT to generate response

![img](demo-gifs/continue-chat.gif)

Save your chat sessions as a json file in the directory tree

![img](demo-gifs/save-as.gif)

## How to run the application with the source code

1. `npm install`
2. `npm start`

## How to package the project to a desktop application

1. `npm install`
2. `npm run make`
3. the packaged application is in the out/ folder

## You must fill in an API key, base url and model name in application to chat

- Example base-url: https://api.openai.com/v1/
- Example model-name: gpt-4o

## Next Steps

1. Let users add their own API key. (Done)
2. Handle errors from OpenAI API. (Done)
3. Support the app on Linux platforms.