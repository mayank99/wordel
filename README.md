# wordel

A simple wordle clone created using preact and vanilla CSS, with no external dependencies.

Try it at: [wordel.app](https://www.wordel.app)

## Features

- Lightweight and fast (blazing??): ~60KB total, including words list
- Word list and answers synced with NYT Wordle
- Fully accessible (color contrast, semantics, labels, keyboard, skipped emojis)
- Dark or light theme based on system preference
- Playable offline by installing PWA
- Minimalist UI with beautiful gradients and animations

## Development

This project was bootstrapped using Vite. The components are written using Preact + TSX and styled using vanilla CSS with PostCSS for nesting. The service worker is generated using vite-plugin-pwa.

To start the local development server, clone the repo and run the following commands:

```console
npm install
npm run dev
```
