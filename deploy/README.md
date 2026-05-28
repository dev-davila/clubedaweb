# Deploy multi-site (Ansible + pm2)

Deploy automatizado de instâncias do **clubedaweb** (Next.js 14) no servidor de
produção M3, seguindo o padrão da casa: **pm2 + nginx + Certbot**, **sem Docker**.

Cada "site" é uma instância isolada do app: usuário Linux próprio, porta própria,
banco Postgres próprio, vhost nginx + certificado próprios. O código-fonte pode
ser o mesmo repo (mono-site, conteúdo definido pelo `.env` + dados no banco).

## Sites configurados

| site         | usuário | porta | domínio                       |
|--------------|---------|-------|-------------------------------|
| `clubedaweb` | m3site  | 3002  | m3site.clubedaweb.com.br      |
| `avast`      | avast   | 3003  | antivirusavast.com.br         |

Para adicionar mais um site: crie `sites/<nome>.yml` + `secrets-<nome>.yml`.

## Alvo
- Servidor: `root@100.95.160.104` (Tailscale, host `app-m3solutions`)
- Banco: Postgres local do servidor (DB/role dedicados por site)

## Pré-requisitos por site
1. SSH liberado no `.claude/settings.local.json` (bloco `autoMode`) — só p/ rodar pelo Claude.
2. **DNS:** apontar o domínio do site → `201.131.2.37` antes da fase 2 (Certbot).
3. `deploy/secrets-<site>.yml` preenchido (gere `db_password` e `NEXTAUTH_SECRET`
   com `openssl rand -base64 32`). Os arquivos `secrets-*.yml` estão no `.gitignore`.

## Como rodar (de dentro de `deploy/`)

```bash
cd deploy

# Fase 1 — gera a deploy key do site e imprime a chave pública
ansible-playbook 01-deploykey.yml -e site=avast
# → copie a chave mostrada e adicione em:
#   GitHub → dev-davila/clubedaweb → Settings → Deploy keys → Add deploy key (read-only)
#   (GitHub aceita várias deploy keys no mesmo repo — uma por site.)

# Fase 2 — deploy completo (DB, código, build, pm2, nginx, SSL)
ansible-playbook 02-deploy.yml -e site=avast
```

Deploys seguintes do mesmo site: só `ansible-playbook 02-deploy.yml -e site=<nome>`
(faz `git pull` + build + `pm2 reload`).

**Default**: se você omitir `-e site=…`, vale `site=clubedaweb` (retrocompat).

## Estrutura

```
deploy/
  ansible.cfg
  inventory.ini             # grupo [m3] = o servidor (1 host só)
  group_vars/all.yml        # vars COMUNS (db_host, certbot_email, pm2_bin, …)
  sites/
    clubedaweb.yml          # vars por-site (app_name, app_user, app_port, app_domain, …)
    avast.yml
  secrets-clubedaweb.yml    # segredos por-site (db_password, secret_env) — gitignored
  secrets-avast.yml         #   idem — gitignored
  templates/
    env.j2                  # .env de produção (monta DATABASE_URL + NEXTAUTH_URL + secret_env)
    nginx-clubedaweb.conf.j2  # vhost (genérico apesar do nome)
  01-deploykey.yml
  02-deploy.yml
```

## Notas
- O vhost do nginx só é gerado **na primeira vez** (re-runs não sobrescrevem os
  ajustes de SSL feitos pelo Certbot). Para regenerar do zero, apague
  `/etc/nginx/sites-available/<app_name>` no servidor e rode de novo.
- `secrets-*.yml` está no `.gitignore`. Nunca commite segredos.
- Portas em uso no servidor: 3000 (solutions-center/m3admin), 3001 (sentra),
  **3002 (clubedaweb)**, **3003 (avast)**. Próximo livre: 3004.
