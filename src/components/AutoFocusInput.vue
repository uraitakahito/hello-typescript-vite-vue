<script setup lang="ts">
import { onMounted, ref } from 'vue';

// ref() の「二重の意味」:
//   1) CounterButton で使ったリアクティブ ref (プリミティブ値のラッパ)
//   2) ここで使う template ref (描画後に DOM 要素が代入される箱)
// どちらも同じ ref() 関数だが、template 側の `ref="inputEl"` 属性と
// 変数名が一致したときだけ (2) として働く。
//
// 初期値が null なのは、<script setup> が評価される時点では
// <template> がまだ DOM に mount されておらず、DOM 要素への参照が
// 存在しないため。型としても HTMLInputElement | null を正直に宣言し、
// tsconfig の strict 方針と整合させる。
const inputEl = ref<HTMLInputElement | null>(null);

// onMounted は「コンポーネントが実 DOM に mount された直後」に呼ばれる
// ライフサイクルフック。このタイミングなら inputEl.value は埋まっている。
//
// 比較: この focus() を onMounted ではなく setup 本文に直接書くと、
//   setup 実行 → inputEl.value は null → ?.focus() は no-op (= focus されない)
// となり期待した挙動にならない。DOM に触る副作用は onMounted 以降、
// というのが Vue 3 Composition API の鉄則 (HelloView.vue の
// `console.log('hello')` は DOM に触らない副作用なので setup 本文
// で OK という対比)。
//
// `?.` (optional chaining) は、型が null を許容しているため TypeScript が
// `.focus()` 呼び出しを弾かないようにするもの。onMounted の中では実際には
// 必ず埋まっているが、型システムはそれを証明できないので明示的に書く。
onMounted(() => {
  inputEl.value?.focus();
});
</script>

<template>
  <label>
    Your name:
    <input
      ref="inputEl"
      type="text"
      placeholder="Focused automatically on mount"
    >
  </label>
</template>
