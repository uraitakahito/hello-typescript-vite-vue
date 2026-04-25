import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import { useErrorLog } from '../stores/useErrorLog';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/counter',
    name: 'counter',
    // ref / @click の最小例。
    component: () => import('../views/CounterView.vue'),
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
  {
    path: '/todos',
    name: 'todos',
    // Pinia の三本柱 (state / getters / actions) を観察する教材ビュー。
    // setup style における getters = `computed` の対応関係、getter 合成、
    // storeToRefs の作法、store 単独テストをまとめて見せる。
    // `/error` (3 つの捕捉源が 1 ストアを共有) と異なり、1 ストア 1 ビューで完結。
    component: () => import('../views/TodosView.vue'),
  },
  {
    path: '/error',
    name: 'error',
    // 三層防御 (global / boundary / router) を観察する教材ビュー。
    component: () => import('../views/ErrorView.vue'),
  },
  {
    path: '/missing',
    name: 'missing',
    // 動的 import の失敗を意図的に起こすルート。createWebHistory で `/missing`
    // を踏むと、router は component ローダを await し、その Promise が reject
    // すると router.onError 経由でエラーが流れる。
    //   - 存在しないファイルパスを書く方法: 型チェック / ビルドで詰まりやすい
    //   - Promise.reject を返す方法: 失敗を作っているのが明示的で教材として読みやすい
    // ここでは後者を採用。Lazy<RouteComponent> = () => Promise<RouteComponent> なので
    // Promise<never> (reject) は型適合する。
    component: () => Promise.reject(new Error('Simulated dynamic import failure')),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// router.onError は以下のエラーを受ける:
//   - 動的 import (lazy route component) の失敗
//   - navigation guard (beforeEach / beforeEnter 等) 内 throw
//   - 解決中にスローされた async errors
// app.config.errorHandler とは別経路で、ビュー内 click handler の throw 等は
// こちらには届かない (それは global 層側)。
router.onError((err, to) => {
  useErrorLog().push({
    layer: 'router',
    message: `to=${to.fullPath} ${err instanceof Error ? err.message : String(err)}`,
    at: Date.now(),
  });
});

export default router;
