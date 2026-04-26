<script setup lang="ts">
import { nextTick, ref } from 'vue';

// 教材趣旨:
//   Vue は state を変えても DOM を「同期的には」更新せず、next tick まで
//   更新をバッファリングしてからまとめて適用する。そのため push 直後に
//   scrollHeight を読むと "反映前" の値を使ってしまい、末尾追従が 1 行ぶん
//   遅れる。await nextTick() を挟めば反映後の scrollHeight を読めるので、
//   末尾追従が成立する。
//   公式: https://ja.vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing
//
// 観察構造:
//   左右に同じスクロールボックスを置き、同一の lines を v-for する。
//   1 回の append で
//     - 左 (no tick)  : push 直後に同期で scrollTop = scrollHeight
//     - 右 (with tick): await nextTick() を挟んでから同じ操作
//   をする。click のたびに左だけが末尾より 1 行ぶん上で止まり、右は常に
//   末尾に追従するのが目視できる。

const initialLines: string[] = Array.from(
  { length: 10 },
  (_, i) => `seed line ${(i + 1).toString()}`,
);

const lines = ref<string[]>([...initialLines]);
const noTickBoxEl = ref<HTMLDivElement | null>(null);
const withTickBoxEl = ref<HTMLDivElement | null>(null);

const append = async (): Promise<void> => {
  lines.value.push(`line ${(lines.value.length + 1).toString()}`);

  // ❌ 同期に scrollTop = scrollHeight を実行する。
  //   Vue はこの時点で DOM を再描画していないので、scrollHeight は
  //   「追加前の高さ」を返す。結果として 1 行ぶん下にスクロールしきれず、
  //   新しい行が可視領域の下に隠れる。
  if (noTickBoxEl.value) {
    noTickBoxEl.value.scrollTop = noTickBoxEl.value.scrollHeight;
  }

  // ✅ DOM 更新が反映されるのを待ってから scrollHeight を読む。
  //   「追加後の高さ」が取れるため、scrollTop が正しく末尾に追いつく。
  //   この await nextTick() を消すと、こちら側も左と同じ「1 行遅れ」挙動
  //   に退行することが確認できる (= nextTick の必要性の対偶検証)。
  await nextTick();
  if (withTickBoxEl.value) {
    withTickBoxEl.value.scrollTop = withTickBoxEl.value.scrollHeight;
  }
};

// 観察を最初からやり直すための reset。ref への代入なので box 内の
// <p v-for> も追従して再描画される。scrollTop は DOM 再描画と共に自然に
// 先頭付近へ戻るため、明示的に 0 を代入する必要はない。
const clear = (): void => {
  lines.value = [...initialLines];
};
</script>

<template>
  <div class="scroll-view">
    <h1>nextTick: DOM 更新タイミング</h1>
    <p>
      <code>Append</code> を押すと両方のログに同じ行が追加される。左は <code>scrollTop = scrollHeight</code> を <em>同期的に</em> 設定し、右は <code>await nextTick()</code> を挟んでから設定する。クリックするたびに、左 (without nextTick) は末尾より 1 行ぶん上で止まり、右 (with nextTick) は常に末尾に追従する。
    </p>

    <div class="controls">
      <button
        type="button"
        @click="append"
      >
        Append
      </button>
      <button
        type="button"
        @click="clear"
      >
        Clear
      </button>
    </div>

    <div class="boxes">
      <section>
        <h2>without nextTick</h2>
        <div
          ref="noTickBoxEl"
          class="box"
        >
          <p
            v-for="(line, i) in lines"
            :key="i"
          >
            {{ line }}
          </p>
        </div>
      </section>
      <section>
        <h2>with nextTick</h2>
        <div
          ref="withTickBoxEl"
          class="box"
        >
          <p
            v-for="(line, i) in lines"
            :key="i"
          >
            {{ line }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.scroll-view {
  text-align: left;
  padding: 2rem;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.boxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.box {
  /* box 高さは「seed が確実に overflow する」サイズに固定。
     line-height 1.4 + font-size 0.9rem ≒ 1 行 1.26rem、padding 上下計
     1rem を引いた内側 7rem に約 5.5 行ぶん入る計算。seed 10 行に対して
     overflow している状態から始まる。 */
  height: 8rem;
  overflow-y: auto;
  border: 1px solid #444;
  padding: 0.5rem;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

.box p {
  margin: 0;
}

.boxes h2 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
</style>
