# 20 — Produção (servidor pcp.synnex.com.br)

Guia para instalar, atualizar e virar o PCP para produção. Complementa
[`08-proximos-passos.md`](./08-proximos-passos.md).

## Arquitetura no servidor

```
Internet → OPNsense (HTTPS) → nginx :80
  /api/* → NestJS 127.0.0.1:3000   (pcp-api.service)
  /*     → /var/www/pcp-web        (arquivos estáticos do build do Vite)
PostgreSQL 127.0.0.1:5432          (pcp-postgres.service)
Backup diário 02:30                (pcp-backup.timer)
```

O frontend **não** roda mais com `vite preview`: o `pcp-web.service` foi
removido e o nginx serve o build direto.

## Instalação inicial (uma vez)

```bash
# como root
cp scripts/systemd/pcp-{postgres,api,backup}.service scripts/systemd/pcp-backup.timer /etc/systemd/system/
cp scripts/nginx/pcp.synnex.com.br.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/pcp.synnex.com.br.conf /etc/nginx/sites-enabled/
mkdir -p /var/www/pcp-web && chown pcp:pcp /var/www/pcp-web

# se o pcp-web.service antigo existir:
systemctl disable --now pcp-web && rm /etc/systemd/system/pcp-web.service

systemctl daemon-reload
systemctl enable --now pcp-postgres pcp-api pcp-backup.timer
```

O usuário `pcp` precisa de sudo sem senha só para o deploy:

```
# /etc/sudoers.d/pcp-deploy
pcp ALL=(root) NOPASSWD: /usr/bin/systemctl restart pcp-api, /usr/bin/systemctl reload nginx, /usr/sbin/nginx -t, /usr/bin/rsync, /usr/bin/mkdir
```

### `.env` da API (`pcp-homol-api/.env`)

Com `NODE_ENV=production` a API **não sobe** se encontrar valores de exemplo:

| Variável | O que colocar |
|----------|---------------|
| `DATABASE_URL` | senha forte do Postgres (não a do exemplo) |
| `JWT_SECRET` | `openssl rand -hex 32` (mín. 32 caracteres) |
| `ADMIN_PASSWORD_HASH` | `node -e "require('bcrypt').hash('SENHA',12).then(console.log)"` — usado só no 1º start |
| `ADMIN_PASSWORD` | **não usar** — recusado em produção |
| `CORS_ORIGIN` | `https://pcp.synnex.com.br` |

### Backup

`scripts/backup/pcp-backup.sh` faz `pg_dump`, confere se o arquivo abre,
apaga dumps com mais de 14 dias e, se configurado, copia para fora da máquina.
Crie `scripts/backup/backup.env` (não versionado):

```bash
BACKUP_REMOTO=usuario@servidor-backup:/backups/pcp/   # IMPORTANTE: fora deste servidor
RETENCAO_DIAS=14
```

Teste agora: `systemctl start pcp-backup && journalctl -u pcp-backup -n 20`.

**Restaurar** (num banco vazio):

```bash
pg_restore --clean --if-exists --no-owner -d "postgresql://pcp:SENHA@127.0.0.1:5432/pcp_homol" backups/arquivo.dump
```

Faça um restore de teste num banco separado pelo menos uma vez antes do go-live.

## Atualizar (deploy)

```bash
sudo -iu pcp
cd ~/pcp-fan && scripts/deploy.sh          # branch main
```

Faz backup `pre-deploy` → `git pull` → `npm ci` → `prisma migrate deploy` →
build API e web → publica o frontend → reinicia a API → confere `/api/health`.
Para no primeiro erro e mostra como voltar.

## Testes

```bash
cd pcp-homol-api
# banco de TESTE vazio (o nome precisa conter "test"; os dados são apagados)
DATABASE_URL=postgresql://pcp:pcp@localhost:5432/pcp_test npx prisma migrate deploy
DATABASE_URL=postgresql://pcp:pcp@localhost:5432/pcp_test npm test
```

Cobrem login (incl. bloqueio após 5 erros), permissões, criar/emitir OP,
baixa de operação, baixa de MP (estoque, inclusive baixas simultâneas) e
encerramento.

### CI no GitHub (ativar)

O workflow pronto está em `scripts/ci/github-actions-ci.yml` (build + testes
da API com Postgres e build do web em cada PR). Para ativar, copie para
`.github/workflows/ci.yml` e envie — pelo site do GitHub ou com um login que
tenha a permissão `workflow` (`gh auth refresh -h github.com -s workflow`).

## Checklist de go-live

### Depende da FANANDRI
- [ ] Aceite funcional Fases 1–5 (`17-checklist-homologacao-cliente.docx`)
- [ ] B8 — conferência visual do usuário-chave no COBOL
- [ ] G3 — decidir se migra `PCPA23I` (pedido de venda)
- [ ] Definir data da virada e quanto tempo o COBOL fica em paralelo (só leitura)
- [ ] Lista de usuários e permissões de cada um

### Servidor
- [ ] `.env` de produção conforme tabela acima
- [ ] `BACKUP_REMOTO` configurado e um restore testado
- [ ] nginx novo + `pcp-web.service` removido
- [ ] Monitoração externa em `https://pcp.synnex.com.br/api/health` (ex.: UptimeRobot) avisando por e-mail
- [ ] `journald` com limite de tamanho (`SystemMaxUse=500M` em `/etc/systemd/journald.conf`)

### Dia da virada
1. Avisar os usuários; congelar lançamentos no COBOL.
2. Copiar os `.DAT` mais recentes e rodar a migração completa (`pcp-homol-migracao`).
3. `npm run verificar:b8` — contagens e amostra batendo.
4. `scripts/backup/pcp-backup.sh pos-migracao`.
5. Criar os usuários no menu Usuários e liberar o acesso.
6. COBOL fica só para consulta no período combinado.

**Plano de volta:** se algo crítico falhar, os usuários voltam a lançar no
COBOL (que não foi alterado) e o banco novo é restaurado do backup
`pos-migracao` antes de nova tentativa.
