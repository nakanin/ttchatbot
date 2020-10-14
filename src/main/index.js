'use strict'

import { app, screen, globalShortcut, ipcMain, BrowserWindow, Tray, Menu } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import os from 'os'
import ElectronPreferences from 'electron-preferences'

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

function showMainWindow() {
  if (!mainWindow.isVisible()) {
    mainWindow.reload()
    setTimeout(() => {
      mainWindow.show()
    }, 500)
  }
}

function setUpTray() {
  const iconPath = isDevelopment ? __dirname + '/icon.png' : path.join(process.resourcesPath, "icon.png")
  tray = new Tray(iconPath);
  tray.on('click', () => {
    showMainWindow()
  })
  const contextMenu = Menu.buildFromTemplate([
    {label: '設定', click: () => {
      preferences.show()
    }},
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
app.whenReady().then(() => {
  mainWindow = createMainWindow()
  setUpTray()

  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    showMainWindow()
  })
})

const preferences = new ElectronPreferences({
  'dataStore': path.resolve(app.getPath('userData'), 'preferences.json'),
  'defaults': {
    'setting': {
      'title': 'Google',
      'url': 'https://www.google.com/search?q=',
    }
  },
  'sections': [
    {
      'id': 'setting',
      'label': '設定',
      'icon': 'settings-gear-63',
      'form': {
        'groups': [
          {
            'label': '検索する場所の設定',
            'fields': [
              {
                'label': '名前',
                'key': 'title',
                'type': 'text',
                'help': '単にチャットのやり取りで表示されるだけです'
              },
              {
                'label': 'URL',
                'key': 'url',
                'type': 'text',
                'help': 'このURLの後に入力したキーワードをつけてブラウザで表示します'
              }
            ]
          }
        ]
      }
    }
  ]
})