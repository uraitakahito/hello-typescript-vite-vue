<script setup lang="ts">
import { ref } from 'vue';

// ref<number>: プリミティブ値のリアクティブラッパ。
//   - JS 側では `count.value` で読み書き。
//   - template 内では自動アンラップされるので `{{ count }}` / `@click="increment"`
//     のように `.value` を書かずに扱える。
//
// 参考リポジトリの src/counter.ts は `let counter = 0` と `element.innerHTML` の
// 手書きだったが、Vue では ref の変更がテンプレートに自動反映される点が違い。
const count = ref(0);

const increment = (): void => {
  count.value += 1;
};
</script>

<template>
  <button
    id="counter"
    type="button"
    @click="increment"
  >
    count is {{ count }}
  </button>
</template>
