// NEHTW API Response Types
export interface NEHTWApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string; // ✅ ADD THIS LINE
}

// Stock Site Information
export interface StockSite {
  id: string;
  name: string;
  domain: string;
  cost: number;
  status: 'active' | 'inactive';
  capabilities: string[];
}

// Stock Information Response
export interface StockInfo {
  site: string;
  stock_id: string;
  title?: string;
  preview_url?: string;
  cost: number;
  available: boolean;
  metadata?: Record<string, any>;
}

// Order Response
export interface OrderResponse {
  success: boolean;
  task_id: string;
  site: string;
  stock_id: string;
  cost: number;
  status: OrderStatus;
  message?: string;
}

// Order Status Types
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
  COMPLETED = 'completed',
}

// Order Status Response
export interface OrderStatusResponse {
  success: boolean;
  task_id: string;
  status: OrderStatus;
  progress?: number;
  message?: string;
  error?: string;
}

// Download Response
export interface DownloadResponse {
  success: boolean;
  task_id: string;
  download_url?: string;
  gdrive_url?: string;
  expires_at?: string;
  error?: string;
}

// Account Balance Response
export interface AccountBalance {
  success: boolean;
  balance: number;
  currency: string;
  email?: string;
}

// AI Generation Request
export interface AIGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  model?: string;
  size?: string;
}

// AI Generation Response
export interface AIGenerationResponse {
  success: boolean;
  task_id: string;
  status: string;
  images?: string[];
  cost: number;
}

// Error Response
export interface NEHTWError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
