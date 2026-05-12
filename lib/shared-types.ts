export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  expires: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  secondaryImage?: string;
  categoryId?: string;
  authorId?: string;
  status: PostStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PostStatus = 
  | 'BRIEFING'
  | 'GENERATING'
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Partner {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageView {
  id: string;
  sessionId: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  createdAt: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  changes?: Record<string, any>;
  details?: string;
  createdAt: Date;
}

export interface SEOMetaTags {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  canonical?: string;
}

export interface SiteConfig {
  id: string;
  siteName: string;
  siteDescription: string;
  phone?: string;
  email?: string;
  whatsappLink?: string;
  address?: string;
  mapEmbed?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIUsageLog {
  id: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  endpoint: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}

export interface SocialMediaAccount {
  id: string;
  platform: 'LINKEDIN' | 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER';
  accountName: string;
  accessToken: string;
  isConnected: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPublication {
  id: string;
  platform: string;
  postId?: string;
  url?: string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
