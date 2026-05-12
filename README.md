# hello-typescript-vite-vue

Vite + Vue 3 + TypeScript + Vue Router + Pinia + Vitest の教材用テンプレート。

## Setup

```sh
./setup.sh
```

`Dockerfile.dev` / `docker-entrypoint.sh` を `uraitakahito/hello-javascript` の
タグから取得し、`.env` (USER_ID / GROUP_ID / TZ) を生成する。生成物 3 つは
`.gitignore` 済み。

### Development Environment

詳細は [docs/development-environment.md](docs/development-environment.md)。

```sh
GH_TOKEN=$(gh auth token) docker compose -f compose.dev.yaml up -d --build
```

### Production Environment

詳細は [docs/production-environment.md](docs/production-environment.md)。

```sh
docker compose -f compose.prod.yaml up -d --build
```

## Test

`vite.config.mts` 内の `test` ブロックを Vitest が直接読みに行くため、別途
`vitest.config.*` は不要。`@vue/test-utils` の `mount` で SFC を仮想 DOM
(`happy-dom`) にマウントしてアサートする。サンプルは
`src/components/__tests__/CounterButton.spec.ts` を参照。

```sh
npm run test:run
```

## NOTE

### `.vue` ファイルの型を TypeScript に教える

`src/shims-vue.d.ts` に以下のようなモジュール宣言がある。

```ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
```

`vue-tsc` はビルド時に `.vue` を解決できるが、`typescript-eslint/parser` のような「素の TypeScript を使う側」はこのシムがないと `.vue` の import 型が `any` 扱いになり、`@typescript-eslint/no-unsafe-assignment` などが誤爆する。

### エラーハンドリングの三層防御

`/error` ルートで、Vue / Vue Router が提供する 3 つのエラー捕捉機構を 1 画面で対比できる。各層は独立しており、捕捉先は throw が発生した「場所」で決まる。

| 層 | 担当ファイル | 捕捉対象 |
|---|---|---|
| global | `src/main.ts` (`app.config.errorHandler`) | render / setup / lifecycle / event handler / watcher。境界の外で発生し、どの `ErrorBoundary` も `return false` で止めなかったもの |
| boundary | `src/components/ErrorBoundary.vue` (`onErrorCaptured`) | 自身のサブツリーで発生したエラー。`return false` で伝播停止 |
| router | `src/router/index.ts` (`router.onError`) | 動的 import の失敗、navigation guard 内 throw 等。global / boundary とは別経路 |

捕捉ログは `src/stores/useErrorLog.ts` の Pinia ストア (setup style) で共有し、`/error` ビュー下部のテーブルに集約表示する。Pinia ストアは `main.ts` で `app.use(createPinia())` してから利用可能になる。

**`storeToRefs` の作法**: Pinia ストアの state を `const { entries } = useErrorLog()` と直接 destructure するとリアクティビティが切れる (`clear()` で `entries.value = []` した瞬間に古い配列参照が残る)。state は `storeToRefs` 経由で取り出し、action (関数) はそのまま destructure する、という使い分けを `src/views/ErrorView.vue` で示している。

**Vue DevTools での観察**: ブラウザに Vue DevTools を入れると Pinia パネルに `errorLog` ストアが現れ、各層が push するたびに `entries` の中身が時系列で更新される。`/error` 上のボタンを押しながら DevTools を見ると、どの層がいつ何を捕まえたかが一目で分かる。

**触って試す**: `src/components/ErrorBoundary.vue` の `onErrorCaptured` 内 `return false` を消すと、boundary 内 throw が boundary と global の両方に記録されるようになる。逆を返せば、`return false` が「外側に漏らさない」スイッチであることが見える。

**テストでの状態分離**: `src/components/__tests__/ErrorBoundary.spec.ts` は `beforeEach` で `setActivePinia(createPinia())` を呼び、各テストが新規ストアで走るようにしている。手動 `clear()` を書く必要がない。

### Pinia getters の教材 (`/todos`)

`/todos` ルートでは小さな todo リストを通じ、state / getters / actions の三本柱を 1 ストアにまとめて観察できる。

### `nextTick()` の教材 (`/scroll`)

Vue は state を変更しても DOM を**同期的には**更新せず、next tick まで更新をバッファリングしてからまとめて適用する (https://ja.vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing)。そのため state を変えた直後に DOM サイズ (`scrollHeight` など) を読むと「反映前」の値を使ってしまい、期待した挙動から 1 ステップ遅れる現象が起きる。

### `computed` のキャッシュと依存追跡 (`/computed-cache`)

公式ドキュメント (https://ja.vuejs.org/guide/essentials/computed.html) にある「`Date.now()` はリアクティブな依存ではないため、次の算出プロパティは二度と更新されない」ケースを左右並べて観察する。

### `legacy-peer-deps` を `.npmrc` で既定化している理由

ESLint 10 系と `eslint-plugin-import`（`eslint-import-resolver-typescript` から peerOptional で引き込まれる）の peer 範囲が衝突するため。機能的には問題ないので、`.npmrc` に `legacy-peer-deps=true` を書いて `npm install` をそのまま通るようにしている。
