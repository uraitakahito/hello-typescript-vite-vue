import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { h } from 'vue';
import ErrorBoundary from '../ErrorBoundary.vue';
import BrokenChild from '../BrokenChild.vue';
import { useErrorLog } from '../../stores/useErrorLog';

// 各テストの先頭で「新しい Pinia インスタンスを active にする」ことで、
// useErrorLog() が前テストの状態を引き継がないことを宣言的に保証する。
// 旧版では useErrorLog().clear() を手で呼んで状態リークを防いでいたが、
// Pinia のテスト作法に乗せると忘れる事故が構造的に発生しなくなる。
//
// mount() の global.plugins に createPinia() を渡す方法もあるが、
// それだと spec 内の直接 useErrorLog() 呼び出し (assert 用) と
// component 内の解決でインスタンスがズレる可能性があるため、
// setActivePinia 一本に揃える。
describe('ErrorBoundary', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders default slot when no error has occurred', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: '<p class="ok">child content</p>',
      },
    });
    expect(wrapper.find('.ok').exists()).toBe(true);
  });

  it('switches to fallback slot after a child throws', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: () => h(BrokenChild),
        fallback: '<p class="fb">caught</p>',
      },
      attachTo: document.body,
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.find('.fb').exists()).toBe(true);
    wrapper.unmount();
  });

  it('records a boundary entry in the shared error log on capture', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: () => h(BrokenChild),
      },
      attachTo: document.body,
    });

    await wrapper.find('button').trigger('click');

    // Pinia setup style ストアのプロパティはアクセス時に自動アンラップされる
    // ため、外側 (consumer) からは `store.entries` で配列にアクセスでき .value
    // は不要 (.value が必要なのは store の setup 関数の内側だけ)。
    // ここでは `entries` を destructure せず store 経由で読むことで、Pinia の
    // 「state は store オブジェクト経由で読む」基本作法も併せて示す。
    const errorLog = useErrorLog();
    expect(errorLog.entries.length).toBe(1);
    // 型推論上 errorLog.entries[0] は ErrorLogEntry | undefined。
    // length === 1 を assert した直後だが `?.` で安全に取り出す。
    expect(errorLog.entries[0]?.layer).toBe('boundary');
    expect(errorLog.entries[0]?.message).toBe('Boom from BrokenChild');
    wrapper.unmount();
  });

  it('reset slot prop clears the captured error and re-renders default slot', async () => {
    // fallback 内で reset() を呼んで boundary を初期化できることの検証。
    // スロットを render 関数で渡すと、ErrorBoundary 側の <slot name="fallback"
    // :reset="reset"> から reset 関数を slotProps として受け取れる。
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: () => h(BrokenChild),
        fallback: (slotProps: { reset: () => void }) =>
          h(
            'button',
            {
              class: 'reset',
              onClick: () => {
                slotProps.reset();
              },
            },
            'reset',
          ),
      },
      attachTo: document.body,
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.find('button.reset').exists()).toBe(true);

    await wrapper.find('button.reset').trigger('click');
    // reset 後は default slot に戻り BrokenChild のボタンが再表示される。
    expect(wrapper.text()).toContain('Throw inside boundary');
    wrapper.unmount();
  });
});
