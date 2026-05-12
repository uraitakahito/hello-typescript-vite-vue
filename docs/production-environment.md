# Production Environment

`compose.prod.yaml` は `Dockerfile.prod` の multi-stage build (`node:24-bookworm-slim` で
Vite ビルド → `nginx:alpine` で配信) を起動する。`docker/nginx.conf` の
`try_files $uri $uri/ /index.html` で Vue Router (`createWebHistory`) の SPA fallback が
成立する。

コンテナは `read_only: true` + `tmpfs: [/var/cache/nginx, /var/run]` でルート FS を
書き込み禁止にし (nginx の作業領域だけメモリ上に確保)、`wget --spider` での
healthcheck と `restart: unless-stopped` を組み合わせる。

## 1. Build & run

```sh
docker compose -f compose.prod.yaml up -d --build
```

`docker ps` で `hello-typescript-vite-vue-prod` の `STATUS` が `Up (healthy)` に
転がれば OK。

## 2. Verify

```sh
# トップページ (`/` は nginx の index.html 直叩き)
curl -fsSI http://localhost:8080/

# SPA fallback の確認 (Vue Router のパスは nginx 側にファイルが無いので
# `/index.html` に落ちて 200 を返す)
curl -fsSI http://localhost:8080/error
curl -fsSI http://localhost:8080/computed-cache
```

ブラウザから <http://localhost:8080/> を開いてもよい。`/error` 等にリロード /
直リンクしても 404 が出ないことが SPA fallback の効いている証拠
(`docker/nginx.conf` のヘッダコメント参照)。

## 3. Stop

```sh
docker compose -f compose.prod.yaml down
```

## 4. Build the production image standalone

レジストリに push したい / `docker run` で単発起動したい場合は compose を介さず
直接 build:

```sh
docker build -f Dockerfile.prod -t hello-typescript-vite-vue:<version> .
docker run --rm -p 8080:80 hello-typescript-vite-vue:<version>
```
