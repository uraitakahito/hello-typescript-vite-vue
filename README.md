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

### 2. Build the image

```sh
PROJECT=$(basename `pwd`) && docker image build -f Dockerfile.dev -t $PROJECT-image . --build-arg TZ=Asia/Tokyo --build-arg user_id=`id -u` --build-arg group_id=`id -g`
```

### 3. (First time only) Create a volume for shell history

```sh
docker volume create $PROJECT-zsh-history
```

### 4. Start the container

`-p 5173:5173` は Vite dev server を host 側に公開する port publish。`ssh-auth.sock` のマウントは Docker Desktop for Mac の仮想ソケットで host の ssh-agent を転送している。

```sh
docker container run -d --rm --init -p 5173:5173 -v /run/host-services/ssh-auth.sock:/run/host-services/ssh-auth.sock -e SSH_AUTH_SOCK=/run/host-services/ssh-auth.sock -e GH_TOKEN=$(gh auth token) --mount type=bind,src=`pwd`,dst=/app --mount type=volume,source=$PROJECT-zsh-history,target=/zsh-volume --name $PROJECT-container $PROJECT-image
```

### 5. Attach to the container via VS Code

1. **Command Palette** を開く (Shift + Command + P)
2. **Dev Containers: Attach to Running Container** を選択
3. `/app` を開く

See the [VS Code documentation](https://code.visualstudio.com/docs/devcontainers/attach-container#_attach-to-a-docker-container) for details.

### 6. (First time only) Fix history volume ownership

コンテナ内で:

```sh
sudo chown -R $(id -u):$(id -g) /zsh-volume
```

### 7. Install dependencies and start the dev server

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

### `legacy-peer-deps` を `.npmrc` で既定化している理由

ESLint 10 系と `eslint-plugin-import`（`eslint-import-resolver-typescript` から peerOptional で引き込まれる）の peer 範囲が衝突するため。機能的には問題ないので、`.npmrc` に `legacy-peer-deps=true` を書いて `npm install` をそのまま通るようにしている。
