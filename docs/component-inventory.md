---
doc_type: component-inventory
project: clubedaweb
generated: 2026-05-14
source: components/** (133 .tsx files)
---

# Component Inventory — clubedaweb

## Layout & Conventions

- `components/ui/` — **48 shadcn/ui primitives** in kebab-case (`alert-dialog.tsx`, `dropdown-menu.tsx`, `dialog.tsx`, etc.). Configured via `components.json`: `style: default`, `rsc: true`, `cssVariables: true`, `baseColor: neutral`, no prefix. **Add via shadcn CLI; don't hand-roll equivalents.**
- Feature components: predominantly kebab-case. Some legacy PascalCase remains (`FormulariosTab.tsx`, `NotificacoesTab.tsx`, `SmtpTab.tsx`) — **prefer kebab-case for new files.**
- Suffix conventions:
  - `-client.tsx` → client island (must declare `"use client"`)
  - `-button.tsx`, `-form.tsx`, `-tracker.tsx` → narrow-purpose
- Push the client boundary as low as possible — pages stay Server Components; interactive bits move into `*-client.tsx`.

## Inventory by Domain

### Primitives — `components/ui/` (shadcn/ui)
48 files, all derivative of Radix UI primitives. Examples: `accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `button`, `calendar`, `card`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle`, `toggle-group`, `tooltip`. Plus `use-toast.ts` re-export.

### Layout / Chrome
- `components/site-chrome.tsx` — public site wrapper
- `components/header.tsx`, `components/footer.tsx`
- `components/providers.tsx`, `components/theme-provider.tsx`, `components/theme-injector.tsx` — global providers (NextAuth, themes, Toaster, Query/SWR config)
- `components/cookie-consent.tsx`
- `components/google-analytics.tsx`, `components/analytics-tracker.tsx`, `components/not-found-tracker.tsx`

### Marketing / Forms
- `components/contact-form.tsx`, `components/newsletter-form.tsx`
- `components/share-button.tsx`, `components/whatsapp-button.tsx`
- `components/section-title.tsx`
- `components/edit-mode-overlay.tsx` — in-page CMS edit overlay

### Home Page Brand Variants
- `components/home/` — generic home
- `components/home-m3/` — M3Solutions brand layout
- `components/home-bd/` — Bitdefender-flavored layout
- `components/m3-original/` — legacy M3 layout
- `components/bd-redesign/` — newer BD redesign
> Brand swap is theme-driven via `lib/themes` and `lib/site-config-server.ts`.

### News
- `components/noticias/` — news rendering (post list, detail, related)

### CMS
- `components/cms/` — visual editor surfaces
- `components/gestor/visual-editor.tsx`, `components/gestor/visual-page-editor.tsx`
- `components/gestor/brand-editor.tsx`, `components/gestor/theme-selector.tsx`

### Back-Office (`components/gestor/`)
- `gestor-layout-client.tsx` — main admin layout shell (recently modified)
- `posts-list-client.tsx`, `delete-post-button.tsx`, `batch-image-generator.tsx`
- `social-media-preview.tsx`
- `delete-partner-button.tsx`, `toggle-partner-home.tsx`
- `FormulariosTab.tsx`, `NotificacoesTab.tsx`, `SmtpTab.tsx` — legacy PascalCase tabs
- `components/gestor/wizard/` — **new wizard UI** (in-progress, modified in current branch)

## State, Toasts, Fetching (recap from `_bmad-output/project-context.md`)

Multiple libraries coexist — **match the surrounding file**, do not introduce new ones casually:

| Concern        | Available                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Toasts         | `react-hot-toast`, `sonner`, shadcn `useToast` (`hooks/use-toast.ts`)                                   |
| Server fetching| `fetch()` (default in gestor), TanStack Query 5, SWR 2                                                  |
| Client state   | `useState`/`useReducer`, Zustand 5, Jotai 2                                                             |
| Validation     | Zod (preferred), React Hook Form. Yup + Formik legacy.                                                  |

## Hooks (`hooks/`)
- `use-toast.ts` — shadcn toast bridge
- Project-specific `use-*` hooks (consult dir for full list)
> Helper hooks that belong to a single component remain colocated with that component.

## Adding a New Component — Checklist

1. Decide Server vs Client first. Default to Server. Client only when hooks/events/browser-APIs are needed.
2. If reusable UI primitive → `components/ui/` via shadcn CLI.
3. If feature-specific → `components/<domain>/`, kebab-case filename.
4. Use `cn()` from `@/lib/utils` for conditional class merging.
5. Use design tokens (`bg-background`, `text-foreground`, etc.) — they map to CSS variables; never hard-code hexes for theme-aware surfaces.
6. Suffix `-client.tsx` for client islands.
7. If interactive admin → place under `components/gestor/`.
