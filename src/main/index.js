'use strict'

import { app, screen, ipcMain, BrowserWindow, Tray, Menu } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'

const isDevelopment = process.env.NODE_ENV !== 'production'

let mainWindow
let tray

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const windowWidth = 400
  const windowHeight = 200
  const margin = 10
  const window = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: width - windowWidth - margin,
    y: height - windowHeight - margin,
    frame: false,
    show: false,
    alwaysOnTop: true,
    webPreferences: {nodeIntegration: true}
  })

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  return window
}

function setUpTray() {
  tray = new Tray(__dirname + '/icon.png');
  tray.on('click', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.reload()
      setTimeout(() => {
        mainWindow.show()
      }, 500)
    }
  })
  const contextMenu = Menu.buildFromTemplate([
    {label: '終了', click: () => {
      mainWindow = null;
      app.quit();
    }}
  ])
  tray.setContextMenu(contextMenu)
}

ipcMain.handle('hide-window', (event, ...args) => {
  mainWindow.hide()
})

app.on('browser-window-blur', () => {
  mainWindow.hide()
})

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()
  setUpTray()
})
