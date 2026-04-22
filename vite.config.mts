/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const config = defineConfig({
  // @vitejs/plugin-vue が Single File Component (.vue) を Vite に解釈させる。
  // 具体的には <template> を render 関数に、<script setup> を通常の ES モジュール
  // に、<style scoped> をハッシュ付き CSS にそれぞれ変換する。
  plugins: [vue()],

  // Docker コンテナ内で dev server を起動し、host 側ブラウザから
  // `http://localhost:5173/` で到達できるようにするための設定ブロック。
  // 3 つとも必要で、抜けると以下のように壊れる。
  //
  // - host: true
  //   Vite のデフォルトは 127.0.0.1 のみに bind する。コンテナ内の
  //   127.0.0.1 はコンテナ自身の loopback で、`docker run -p 5173:5173`
  //   の port publish が繋がる経路(外向きインターフェース)とは別物。
  //   0.0.0.0 に bind しないと host から Connection refused になる。必須。
  //
  // - strictPort: true
  //   Vite は port 占有時にデフォルトで 5174, 5175 … と黙って逃げる。
  //   `docker run -p 5173:5173` は host 5173 ← コンテナ 5173 の静的な
  //   紐付けなので、Vite が別 port に逃げると host 5173 は空を指す状態
  //   になり、エラーも出ずに「繋がらない」だけでハマる。占有時に
  //   即 fail させて検知できるようにする保険。
  //
  // - port: 5173
  //   Vite のデフォルトと同値なので挙動としては省略可能だが、README /
  //   `docker run -p` 側と port 番号の意図を一致させるために明示。
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },

  build: {
    rollupOptions: {
      // https://github.com/vitejs/vite/issues/378#issuecomment-789366197
      // 教材として dist/ の中身を読みやすくするため、ファイル名にハッシュを
      // 付けず固定名にする。本番で cache busting したい場合は `[name]-[hash]`
      // に戻す（Vite のデフォルト）。
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    // minify を切っておくと dist/ の JS/CSS が読めて「Vite が何を出したか」
    // を目で追える。本番相当のビルドが欲しければ削除（既定の esbuild minify）。
    minify: false,
  },

  // Vitest は Vite の設定 (alias, plugins, resolve) をそのまま再利用する。
  // そのため環境変数的に別ファイルを作らず、ここに同居させるのが最もシンプル。
  test: {
    // Vue SFC の DOM 操作テストは happy-dom で十分（jsdom より軽量・高速）。
    environment: 'happy-dom',
    // describe/it/expect のグローバル注入はしない方針。`import { ... } from 'vitest'`
    // を明示させることで「このシンボルがどこから来ているか」が追いやすい。
    globals: false,
    include: ['src/**/*.spec.ts'],
  },
});

export default config;
