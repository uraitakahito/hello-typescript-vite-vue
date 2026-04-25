import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { useErrorLog } from './composables/useErrorLog';

// createApp:    ルート SFC から Vue アプリケーションインスタンスを生成。
// use(router):  Vue Router をプラグインとして登録し <RouterView /> / <RouterLink /> を有効化。
// mount('#app'): index.html の <div id="app"></div> に実 DOM をマウント。
//
// 旧コードでは createApp(App).use(router).mount('#app') と 1 行で書いていたが、
// 三層防御の global 層 (app.config.errorHandler) を登録するために
// createApp の戻り値を変数に取り出す形に分解している。
const app = createApp(App);

// 三層防御の最外層 (global 層)。
//   - 子孫の ErrorBoundary が onErrorCaptured で return false しなかったエラー
//   - どの ErrorBoundary にも包まれていないコンポーネントのエラー
//   - render / setup / lifecycle / event handler / watcher 内 throw
//   が最終的にここに到達する。第3引数 info は発生コンテキストを示す
//   文字列 (例: "render function", "event handler", "setup function" 等)。
//
// router の navigation エラー (動的 import 失敗など) はここではなく
// router.onError 側で受ける。両者は別経路。
app.config.errorHandler = (err, _instance, info) => {
  useErrorLog().push({
    layer: 'global',
    message: `[${info}] ${err instanceof Error ? err.message : String(err)}`,
    at: Date.now(),
  });
};

app.use(router).mount('#app');
