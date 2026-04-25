import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTodoList } from '../useTodoList';

// Pinia ストアは Vue インスタンス (mount) から切り離して単体テスト可能。
// `setActivePinia(createPinia())` だけで useXxx() が解決でき、コンポーネントの
// レンダリングや happy-dom も不要 (= 環境依存が少なく、テストが速い)。
//
// 対比: `src/components/__tests__/ErrorBoundary.spec.ts` は `mount()` を伴う
// 統合テスト。両者を意図的に並べてある:
//   - store の振る舞い      → 単体テスト (このファイル)
//   - boundary の振る舞い   → mount テスト (ErrorBoundary.spec.ts)
//
// store proxy 経由 (`store.remainingCount`) ならアクセス時点で自動アンラップ
// されるため、ここでは `.value` を書かない。`storeToRefs(store)` で取り出した
// 場合に限り `.value` が必要、というのが Pinia のアクセス規則。
//
// `setActivePinia(createPinia())` を beforeEach で毎回張り直すことで、テスト間
// のストア状態リークを構造的に防いでいる (手動 `clear()` を書く必要がない)。
describe('useTodoList', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts empty; isAllDone は空配列のとき false (`!isEmpty` ガードの確認)', () => {
    const store = useTodoList();
    expect(store.items.length).toBe(0);
    expect(store.remainingCount).toBe(0);
    expect(store.completedCount).toBe(0);
    expect(store.isEmpty).toBe(true);
    // 空配列のときは isAllDone は false (`!isEmpty` ガードが効いている)。
    // ここを true にしてしまうと「todo が無い = 全部終わった」と誤読される。
    expect(store.isAllDone).toBe(false);
  });

  it('add: 1 件追加すると getters が連動更新される', () => {
    const store = useTodoList();
    store.add('write tests');
    expect(store.items.length).toBe(1);
    expect(store.remainingCount).toBe(1);
    expect(store.completedCount).toBe(0);
    expect(store.isEmpty).toBe(false);
    expect(store.isAllDone).toBe(false);
  });

  it('toggle: getter 合成 — completedCount が 1 になると isAllDone も true に転がる', () => {
    const store = useTodoList();
    store.add('a');
    const first = store.items[0];
    // noUncheckedIndexedAccess が ON なので items[0] は Todo | undefined。
    // テスト前提が崩れていたら早期に投げて分かりやすく落とす。
    if (!first) throw new Error('precondition: items[0] should exist after add');

    store.toggle(first.id);
    expect(store.completedCount).toBe(1);
    expect(store.remainingCount).toBe(0);
    // `isAllDone` は `remainingCount` という別 computed を参照しており、
    // toggle で remainingCount が 0 になった瞬間に isAllDone も true に転がる。
    // これが getter 合成 (computed が computed を読む) の reactivity チェーン。
    expect(store.isAllDone).toBe(true);
  });

  it('add は trim 後に空なら no-op (空文字 / 空白 / 改行)', () => {
    const store = useTodoList();
    store.add('');
    store.add('   ');
    store.add('\t\n');
    expect(store.items.length).toBe(0);
  });

  it('remove: 該当 id の item だけが消える', () => {
    const store = useTodoList();
    store.add('a');
    store.add('b');
    const first = store.items[0];
    if (!first) throw new Error('precondition: items[0] should exist after add');

    store.remove(first.id);
    expect(store.items.length).toBe(1);
    // 残ったのは 'b' 側。
    expect(store.items[0]?.text).toBe('b');
  });

  it('clear: items が空に戻ると isAllDone も false に戻る (`!isEmpty` 経由)', () => {
    const store = useTodoList();
    store.add('a');
    const first = store.items[0];
    if (!first) throw new Error('precondition: items[0] should exist after add');
    store.toggle(first.id);
    expect(store.isAllDone).toBe(true);

    store.clear();
    expect(store.isEmpty).toBe(true);
    // clear で items が空になると isEmpty が true、`!isEmpty` ガードで
    // isAllDone は false に戻る。「true → false に戻る向き」も連鎖する。
    expect(store.isAllDone).toBe(false);
  });
});
