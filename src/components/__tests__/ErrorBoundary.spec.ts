import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import ErrorBoundary from '../ErrorBoundary.vue';
import BrokenChild from '../BrokenChild.vue';
import { useErrorLog } from '../../composables/useErrorLog';

// テスト間で useErrorLog のモジュールスコープ ref を共有しているため、
// 各テストの独立性を保つために clear() でリセットする。
describe('ErrorBoundary', () => {
  beforeEach(() => {
    useErrorLog().clear();
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

    const { entries } = useErrorLog();
    expect(entries.value.length).toBe(1);
    // Vitest の型推論上 entries.value[0] は ErrorLogEntry | undefined。
    // length === 1 を assert した直後だが、`?.` で安全に取り出す。
    expect(entries.value[0]?.layer).toBe('boundary');
    expect(entries.value[0]?.message).toBe('Boom from BrokenChild');
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
