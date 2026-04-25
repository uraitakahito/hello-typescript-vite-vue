<script setup lang="ts">
import CounterButton from '../components/CounterButton.vue';
</script>

<template>
  <div class="counter">
    <h1>Counter</h1>
    <p><code>ref</code> + <code>@click</code> の最小例。ボタンを押すたびに <code>count</code> が increment される。</p>
    <CounterButton />
  </div>
</template>

<style scoped>
.counter {
  text-align: center;
  padding: 2rem;
}
</style>
