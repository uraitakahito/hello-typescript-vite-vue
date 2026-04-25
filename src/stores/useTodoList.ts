import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export interface Todo {
  id: string;
  text: string;
  isDone: boolean;
}

// Pinia setup style ストア。
//
// 教材としての主眼:
//
//   1. setup style における getters は `computed` そのもの。
//      Options style の `getters: { ... }` ブロックに 1:1 対応する。
//      「ストアが return しているのが ref か computed か」だけで
//      state / getter を見分けられる、という素直さがこの style の利点。
//
//   2. getters も state と同じく `storeToRefs` を経由しないとリアクティビティ
//      が切れる。consumer 側で
//        const { items, remainingCount } = storeToRefs(store)
//      とまとめて取り出すのが正しい。`useErrorLog` で entries を直接 destructure
//      すると壊れる話と完全に同根。
//
//   3. computed は他の computed を参照できる (依存追跡が連鎖する)。
//      `isAllDone` は `remainingCount` を読んでおり、items を変えると
//      remainingCount が再計算され、それが isAllDone も再計算する。
//      この連鎖は Vue の reactivity が自動で張ってくれる。
//
//   4. `isEmpty` ガードを噛ませている理由: items 空の状態で
//        remainingCount === 0 → isAllDone === true
//      となり「空なのに全完了」と読めてしまう。`!isEmpty` を AND で挟み、
//      仕様 (1 件以上ある & 全部 done) を守る。仕様を getter 側で表現する例。
export const useTodoList = defineStore('todoList', () => {
  const items = ref<Todo[]>([]);

  // getters (= computed)。setup style では公開 API として return すれば
  // 外側の template / spec から `.value` 不要 (template) または `.value` 必須 (spec)
  // で読める、という非対称になる。store proxy 経由 (`store.remainingCount`) なら
  // どちらの場面でも自動アンラップされる、というのが Pinia のアクセス規則。
  const remainingCount = computed(() => items.value.filter((i) => !i.isDone).length);
  const completedCount = computed(() => items.value.filter((i) => i.isDone).length);
  const isEmpty = computed(() => items.value.length === 0);
  // getter 合成: 別 computed (`remainingCount`, `isEmpty`) を参照する。
  // items が変わる → remainingCount / isEmpty が再計算される → ここも再計算、
  // という連鎖が自動で張られる。
  const isAllDone = computed(() => !isEmpty.value && remainingCount.value === 0);

  const add = (text: string): void => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    items.value.push({
      id: crypto.randomUUID(),
      text: trimmed,
      isDone: false,
    });
  };

  const toggle = (id: string): void => {
    const target = items.value.find((i) => i.id === id);
    if (target) target.isDone = !target.isDone;
  };

  const remove = (id: string): void => {
    // splice で in-place 編集。配列参照を保ったまま reactivity が効く。
    // `items.value = items.value.filter(...)` のように参照を置換しても
    // 同じく reactivity は効く。「Vue は in-place 編集も参照置換も追える」
    // ことを別々の action で書き分けてある (clear は参照置換)。
    const idx = items.value.findIndex((i) => i.id === id);
    if (idx !== -1) items.value.splice(idx, 1);
  };

  const clear = (): void => {
    // 参照置換で空配列に。`items.value.length = 0` の in-place 編集でも動く。
    items.value = [];
  };

  return {
    items,
    remainingCount,
    completedCount,
    isEmpty,
    isAllDone,
    add,
    toggle,
    remove,
    clear,
  };
});
