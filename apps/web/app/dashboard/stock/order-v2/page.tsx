'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';

interface StockInfo {
  image: string;
  title: string;
  id: string;
  source: string;
  cost: number;
  ext?: string;
  name?: string;
  author?: string;
  sizeInBytes?: string;
}

interface Order {
  id: string;
  task_id: string;
  status: 'preview' | 'pending' | 'processing' | 'ready' | 'failed';
  url: string;
  downloadUrl?: string;
  site: string;
  stockId: string;
  stockInfo?: StockInfo;
}

interface StockSite {
  active: boolean;
  price: number;
}

const NEHTW_API_KEY = 'A8K9bV5s2OX12E8cmS4I96mtmSNzv7';
const NEHTW_BASE_URL = 'https://nehtw.com/api';

export default function OrderV2Page() {
  const [urls, setUrls] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockSites, setStockSites] = useState<Record<string, StockSite>>({});
  const [userBalance, setUserBalance] = useState<number>(0);

  // Fetch stock sites pricing on mount
  useEffect(() => {
    fetchStockSites();
    fetchUserBalance();
  }, []);

  const fetchStockSites = async () => {
    try {
      const response = await fetch(`${NEHTW_BASE_URL}/stocksites`, {
        headers: { 'X-Api-Key': NEHTW_API_KEY },
      });
      const data = await response.json();
      setStockSites(data);
    } catch (error) {
      console.error('Failed to fetch stock sites:', error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch(`${NEHTW_BASE_URL}/me`, {
        headers: { 'X-Api-Key': NEHTW_API_KEY },
      });
      const data = await response.json();
      if (data.success) {
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  // Extract site and ID from URL
  const parseStockUrl = (url: string): { site: string; id: string } | null => {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname.includes('shutterstock.com')) {
        const id = url.split('-').pop() || '';
        return { site: 'shutterstock', id };
      }
      
      if (urlObj.hostname.includes('adobestock.com')) {
        const id = url.split('/').pop()?.split('?')[0] || '';
        return { site: 'adobestock', id };
      }
      
      return null;
    } catch {
      return null;
    }
  };

  // Get stock info (preview, cost, title)
  const getStockInfo = async (site: string, id: string): Promise<StockInfo | null> => {
    try {
      const response = await fetch(
        `${NEHTW_BASE_URL}/stockinfo/${site}/${id}`,
        {
          headers: { 'X-Api-Key': NEHTW_API_KEY },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get stock info:', error);
      return null;
    }
  };

  // Create preview order
  const createPreviewOrder = async (url: string): Promise<Order | null> => {
    const parsed = parseStockUrl(url);
    if (!parsed) {
      console.error('Invalid stock URL:', url);
      return null;
    }

    const stockInfo = await getStockInfo(parsed.site, parsed.id);
    if (!stockInfo) {
      return null;
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      task_id: '',
      status: 'preview',
      url,
      site: parsed.site,
      stockId: parsed.id,
      stockInfo,
    };
  };

  // Confirm and create actual order
  const confirmOrder = async (order: Order) => {
    try {
      const response = await fetch(
        `${NEHTW_BASE_URL}/stockorder/${order.site}/${order.stockId}`,
        {
          headers: { 'X-Api-Key': NEHTW_API_KEY },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setOrders(prev =>
          prev.map(o =>
            o.id === order.id
              ? { ...o, task_id: data.task_id, status: 'pending' }
              : o
          )
        );
        // Refresh balance
        fetchUserBalance();
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, status: 'failed' } : o))
      );
    }
  };

  // Handle URL submission
  const handleSubmit = async () => {
    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urlList.length === 0) return;

    setLoading(true);

    const newOrders: Order[] = [];
    for (const url of urlList) {
      const order = await createPreviewOrder(url);
      if (order) {
        newOrders.push(order);
      }
    }

    setOrders(prev => [...prev, ...newOrders]);
    setUrls('');
    setLoading(false);
  };

  // Check order status
  const checkOrderStatus = async (taskId: string): Promise<string> => {
    try {
      const response = await fetch(
        `${NEHTW_BASE_URL}/order/${taskId}/status?responsetype=any`,
        {
          headers: { 'X-Api-Key': NEHTW_API_KEY },
        }
      );

      const data = await response.json();
      return data.status || 'processing';
    } catch (error) {
      console.error('Failed to check status:', error);
      return 'failed';
    }
  };

  // Get download link
  const getDownloadLink = async (taskId: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `${NEHTW_BASE_URL}/v2/order/${taskId}/download?responsetype=any`,
        {
          headers: { 'X-Api-Key': NEHTW_API_KEY },
        }
      );

      const data = await response.json();
      
      if (data.success && data.status === 'ready') {
        return data.downloadLink || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get download link:', error);
      return null;
    }
  };

  // Poll order status
  useEffect(() => {
    const interval = setInterval(async () => {
      const activeOrders = orders.filter(
        o => o.status === 'pending' || o.status === 'processing'
      );
      
      for (const order of activeOrders) {
        if (!order.task_id) continue;

        const status = await checkOrderStatus(order.task_id);
        
        if (status === 'ready') {
          const downloadUrl = await getDownloadLink(order.task_id);
          setOrders(prev =>
            prev.map(o =>
              o.id === order.id
                ? { ...o, status: 'ready', downloadUrl: downloadUrl || undefined }
                : o
            )
          );
        } else if (status === 'error' || status === 'failed') {
          setOrders(prev =>
            prev.map(o => (o.id === order.id ? { ...o, status: 'failed' } : o))
          );
        } else if (status === 'processing') {
          setOrders(prev =>
            prev.map(o => (o.id === order.id ? { ...o, status: 'processing' } : o))
          );
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Stock Order (v2)</h1>
          <div className="text-white/90 text-lg font-semibold">
            Balance: <span className="text-green-400">{userBalance.toFixed(2)}</span> Credits
          </div>
        </div>

        {/* Supported Sites Pricing */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
          <h2 className="text-white/90 font-semibold mb-4 text-lg">Supported Stock Sites</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stockSites).map(([site, info]) => (
              <div
                key={site}
                className={`p-4 rounded-lg ${
                  info.active
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                <div className="text-white/90 font-medium capitalize">{site}</div>
                <div className="text-white/70 text-sm mt-1">
                  {info.active ? `${info.price} credits` : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* URL Input */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
          <label className="block text-white/90 font-semibold mb-3">
            Paste Stock URLs (one per line)
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://www.shutterstock.com/image-vector/heart-logo-love-medical-romance-charity-2365327491"
            className="w-full h-32 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !urls.trim()}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Loading Preview...' : 'Get Preview'}
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6"
            >
              {/* Preview Mode */}
              {order.status === 'preview' && order.stockInfo && (
                <div className="flex gap-6">
                  {/* Image Preview */}
                  <img
                    src={order.stockInfo.image}
                    alt={order.stockInfo.title}
                    className="w-48 h-48 object-cover rounded-lg border border-white/20"
                  />
                  
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {order.stockInfo.title}
                    </h3>
                    <div className="space-y-2 text-white/70 text-sm">
                      <p>
                        <span className="text-white/50">Source:</span>{' '}
                        <span className="capitalize">{order.stockInfo.source}</span>
                      </p>
                      <p>
                        <span className="text-white/50">ID:</span> {order.stockInfo.id}
                      </p>
                      {order.stockInfo.author && (
                        <p>
                          <span className="text-white/50">Author:</span> {order.stockInfo.author}
                        </p>
                      )}
                      {order.stockInfo.sizeInBytes && (
                        <p>
                          <span className="text-white/50">Size:</span>{' '}
                          {(parseInt(order.stockInfo.sizeInBytes) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      <p className="text-lg font-semibold text-yellow-300">
                        Cost: {order.stockInfo.cost} Credits
                      </p>
                    </div>
                    
                    {/* Confirm Button */}
                    <button
                      onClick={() => confirmOrder(order)}
                      disabled={userBalance < order.stockInfo.cost}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {userBalance < order.stockInfo.cost
                        ? 'Insufficient Credits'
                        : 'Confirm Order'}
                    </button>
                  </div>
                </div>
              )}

              {/* Processing/Completed Mode */}
              {order.status !== 'preview' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-white/60 text-sm mb-1">
                        {order.site} - {order.stockId}
                      </p>
                      {order.stockInfo && (
                        <p className="text-white/90 font-medium">{order.stockInfo.title}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      {order.status === 'pending' && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
                          Pending
                        </span>
                      )}
                      {order.status === 'processing' && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing
                        </span>
                      )}
                      {order.status === 'ready' && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                          Ready
                        </span>
                      )}
                      {order.status === 'failed' && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {order.downloadUrl && (
                    <a
                      href={order.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all"
                    >
                      📥 Download File
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/40 text-lg">
              No orders yet. Paste URLs above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
