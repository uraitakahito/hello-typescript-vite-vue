import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';

// createWebHistory:     HTML5 History API を使うモード。URL は `/hello` のような clean URL。
//                        本番配信では nginx 側で try_files による SPA フォールバックが必要
//                        （docker/nginx.conf 参照）。
// createWebHashHistory: `/#/hello` のような hash ベース。サーバ設定不要でどこでも動くが
//                        URL に `#` が入る。学習初期のトラブル回避を優先するなら選択肢。
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/hello',
    name: 'hello',
    // ルート分割: hello ページのコードは初回バンドルに含まれず、遷移時に動的 import される。
    // 小規模アプリでは差が小さいが、SFC/ページ単位で code-splitting する作法を示す意図。
    component: () => import('../views/HelloView.vue'),
  },
  {
    path: '/focus',
    name: 'focus',
    // /hello と同じく動的 import。onMounted + template ref の教材ページ。
    component: () => import('../views/FocusView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
