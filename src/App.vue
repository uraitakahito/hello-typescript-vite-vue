<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">
        Home
      </RouterLink>
      <RouterLink to="/counter">
        Counter
      </RouterLink>
      <RouterLink to="/hello">
        Hello
      </RouterLink>
      <RouterLink to="/focus">
        Focus
      </RouterLink>
      <RouterLink to="/scroll">
        Scroll
      </RouterLink>
      <RouterLink to="/todos">
        Todos
      </RouterLink>
      <RouterLink to="/error">
        Error
      </RouterLink>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  justify-content: center;
}

nav a {
  font-weight: 500;
}

/* router-link-active は Vue Router が現在ルートに一致するリンクへ自動付与する class。 */
nav a.router-link-active {
  color: #646cff;
}
</style>
