# hello-typescript-vite-vue

Vite + Vue 3 + TypeScript + Vue Router + Vitest の教材用テンプレート。

## Development

macOSを想定。

### 1. Download the Dockerfile and entrypoint

```sh
curl -L -O https://raw.githubusercontent.com/uraitakahito/hello-javascript/refs/tags/1.2.5/Dockerfile.dev
curl -L -O https://raw.githubusercontent.com/uraitakahito/hello-javascript/refs/tags/1.2.5/docker-entrypoint.sh
chmod 755 docker-entrypoint.sh
```

### 2. Build & start the container with Compose

```sh
export USER_ID=$(id -u) GROUP_ID=$(id -g) GH_TOKEN=$(gh auth token)
docker compose up -d --build
```

### 3. Attach to the container via VS Code

1. **Command Palette** を開く (Shift + Command + P)
2. **Dev Containers: Attach to Running Container** を選択
3. `/app` を開く

See the [VS Code documentation](https://code.visualstudio.com/docs/devcontainers/attach-container#_attach-to-a-docker-container) for details.

### 4. (First time only) Fix history volume ownership

コンテナ内で:

```sh
sudo chown -R $(id -u):$(id -g) /zsh-volume
```

### 5. Install dependencies and start the dev server

コンテナ内（またはローカル Node.js 環境）で:

```sh
npm ci
npm run dev
```

ブラウザから `http://localhost:5173/` を開き、Home ルートのカウンタが表示されることを確認。

## Test

`vite.config.mts` 内の `test` ブロックを Vitest が直接読みに行くため、別途 `vitest.config.*` は不要。`@vue/test-utils` の `mount` で SFC を仮想 DOM (`happy-dom`) にマウントしてアサートする。サンプルは `src/components/__tests__/CounterButton.spec.ts` を参照。

## Production (Docker)

nginx で静的配信するビルド＆ラン手順。

```console
PROJECT=$(basename `pwd`)
docker image build -f Dockerfile.prod -t ${PROJECT}-prod-image .
docker container run --rm -p 8080:80 --name ${PROJECT}-prod-container ${PROJECT}-prod-image
```

`http://localhost:8080/` を開く。`/hello` に直接アクセスしたりリロードしたりしても 404 にならない（nginx 側の `try_files $uri /index.html;` により SPA fallback される）。詳細は `Dockerfile.prod` と `docker/nginx.conf` のヘッダコメント参照。

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

### `legacy-peer-deps` を `.npmrc` で既定化している理由

ESLint 10 系と `eslint-plugin-import`（`eslint-import-resolver-typescript` から peerOptional で引き込まれる）の peer 範囲が衝突するため。機能的には問題ないので、`.npmrc` に `legacy-peer-deps=true` を書いて `npm install` をそのまま通るようにしている。
