import { readonly, ref, type DeepReadonly, type Ref } from 'vue';

// 三層防御 (global / boundary / router) のどこで捕捉されたかを表すタグ。
// union 型にして判別共用体的に扱う。
export type ErrorLayer = 'global' | 'boundary' | 'router';

export interface ErrorLogEntry {
  layer: ErrorLayer;
  message: string;
  // ms epoch。表示時に Date でフォーマットする。
  at: number;
}

// なぜモジュールスコープに ref を置くか:
//   - global 層 (main.ts の app.config.errorHandler)
//   - boundary 層 (ErrorBoundary.vue の onErrorCaptured)
//   - router 層 (router/index.ts の router.onError)
//   の 3 箇所が独立に書き込み、ErrorView.vue の 1 箇所が観察する構造。
//   useErrorLog() を呼んだ全員が同じ ref を参照する「アプリ全体で 1 つ」の
//   ストアとして機能させたいので、composable の関数本体ではなくモジュール
//   トップレベルで ref を生成する。
//   関数内で生成すると呼び出しごとに別 ref になり、書き手と読み手が分離する。
//
// Pinia 等のストアライブラリを入れない理由: 教材として依存を増やしたくないのと、
// 「Vue の ref + モジュールスコープ」だけでシングルトン状態を作る作法を示したいため。
const entries = ref<ErrorLogEntry[]>([]);

export interface UseErrorLogReturn {
  // 外部からの直接 mutation を防ぐため readonly でエクスポート。
  // 追加は push() / 全消去は clear() を経由させる。
  entries: DeepReadonly<Ref<ErrorLogEntry[]>>;
  push: (entry: ErrorLogEntry) => void;
  clear: () => void;
}

export const useErrorLog = (): UseErrorLogReturn => ({
  entries: readonly(entries),
  push: (entry) => {
    entries.value.push(entry);
  },
  clear: () => {
    entries.value = [];
  },
});
