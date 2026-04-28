import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ComputedCacheView from '../ComputedCacheView.vue';

// computed の依存追跡が壊れている (broken) / 成立している (fixed) 両カラムが、
// 時計を進めたとき期待通り「動かない / 動く」を取ることをアサートする統合テスト。
//
// vi.useFakeTimers() は Date.now() / setInterval / setTimeout を一括で fake 時計
// に乗せ替える。vi.advanceTimersByTime(ms) で時計と pending timer を連動して
// 進められるため、リアル時間で 5 秒待つような brittle なテストにならない。
// vi.setSystemTime() で初期時刻を固定し、テスト間で再現性を担保する。
describe('ComputedCacheView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('broken 側の epoch 表示は時計を進めても初期値のまま (dep 空のためキャッシュが invalidate されない)', async () => {
    const wrapper = mount(ComputedCacheView);
    const initialEpoch = wrapper.find('.broken .epoch').text();

    vi.advanceTimersByTime(5_000);
    await nextTick();

    expect(wrapper.find('.broken .epoch').text()).toBe(initialEpoch);
    wrapper.unmount();
  });

  it('fixed 側の epoch 表示は時計を進めると更新される (ref.value 経由で dep が成立する)', async () => {
    const wrapper = mount(ComputedCacheView);
    const initialEpoch = wrapper.find('.fixed .epoch').text();

    vi.advanceTimersByTime(5_000);
    await nextTick();

    expect(wrapper.find('.fixed .epoch').text()).not.toBe(initialEpoch);
    wrapper.unmount();
  });

  it('tick カウンタは時計に連動して増える (= 再レンダーは毎秒走っている、の証拠)', async () => {
    const wrapper = mount(ComputedCacheView);
    expect(wrapper.find('.tick').text()).toBe('tick = 0');

    vi.advanceTimersByTime(3_000);
    await nextTick();

    expect(wrapper.find('.tick').text()).toBe('tick = 3');
    wrapper.unmount();
  });

  it('unmount 後に setInterval が残らない (onBeforeUnmount で clearInterval する契約)', () => {
    const wrapper = mount(ComputedCacheView);
    // mount 直後は onMounted 内 setInterval が 1 本仕込まれている。
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    wrapper.unmount();
    // cleanup を消すと unmount 後も timer が残り、ゴーストコールバックが走る。
    // この assert がそのリーク回帰を検出する。
    expect(vi.getTimerCount()).toBe(0);
  });
});
