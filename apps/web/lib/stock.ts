import { detectSiteAndIdFromUrl } from './detection';

export type ResponseType = 'any' | 'gdrive' | 'asia' | 'mydrivelink';

export type StockSite = {
  site: string;
  displayName?: string;
  price?: number;
  minPrice?: number;
  currency?: string;
  active?: boolean;
};

export type StockInfoRequest = {
  site?: string;
  id?: string;
  url?: string;
  responsetype?: ResponseType;
};

export type StockInfo = {
  site?: string;
  assetId?: string;
  title?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  costPoints?: number | null;
  costAmount?: number | null;
  costCurrency?: string | null;
  sourceUrl?: string | null;
  raw?: Record<string, unknown>;
};

export type BalanceSummary = {
  userId: string;
  points: number;
  updatedAt?: string;
};

export type StockOrderTask = {
  taskId: string;
  externalTaskId?: string;
  status: string;
  title?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  costPoints?: number;
  costAmount?: number;
  costCurrency?: string;
  latestMessage?: string;
  downloadUrl?: string;
  site?: string;
  assetId?: string;
  responsetype?: ResponseType;
  batchId?: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type MultiLinkItem = {
  url?: string;
  site?: string;
  id?: string;
};

export type PreviewOrderPayload = {
  userId: string;
  items: MultiLinkItem[];
  responsetype?: ResponseType;
};

export type PreviewOrderResult = {
  task?: StockOrderTask;
  error?: string;
};

export type PreviewOrderResponse = {
  balance: BalanceSummary;
  results: PreviewOrderResult[];
};

export type CommitOrderPayload = {
  userId: string;
  taskIds: string[];
  responsetype?: ResponseType;
};

export type CommitOrderResponse = {
  balance: BalanceSummary;
  tasks: StockOrderTask[];
  failures: Array<{ taskId: string; error: string }>;
  pointsDebited: number;
  pointsRefunded: number;
};

export type CreateOrderPayload = {
  userId?: string;
  site?: string;
  id?: string;
  url?: string;
  responsetype?: ResponseType;
  notificationChannel?: string;
};

export type UpstreamOrderResponse = {
  success?: boolean;
  taskId?: string;
  status?: string;
  message?: string;
  queuedAt?: string;
  downloadUrl?: string;
  actions?: unknown;
  raw?: Record<string, unknown>;
};

export type CreateOrderResponse = {
  task: StockOrderTask;
  balance: BalanceSummary;
  upstream: UpstreamOrderResponse;
};

export type OrderStatusResponse = {
  status: {
    success: boolean;
    status?: string;
    message?: string;
    progress?: number | null;
    download_url?: string;
    details?: Record<string, unknown>;
  };
};

export type ConfirmOrderResponse = {
  confirmation: {
    success: boolean;
    message?: string;
    download_url?: string;
  };
};

export type DownloadOrderResponse = {
  download: {
    success: boolean;
    downloadUrl?: string;
    fileName?: string;
    raw: Record<string, unknown>;
  };
};

export type DownloadHistoryResponse = {
  downloads: StockOrderTask[];
};

export type RedownloadResponse = {
  download: {
    taskId: string;
    downloadUrl?: string;
    fileName?: string;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_NEHTW_API_KEY;

function withUserId(userId?: string): Record<string, string> | undefined {
  return userId ? { 'X-User-Id': userId } : undefined;
}

function jsonHeaders(userId?: string) {
  return {
    'Content-Type': 'application/json',
    ...(withUserId(userId) ?? {}),
  } as Record<string, string>;
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (API_KEY) {
    headers.set('X-Api-Key', API_KEY);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

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

  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  throw new Error('Unexpected non-JSON response from API');
}

function withQuery(endpoint: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `${endpoint}?${query}` : endpoint;
}

export const queries = {
  sites: ['stock', 'sites'],
  orderStatus: (taskId: string) => ['stock', 'order', 'status', taskId],
  balance: (userId: string) => ['stock', 'balance', userId],
  tasks: (userId: string, limit?: number) => ['stock', 'tasks', userId, limit ?? 'default'],
  downloadsHistory: (userId: string, limit?: number, status?: string | null) => [
    'stock',
    'downloads',
    'history',
    userId,
    limit ?? 'default',
    status ?? 'all',
  ],
};

export async function fetchSites(signal?: AbortSignal): Promise<StockSite[]> {
  const data = await apiFetch<{ sites: StockSite[] }>('/stock/sites', { signal });
  return data.sites;
}

export async function fetchStockInfo(request: StockInfoRequest, signal?: AbortSignal): Promise<StockInfo> {
  const endpoint = withQuery('/stock/info', {
    site: request.site,
    id: request.id,
    url: request.url,
    responsetype: request.responsetype,
  });
  const data = await apiFetch<{ info: StockInfo }>(endpoint, { signal });
  return data.info;
}

export async function fetchBalance(userId: string, signal?: AbortSignal): Promise<BalanceSummary> {
  return apiFetch<BalanceSummary>(`/stock/balance/${encodeURIComponent(userId)}`, {
    signal,
    headers: withUserId(userId),
  });
}

export async function adjustBalance(userId: string, deltaPoints: number): Promise<BalanceSummary> {
  return apiFetch<BalanceSummary>(`/stock/balance/${encodeURIComponent(userId)}/adjust`, {
    method: 'POST',
    headers: jsonHeaders(userId),
    body: JSON.stringify({ deltaPoints }),
  });
}

export async function fetchTasks(userId: string, limit?: number, signal?: AbortSignal): Promise<StockOrderTask[]> {
  const endpoint = withQuery('/stock/tasks', {
    userId,
    limit,
  });
  const data = await apiFetch<{ tasks: StockOrderTask[] }>(endpoint, {
    signal,
    headers: withUserId(userId),
  });
  return data.tasks;
}

export async function fetchDownloadHistory(
  userId: string,
  limit?: number,
  status?: string,
  signal?: AbortSignal,
): Promise<DownloadHistoryResponse> {
  const endpoint = withQuery('/stock/downloads/history', {
    userId,
    limit,
    status,
  });
  return apiFetch<DownloadHistoryResponse>(endpoint, {
    signal,
    headers: withUserId(userId),
  });
}

export async function requestRedownload(
  taskId: string,
  userId: string,
  responsetype?: ResponseType,
): Promise<RedownloadResponse> {
  const endpoint = withQuery(`/stock/downloads/${encodeURIComponent(taskId)}`, {
    responsetype,
  });
  return apiFetch<RedownloadResponse>(endpoint, {
    headers: withUserId(userId),
  });
}

export async function previewOrder(payload: PreviewOrderPayload): Promise<PreviewOrderResponse> {
  return apiFetch<PreviewOrderResponse>('/stock/order/preview', {
    method: 'POST',
    headers: jsonHeaders(payload.userId),
    body: JSON.stringify(payload),
  });
}

export async function commitOrder(payload: CommitOrderPayload): Promise<CommitOrderResponse> {
  return apiFetch<CommitOrderResponse>('/stock/order/commit', {
    method: 'POST',
    headers: jsonHeaders(payload.userId),
    body: JSON.stringify(payload),
  });
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>('/stock/order', {
    method: 'POST',
    headers: jsonHeaders(payload.userId),
    body: JSON.stringify(payload),
  });
}

export async function getOrderStatus(
  taskId: string,
  responsetype?: ResponseType,
  signal?: AbortSignal,
): Promise<OrderStatusResponse> {
  const endpoint = withQuery(`/stock/order/${encodeURIComponent(taskId)}/status`, {
    responsetype,
  });
  return apiFetch<OrderStatusResponse>(endpoint, { signal });
}

export async function confirmOrder(taskId: string, responsetype?: ResponseType): Promise<ConfirmOrderResponse> {
  return apiFetch<ConfirmOrderResponse>(`/stock/order/${encodeURIComponent(taskId)}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responsetype }),
  });
}

export async function fetchDownload(taskId: string, responsetype?: ResponseType): Promise<DownloadOrderResponse> {
  const endpoint = withQuery(`/stock/order/${encodeURIComponent(taskId)}/download`, {
    responsetype,
  });
  return apiFetch<DownloadOrderResponse>(endpoint);
}

export { detectSiteAndIdFromUrl };

export function buildDownloadUrl(taskId: string, responsetype: ResponseType = 'any') {
  const params = new URLSearchParams();
  if (responsetype) params.set('responsetype', responsetype);
  params.set('redirect', 'true');
  return `${API_BASE}/api/stock/order/${encodeURIComponent(taskId)}/download?${params.toString()}`;
}

