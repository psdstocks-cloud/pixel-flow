const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface StockSite {
  id: string;
  name: string;
  active: boolean;
  price: number;
  updatedAt: string;
}

export interface Order {
  id: string;
  taskId: string;
  site: string;
  stockId: string;
  stockUrl: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'DOWNLOADING' | 'COMPLETED' | 'ERROR' | 'TIMEOUT';
  cost: number;
  stockTitle?: string;
  stockImage?: string;
  stockAuthor?: string;
  stockFormat?: string;
  downloadLink?: string;
  fileName?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
}

export interface Batch {
  id: string;
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  totalCost: number;
  status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  orders: Order[];
  stats: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
  };
}

class APIClient {
  private userId: string;

  constructor(userId = 'cmh2r96870000lyp4k4dist2s') {
    this.userId = userId;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = API_BASE_URL + endpoint;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  async getStockSites(): Promise<{ sites: StockSite[] }> {
    return this.request('/stock-sites');
  }

  async createBatchOrder(
    urls: string[],
    responseType = 'any'
  ): Promise<{
    batchId: string;
    orders: Order[];
    totalCost: number;
    remainingBalance: number;
    failedUrls?: string[];
  }> {
    return this.request('/orders/batch', {
      method: 'POST',
      body: JSON.stringify({ urls, responseType }),
    });
  }

  async pollOrder(taskId: string): Promise<{ order: Order; status: string }> {
    return this.request('/orders/' + taskId + '/poll', {
      method: 'POST',
    });
  }

  async getBatchStatus(batchId: string): Promise<{ batch: Batch }> {
    return this.request('/batches/' + batchId);
  }

  async getOrders(page = 1, limit = 20) {
    return this.request('/orders?page=' + page + '&limit=' + limit);
  }
}

export const apiClient = new APIClient();
import { createClient } from '@/lib/supabase/client'

export async function fetchProtectedData() {
  const supabase = createClient()
  
  // Get current session token
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Call your Express.js backend with token
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }

  return response.json()
}
