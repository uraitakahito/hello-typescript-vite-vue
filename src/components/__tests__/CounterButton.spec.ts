import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CounterButton from '../CounterButton.vue';

// @vue/test-utils の mount は SFC をテスト用に仮想 DOM へレンダリングする。
// happy-dom 環境のため document は自動で用意されている（vite.config.mts 参照）。
describe('CounterButton', () => {
  it('renders with count 0 on mount', () => {
    const wrapper = mount(CounterButton);
    expect(wrapper.text()).toContain('count is 0');
  });

  it('increments count on click', async () => {
    const wrapper = mount(CounterButton);
    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toContain('count is 1');
    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toContain('count is 2');
  });
});
