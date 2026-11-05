#!/usr/bin/env bash
# Backup do banco PCP (pg_dump formato custom) com retenção.
#
# Uso:  scripts/backup/pcp-backup.sh [rótulo]
#   rótulo opcional entra no nome do arquivo (ex.: "pre-deploy").
#
# Variáveis (opcionais, podem ir em /home/pcp/pcp-fan/scripts/backup/backup.env):
#   BACKUP_DIR        pasta dos dumps            (padrão: <repo>/backups)
#   RETENCAO_DIAS     apaga dumps mais velhos    (padrão: 14)
#   BACKUP_REMOTO     destino rsync fora da máquina, ex.: backup@nas:/pcp/
#                     — sem isso o backup fica só neste servidor!
#   PG_BIN            pasta do pg_dump           (padrão: micromamba pcp-pg)
#
# Restaurar (num banco vazio):
#   pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" arquivo.dump
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
[ -f "$REPO/scripts/backup/backup.env" ] && source "$REPO/scripts/backup/backup.env"

BACKUP_DIR="${BACKUP_DIR:-$REPO/backups}"
RETENCAO_DIAS="${RETENCAO_DIAS:-14}"
PG_BIN="${PG_BIN:-/home/pcp/micromamba/envs/pcp-pg/bin}"
[ -x "$PG_BIN/pg_dump" ] && export PATH="$PG_BIN:$PATH"

# DATABASE_URL vem do .env da API (remove o ?schema=public, que o pg_dump não aceita)
DATABASE_URL="${DATABASE_URL:-$(grep -E '^DATABASE_URL=' "$REPO/pcp-homol-api/.env" | cut -d= -f2-)}"
DATABASE_URL="${DATABASE_URL%%\?*}"
[ -n "$DATABASE_URL" ] || { echo "DATABASE_URL não encontrado" >&2; exit 1; }

ROTULO="${1:-diario}"
mkdir -p "$BACKUP_DIR"
ARQ="$BACKUP_DIR/pcp_homol_${ROTULO}_$(date +%Y%m%d-%H%M%S).dump"

pg_dump --format=custom --no-owner --file="$ARQ.parcial" "$DATABASE_URL"
# Confere se o arquivo é legível antes de considerar o backup bom
pg_restore --list "$ARQ.parcial" >/dev/null
mv "$ARQ.parcial" "$ARQ"
echo "Backup OK: $ARQ ($(du -h "$ARQ" | cut -f1))"

find "$BACKUP_DIR" -name 'pcp_homol_*.dump' -mtime +"$RETENCAO_DIAS" -print -delete

if [ -n "${BACKUP_REMOTO:-}" ]; then
  rsync -a "$ARQ" "$BACKUP_REMOTO"
  echo "Copiado para $BACKUP_REMOTO"
else
  echo "AVISO: BACKUP_REMOTO não definido — backup só existe neste servidor." >&2
fi
