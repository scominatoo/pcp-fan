#!/usr/bin/env bash
# Deploy do PCP no servidor (rodar como usuário pcp, com sudo para systemctl/nginx).
#
# Uso:  scripts/deploy.sh [branch]     (padrão: main)
#
# Passos: backup → git pull → npm ci → migrations → build → publica frontend
#         → reinicia API → confere /api/health. Para no primeiro erro.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"
WEB_ROOT="${WEB_ROOT:-/var/www/pcp-web}"
NODE_BIN="${NODE_BIN:-/home/pcp/.nvm/versions/node/v22.23.1/bin}"
export PATH="$NODE_BIN:$PATH"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"

passo() { echo; echo "==> $*"; }

# Tudo dentro de main(): o bash lê a função inteira antes de rodar, então
# o git pull abaixo pode atualizar este arquivo sem quebrar a execução.
main() {
cd "$REPO"

passo "Conferindo repositório"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Há alterações locais não commitadas no servidor — resolva antes do deploy." >&2
  exit 1
fi
ANTES=$(git rev-parse --short HEAD)

passo "Backup do banco antes do deploy"
"$REPO/scripts/backup/pcp-backup.sh" pre-deploy

passo "Atualizando código ($BRANCH)"
git fetch origin "$BRANCH"
git checkout -q "$BRANCH"
git merge --ff-only "origin/$BRANCH"
DEPOIS=$(git rev-parse --short HEAD)
echo "$ANTES → $DEPOIS"

passo "API: dependências, migrations e build"
cd "$REPO/pcp-homol-api"
npm ci --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy
npm run build

passo "Web: dependências e build"
cd "$REPO/pcp-homol-web"
npm ci --no-audit --no-fund
npm run build

passo "Publicando frontend em $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete "$REPO/pcp-homol-web/dist/" "$WEB_ROOT/"

passo "Reiniciando API"
sudo systemctl restart pcp-api
for i in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" | grep -q '"database":"ok"'; then
    echo "API no ar: $(curl -fsS "$HEALTH_URL")"
    sudo nginx -t && sudo systemctl reload nginx
    echo; echo "Deploy concluído: $DEPOIS"
    exit 0
  fi
  sleep 2
done

echo "API não respondeu em $HEALTH_URL. Veja: journalctl -u pcp-api -n 100" >&2
echo "Para voltar: git checkout $ANTES && scripts/deploy.sh (e, se a migration quebrou dados, restaure o dump pre-deploy)" >&2
exit 1
}

main "$@"
