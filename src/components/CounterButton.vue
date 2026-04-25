<script setup lang="ts">
import { ref } from 'vue';

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
