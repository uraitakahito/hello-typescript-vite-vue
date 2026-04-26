import { defineStore } from 'pinia';
import { ref } from 'vue';

// 三層防御 (global / boundary / router) のどこで捕捉されたかを表すタグ。
export type ErrorLayer = 'global' | 'boundary' | 'router';

export interface ErrorLogEntry {
  layer: ErrorLayer;
  message: string;
  // ms epoch。表示時に Date でフォーマットする。
  at: number;
}

// Pinia の setup style ストア。
//   - 第1引数 'errorLog' は store id (DevTools の Pinia パネルに表示される名前)
//   - 第2引数の関数は <script setup> と同じ感覚で書ける: ref / reactive / computed
//     を宣言し、return したものが store の公開フィールドになる
//
// 三箇所 (main.ts の app.config.errorHandler / ErrorBoundary.vue の onErrorCaptured /
// router/index.ts の router.onError) が push を呼び、ErrorView.vue が entries を
// 観察する構造。Pinia ストアは app に install された 1 インスタンスを共有する。
export const useErrorLog = defineStore('errorLog', () => {
  const entries = ref<ErrorLogEntry[]>([]);

  const push = (entry: ErrorLogEntry): void => {
    entries.value.push(entry);
  };

  const clear = (): void => {
    entries.value = [];
  };

  return { entries, push, clear };
});
