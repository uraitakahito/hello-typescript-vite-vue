<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// 公式: https://ja.vuejs.org/guide/essentials/computed.html
//   "Date.now() はリアクティブな依存ではないため、次の算出プロパティは
//    二度と更新されないことを意味します"
//
// 教材趣旨:
//   computed の依存追跡は「ref / reactive プロパティの read」を Vue が
//   Proxy 経由で track して成立する。Date.now() のような外部関数しか呼ばない
//   getter は dep set が空集合のまま固定され、初回評価値がキャッシュされ続ける。
//
// 観察構造:
//   左 (broken): computed(() => Date.now())
//                依存追跡が空 → 初回評価で値が固定される。
//   右 (fixed) : ref(Date.now()) を 1 秒ごとに書き戻し、computed が ref.value を
//                read することで dep が成立する。
//   両カラムは setInterval を共有する (timer は 1 本に集約)。broken の
//   表示が動かない原因が「再レンダーが走っていないから」ではなく
//   「依存追跡が空だから」であることを切り分けるため、画面に独立な tick
//   カウンタも出す (= 再レンダー自体は毎秒走っていることの証拠)。

// --- broken side ---
//
// この getter は Date.now() しか呼ばない。Vue の reactive proxy 経由ではない
// ため track 関数が反応せず、brokenNow の dep set は空集合のまま残る。
// computed は「dep のいずれかが trigger されたら invalidate」というモデルで
// 動くので、dep が空であれば invalidate される機会が永遠に来ない。
// 結果として初回評価値が永久にキャッシュされる。
const brokenNow = computed(() => Date.now());

// --- fixed side ---
//
// fixedTickMs.value を read することで Vue は track を実行し、この computed の
// dep に fixedTickMs を登録する。後で fixedTickMs.value に書き戻すと trigger
// が走り、computed が invalidate されて次の read で再評価される。
// "ref を経由する" ことの実質的な意味はこの「track / trigger に乗せる」点。
const fixedTickMs = ref<number>(Date.now());
const fixedNow = computed(() =>
  new Date(fixedTickMs.value).toLocaleTimeString(),
);

// --- 観察補助 tick ---
//
// brokenNow が動かない原因を切り分けるための独立シグナル。
//   (a) 再レンダーが走っていない → tick も止まっているはず
//   (b) 依存追跡が空 → tick は普通に増え、brokenNow だけが止まる
// 実際は (b) なので、tick が増え続ける中で brokenNow が固定のままになる、
// という対比が画面に出る。これがないと「ただ表示更新が止まってるだけ」と
// 区別できず、教材の説得力が落ちる。
const tick = ref(0);

const formatBrokenTime = (ms: number): string =>
  new Date(ms).toLocaleTimeString();

// --- timer lifecycle ---
//
// onMounted で 1 本だけ setInterval を設置し、tick と fixedTickMs を同時に
// 進める。別々に 2 本立てるとリーク危険性が 2 倍になり、tick の周期と
// fixedTickMs の周期がずれる事故も起きうる。
//
// onBeforeUnmount で必ず clearInterval する。これを忘れるとルート遷移後も
// callback が動き続け (Vue が ref を捨てても closure 内 identifier は GC
// されず、setInterval ID も残る)、HMR で二重起動の元にもなる。
// 教材として cleanup の必然性を明示するため両方を必ず書く。
let timerId: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timerId = setInterval(() => {
    tick.value += 1;
    fixedTickMs.value = Date.now();
  }, 1000);
});
onBeforeUnmount(() => {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
});

// 1 秒待たずに tick の更新 (= ref が変わったときの再レンダー) を即時に
// 観察するためのボタン。何度押しても brokenNow は固定のまま。
// 「再レンダーは走っているのに値が動かない」現象を能動的に再現できる。
const bumpTick = (): void => {
  tick.value += 1;
};
</script>

<template>
  <div class="computed-cache-view">
    <h1>computed: 依存追跡とキャッシュ</h1>
    <p>
      <code>computed(() =&gt; Date.now())</code> のように Vue の reactive proxy を
      経由しない値だけを read する算出プロパティは <strong>初回評価のまま二度と更新されない</strong>。
      右の "fixed" カラムでは <code>ref</code> 経由にして依存追跡を成立させる。
      公式:
      <a
        href="https://ja.vuejs.org/guide/essentials/computed.html"
        target="_blank"
        rel="noopener noreferrer"
      >算出プロパティ</a>
    </p>

    <div class="controls">
      <button
        type="button"
        @click="bumpTick"
      >
        Tick++ (force re-render)
      </button>
      <span class="tick">tick = {{ tick }}</span>
    </div>

    <div class="boxes">
      <section class="broken">
        <h2>❌ broken: <code>computed(() =&gt; Date.now())</code></h2>
        <p class="value">
          {{ formatBrokenTime(brokenNow) }}
        </p>
        <p class="epoch">
          epoch ms: {{ brokenNow }}
        </p>
        <p class="hint">
          tick が増え続ける (= 再レンダーは走っている) のにこの値は固定。
          dep set が空で invalidate トリガーが永遠に来ない。
        </p>
      </section>
      <section class="fixed">
        <h2>✅ fixed: <code>ref</code> 経由</h2>
        <p class="value">
          {{ fixedNow }}
        </p>
        <p class="epoch">
          epoch ms: {{ fixedTickMs }}
        </p>
        <p class="hint">
          <code>fixedTickMs.value</code> を read した時点で track され、
          1 秒ごとの書き戻しで trigger される。computed が invalidate されて
          次の read で再評価される。
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.computed-cache-view {
  text-align: left;
  padding: 2rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tick {
  color: #888;
  font-family: monospace;
}

.boxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.broken,
.fixed {
  border: 1px solid #444;
  padding: 1rem;
  border-radius: 8px;
}

/* broken カラムは「壊れている側」を視覚的に明示するため赤系 dashed。
   ErrorBoundary.vue の .error-boundary-fallback と同系統の警告配色。 */
.broken {
  border-color: #ff6464;
  border-style: dashed;
}

.boxes h2 {
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.value {
  font-family: monospace;
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.epoch {
  font-family: monospace;
  font-size: 0.85em;
  color: #888;
  margin: 0.25rem 0;
}

.hint {
  color: #888;
  font-size: 0.9em;
  margin: 0.5rem 0 0;
}
</style>
