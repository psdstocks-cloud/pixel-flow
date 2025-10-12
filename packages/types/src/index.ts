// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// User Types
export interface User {
  id: string
  email: string
  name?: string
  role: 'FREE' | 'PREMIUM' | 'ADMIN'
  credits: number
  storageUsedBytes: number
  storageLimit: number
  image?: string
  emailVerified?: string
  createdAt: string
  updatedAt: string
}

// Stock Types
export interface StockInfo {
  image: string
  title: string
  id: string
  source: string
  cost: number
  ext: string
  name: string
  author: string
  sizeInBytes: string
}

export interface StockSearchParams {
  query: string
  site: string
  page?: number
  limit?: number
}

// AI Generation Types
export interface AIGenerationRequest {
  prompt: string
}

export interface AIGenerationResponse {
  job_id: string
  get_result_url: string
}

export interface AIGenerationResult {
  __id: string
  prompt: string
  type: 'imagine' | 'vary' | 'upscale'
  cost: number
  error_message?: string
  parent_nh_job_id?: string
  status: 'completed' | 'processing' | 'failed'
  percentage_complete: number
  strong?: string
  index?: number
  created_at: number
  updated_at: number
  updated_at_human: string
  files: Array<{
    index: number
    thumb_sm: string
    thumb_lg: string
    download: string
  }>
}

export interface AIActionRequest {
  job_id: string
  action: 'vary' | 'upscale'
  index: number
  vary_type?: 'subtle' | 'strong'
}

// File Types
export interface File {
  id: string
  userId: string
  type: 'STOCK_DOWNLOAD' | 'AI_GENERATION' | 'BACKGROUND_REMOVED' | 'UPLOADED'
  filename: string
  originalName?: string
  mimeType: string
  sizeBytes: number
  storageKey: string
  thumbnailKey?: string
  width?: number
  height?: number
  format?: string
  folderId?: string
  isPublic: boolean
  downloadCount: number
  lastDownloadAt?: string
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  userId: string
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
  sortOrder: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    files: number
  }
  children?: Folder[]
}

// Order Types
export interface Order {
  id: string
  userId: string
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'POLLING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  type: 'STOCK_DOWNLOAD' | 'AI_GENERATION' | 'BACKGROUND_REMOVED' | 'UPLOADED'
  creditsCost: number
  stockSite?: string
  stockId?: string
  stockUrl?: string
  stockTitle?: string
  stockAuthor?: string
  prompt?: string
  aiJobId?: string
  aiParentJobId?: string
  aiAction?: string
  aiVaryType?: string
  aiIndex?: number
  originalFileId?: string
  nehtwTaskId?: string
  errorMessage?: string
  retryCount: number
  maxRetries: number
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  files?: File[]
}

// Transaction Types
export interface Transaction {
  id: string
  userId: string
  type: 'PURCHASE' | 'SPEND' | 'REFUND' | 'ADMIN_ADJUSTMENT' | 'REFERRAL_BONUS' | 'WELCOME_BONUS' | 'PROMO_BONUS'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  stripePaymentId?: string
  stripePriceId?: string
  stripeCustomerId?: string
  paymentMethod?: string
  orderId?: string
  createdAt: string
}

// Credit Package Types
export interface CreditPackage {
  id: string
  credits: number
  priceUSD: number
  stripePriceId: string
  displayName: string
  description?: string
  isPopular: boolean
  discountPercent: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Saved Prompt Types
export interface SavedPrompt {
  id: string
  userId: string
  name: string
  prompt: string
  category?: string
  useCount: number
  lastUsedAt?: string
  isFavorite: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Prompt Template Types
export interface PromptTemplate {
  name: string
  prompt: string
  example: string
}

export interface PromptTemplateCategory {
  category: string
  templates: PromptTemplate[]
}

// Background Removal Types
export interface BackgroundRemovalRequest {
  file: File
}

export interface BackgroundRemovalResponse {
  orderId: string
  originalFileId: string
  processedFileId: string
  processedUrl: string
}

// Cart Types
export interface CartItem {
  id: string
  site: string
  stockId: string
  title: string
  image: string
  cost: number
}

// Pagination Types
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error Types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class NehtwAPIError extends AppError {
  constructor(message: string, public nehtwResponse?: any) {
    super(500, `Nehtw API Error: ${message}`)
  }
}
