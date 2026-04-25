<script setup lang="ts">
// Home はランディング専用 (ロゴ + タイトルのみ)。教材は各ルートに分離してあり、
// `/counter` `/hello` `/focus` `/todos` `/error` の各ビューが独立した教材を持つ。
import viteLogo from '/vite.svg';
import typescriptLogo from '../assets/typescript.svg';
</script>

<template>
  <div class="home">
    <a
      href="https://vitejs.dev"
      target="_blank"
    >
      <img
        :src="viteLogo"
        class="logo"
        alt="Vite logo"
      >
    </a>
    <a
      href="https://www.typescriptlang.org/"
      target="_blank"
    >
      <img
        :src="typescriptLogo"
        class="logo vanilla"
        alt="TypeScript logo"
      >
    </a>
    <h1>Vite + Vue + TypeScript</h1>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
}
</style>
