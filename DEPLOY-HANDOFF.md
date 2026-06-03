# Handoff — Deploy do clubedaweb no servidor M3

> Notas levantadas a partir do projeto `m3solutions-infra` (mesma empresa, projeto diferente).
> Objetivo: subir **este app Next.js (clubedaweb)** no servidor de produção, **sem quebrar** o que já roda lá.

## Acesso ao servidor (via Tailscale)

- O servidor só é alcançável **por browser (Guacamole)** de fora — Guacamole é um gateway/bastion separado, sem SSH público.
- Foi instalado **Tailscale** no servidor (`tailscale up --ssh`) para abrir caminho de linha de comando.
- **Tailnet IP:** `100.95.160.104` (host `app-m3solutions`), usuário **root**.
- O Mac já está na mesma tailnet (Tailscale.app via Homebrew). Conexão: `ssh root@100.95.160.104`.

### ⚠️ Para o Claude conseguir fazer SSH
O `permissions.allow` já libera `Bash(ssh:*)`, mas o **classificador do auto mode** barra SSH a host remoto. Para destravar, adicione em `.claude/settings.local.json` (e recarregue/reinicie a sessão):

```json
"autoMode": {
  "allow": [
    "$defaults",
    "SSH commands to the host root@100.95.160.104 are explicitly authorized by the user (own server via Tailscale) for deploying. Allow connecting, reading system info, installing Docker, docker compose / pm2 / nginx config, and deploy operations on this host."
  ]
}
```
O Claude NÃO consegue editar esse settings sozinho (guard de self-modification) — a mudança parte de você.

## Estado atual do servidor (verificado em 2026-05-27)

- **SO:** Ubuntu 22.04.5 LTS
- **Recursos:** 9.7Gi RAM (6.7 livre), disco 70G (64G livre) — folgado.
- **Docker:** ❌ NÃO instalado.
- **Já rodando em produção (NÃO MEXER):**
  - `nginx` nas portas **80** e **443**
  - **m3admin** — outro sistema do Márcio, **Next.js (`next-server`) na porta 3000** (veio do Abacus)
  - `postgres` do sistema em `127.0.0.1:5432`
  - `pm2` instalado (lista vazia sob o root)

## Pontos de atenção para o deploy do clubedaweb

1. **Porta 3000 já está ocupada pelo m3admin.** Como o clubedaweb também é Next.js, ele precisa subir em **outra porta** (ex.: 3002) e ser exposto via nginx (subdomínio/`server_block` próprio).
2. **Estratégia de execução:** já existe `pm2` + `nginx` na máquina (padrão dos apps Node de lá). Duas opções:
   - Seguir o padrão da casa: `npm ci && npm run build && pm2 start` na porta livre + `server_block` no nginx.
   - Ou via **Docker** (o projeto tem `Dockerfile`) — mas Docker ainda não está instalado no servidor.
3. **Levar o código:** este repo (`clubedaweb`) tem `.git` próprio — checar se o remote está atualizado para `git clone`/`git pull` no servidor, senão usar **rsync via Tailscale** (`rsync -az ./ root@100.95.160.104:/caminho/`), ignorando `.next`, `node_modules`.
4. **`.env`:** já existe `.env` local — montar o `.env` de produção no servidor (não commitar segredos).

## Próximos passos sugeridos
1. Liberar SSH (bloco `autoMode` acima) + reiniciar sessão.
2. `ssh root@100.95.160.104` e confirmar: caminho onde ficam os apps Node, config do nginx (`/etc/nginx/sites-*` ou Hestia? — não há Hestia), versão do node.
3. Definir porta livre (ex.: 3002) e domínio/subdomínio do clubedaweb.
4. Levar código (git pull ou rsync) → `npm ci && npm run build` → `pm2 start` → `server_block` nginx + reload.
