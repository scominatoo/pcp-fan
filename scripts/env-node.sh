#!/bin/bash
# Adiciona Node portátil do projeto ao PATH (se existir)
# Uso: source scripts/env-node.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_DIR="$ROOT/.tools/node/bin"

if [ -x "$NODE_DIR/node" ]; then
  export PATH="$NODE_DIR:$PATH"
  echo "Node portátil: $(node -v)"
else
  echo "Node portátil não encontrado em $NODE_DIR"
  echo "Use Node.js 20+ instalado no sistema ou rode o download em docs/08-proximos-passos.md"
fi
