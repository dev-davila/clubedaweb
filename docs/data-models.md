---
doc_type: data-models
project: clubedaweb
generated: 2026-05-14
source: prisma/schema.prisma (1455 lines, 64 models, 19 enums)
---

# Data Models — clubedaweb

> Schema location: `prisma/schema.prisma`. Database: PostgreSQL.
> **Migration strategy:** `prisma db push` (NO `prisma/migrations/` folder present — schema is the source of truth and is pushed directly). Treat the schema as authoritative; do not assume migrations exist.

## How to Read the Catalog

Models are grouped by domain. For each model, see the schema file for full field definitions. The notes below capture *non-obvious* constraints, soft-delete columns, and cross-model relationships that AI agents must respect.

## Identity & Auth

| Model    | Purpose                                       | Key fields / Notes                                                        |
| -------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `User`   | Back-office accounts                          | `email` unique, `role` defaults to `"admin"`, `password` is bcrypt hash. Owns many BlogPosts, AuditLogs, EvolutionInstances, WaContacts, AiSessions. |
| `AuditLog` | Audit trail of admin actions               | FK → `User.id`                                                            |

## Content (Blog / News / Posts / Crônicas)

| Model               | Purpose                                                          | Notes                                                              |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `Post`              | Legacy/simple post (single author string)                        | `slug` unique. May be deprecated in favor of `BlogPost`.           |
| `BlogPost`          | Primary editorial entity                                         | **Soft delete** via `deletedAt`. Has `PostCreator` and `PostApprover` relations to `User`. Indexed on `deletedAt`. |
| `BlogCategory`      | Category taxonomy                                                | Many-to-many w/ authors + tags via join tables                     |
| `BlogTag`           | Tag taxonomy                                                     |                                                                    |
| `BlogAuthor`        | Author profile (1:1 with User optional)                          |                                                                    |
| `BlogImage`         | Image registry tied to posts                                     | Storage via `lib/s3.ts`                                            |
| `BlogPostTag`       | Join: post ↔ tag                                                 |                                                                    |
| `BlogCategoryAuthor`| Join: category ↔ author                                          |                                                                    |
| `BlogCategoryTag`   | Join: category ↔ tag                                             |                                                                    |
| `BlogAuthorTag`     | Join: author ↔ tag                                               |                                                                    |
| `PostVersion`       | Revision history                                                 |                                                                    |
| `VoiceTemplate`     | AI tone-of-voice presets for content generation                  |                                                                    |
| `Chronicle`         | "Crônica" (editorial newsletter unit)                            | See `enum ChronicleStatus`                                          |
| `ChronicleRecipient`| Recipients of a chronicle                                        |                                                                    |
| `MonitoredSite`     | External sites monitored for article harvesting                  |                                                                    |
| `CollectedArticle`  | Articles harvested from monitored sites                          | See `enum ArticleStatus`                                            |
| `SelectionToken`    | One-time token for selecting articles into a chronicle           |                                                                    |
| `ApprovalToken`     | One-time token for approving a chronicle                         |                                                                    |

## CMS / Dynamic Pages

| Model            | Purpose                                                   | Notes                                                |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `SiteConfig`     | Site-wide branding/config (single-row pattern)            | Loaded server-side via `lib/site-config-server.ts`   |
| `BrandTokens`    | Theme tokens for brand-specific styling                   | Surfaced through `components/theme-injector.tsx`     |
| `DynamicPage`    | Editor-built landing pages                                | See `enum PageStatus`, `enum PageObjective`, `enum SeoLevel` |
| `InstitutionalPage` | Static-ish institutional content                       |                                                      |
| `MediaLibrary`   | Asset catalog (uploaded images/videos)                    | Storage in S3                                        |
| `CtaTemplate`    | CTA blocks (reusable)                                     | `enum TemplateType`                                  |
| `NavigationMenu` | Menu container                                            |                                                      |
| `NavigationItem` | Menu item (tree)                                          |                                                      |
| `UrlRedirect`    | Permanent/temporary redirects (per-request lookup)        | Permanent legacy redirects also live in `next.config.js` `redirects()` |

## Catalog / Partners / Solutions

| Model              | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| `Partner`          | Partner directory entry                                |
| `SoftwareProduct`  | Catalog product                                        |
| `SoftwareCategory` | Product category                                       |
| `Solution`         | Marketed solution                                      |
| `SolutionCategory` | Solution grouping                                      |

## SEO / Analytics

| Model                  | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `SEOGoogleToken`       | OAuth tokens for Google Search Console / GA4                       |
| `SEOIndexNowLog`       | Log of IndexNow (Bing) submissions                                 |
| `SEOSitemapSubmission` | Sitemap submission audit                                           |
| `PageView`             | Page-view tracking (custom analytics, not GA-only)                 |
| `SocialMetric`         | Per-publication social metrics snapshot                            |

## Social Publishing

| Model                | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `SocialMediaAccount` | Linked accounts (Facebook, Instagram, LinkedIn, Twitter)             |
| `SocialPublication`  | Outbound publication record (per platform, per post)                 |

## Security

| Model                 | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `SecurityEvent`       | Detected events (suspicious requests, login anomalies, etc.)         |
| `SecurityBlock`       | IP / fingerprint blocks (per-endpoint, async — not Edge middleware)  |
| `SecurityAllowlist`   | Allowlisted IPs / actors                                             |
| `SecuritySetting`     | Global toggles (per phase) — see `lib/security/config-service.ts`    |
| `SecurityRateLimit`   | Per-key counters (DB-backed rate limits)                             |
| `SecurityLoginAttempt`| Failed login tracking                                                |

## Messaging / WhatsApp (Evolution API)

| Model                  | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `EvolutionServer`      | Backing Evolution API server / cluster config                        |
| `EvolutionInstance`    | Per-user WhatsApp instance (FK → `User.id`)                          |
| `WaContact`            | WhatsApp contact directory                                           |
| `WaConversation`       | Conversation thread                                                  |
| `WaMessage`            | Individual message                                                   |
| `WaTag`                | Tag for organizing contacts/conversations (per-user)                 |
| `WaConversationTag`    | Join: conversation ↔ tag                                             |
| `WaScheduledContact`   | Scheduled outbound messages (FK → `User.id`)                         |

## AI Agents (in-app)

| Model              | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `AiAgentConfig`    | Per-user agent configuration (prompts, model, tools)                   |
| `AiSession`        | Conversation session; owner + optional assignee (both FK → `User.id`)  |
| `AiSessionMessage` | Per-turn message in a session                                          |
| `AIUsageLog`       | OpenAI usage tracking (per call)                                       |
| `AIPageModification` | Audit of AI-driven page edits                                        |
| `AIQuota`          | Per-user quotas / limits                                               |

## Email Marketing / Newsletter

| Model                   | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `NewsletterSubscriber`  | Subscriber list (see `enum SubscriberStatus`)            |
| `ContactMessage`        | Contact-form submissions                                 |
| `NotificationRecipient` | Internal notification recipients                         |

## Enums (19)

```
FlowType, FlowStatus, FlowStepCondition, FlowStepStatus, FlowRecipientState,
DiscardReason, PostStatus, AttendanceType, PageObjective, SeoLevel, PageStatus,
TemplateType, ArticleStatus, ChronicleStatus, IpAssetType, IpAssetStatus,
DomainWhoisStatus, DiscoveryAction, MiningContactStatus, ExclusionReason,
SubscriberStatus, CampaignStatus, CampaignType, DeliveryStatus
```

> Some enums (e.g. `FlowType`, `IpAssetType`, `MiningContactStatus`) hint at additional planned domains (marketing automation flows, IP-asset surveillance, contact mining) that may exist in the schema before their corresponding models — check `schema.prisma` for full definitions.

## Cross-Cutting Rules

1. **Soft delete** — `BlogPost` (and likely others — verify per model) uses `deletedAt: DateTime?` with an index. Default queries MUST filter `where: { deletedAt: null }`. Trash views opt in via `?deleted=true`.
2. **Single Prisma client** — import `prisma` only from `@/lib/db`. Never `new PrismaClient()`. The proxy is lazy and appends `connection_limit=5` to `DATABASE_URL`.
3. **No migrations folder** — schema changes via `npx prisma db push` (data-loss accepted in docker-compose's startup command). For production, plan migration tooling before introducing destructive changes.
4. **Hardcoded Prisma client output path** — `prisma/schema.prisma` has a legacy `output` path matching `/home/ubuntu/m3solutions_site/nextjs_space`. The Dockerfile mirrors this directory layout. Don't move the schema or rename the project root without updating both.

## Suggested Diagrams to Add (Future)

- ER diagram for the Blog cluster (`BlogPost`, `BlogAuthor`, `BlogCategory`, `BlogTag`, joins)
- ER diagram for the WhatsApp cluster (`EvolutionInstance`, `WaContact`, `WaConversation`, `WaMessage`)
- ER diagram for the Security cluster
