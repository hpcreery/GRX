const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const autoUpdater = require('electron-updater').autoUpdater
const log = require('electron-log')
const path = require('path')
const url = require('url')
const fs = require('fs')
const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)
require('dotenv').config()

global.sharedObject = { args: process.argv }

//-------------------------------------------------------------------
// Logging
//-------------------------------------------------------------------
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

//-------------------------------------------------------------------
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
//-------------------------------------------------------------------
let mainWindow

//-------------------------------------------------------------------
// Create the Main Window
//-------------------------------------------------------------------
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      enableRemoteModule: true,
      webSecurity: false,
      contextIsolation: false,
    },
  })
  // console.log(process.env)
  // and load the index.html of the app.
  const startUrl = process.env.ELECTRON_START_URL
    ? process.env.ELECTRON_START_URL
    : process.env.ELECTRON_DEVENV
    ? url.format({
        pathname: resolveApp('build/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    : url.format({
        pathname: resolveApp('resources/app/build/index.html'),
        protocol: 'file:',
        slashes: true,
      })
  mainWindow.loadURL(startUrl)

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

//-------------------------------------------------------------------
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//-------------------------------------------------------------------
app.on('ready', createWindow)

//-------------------------------------------------------------------
// Quit when all windows are closed.
//-------------------------------------------------------------------
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

//-------------------------------------------------------------------
// On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
//-------------------------------------------------------------------
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//-------------------------------------------------------------------
// Electorn Update Messages - Not Necessary
//-------------------------------------------------------------------

// function sendStatusToWindow(text) {
//   console.log(text)
//   log.info(text)
//   mainWindow.webContents.send('message', text)
// }
// autoUpdater.on('checking-for-update', () => {
//   sendStatusToWindow('Checking for update...')
// })
// autoUpdater.on('update-available', (info) => {
//   sendStatusToWindow('Update available.')
// })
// autoUpdater.on('update-not-available', (info) => {
//   sendStatusToWindow('Update not available.')
// })
// autoUpdater.on('error', (err) => {
//   sendStatusToWindow('Error in auto-updater. ' + err)
// })
// autoUpdater.on('download-progress', (progressObj) => {
//   let log_message = 'Download speed: ' + progressObj.bytesPerSecond
//   log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
//   log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
//   sendStatusToWindow(log_message)
// })
// autoUpdater.on('update-downloaded', (info) => {
//   sendStatusToWindow('Update downloaded')
// })

//-------------------------------------------------------------------
// CHOOSE one of the following options for Auto updates
//-------------------------------------------------------------------

//-------------------------------------------------------------------
// Auto updates - Option 1 - Simplest version
//
// This will immediately download an update, then install when the
// app quits.
//-------------------------------------------------------------------
app.on('ready', function () {
  autoUpdater.checkForUpdatesAndNotify()
})

autoUpdater.on('update-downloaded', (info) => {
  // autoUpdater.quitAndInstall()
  setTimeout(function () {
    autoUpdater.quitAndInstall()
  }, 5000)
})

//-------------------------------------------------------------------
// Auto updates - Option 2 - More control
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
// app.on('ready', function()  {
//   autoUpdater.checkForUpdates();
// });
// autoUpdater.on('checking-for-update', () => {
// })
// autoUpdater.on('update-available', (info) => {
// })
// autoUpdater.on('update-not-available', (info) => {
// })
// autoUpdater.on('error', (err) => {
// })
// autoUpdater.on('download-progress', (progressObj) => {
// })
// autoUpdater.on('update-downloaded', (info) => {
//   autoUpdater.quitAndInstall();
// })

// import { NsisUpdater } from "electron-updater"
// // Or MacUpdater, AppImageUpdater

// export default class AppUpdater {
//     constructor() {
//         const options = {
//             requestHeaders: {
//                 // Any request headers to include here
//                 Authorization: 'Basic AUTH_CREDS_VALUE'
//             },
//             provider: 'generic',
//             url: 'https://example.com/auto-updates'
//         }

//         const autoUpdater = new NsisUpdater(options)
//         autoUpdater.checkForUpdatesAndNotify()
//     }
// }
