<div align="center">
  <h1>GRX</h1>
  <p>Fastest Web Based Gerber Viewer</p>
  <p>!! DEVELOPMENT !!</p>
</div>

See the current build in production here -> [GRX](http://grx.creery.org)

![preview](/resources/screenshot.png)

## About

GRX is designed to be an easy to use online gerber viewer. Under the hood, GRX uses WebGL for rendering at the best performance and WebWorkers for parsing on multiple cores, even isolating the Main DOM thread from the WebGL renderer thread.

## Features

* 🏃 Fast
* 👍 Easy to use
* 📄 Gerber RS-274X
* 🖥 Multi-Platform Electron App

## Tools
* [Electron](https://electronjs.org/)
* [React](https://reactjs.org/)
* [PixiJS](https://www.pixijs.com/)
* [Typescript](https://www.typescriptlang.org/)
* [Tracespace](https://github.com/hpcreery/tracespace)

```
electron-icon-builder --input=build/icon.png --output=build --flatten && mv build/icons/* build && rm -rf build/icons
```
