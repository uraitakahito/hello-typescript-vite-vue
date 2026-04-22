<script setup lang="ts">
import AutoFocusInput from '../components/AutoFocusInput.vue';
</script>

<template>
  <div class="focus">
    <h1>Auto-focus input</h1>
    <p>このページを開くと、下の input に <code>onMounted</code> 経由で自動的にフォーカスが当たる。</p>
    <AutoFocusInput />
  </div>
</template>

<style scoped>
.focus {
  text-align: center;
  padding: 2rem;
}
</style>
