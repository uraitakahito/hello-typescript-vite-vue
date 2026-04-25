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

// 教材としての主眼:
//
//   1. このストアは「Setup Stores」スタイル (defineStore の第2引数に関数を渡す)。
//      対する「Option Stores」スタイルは state/getters/actions を別ブロックで宣言する:
//
//        // Option Stores — このファイルでは採用していない
//        defineStore('todoList', {
//          state:   () => ({ items: [] as Todo[] }),
//          getters: { remainingCount: (s) => s.items.filter(i => !i.isDone).length },
//          actions: { add(text) { /* ... */ } },
//        });
//
//        // Setup Stores — このファイルが採用
//        defineStore('todoList', () => {
//          const items = ref<Todo[]>([]);
//          const remainingCount = computed(() => /* ... */);
//          const add = (text: string) => { /* ... */ };
//          return { items, remainingCount, add };
//        });
//
//      Setup style には state/getters/actions の見出しブロックが無いため、
//      return しているのが `ref` か `computed` か関数か、で 3 者を判別する。
//      → https://pinia.vuejs.org/core-concepts/#Setup-Stores
//
//   2. state も getters も `storeToRefs` を経由しないとリアクティビティが切れる。
//      consumer 側で
//        const { items, remainingCount } = storeToRefs(store)
//      とまとめて取り出すのが正しい。直接 destructure (`const { items } = store`)
//      が壊れるのは、ref / computed の "中身" を取り出した瞬間に reactive な
//      参照が外れるため。actions (関数) は中身を取り出しても壊れないので、
//      action だけは普通の destructure で良い。
//      → https://pinia.vuejs.org/core-concepts/#Destructuring-from-a-Store
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
  // --- state --- (https://pinia.vuejs.org/core-concepts/state.html)
  const items = ref<Todo[]>([]);

  // --- getters --- (https://pinia.vuejs.org/core-concepts/getters.html)
  // setup style では `computed` を作って return すれば getters になる。
  // template / spec での `.value` 必要性の非対称は store proxy の自動アンラップ
  // 規則による (詳細はヘッダ参照)。
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
