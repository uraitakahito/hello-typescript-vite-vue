<script setup lang="ts">
import ErrorBoundary from '../components/ErrorBoundary.vue';
import BrokenChild from '../components/BrokenChild.vue';
import { useErrorLog } from '../composables/useErrorLog';

// 三層防御 (global / boundary / router) のどこで throw が捕捉されるかを
// 1 ビューで観察する教材。各セクションのボタン or リンクを押すと、画面下の
// ログテーブルに対応する layer が追記される。
//
// 観察ポイント:
//   1. 「境界の外」ボタン (このビュー直下のクリックハンドラ throw)
//      → どの ErrorBoundary にも包まれていないので app.config.errorHandler
//        (= global 層) に届く
//   2. 「境界の中」ボタン (<ErrorBoundary> で囲んだ <BrokenChild> のクリック)
//      → ErrorBoundary の onErrorCaptured が return false で受けるので
//        boundary 層に止まる。global 層には届かない
//   3. 「失敗するルートに遷移」リンク
//      → /missing は component ローダが Promise.reject するため
//        router.onError (= router 層) が捕捉する
//
// 実験のヒント: src/components/ErrorBoundary.vue の onErrorCaptured で
// `return false` をコメントアウトすると、(2) のクリックが boundary に加えて
// global にも記録され、ログに 2 行並ぶようになる。

const { entries, clear } = useErrorLog();

// 境界の外 (= app.config.errorHandler 行き)。
// イベントハンドラ内の throw は Vue の捕捉経路に乗るため、ここで投げると
// 親ツリーに ErrorBoundary がない限り global 層まで素通りする。
const throwOutside = (): void => {
  throw new Error('Boom outside any boundary');
};

const formatTime = (ms: number): string => new Date(ms).toLocaleTimeString();
</script>

<template>
  <div class="error-view">
    <h1>Error handling: 3-layer defense</h1>

    <section>
      <h2>1. Outside any boundary (global layer)</h2>
      <button
        type="button"
        @click="throwOutside"
      >
        Throw outside boundary
      </button>
    </section>

    <section>
      <h2>2. Inside ErrorBoundary (boundary layer)</h2>
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    </section>

    <section>
      <h2>3. Failed dynamic import (router layer)</h2>
      <p>
        <RouterLink to="/missing">
          Navigate to /missing
        </RouterLink>
      </p>
      <p class="hint">
        遷移自体は失敗 (URL は変わらない) するが router.onError がエラーを受ける。
      </p>
    </section>

    <section>
      <div class="log-header">
        <h2>Captured log</h2>
        <button
          type="button"
          @click="clear"
        >
          Clear
        </button>
      </div>
      <table v-if="entries.length > 0">
        <thead>
          <tr>
            <th>time</th>
            <th>layer</th>
            <th>message</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(entry, index) in entries"
            :key="index"
          >
            <td>{{ formatTime(entry.at) }}</td>
            <td>{{ entry.layer }}</td>
            <td>{{ entry.message }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>
        (no errors captured yet)
      </p>
    </section>
  </div>
</template>

<style scoped>
.error-view {
  text-align: left;
  padding: 2rem;
}

section {
  margin: 2rem 0;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hint {
  color: #888;
  font-size: 0.9em;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #444;
  padding: 0.4rem 0.6rem;
  text-align: left;
  vertical-align: top;
}
</style>
