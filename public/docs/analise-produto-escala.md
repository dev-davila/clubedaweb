# M3Solutions CMS — Análise de Viabilidade como Produto

**Data:** 09/04/2026  
**Autor:** Análise técnica da arquitetura atual

---

## 1. Visão Geral

O sistema M3Solutions é composto por duas camadas bem definidas:

- **Site público** — páginas institucionais, soluções, catálogo, notícias, contato
- **Gestor (CMS)** — painel administrativo completo em `/gestor`

Essas camadas já possuem **separação clara**, o que favorece a reutilização do gestor com diferentes layouts de site público.

---

## 2. O que o Gestor já oferece

| Funcionalidade | Descrição |
|---|---|
| Blog/Notícias | Criação, edição, IA, imagens, workflow editorial, categorias, tags |
| Soluções | CRUD completo de 63+ soluções com categorias e variantes |
| Catálogo de Software | 123+ produtos em 11 categorias, editáveis |
| Páginas Institucionais | 12 páginas dinâmicas (LGPD, Quem Somos, etc.) |
| Home Page | 5 seções editáveis (hero, serviços, soluções, diferenciais, depoimentos) |
| Contatos | Inbox completo com busca, filtros, marcar como lido, responder |
| Newsletter | Gestão de assinantes + integração email marketing |
| Parceiros | CRUD de parceiros com exibição na home |
| Menus/Navegação | Header e footer dinâmicos via banco de dados |
| SEO | Checklist, Google snippet preview, meta tags, sitemap dinâmico |
| Calendário Editorial | Visualização mensal, agendamento de posts |
| Analytics | Tracking local + Google Analytics |
| Crônicas com IA | Geração automática, workflow de aprovação |
| Configurações | Dados de contato, integrações, identidade visual |
| Segurança | Autenticação, roles, proteção de rotas |

---

## 3. Arquitetura Atual — Pontos Fortes para Escala

### 3.1 Separação dados × apresentação
- Todo conteúdo é armazenado no banco (PostgreSQL via Prisma)
- Componentes do site público apenas **consomem** dados via props
- O gestor **grava** dados; o site público **lê** e renderiza

### 3.2 Configuração centralizada
- `SiteConfig` no banco armazena configurações do site (contato, SEO, integrações)
- `lib/constants.ts` centraliza URLs, logos e valores padrão
- `tailwind.config.ts` + `globals.css` centralizam cores e estilos

### 3.3 Fallback system
- Todas as seções dinâmicas possuem dados padrão hardcoded como fallback
- Se o banco estiver vazio, o site ainda funciona com os defaults

### 3.4 Componentes modulares
- Header, Footer, Hero, Seções — todos são componentes independentes que recebem props
- Fácil substituir a "casca visual" sem mexer na lógica

---

## 4. Para criar um novo site com layout diferente (mesmo gestor)

### O que TROCAR (🟢 fácil):
- Logo e cores (`constants.ts` + `tailwind.config.ts` + `globals.css`)
- Imagens do hero e backgrounds
- Textos padrão/fallback

### O que RECRIAR (🟡 médio):
- Componentes visuais do site público:
  - `header.tsx`, `footer.tsx`
  - `hero-section.tsx`, `services-section.tsx`, cards, etc.
  - Templates das páginas públicas (`/solucoes`, `/noticias`, `/contato`, etc.)
- Esses componentes consomem os **mesmos dados** do banco — só muda a apresentação

### O que NÃO MEXER (✅ reutilizar 100%):
- Todo o `/gestor` (layout, páginas, editores)
- Todas as `/api/gestor/*` (APIs do admin)
- Prisma schema e models
- Lógica de autenticação
- Integrações (email, S3, LLM, analytics)
- Scripts de seed e migração

---

## 5. Roadmap de Evolução como Produto

### Etapa 1 — Template Manual (✅ já viável hoje)

**Complexidade:** 🟢 Baixa  
**Tempo estimado por novo cliente:** Poucos dias

- Duplicar o projeto
- Trocar logo, cores e layout do front público
- O gestor fica idêntico
- Cada cliente tem seu próprio deploy e banco

**Ideal para:** Primeiros clientes, validação do produto

### Etapa 2 — Tematização via Banco de Dados

**Complexidade:** 🟡 Média  
**O que fazer:**

- Mover cores, fontes, logo e configurações visuais para `SiteConfig`
- Criar seção "Identidade Visual" no gestor
- O próprio cliente troca cores/logo pelo painel, sem código
- Criar 3-5 templates de layout pré-definidos selecionáveis

**Ideal para:** Escala moderada (10-50 clientes)

### Etapa 3 — Multi-tenant (SaaS)

**Complexidade:** 🔴 Alta  
**O que fazer:**

- Um único deploy servindo múltiplos clientes
- Cada cliente com seu domínio, banco (ou schema separado) e tema
- Painel de administração master para gerenciar tenants
- Sistema de billing/planos
- Isolamento de dados entre clientes

**Ideal para:** Escala real (50+ clientes), modelo SaaS

---

## 6. Tabela Resumo de Dificuldade

| Cenário | Dificuldade | Observação |
|---|---|---|
| Novo site com layout diferente, mesmo gestor | 🟢 Baixa-média | Recriar apenas componentes visuais do front |
| Trocar só cores/logo por cliente | 🟢 Baixa | Editar 3 arquivos de configuração |
| Gestor editável pelo próprio cliente | 🟢 Já funciona | Todas as funcionalidades já são via painel |
| Tematização 100% via gestor (sem código) | 🟡 Média | Precisa mover configs visuais para o banco |
| Templates de layout selecionáveis | 🟡 Média | Criar 3-5 variações de componentes |
| Multi-tenant completo (SaaS) | 🔴 Alta | Requer refatoração de arquitetura |

---

## 7. Componentes do Site Público (o que seria recriado por cliente)

```
components/
├── header.tsx              ← Navegação principal
├── footer.tsx              ← Rodapé
├── whatsapp-button.tsx     ← Botão flutuante WhatsApp
├── section-title.tsx       ← Títulos de seção
└── home/
    ├── hero-section.tsx    ← Banner principal
    ├── services-section.tsx ← Seção de serviços
    ├── solutions-section.tsx ← Seção de soluções
    ├── why-us-section.tsx  ← Diferenciais
    ├── testimonials-section.tsx ← Depoimentos
    ├── partners-section.tsx ← Parceiros
    ├── news-section.tsx    ← Últimas notícias
    └── cta-section.tsx     ← Call to action

app/
├── page.tsx               ← Home (composição das seções)
├── solucoes/              ← Listagem e detalhe de soluções
├── catalogo/              ← Catálogo de software
├── noticias/              ← Blog/notícias
├── contato/               ← Página de contato
├── quem-somos/            ← Institucional
└── [outras institucionais]
```

---

## 8. O que NÃO precisa ser recriado (reutilizado 100%)

```
app/gestor/                ← Todo o painel administrativo
app/api/gestor/            ← Todas as APIs do admin
app/api/auth/              ← Autenticação
app/api/contact/           ← Formulário de contato
app/api/newsletter/        ← Newsletter
app/api/cronicas/          ← Sistema de crônicas
lib/                       ← Utilitários, configs, types
prisma/                    ← Schema do banco de dados
scripts/                   ← Seeds e migrações
components/gestor/         ← Componentes do admin
```

---

## 9. Conclusão

A base atual é **sólida para comercialização**. O gestor é robusto, o conteúdo é 100% dinâmico, e a separação entre dados e apresentação permite criar novos layouts sem reescrever a lógica de negócio.

O caminho recomendado é:
1. **Agora:** Começar com duplicação manual (Etapa 1)
2. **Com 5-10 clientes:** Investir na tematização via banco (Etapa 2)
3. **Com demanda validada:** Evoluir para multi-tenant (Etapa 3)
