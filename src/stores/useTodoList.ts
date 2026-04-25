import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export interface Todo {
  id: string;
  text: string;
  isDone: boolean;
}

// === Pinia とは何か (用語マップ) ===
//
// Pinia は Vue 3 公式の状態管理ライブラリ。1 つのストアは 3 種類の要素で構成される:
//
//   - state    : ストアが持つ生のデータ。Vue の `ref` / `reactive` で宣言する。
//                https://pinia.vuejs.org/core-concepts/state.html
//   - getters  : state から導出される派生値 (= 読み取り専用の computed)。
//                https://pinia.vuejs.org/core-concepts/getters.html
//   - actions  : state を変更する関数。普通の JS 関数として書ける。
//                https://pinia.vuejs.org/core-concepts/actions.html
//
// このファイルでの対応:
//   state   → items
//   getters → remainingCount / completedCount / isEmpty / isAllDone
//   actions → add / toggle / remove / clear

export const useTodoList = defineStore('todoList', () => {
  // --- state --- (https://pinia.vuejs.org/core-concepts/state.html)
  const items = ref<Todo[]>([]);

  // --- getters --- (https://pinia.vuejs.org/core-concepts/getters.html)
  const remainingCount = computed(() => items.value.filter((i) => !i.isDone).length);
  const completedCount = computed(() => items.value.filter((i) => i.isDone).length);
  const isEmpty = computed(() => items.value.length === 0);
  // getter 合成: 別 computed (`remainingCount`, `isEmpty`) を参照する。
  // items が変わる → remainingCount / isEmpty が再計算される → ここも再計算、
  // という連鎖が自動で張られる。
  const isAllDone = computed(() => !isEmpty.value && remainingCount.value === 0);

  // --- actions --- (https://pinia.vuejs.org/core-concepts/actions.html)
  // state を変更する関数。Pinia では this バインドの作法が要らないので、
  // 普通のアロー関数として書ける (Options style の `actions:` ブロックに相当)。
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
