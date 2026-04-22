import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';

// createApp:    ルート SFC から Vue アプリケーションインスタンスを生成。
// use(router):  Vue Router をプラグインとして登録し <RouterView /> / <RouterLink /> を有効化。
// mount('#app'): index.html の <div id="app"></div> に実 DOM をマウント。
createApp(App).use(router).mount('#app');
