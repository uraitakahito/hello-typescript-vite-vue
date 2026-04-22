<script setup lang="ts">
import viteLogo from '/vite.svg';
import typescriptLogo from '../assets/typescript.svg';
import CounterButton from '../components/CounterButton.vue';
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
    <div class="card">
      <CounterButton />
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
}
</style>
