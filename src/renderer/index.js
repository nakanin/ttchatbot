import Vue from 'vue'
import BotUI from 'botui'
import { ipcRenderer, shell } from 'electron'
import 'botui/build/botui.min.css'
import 'botui/build/botui-theme-default.css'

// BotUIでは html 側に <bot-ui></bot-ui> を書く必要がある
// https://docs.botui.org/install.html#bot-ui-tag
// しかし、electron-webpack では <div id="app"></div> しか生成してくれない
// https://webpack.electron.build/development#use-of-html-webpack-plugin
// なので、手動で追加する
const app = document.getElementById("app")
const bot = document.createElement("bot-ui")
app.appendChild(bot)

// 公式ドキュメントに沿って初期化
// https://docs.botui.org/install.html#using-webpack
const botui = BotUI('app', {
  vue: Vue
})

const preferences = ipcRenderer.sendSync('getPreferences')
const config = { ...preferences.setting }

// チャットのやり取りを定義
botui.message.add({
  delay: 500,
  content: 'こんにちは。何をお探しでしょうか？'
}).then(() => {
  return botui.action.text({
    delay: 500,
    action: {
      placeholder: 'キーワード'
    }
  })
}).then((res) => {
  botui.message.add({
    delay: 1000,
    content: config.title + ' で「' + res.value + '」を探します...'
  })
  setTimeout(() => {
    shell.openExternal(config.url + res.value)
    ipcRenderer.invoke('hide-window')
  }, 2000)
})
