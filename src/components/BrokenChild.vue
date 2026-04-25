<script setup lang="ts">
// 教材用に「クリックで必ず throw する子コンポーネント」。
// イベントハンドラ内 throw は Vue の捕捉経路に乗るため、
//   - 親に <ErrorBoundary> がある  → onErrorCaptured で捕まる (boundary 層)
//   - どの ErrorBoundary にも包まれていない → app.config.errorHandler に届く (global 層)
// と、配置場所だけで捕捉先が変わる挙動を観察できる。
const breakIt = (): void => {
  throw new Error('Boom from BrokenChild');
};
</script>

<template>
  <button
    type="button"
    @click="breakIt"
  >
    Throw inside boundary
  </button>
</template>
