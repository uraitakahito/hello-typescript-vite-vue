<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import { useErrorLog } from '../stores/useErrorLog';

// React の Error Boundary 相当を Composition API で実装した教材コンポーネント。
//
// onErrorCaptured((err, instance, info) => boolean | void) は子孫の
//   - render 関数
//   - setup
//   - lifecycle hook
//   - イベントハンドラ
//   - watcher
// で発生したエラーを捕まえる。第3引数 info は app.config.errorHandler と同じ
// 「発生コンテキスト」文字列。
//
// 戻り値で伝播の挙動が変わる:
//   - return false → ここで止める。app.config.errorHandler には到達しない。
//   - 何も返さない / true → 上位 (より外側の ErrorBoundary、最終的に
//     app.config.errorHandler) にも伝播する。
//
// 教材として「同じ throw でも boundary が止めるか global まで届くか」を
// 観察できるよう、ここでは return false で止める。読者が return false を
// コメントアウトすると、ErrorView のログに boundary と global の両方が
// 並ぶようになり、伝播の様子が見える。
const capturedError = ref<unknown>(null);
const errorLog = useErrorLog();

onErrorCaptured((err) => {
  capturedError.value = err;
  errorLog.push({
    layer: 'boundary',
    message: err instanceof Error ? err.message : String(err),
    at: Date.now(),
  });
  return false;
});

const reset = (): void => {
  capturedError.value = null;
};
</script>

<template>
  <slot v-if="capturedError === null" />
  <template v-else>
    <slot
      name="fallback"
      :error="capturedError"
      :reset="reset"
    >
      <!--
        <slot> タグの開閉間に書いたコンテンツは Vue の「fallback content」機能。
        呼び出し側が <template #fallback> を渡さなかった場合に限り、デフォルト
        表示として描画される (https://vuejs.org/guide/components/slots.html#fallback-content)。
      -->
      <div class="error-boundary-fallback">
        <p>Something went wrong inside this boundary.</p>
        <button
          type="button"
          @click="reset"
        >
          Reset boundary
        </button>
      </div>
    </slot>
  </template>
</template>

<style scoped>
.error-boundary-fallback {
  border: 1px dashed #ff6464;
  padding: 1rem;
  border-radius: 8px;
}
</style>
