// TypeScript (および型情報を使う typescript-eslint) は .vue ファイルの import
// 先の型を知らない。vue-tsc はビルド時に解決できるが、エディタ / lint 経由の
// 型チェックには下記のモジュール宣言が必要。
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}
