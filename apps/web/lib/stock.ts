import { detectSiteAndIdFromUrl } from './detection';

export type StockSite = {
  site: string;
  displayName?: string;
  price?: number;
  minPrice?: number;
  currency?: string;
  active?: boolean;
};

export type StockOrderPayload = {
  site?: string;
  id?: string;
  url?: string;
  responsetype?: 'any' | 'gdrive' | 'asia' | 'mydrivelink';
  notificationChannel?: string;
};

export type StockOrderResponse = {
  success: boolean;
  taskId?: string;
  status?: string;
  message?: string;
  queuedAt?: string;
};

export type StockStatusResponse = {
  status: string;
  progress?: number;
  message?: string;
  downloadUrl?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_NEHTW_API_KEY;

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}/api${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (API_KEY) {
    headers.set('X-Api-Key', API_KEY);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody.message === 'string') {
        errorMessage = errorBody.message;
      }
    } catch {
      // Ignore if response is not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const queries = {
  sites: ['stock', 'sites'],
  orderStatus: (taskId: string) => ['stock', 'order', 'status', taskId],
};

export async function fetchSites(signal?: AbortSignal): Promise<StockSite[]> {
  const data = await apiFetch<{ sites: StockSite[] }>('/stock/sites', { signal });
  return data.sites;
}

export async function createOrder(
  payload: StockOrderPayload,
): Promise<StockOrderResponse> {
  return apiFetch<StockOrderResponse>('/stock/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getOrderStatus(
  taskId: string,
  _?: unknown, // Placeholder for potential future params
  signal?: AbortSignal,
): Promise<StockStatusResponse> {
  return apiFetch<StockStatusResponse>(`/stock/order/${taskId}/status`, {
    signal,
  });
}

export { detectSiteAndIdFromUrl };

export function buildDownloadUrl(taskId: string, responsetype: NonNullable<StockOrderPayload['responsetype']> = 'any') {
  const params = new URLSearchParams()
  if (responsetype) params.set('responsetype', responsetype)
  params.set('redirect', 'true')
  return `${API_BASE}/api/stock/order/${encodeURIComponent(taskId)}/download?${params.toString()}`
}

