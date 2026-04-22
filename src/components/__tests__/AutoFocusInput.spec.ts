import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AutoFocusInput from '../AutoFocusInput.vue';

// focus() は「document に接続された要素」に対してだけ効く (happy-dom も同様)。
// @vue/test-utils の mount() はデフォルトで detached (= document に繋がない) で
// マウントするので、そのままだと `document.activeElement` が body のままになる。
// attachTo: document.body を指定して実 document にぶら下げてから検証する。
// テスト後は wrapper.unmount() で確実に DOM から外す (次のテストに影響させない)。
describe('AutoFocusInput', () => {
  it('renders an input element', () => {
    const wrapper = mount(AutoFocusInput, { attachTo: document.body });
    expect(wrapper.find('input').exists()).toBe(true);
    wrapper.unmount();
  });

  it('focuses the input after mount', () => {
    const wrapper = mount(AutoFocusInput, { attachTo: document.body });
    const input = wrapper.find('input').element;
    expect(document.activeElement).toBe(input);
    wrapper.unmount();
  });
});
