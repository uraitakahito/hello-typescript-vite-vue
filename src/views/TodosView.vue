<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useTodoList } from '../stores/useTodoList';

// state (items) も getters (remainingCount, completedCount, isEmpty, isAllDone)
// も、同じ storeToRefs 一回でまとめて取り出せる。
//   - 内部表現は state = Ref<T>、getters = ComputedRef<T> で異なるが、
//     storeToRefs はどちらも「リアクティブな参照」として consumer 側に渡す。
//   - template では自動アンラップで `.value` 不要。
const store = useTodoList();
const { items, remainingCount, completedCount, isEmpty, isAllDone } = storeToRefs(store);
// actions (関数) は this 解決が要らないので直接 destructure で OK。
const { add, toggle, remove, clear } = store;

const draft = ref('');
const submit = (): void => {
  add(draft.value);
  draft.value = '';
};
</script>

<template>
  <div class="todos">
    <h1>Todos (Pinia getters demo)</h1>

    <form @submit.prevent="submit">
      <input
        v-model="draft"
        type="text"
        placeholder="What needs doing?"
      >
      <button type="submit">
        Add
      </button>
    </form>

    <p
      v-if="isEmpty"
      class="empty"
    >
      (no todos yet)
    </p>
    <ul v-else>
      <li
        v-for="item in items"
        :key="item.id"
      >
        <label>
          <input
            type="checkbox"
            :checked="item.isDone"
            @change="toggle(item.id)"
          >
          <span :class="{ done: item.isDone }">{{ item.text }}</span>
        </label>
        <button
          type="button"
          @click="remove(item.id)"
        >
          Remove
        </button>
      </li>
    </ul>

    <footer>
      <p>{{ remainingCount }} remaining / {{ completedCount }} done</p>
      <p
        v-if="isAllDone"
        class="celebrate"
      >
        All done!
      </p>
      <button
        type="button"
        :disabled="isEmpty"
        @click="clear"
      >
        Clear all
      </button>
    </footer>
  </div>
</template>

<style scoped>
.todos {
  text-align: left;
  padding: 2rem;
}

form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

form input {
  flex: 1;
  padding: 0.4rem 0.6rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #444;
}

li label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.done {
  text-decoration: line-through;
  color: #888;
}

.empty {
  color: #888;
}

.celebrate {
  color: #6cf;
  font-weight: bold;
}

footer {
  margin-top: 1rem;
}
</style>
