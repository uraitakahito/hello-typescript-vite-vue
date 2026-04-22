import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';

// createWebHistory:     HTML5 History API を使うモード。URL は `/hoge` のような clean URL。
//                        本番配信では nginx 側で try_files による SPA フォールバックが必要
//                        （docker/nginx.conf 参照）。
// createWebHashHistory: `/#/hoge` のような hash ベース。サーバ設定不要でどこでも動くが
//                        URL に `#` が入る。学習初期のトラブル回避を優先するなら選択肢。
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/hoge',
    name: 'hoge',
    // ルート分割: hoge ページのコードは初回バンドルに含まれず、遷移時に動的 import される。
    // 小規模アプリでは差が小さいが、SFC/ページ単位で code-splitting する作法を示す意図。
    component: () => import('../views/HogeView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
