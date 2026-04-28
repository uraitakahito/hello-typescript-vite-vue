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
    path: '/scroll',
    name: 'scroll',
    // reactive な state 変更を起点とした DOM 更新の「反映後」に DOM へ触る
    // タイミングを学ぶ。
    // 公式: https://ja.vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing
    component: () => import('../views/ScrollView.vue'),
  },
  {
    path: '/computed-cache',
    name: 'computed-cache',
    // computed の依存追跡 (track) が成立する条件を学ぶ教材ビュー。
    // Date.now() のような外部関数だけを read する getter は dep set が空に
    // なり、初回評価値がキャッシュされたまま invalidate されない、という
    // 公式ドキュメントの罠を左右並べで観察する。
    // 公式: https://ja.vuejs.org/guide/essentials/computed.html
    component: () => import('../views/ComputedCacheView.vue'),
  },
  {
    path: '/todos',
    name: 'todos',
    // Pinia の三本柱 (state / getters / actions) を観察する教材ビュー。
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
//
// 具体例 (一つに過ぎない): src/views/ErrorView.vue の
// <RouterLink to="/missing"> をクリックすると、上の routes 配列で
// `/missing` の component を `() => Promise.reject(...)` と宣言してある
// ため component ローダが reject し、この onError が発火する。
//
// ただし発火源は ErrorView だけではない。別のビューが <RouterLink> や
// router.push() で失敗ルートへ飛ぶ／将来 navigation guard で throw する／
// 動的 import が chunk fetch 失敗で reject する、といった全ての経路が
// ここに集まる。「呼び出し元はどこか」を ahead-of-time に網羅することは
// できない。
//
// だからこそ、push 側 (この router.onError) は呼び出し元を知らず、
// 観察側 (ErrorView.vue) も router.onError を直接 import せず、両者が
// Pinia ストア useErrorLog 経由でしか結合しないという疎結合が重要になる。
// 新しい捕捉経路を増やしても観察側のコードは触らずに済み、観察側を
// 増やしても捕捉側に手を入れる必要がない (= 三層防御が「層」として独立に
// 育てられる)。同じ理由で main.ts の app.config.errorHandler /
// ErrorBoundary.vue の onErrorCaptured も互いと観察側の存在を知らない。
router.onError((err, to) => {
  useErrorLog().push({
    layer: 'router',
    message: `to=${to.fullPath} ${err instanceof Error ? err.message : String(err)}`,
    at: Date.now(),
  });
});

export default router;
