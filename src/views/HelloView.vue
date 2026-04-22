<script setup lang="ts">
// 姉妹リポジトリ hello-typescript-vite の src/hoge.ts (console.log だけの
// 副作用モジュール) を Vue SFC に移植した最小ビュー。setup 評価時に
// console.log が走る「setup 時点の副作用」を観察する教材で、/focus の
// onMounted と対比して「DOM に触らない副作用は setup 本文、DOM に触る
// 副作用は onMounted 以降」という使い分けを示す。
console.log('hello');
</script>

<template>
  <div class="hello">
    <h1>hello</h1>
  </div>
</template>

<style scoped>
.hello {
  text-align: center;
  padding: 2rem;
}
</style>
