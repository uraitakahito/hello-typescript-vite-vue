<script setup lang="ts">
// 参考リポジトリ (hello-typescript-vite) の src/hoge.ts は `console.log('hello hoge')`
// のみ。ルート遷移時に同じ副作用が走るよう setup 内に書いておく。
console.log('hello hoge');
</script>

<template>
  <div class="hoge">
    <h1>hoge</h1>
  </div>
</template>

<style scoped>
.hoge {
  text-align: center;
  padding: 2rem;
}
</style>
