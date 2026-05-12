# Development Environment

macOS + Docker Desktop を想定。

## 1. Setup

`Dockerfile.dev` と `docker-entrypoint.sh` を `uraitakahito/hello-javascript` の
タグ付きリリースから取得し、`.env` (USER_ID / GROUP_ID / TZ) を生成する。

```sh
./setup.sh
```

`Dockerfile.dev` / `docker-entrypoint.sh` / `.env` の 3 つは生成物で、本リポジトリには
コミットしない (`.gitignore` 済み)。バージョン更新は `setup.sh` の `HELLO_JS_TAG`
を書き換えて再実行する。

## 2. Build & start the dev stack

```sh
GH_TOKEN=$(gh auth token) docker compose -f compose.dev.yaml up -d --build
```

`compose.dev.yaml` が同じディレクトリの `.env` を自動で読むため、`USER_ID` /
`GROUP_ID` を `export` する必要は無い。`GH_TOKEN` のみコマンドラインで渡している
のは、ホスト側で `gh auth token` の解決が安定しているのに対し、`.env` への
書き込みは avoid したい (token をディスクに置きたくない) ため。

起動後、Docker Desktop or `docker ps` に `hello-typescript-vite-vue-container` が
表示される。

## 3. Attach to the container

VS Code:

1. **Command Palette** を開く (Shift + Command + P)
2. **Dev Containers: Attach to Running Container** を選択
3. `hello-typescript-vite-vue-container` を選び、`/app` を開く

CLI で入る場合:

```sh
docker exec -it hello-typescript-vite-vue-container zsh
```

## 4. (First time only) Fix history volume ownership

`/zsh-volume` は named volume `hello-typescript-vite-vue-zsh-history` を mount した
ものだが、初回作成時に所有権が root になる場合がある。コンテナ内で:

```sh
sudo chown -R $(id -u):$(id -g) /zsh-volume
```

## 5. Install dependencies and start the dev server

コンテナ内 (または直接ローカル Node.js 環境) で:

```sh
npm ci
npm run dev
```

ブラウザから <http://localhost:5173/> を開く。Home ルートにロゴとタイトルが
表示されることを確認。`/counter` `/scroll` `/computed-cache` `/todos` `/error`
など 8 本のルートをナビゲーションから遷移できる (詳細は `README.md` の NOTE
セクションを参照)。

## 6. Stop

```sh
docker compose -f compose.dev.yaml down
```

zsh history の named volume も含めて完全に消したい場合は `-v` を付ける。

```sh
docker compose -f compose.dev.yaml down -v
```
