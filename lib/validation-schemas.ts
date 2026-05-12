import { z } from 'zod';

// Helper function to convert empty strings to null
const emptyStringToNull = (val: any) => {
  if (typeof val === 'string' && val.trim() === '') return null;
  return val;
};

// CUID validation (Prisma default ID format: e.g. cmkh9ioau000ethsw6y1419d9)
const cuidSchema = (errorMsg?: string) => z.string().min(1, errorMsg || 'ID inválido');

// ============================================
// BLOG POST & BRIEFING VALIDATION
// ============================================

// Schema para criar uma nova PAUTA (BRIEFING)
export const createBriefingSchema = z.object({
  briefTitle: z.string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título não pode exceder 200 caracteres'),
  briefPersona: z.string().optional(),
  briefCta: z.string().optional(),
  briefKeywords: z.array(z.string()).optional(),
  briefNotes: z.string().optional(),
  categoryId: z.preprocess(emptyStringToNull, cuidSchema('ID de categoria inválido').optional().nullable()),
  authorId: z.preprocess(emptyStringToNull, cuidSchema('ID de autor inválido').optional().nullable()),
  scheduledAt: z.string().datetime().optional().nullable(),
  
  // Campos de SEO Local
  serviceType: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  attendanceType: z.string().optional().nullable(),
  pageObjective: z.string().optional().nullable(),
  mainKeyword: z.string().optional().nullable(),
  secondaryKeywords: z.array(z.string()).optional(),
  geoCountry: z.string().optional().nullable(),
  geoState: z.string().optional().nullable(),
  geoCity: z.string().optional().nullable(),
  geoNeighborhood: z.string().optional().nullable(),
  seoLevel: z.string().optional().nullable(),
  seoLevelJustification: z.string().optional().nullable(),
  seoRecommendedUrl: z.string().optional().nullable(),
});

// Schema para blog post completo (após geração)
export const createBlogPostSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório').max(200),
  slug: z.string().optional(),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  excerpt: z.string().max(500).optional(),
  categoryId: z.preprocess(emptyStringToNull, cuidSchema().optional()),
  authorId: z.preprocess(emptyStringToNull, cuidSchema().optional()),
  featuredImage: z.string().url('URL de imagem inválida').optional(),
  secondaryImage: z.string().url('URL de imagem inválida').optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  keywords: z.string().optional(),
  status: z.enum(['BRIEFING', 'GENERATING', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

// Blog Category Validation
export const createBlogCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  active: z.boolean().optional(),
});

export const updateBlogCategorySchema = createBlogCategorySchema.partial();

// Partner Validation
export const createPartnerSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres'),
  logoUrl: z.string().url('URL de logo inválida').optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  website: z.string().url('URL de website inválida').optional().nullable(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  showOnHome: z.boolean().optional(),
});

export const updatePartnerSchema = createPartnerSchema.partial();

// Analytics Validation
export const trackPageViewSchema = z.object({
  path: z.string(),
  referrer: z.string().optional(),
  duration: z.number().optional(),
  viewport: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
});

// CTA Template Validation
export const createCtaTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  text: z.string().min(1).max(500),
  whatsappMessage: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  active: z.boolean().optional(),
});

export const updateCtaTemplateSchema = createCtaTemplateSchema.partial();

// Voice Template Validation
export const createVoiceTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  toneDescription: z.string().optional(),
  instructions: z.string().optional(),
  active: z.boolean().optional(),
});

export const updateVoiceTemplateSchema = createVoiceTemplateSchema.partial();

// ============================================
// CONTACT & FORMS VALIDATION
// ============================================

export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres'),
  email: z.string()
    .email('Email inválido'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(20, 'Telefone não pode exceder 20 dígitos'),
  message: z.string()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(5000, 'Mensagem não pode exceder 5000 caracteres'),
  subject: z.string().optional(),
  company: z.string().optional(),
});

// ============================================
// QUERY PARAMETERS VALIDATION
// ============================================

export const postsQuerySchema = z.object({
  status: z.enum(['BRIEFING', 'GENERATING', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.preprocess(emptyStringToNull, cuidSchema().optional()),
  authorId: z.preprocess(emptyStringToNull, cuidSchema().optional()),
  search: z.string().max(200).optional(),
  deleted: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const newsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(18),
  category: z.string().optional(),
});

// ============================================
// IMAGE GENERATION VALIDATION
// ============================================

export const generateImageSchema = z.object({
  title: z.string().optional(),
  excerpt: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  keywords_text: z.string().optional(),
  imageType: z.enum(['featured', 'secondary']).optional(),
  useAI: z.boolean().optional(),
  selectedImage: z.string().url().optional(),
});

// ============================================
// SOCIAL MEDIA PUBLISHING VALIDATION
// ============================================

export const socialPublishSchema = z.object({
  blogPostId: cuidSchema('ID de post inválido'),
  customText: z.string()
    .max(5000, 'Texto customizado não pode exceder 5000 caracteres')
    .optional(),
  scheduleTime: z.string()
    .datetime()
    .optional()
    .nullable(),
  autoPublish: z.boolean().optional(),
});

// ============================================
// TAGS VALIDATION
// ============================================

export const createTagSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().optional(),
  description: z.string().optional(),
});

export const updateTagSchema = createTagSchema.partial();

// ============================================
// AUTHORS VALIDATION
// ============================================

export const createAuthorSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  active: z.boolean().optional(),
});

export const updateAuthorSchema = createAuthorSchema.partial();

// ============================================
// SITE CONFIG VALIDATION
// ============================================

export const updateSiteConfigSchema = z.object({
  siteName: z.string().min(2).max(100).optional(),
  siteDescription: z.string().optional(),
  phone: z.string().optional(),
  whatsappLink: z.string().url().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  twitterHandle: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
});

// ============================================
// AI ENDPOINTS VALIDATION
// ============================================

export const generateAITextSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt deve ter pelo menos 10 caracteres')
    .max(2000, 'Prompt não pode exceder 2000 caracteres'),
  context: z.string().max(500).optional(),
  currentValue: z.string().max(5000).optional(),
});

export const generateAIImageSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt deve ter pelo menos 10 caracteres')
    .max(2000, 'Prompt não pode exceder 2000 caracteres'),
  style: z.string().max(200).optional(),
  provider: z.enum(['leonardo', 'openai']).optional(),
});

export const suggestLocationsSchema = z.object({
  baseTitle: z.string().max(200).optional(),
  serviceType: z.string()
    .min(2, 'Tipo de serviço deve ter pelo menos 2 caracteres')
    .max(100, 'Tipo de serviço não pode exceder 100 caracteres'),
  attendanceType: z.enum(['REMOTE', 'LOCAL', 'HYBRID']).optional(),
  pageObjective: z.enum(['CONVERSION', 'TRAFFIC', 'AUTHORITY']).optional(),
  brand: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

// ============================================
// CHRONICLE VALIDATION
// ============================================

export const createChronicleSchema = z.object({
  articleId: cuidSchema('ID de artigo inválido'),
  title: z.string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título não pode exceder 200 caracteres'),
  content: z.string()
    .min(20, 'Conteúdo deve ter pelo menos 20 caracteres'),
  featuredImage: z.string().url('URL de imagem inválida').optional().nullable(),
  sourceReference: z.string()
    .min(2, 'Referência de fonte é obrigatória')
    .max(200),
  status: z.enum(['draft', 'approved', 'published', 'rejected']).optional(),
  publishToSocial: z.boolean().optional(),
  socialPlatforms: z.array(z.string()).optional(),
  categoryId: cuidSchema().optional().nullable(),
  authorId: cuidSchema().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export const updateChronicleSchema = createChronicleSchema.partial();

export const chronicleFilterSchema = z.object({
  status: z.enum(['draft', 'approved', 'published', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// TYPE EXPORTS FOR USE IN COMPONENTS
// ============================================

export type CreateBriefing = z.infer<typeof createBriefingSchema>;
export type CreateBlogPost = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;
export type CreateBlogCategory = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategory = z.infer<typeof updateBlogCategorySchema>;
export type CreatePartner = z.infer<typeof createPartnerSchema>;
export type UpdatePartner = z.infer<typeof updatePartnerSchema>;
export type CreateTag = z.infer<typeof createTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;
export type CreateAuthor = z.infer<typeof createAuthorSchema>;
export type UpdateAuthor = z.infer<typeof updateAuthorSchema>;
export type UpdateSiteConfig = z.infer<typeof updateSiteConfigSchema>;
export type GenerateAIText = z.infer<typeof generateAITextSchema>;
export type GenerateAIImage = z.infer<typeof generateAIImageSchema>;
export type SuggestLocations = z.infer<typeof suggestLocationsSchema>;
export type CreateChronicle = z.infer<typeof createChronicleSchema>;
export type UpdateChronicle = z.infer<typeof updateChronicleSchema>;
export type ChronicleFilter = z.infer<typeof chronicleFilterSchema>;
export type TrackPageView = z.infer<typeof trackPageViewSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
export type PostsQuery = z.infer<typeof postsQuerySchema>;
export type NewsQuery = z.infer<typeof newsQuerySchema>;
export type GenerateImage = z.infer<typeof generateImageSchema>;
export type SocialPublish = z.infer<typeof socialPublishSchema>;
