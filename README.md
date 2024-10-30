<div align="center">
  <a title="GRX" href="https://grx.creery.org">
    <img src="./resources/icon.png" width="120" height="120">
  </a>
  <h1>GRX</h1>
  <p>GPU-Accelerated Web Based EDA Manufacturing Artwork Viewer</p>
  <a title="GRX" href="https://grx.creery.org">
    <img src="https://img.shields.io/website?label=grx.creery.org&url=https%3A%2F%2Fgrx.creery.org%2F">
  </a>
  <img src="https://img.shields.io/github/package-json/v/hpcreery/grx">
  <img src="https://img.shields.io/github/actions/workflow/status/hpcreery/grx/release.yml">
  <img src="https://img.shields.io/github/license/hpcreery/grx">
</div>

![preview](/resources/screenshot-v3.1-dark.png)

## About

GRX is designed to be an easy to use online manufacturing artwork data exchange viewer. Under the hood, GRX uses WebGL for rendering at the best performance and WebWorkers for parsing on multiple cores, even isolating the Main DOM thread from the WebGL renderer thread.

## Features

- 🚀 GPU-Accelerated
- 🏃 Fast and Responsive
- 👍 Easy to use
- 🤏 Touchscreen Friendly
- 🖥 Cross Platform and Available Everywhere

## Supported Artwork Formats

- [x] Gerber RS-274X
  - [x] X1
  - [ ] X2 ( coming soon! )
  - [ ] X3
- [x] NC
  - [x] XNC ( attributes coming soon! )
  - [ ] IPC-NC-349
  - [x] Excellon
  - [x] Sieb & Meyer ( excellon version )
- [x] GDSII
- [ ] ODB++
- [ ] IPC-2581
- [x] DXF
- [ ] OASIS

## Tools

- [Electron](https://electronjs.org/)
- [React](https://reactjs.org/)
- [regl](http://regl.party/)
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [Typescript](https://www.typescriptlang.org/)
- [Tracespace (forked)](https://github.com/hpcreery/tracespace)
- [Vite](https://vitejs.dev/)
- [Mantine](https://mantine.dev/)
