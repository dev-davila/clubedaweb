-- CreateEnum
CREATE TYPE "FlowType" AS ENUM ('COLD_MAIL', 'DIGEST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FlowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FlowStepCondition" AS ENUM ('NO_RESPONSE', 'NO_REPLY', 'NO_OPEN', 'NO_CLICK', 'ALWAYS', 'OPENED', 'CLICKED', 'REPLIED');

-- CreateEnum
CREATE TYPE "FlowStepStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FlowRecipientState" AS ENUM ('IN_PROGRESS', 'RESPONDED', 'COMPLETED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "DiscardReason" AS ENUM ('BOUNCE', 'FAILED_DELIVERY', 'MANUAL', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('BRIEFING', 'GENERATING', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('REMOTE', 'LOCAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "PageObjective" AS ENUM ('AUTHORITY', 'TRAFFIC', 'CONVERSION');

-- CreateEnum
CREATE TYPE "SeoLevel" AS ENUM ('GLOBAL', 'STATE', 'CITY');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('HEADER', 'FOOTER', 'HOME', 'SERVICES', 'PRODUCTS', 'ABOUT', 'CONTACT', 'POST_LIST', 'POST_DETAIL', 'LEGAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('pending', 'selected', 'rejected', 'converted', 'expired');

-- CreateEnum
CREATE TYPE "ChronicleStatus" AS ENUM ('draft', 'pending_review', 'approved', 'scheduled', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "IpAssetType" AS ENUM ('IP', 'CIDR');

-- CreateEnum
CREATE TYPE "IpAssetStatus" AS ENUM ('ATIVO', 'PAUSADO', 'CONCLUIDO', 'ERRO');

-- CreateEnum
CREATE TYPE "DomainWhoisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR', 'PENDING_RETRY');

-- CreateEnum
CREATE TYPE "DiscoveryAction" AS ENUM ('REVERSE_DNS', 'DNS_VALIDATION', 'WHOIS_LOOKUP', 'DOMAIN_SAVED', 'ERROR', 'CRT_SEARCH');

-- CreateEnum
CREATE TYPE "MiningContactStatus" AS ENUM ('NOVO', 'CONTATADO', 'INTERESSADO', 'NEGOCIANDO', 'CONVERTIDO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "ExclusionReason" AS ENUM ('CONCORRENTE', 'PARCEIRO', 'FORA_FOCO', 'SPAM', 'INVALIDO', 'SEM_POTENCIAL', 'DUPLICADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BLOCKED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('MANUAL', 'POST_DIGEST', 'AUTOMATED', 'COLD_MAIL', 'DIGEST');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED', 'FAILED', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Tecnologia',
    "author" TEXT NOT NULL DEFAULT 'M3Solutions',
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "website" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "showOnHome" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "contentHtml" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featuredImage" TEXT,
    "imageAlt" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'BRIEFING',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "briefTitle" TEXT,
    "briefPersona" TEXT,
    "briefCta" TEXT,
    "briefKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "briefNotes" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "aiPromptUsed" TEXT,
    "aiGeneratedAt" TIMESTAMP(3),
    "categoryId" TEXT,
    "authorId" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "videoUrl" TEXT,
    "attendanceType" "AttendanceType",
    "brand" TEXT,
    "geoCity" TEXT,
    "geoCountry" TEXT,
    "geoNeighborhood" TEXT,
    "geoState" TEXT,
    "mainKeyword" TEXT,
    "pageObjective" "PageObjective",
    "schemaMarkup" TEXT,
    "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoBlockReason" TEXT,
    "seoBlocked" BOOLEAN NOT NULL DEFAULT false,
    "seoLevel" "SeoLevel",
    "seoLevelJustification" TEXT,
    "seoRecommendedUrl" TEXT,
    "serviceType" TEXT,
    "secondaryImage" TEXT,
    "reviewToken" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "color" TEXT DEFAULT '#0066CC',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategoryAuthor" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "BlogCategoryAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategoryTag" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogCategoryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogAuthorTag" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogAuthorTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostTag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogAuthor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "email" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "userId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avoidTopics" TEXT,
    "contentGoals" TEXT,
    "keywords" TEXT,
    "promptTemplate" TEXT,
    "targetAudience" TEXT,
    "tone" TEXT,
    "writingStyle" TEXT,
    "wordCountMax" INTEGER,
    "wordCountMin" INTEGER,
    "videoAvatarDesc" TEXT,
    "videoAvatarName" TEXT,
    "videoAvatarStyle" TEXT,
    "videoBackground" TEXT,
    "videoCompanyMention" TEXT,
    "videoCta" TEXT,
    "videoDuration" TEXT,
    "videoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "videoIntroScript" TEXT,
    "videoOutroScript" TEXT,
    "videoTone" TEXT,
    "videoAvatarImage" TEXT,

    CONSTRAINT "BlogAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "persona" TEXT NOT NULL,
    "tone" TEXT,
    "examples" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT,
    "caption" TEXT,
    "size" INTEGER,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "isFeature" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION,
    "operation" TEXT NOT NULL,
    "postId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPageModification" (
    "id" TEXT NOT NULL,
    "pageId" TEXT,
    "pageTitle" TEXT NOT NULL,
    "pageSlug" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "referenceUrls" TEXT,
    "referencePageIds" TEXT,
    "previousContent" TEXT,
    "newContent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPageModification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQuota" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "tokensLimit" INTEGER NOT NULL DEFAULT 1000000,
    "postsGenerated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CtaTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL,
    "formId" TEXT,
    "linkUrl" TEXT,
    "whatsappText" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "icon" TEXT,
    "color" TEXT DEFAULT '#7C3AED',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CtaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaLibrary" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "mimeType" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "generatedByAI" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "aiProvider" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandTokens" (
    "id" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1E40AF',
    "accentColor" TEXT NOT NULL DEFAULT '#10B981',
    "textColor" TEXT NOT NULL DEFAULT '#1F2937',
    "textLightColor" TEXT NOT NULL DEFAULT '#6B7280',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "surfaceColor" TEXT NOT NULL DEFAULT '#F9FAFB',
    "fontPrimary" TEXT NOT NULL DEFAULT 'Inter, sans-serif',
    "fontSecondary" TEXT NOT NULL DEFAULT 'Inter, sans-serif',
    "fontHeading" TEXT NOT NULL DEFAULT 'Inter, sans-serif',
    "logoUrl" TEXT,
    "logoLightUrl" TEXT,
    "logoIconUrl" TEXT,
    "styleType" TEXT NOT NULL DEFAULT 'corporate',
    "borderRadius" TEXT NOT NULL DEFAULT '8px',
    "buttonStyle" TEXT NOT NULL DEFAULT 'rounded',
    "iconStyle" TEXT NOT NULL DEFAULT 'solid',
    "lastAnalyzed" TIMESTAMP(3),
    "analyzedFrom" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaAccount" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountName" TEXT,
    "accountId" TEXT,
    "profileUrl" TEXT,
    "profileImage" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "refreshExpiresAt" TIMESTAMP(3),
    "autoPost" BOOLEAN NOT NULL DEFAULT true,
    "postTemplate" TEXT,
    "hashtagsDefault" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,
    "organizationName" TEXT,
    "postAsOrganization" BOOLEAN NOT NULL DEFAULT false,
    "postAsBoth" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SocialMediaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPublication" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "blogPostId" TEXT,
    "platform" TEXT NOT NULL,
    "postId" TEXT,
    "postUrl" TEXT,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userAgent" TEXT,
    "payloadExcerpt" TEXT,
    "statusCode" INTEGER,
    "country" TEXT,
    "city" TEXT,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityBlock" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,

    CONSTRAINT "SecurityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAllowlist" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,

    CONSTRAINT "SecurityAllowlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecuritySetting" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuritySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityRateLimit" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SecurityRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLoginAttempt" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "email" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "SecurityLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoredSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "feedUrl" TEXT,
    "selector" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "checkInterval" INTEGER NOT NULL DEFAULT 3,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectedArticle" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "originalUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ArticleStatus" NOT NULL DEFAULT 'pending',
    "notifiedAt" TIMESTAMP(3),
    "selectedAt" TIMESTAMP(3),

    CONSTRAINT "CollectedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChronicleRecipient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChronicleRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chronicle" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "sourceReference" TEXT NOT NULL,
    "status" "ChronicleStatus" NOT NULL DEFAULT 'draft',
    "publishToSocial" BOOLEAN NOT NULL DEFAULT false,
    "socialPlatforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" TEXT,
    "authorId" TEXT,
    "blogPostId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "facebookPostUrl" TEXT,
    "instagramPostUrl" TEXT,
    "linkedinPostUrl" TEXT,
    "twitterPostUrl" TEXT,

    CONSTRAINT "Chronicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectionToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelectionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOGoogleToken" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOGoogleToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOIndexNowLog" (
    "id" TEXT NOT NULL,
    "urls" TEXT[],
    "status" TEXT NOT NULL,
    "response" TEXT,
    "engine" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOIndexNowLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOSitemapSubmission" (
    "id" TEXT NOT NULL,
    "sitemapUrl" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "urlCount" INTEGER,
    "lastChecked" TIMESTAMP(3),
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOSitemapSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "referrerDomain" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "country" TEXT DEFAULT 'Brasil',
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "language" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "channelGroup" TEXT,
    "statusCode" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UrlRedirect" (
    "id" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "targetPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UrlRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pageType" TEXT NOT NULL DEFAULT 'institutional',
    "content" TEXT,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "layoutConfig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationMenu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "target" TEXT NOT NULL DEFAULT '_self',
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVersion" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "editedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMetric" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "categories" TEXT[] DEFAULT ARRAY['gestao']::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "cnpj" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "categoryId" TEXT NOT NULL,
    "vendor" TEXT,
    "image" TEXT,
    "features" JSONB,
    "benefits" JSONB,
    "editions" JSONB,
    "relatedProducts" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image" TEXT,
    "icon" TEXT,
    "logo" TEXT,
    "description" TEXT,
    "longDescription" TEXT,
    "benefits" JSONB,
    "features" JSONB,
    "highlights" JSONB,
    "extraSections" JSONB,
    "partnerLogos" JSONB,
    "dataCenterPartners" JSONB,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "cardVariant" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "subtitle" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "gridCols" INTEGER NOT NULL DEFAULT 3,
    "bgVariant" TEXT NOT NULL DEFAULT 'white',
    "defaultCardVariant" TEXT NOT NULL DEFAULT 'card',
    "parentSlug" TEXT,
    "partnerLogos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolutionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionServer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionInstance" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "instanceToken" TEXT,
    "phoneNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "profileName" TEXT,
    "profilePicUrl" TEXT,
    "serverId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaConversation" (
    "id" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "profilePicUrl" TEXT,
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "instanceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "conversationId" TEXT NOT NULL,
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT,
    "mediaType" TEXT,
    "mediaUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaConversationTag" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaConversationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "source" TEXT DEFAULT 'manual',
    "remoteJid" TEXT,
    "instanceId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaScheduledContact" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentError" TEXT,
    "autoSend" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaScheduledContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "content" TEXT,
    "sections" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "restrictions" TEXT,
    "welcomeMessage" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1024,
    "departments" TEXT NOT NULL DEFAULT 'comercial,suporte,financeiro',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "instanceIds" TEXT,
    "businessRules" TEXT,
    "trainingFiles" TEXT,
    "trainingUrls" TEXT,
    "responseDelay" INTEGER NOT NULL DEFAULT 0,
    "inactivityTimeout" INTEGER NOT NULL DEFAULT 0,
    "fallbackModel" TEXT,
    "trainingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "unodeskEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isEntryPoint" BOOLEAN NOT NULL DEFAULT false,
    "routingInstructions" TEXT,
    "routingAgentIds" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "department" TEXT,
    "step" TEXT NOT NULL DEFAULT 'greeting',
    "instanceId" TEXT NOT NULL,
    "agentConfigId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "conversationId" TEXT,
    "parentSessionId" TEXT,
    "metadata" TEXT,
    "summary" TEXT,
    "closedReason" TEXT,
    "ownerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSessionMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "aiPayload" TEXT,
    "externalMsgId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feedbackStatus" TEXT,
    "feedbackComment" TEXT,
    "feedbackAt" TIMESTAMP(3),
    "feedbackBy" TEXT,

    CONSTRAINT "AiSessionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WizardSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'web',
    "channelRef" TEXT,
    "state" TEXT NOT NULL DEFAULT 'idle',
    "data" JSONB NOT NULL DEFAULT '{}',
    "brief" TEXT,
    "stitchProjectId" TEXT,
    "stitchScreenId" TEXT,
    "stitchHtmlUrl" TEXT,
    "stitchHtmlCached" TEXT,
    "stitchPagesCached" JSONB,
    "extractedTokens" JSONB,
    "generatedContent" JSONB,
    "previewToken" TEXT,
    "previewExpiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WizardSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WizardMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WizardMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

-- CreateIndex
CREATE INDEX "BlogPost_seoLevel_idx" ON "BlogPost"("seoLevel");

-- CreateIndex
CREATE INDEX "BlogPost_geoCity_idx" ON "BlogPost"("geoCity");

-- CreateIndex
CREATE INDEX "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "BlogTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategoryAuthor_categoryId_authorId_key" ON "BlogCategoryAuthor"("categoryId", "authorId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategoryTag_categoryId_tagId_key" ON "BlogCategoryTag"("categoryId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogAuthorTag_authorId_tagId_key" ON "BlogAuthorTag"("authorId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostTag_postId_tagId_key" ON "BlogPostTag"("postId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogAuthor_slug_key" ON "BlogAuthor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogAuthor_userId_key" ON "BlogAuthor"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIPageModification_pageId_idx" ON "AIPageModification"("pageId");

-- CreateIndex
CREATE INDEX "AIPageModification_status_idx" ON "AIPageModification"("status");

-- CreateIndex
CREATE INDEX "AIPageModification_createdAt_idx" ON "AIPageModification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIQuota_month_key" ON "AIQuota"("month");

-- CreateIndex
CREATE UNIQUE INDEX "SiteConfig_key_key" ON "SiteConfig"("key");

-- CreateIndex
CREATE INDEX "SiteConfig_category_idx" ON "SiteConfig"("category");

-- CreateIndex
CREATE INDEX "MediaLibrary_category_idx" ON "MediaLibrary"("category");

-- CreateIndex
CREATE INDEX "MediaLibrary_generatedByAI_idx" ON "MediaLibrary"("generatedByAI");

-- CreateIndex
CREATE INDEX "MediaLibrary_createdAt_idx" ON "MediaLibrary"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaAccount_platform_key" ON "SocialMediaAccount"("platform");

-- CreateIndex
CREATE INDEX "SocialMediaAccount_platform_isConnected_idx" ON "SocialMediaAccount"("platform", "isConnected");

-- CreateIndex
CREATE INDEX "SocialPublication_accountId_idx" ON "SocialPublication"("accountId");

-- CreateIndex
CREATE INDEX "SocialPublication_blogPostId_idx" ON "SocialPublication"("blogPostId");

-- CreateIndex
CREATE INDEX "SocialPublication_platform_status_idx" ON "SocialPublication"("platform", "status");

-- CreateIndex
CREATE INDEX "SecurityEvent_ip_idx" ON "SecurityEvent"("ip");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "SecurityEvent_action_idx" ON "SecurityEvent"("action");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityBlock_ip_idx" ON "SecurityBlock"("ip");

-- CreateIndex
CREATE INDEX "SecurityBlock_active_idx" ON "SecurityBlock"("active");

-- CreateIndex
CREATE INDEX "SecurityBlock_expiresAt_idx" ON "SecurityBlock"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAllowlist_ip_key" ON "SecurityAllowlist"("ip");

-- CreateIndex
CREATE INDEX "SecurityAllowlist_ip_idx" ON "SecurityAllowlist"("ip");

-- CreateIndex
CREATE INDEX "SecurityAllowlist_active_idx" ON "SecurityAllowlist"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SecuritySetting_settingKey_key" ON "SecuritySetting"("settingKey");

-- CreateIndex
CREATE INDEX "SecuritySetting_settingKey_idx" ON "SecuritySetting"("settingKey");

-- CreateIndex
CREATE INDEX "SecurityRateLimit_ip_idx" ON "SecurityRateLimit"("ip");

-- CreateIndex
CREATE INDEX "SecurityRateLimit_windowStart_idx" ON "SecurityRateLimit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityRateLimit_ip_endpoint_windowStart_key" ON "SecurityRateLimit"("ip", "endpoint", "windowStart");

-- CreateIndex
CREATE INDEX "SecurityLoginAttempt_ip_idx" ON "SecurityLoginAttempt"("ip");

-- CreateIndex
CREATE INDEX "SecurityLoginAttempt_email_idx" ON "SecurityLoginAttempt"("email");

-- CreateIndex
CREATE INDEX "SecurityLoginAttempt_createdAt_idx" ON "SecurityLoginAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "MonitoredSite_active_idx" ON "MonitoredSite"("active");

-- CreateIndex
CREATE INDEX "MonitoredSite_lastCheckedAt_idx" ON "MonitoredSite"("lastCheckedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollectedArticle_originalUrl_key" ON "CollectedArticle"("originalUrl");

-- CreateIndex
CREATE INDEX "CollectedArticle_siteId_idx" ON "CollectedArticle"("siteId");

-- CreateIndex
CREATE INDEX "CollectedArticle_status_idx" ON "CollectedArticle"("status");

-- CreateIndex
CREATE INDEX "CollectedArticle_collectedAt_idx" ON "CollectedArticle"("collectedAt");

-- CreateIndex
CREATE INDEX "CollectedArticle_notifiedAt_idx" ON "CollectedArticle"("notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChronicleRecipient_email_key" ON "ChronicleRecipient"("email");

-- CreateIndex
CREATE INDEX "ChronicleRecipient_active_idx" ON "ChronicleRecipient"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Chronicle_articleId_key" ON "Chronicle"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Chronicle_blogPostId_key" ON "Chronicle"("blogPostId");

-- CreateIndex
CREATE INDEX "Chronicle_status_idx" ON "Chronicle"("status");

-- CreateIndex
CREATE INDEX "Chronicle_categoryId_idx" ON "Chronicle"("categoryId");

-- CreateIndex
CREATE INDEX "Chronicle_authorId_idx" ON "Chronicle"("authorId");

-- CreateIndex
CREATE INDEX "Chronicle_scheduledFor_idx" ON "Chronicle"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "SelectionToken_token_key" ON "SelectionToken"("token");

-- CreateIndex
CREATE INDEX "SelectionToken_token_idx" ON "SelectionToken"("token");

-- CreateIndex
CREATE INDEX "SelectionToken_expiresAt_idx" ON "SelectionToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalToken_token_key" ON "ApprovalToken"("token");

-- CreateIndex
CREATE INDEX "ApprovalToken_token_idx" ON "ApprovalToken"("token");

-- CreateIndex
CREATE INDEX "ApprovalToken_expiresAt_idx" ON "ApprovalToken"("expiresAt");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");

-- CreateIndex
CREATE INDEX "PageView_path_idx" ON "PageView"("path");

-- CreateIndex
CREATE INDEX "PageView_createdAt_path_idx" ON "PageView"("createdAt", "path");

-- CreateIndex
CREATE INDEX "PageView_createdAt_isBot_idx" ON "PageView"("createdAt", "isBot");

-- CreateIndex
CREATE UNIQUE INDEX "UrlRedirect_sourcePath_key" ON "UrlRedirect"("sourcePath");

-- CreateIndex
CREATE INDEX "UrlRedirect_sourcePath_idx" ON "UrlRedirect"("sourcePath");

-- CreateIndex
CREATE INDEX "UrlRedirect_active_idx" ON "UrlRedirect"("active");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicPage_slug_key" ON "DynamicPage"("slug");

-- CreateIndex
CREATE INDEX "DynamicPage_status_idx" ON "DynamicPage"("status");

-- CreateIndex
CREATE INDEX "DynamicPage_pageType_idx" ON "DynamicPage"("pageType");

-- CreateIndex
CREATE INDEX "DynamicPage_parentId_idx" ON "DynamicPage"("parentId");

-- CreateIndex
CREATE INDEX "DynamicPage_slug_idx" ON "DynamicPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationMenu_name_key" ON "NavigationMenu"("name");

-- CreateIndex
CREATE INDEX "NavigationItem_menuId_idx" ON "NavigationItem"("menuId");

-- CreateIndex
CREATE INDEX "NavigationItem_parentId_idx" ON "NavigationItem"("parentId");

-- CreateIndex
CREATE INDEX "NavigationItem_order_idx" ON "NavigationItem"("order");

-- CreateIndex
CREATE INDEX "PostVersion_postId_idx" ON "PostVersion"("postId");

-- CreateIndex
CREATE INDEX "PostVersion_createdAt_idx" ON "PostVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "SocialMetric_publicationId_idx" ON "SocialMetric"("publicationId");

-- CreateIndex
CREATE INDEX "SocialMetric_fetchedAt_idx" ON "SocialMetric"("fetchedAt");

-- CreateIndex
CREATE INDEX "NotificationRecipient_active_idx" ON "NotificationRecipient"("active");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_read_idx" ON "ContactMessage"("read");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareCategory_slug_key" ON "SoftwareCategory"("slug");

-- CreateIndex
CREATE INDEX "SoftwareCategory_active_idx" ON "SoftwareCategory"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareProduct_slug_key" ON "SoftwareProduct"("slug");

-- CreateIndex
CREATE INDEX "SoftwareProduct_categoryId_idx" ON "SoftwareProduct"("categoryId");

-- CreateIndex
CREATE INDEX "SoftwareProduct_vendor_idx" ON "SoftwareProduct"("vendor");

-- CreateIndex
CREATE INDEX "SoftwareProduct_active_idx" ON "SoftwareProduct"("active");

-- CreateIndex
CREATE INDEX "SoftwareProduct_displayOrder_idx" ON "SoftwareProduct"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_slug_key" ON "Solution"("slug");

-- CreateIndex
CREATE INDEX "Solution_category_idx" ON "Solution"("category");

-- CreateIndex
CREATE INDEX "Solution_active_idx" ON "Solution"("active");

-- CreateIndex
CREATE INDEX "Solution_displayOrder_idx" ON "Solution"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionCategory_slug_key" ON "SolutionCategory"("slug");

-- CreateIndex
CREATE INDEX "SolutionCategory_displayOrder_idx" ON "SolutionCategory"("displayOrder");

-- CreateIndex
CREATE INDEX "SolutionCategory_active_idx" ON "SolutionCategory"("active");

-- CreateIndex
CREATE INDEX "EvolutionServer_active_idx" ON "EvolutionServer"("active");

-- CreateIndex
CREATE INDEX "EvolutionInstance_ownerId_idx" ON "EvolutionInstance"("ownerId");

-- CreateIndex
CREATE INDEX "EvolutionInstance_status_idx" ON "EvolutionInstance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EvolutionInstance_serverId_instanceName_key" ON "EvolutionInstance"("serverId", "instanceName");

-- CreateIndex
CREATE INDEX "WaConversation_instanceId_lastMessageAt_idx" ON "WaConversation"("instanceId", "lastMessageAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "WaConversation_instanceId_remoteJid_key" ON "WaConversation"("instanceId", "remoteJid");

-- CreateIndex
CREATE INDEX "WaMessage_conversationId_timestamp_idx" ON "WaMessage"("conversationId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "WaMessage_messageId_idx" ON "WaMessage"("messageId");

-- CreateIndex
CREATE INDEX "WaTag_ownerId_idx" ON "WaTag"("ownerId");

-- CreateIndex
CREATE INDEX "WaConversationTag_tagId_idx" ON "WaConversationTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "WaConversationTag_conversationId_tagId_key" ON "WaConversationTag"("conversationId", "tagId");

-- CreateIndex
CREATE INDEX "WaContact_ownerId_idx" ON "WaContact"("ownerId");

-- CreateIndex
CREATE INDEX "WaContact_phone_idx" ON "WaContact"("phone");

-- CreateIndex
CREATE INDEX "WaContact_instanceId_idx" ON "WaContact"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "WaContact_ownerId_phone_key" ON "WaContact"("ownerId", "phone");

-- CreateIndex
CREATE INDEX "WaScheduledContact_ownerId_status_idx" ON "WaScheduledContact"("ownerId", "status");

-- CreateIndex
CREATE INDEX "WaScheduledContact_scheduledAt_idx" ON "WaScheduledContact"("scheduledAt");

-- CreateIndex
CREATE INDEX "WaScheduledContact_contactId_idx" ON "WaScheduledContact"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalPage_slug_key" ON "InstitutionalPage"("slug");

-- CreateIndex
CREATE INDEX "InstitutionalPage_slug_idx" ON "InstitutionalPage"("slug");

-- CreateIndex
CREATE INDEX "InstitutionalPage_active_idx" ON "InstitutionalPage"("active");

-- CreateIndex
CREATE INDEX "AiAgentConfig_ownerId_active_idx" ON "AiAgentConfig"("ownerId", "active");

-- CreateIndex
CREATE INDEX "AiSession_phone_instanceId_status_idx" ON "AiSession"("phone", "instanceId", "status");

-- CreateIndex
CREATE INDEX "AiSession_status_idx" ON "AiSession"("status");

-- CreateIndex
CREATE INDEX "AiSession_department_idx" ON "AiSession"("department");

-- CreateIndex
CREATE INDEX "AiSession_assignedTo_idx" ON "AiSession"("assignedTo");

-- CreateIndex
CREATE INDEX "AiSession_ownerId_idx" ON "AiSession"("ownerId");

-- CreateIndex
CREATE INDEX "AiSessionMessage_sessionId_timestamp_idx" ON "AiSessionMessage"("sessionId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "AiSessionMessage_externalMsgId_idx" ON "AiSessionMessage"("externalMsgId");

-- CreateIndex
CREATE UNIQUE INDEX "WizardSession_previewToken_key" ON "WizardSession"("previewToken");

-- CreateIndex
CREATE INDEX "WizardSession_userId_idx" ON "WizardSession"("userId");

-- CreateIndex
CREATE INDEX "WizardSession_state_idx" ON "WizardSession"("state");

-- CreateIndex
CREATE INDEX "WizardMessage_sessionId_createdAt_idx" ON "WizardMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "BlogAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogCategoryAuthor" ADD CONSTRAINT "BlogCategoryAuthor_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "BlogAuthor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogCategoryAuthor" ADD CONSTRAINT "BlogCategoryAuthor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogCategoryTag" ADD CONSTRAINT "BlogCategoryTag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogCategoryTag" ADD CONSTRAINT "BlogCategoryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogAuthorTag" ADD CONSTRAINT "BlogAuthorTag_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "BlogAuthor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogAuthorTag" ADD CONSTRAINT "BlogAuthorTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogAuthor" ADD CONSTRAINT "BlogAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogImage" ADD CONSTRAINT "BlogImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPublication" ADD CONSTRAINT "SocialPublication_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialMediaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPublication" ADD CONSTRAINT "SocialPublication_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectedArticle" ADD CONSTRAINT "CollectedArticle_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "MonitoredSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chronicle" ADD CONSTRAINT "Chronicle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "CollectedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chronicle" ADD CONSTRAINT "Chronicle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "BlogAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chronicle" ADD CONSTRAINT "Chronicle_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chronicle" ADD CONSTRAINT "Chronicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPage" ADD CONSTRAINT "DynamicPage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DynamicPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "NavigationMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavigationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVersion" ADD CONSTRAINT "PostVersion_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "SocialPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareProduct" ADD CONSTRAINT "SoftwareProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SoftwareCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionInstance" ADD CONSTRAINT "EvolutionInstance_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "EvolutionServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionInstance" ADD CONSTRAINT "EvolutionInstance_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaConversation" ADD CONSTRAINT "WaConversation_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "EvolutionInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaTag" ADD CONSTRAINT "WaTag_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaConversationTag" ADD CONSTRAINT "WaConversationTag_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaConversationTag" ADD CONSTRAINT "WaConversationTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "WaTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaContact" ADD CONSTRAINT "WaContact_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "EvolutionInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaContact" ADD CONSTRAINT "WaContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaScheduledContact" ADD CONSTRAINT "WaScheduledContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "WaContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaScheduledContact" ADD CONSTRAINT "WaScheduledContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentConfig" ADD CONSTRAINT "AiAgentConfig_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "EvolutionInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_agentConfigId_fkey" FOREIGN KEY ("agentConfigId") REFERENCES "AiAgentConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WaConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSessionMessage" ADD CONSTRAINT "AiSessionMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WizardSession" ADD CONSTRAINT "WizardSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WizardMessage" ADD CONSTRAINT "WizardMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WizardSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
