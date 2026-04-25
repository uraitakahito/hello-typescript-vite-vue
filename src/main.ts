import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';
import router from './router';
import { useErrorLog } from './stores/useErrorLog';

// use(pinia):   Pinia をプラグインとして登録し、useXxx() でストアを解決可能にする。
//               useErrorLog() を最初に呼ぶ時点で install 済みである必要があるが、
//               errorHandler 等の closure は「実行時」にストアを解決するため、
//               install 順は「最初の呼び出し前」までに済んでいれば良い。
// use(router):  Vue Router をプラグインとして登録し <RouterView /> / <RouterLink /> を有効化。
const app = createApp(App);
app.use(createPinia());

// 三層防御の最外層 (global 層)。
//   - 子孫の ErrorBoundary が onErrorCaptured で return false しなかったエラー
//   - どの ErrorBoundary にも包まれていないコンポーネントのエラー
//   - render / setup / lifecycle / event handler / watcher 内 throw
//   が最終的にここに到達する。第3引数 info は発生コンテキストを示す
//   文字列 (例: "render function", "event handler", "setup function" 等)。
//
// router の navigation エラー (動的 import 失敗など) はここではなく
// router.onError 側で受ける。両者は別経路。
//
// この closure は「エラー発生時」に呼ばれるため、useErrorLog() の解決は
// install 直後ではなくエラー時点で行われる。Pinia install を errorHandler
// 設定より前にしているのは「最初に発生し得るエラー」より前に install を
// 済ませる教材的な順序付けで、機能上は logical な前後関係を持たない。
app.config.errorHandler = (err, _instance, info) => {
  useErrorLog().push({
    layer: 'global',
    message: `[${info}] ${err instanceof Error ? err.message : String(err)}`,
    at: Date.now(),
  });
};

app.use(router).mount('#app');
