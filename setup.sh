#!/bin/bash
# Dev container の前提ファイル 2 本 (Dockerfile.dev / docker-entrypoint.sh) を
# uraitakahito/hello-javascript のタグ付きリリースから curl 取得し、
# `.env` に USER_ID / GROUP_ID / TZ を書き出すスクリプト。
#
# Dockerfile.dev / docker-entrypoint.sh は本リポジトリ自身にはコミットしない
# (複数リポジトリで共通のテンプレを使い回す設計; .gitignore 済み)。
# `.env` も machine-local な値 (host の uid / gid) なので .gitignore 済み。
#
# 実行後の起動:
#   GH_TOKEN=$(gh auth token) docker compose -f compose.dev.yaml up -d --build
set -euo pipefail

# hello-javascript リポジトリのタグ。バージョンを上げるときはここを書き換える。
HELLO_JS_TAG="1.2.5"
BASE_URL="https://raw.githubusercontent.com/uraitakahito/hello-javascript/refs/tags/${HELLO_JS_TAG}"

echo "==> Fetching Dockerfile.dev and docker-entrypoint.sh from hello-javascript@${HELLO_JS_TAG}"
curl -LfsS -o Dockerfile.dev "${BASE_URL}/Dockerfile.dev"
curl -LfsS -o docker-entrypoint.sh "${BASE_URL}/docker-entrypoint.sh"
chmod 755 docker-entrypoint.sh

echo "==> Generating .env"
cat > .env <<EOF
USER_ID=$(id -u)
GROUP_ID=$(id -g)
TZ=Asia/Tokyo
EOF

cat <<'EOF'

==> Done.

Next:
  GH_TOKEN=$(gh auth token) docker compose -f compose.dev.yaml up -d --build

Then attach VS Code to "hello-typescript-vite-vue-container", or use a shell:
  docker exec -it hello-typescript-vite-vue-container zsh
EOF
