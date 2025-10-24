'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';

interface Order {
  id: string;
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url: string;
  downloadUrl?: string;
  site: string;
  stockId: string;
}

const NEHTW_API_KEY = 'A8K9bV5s2OX12E8cmS4I96mtmSNzv7';
const NEHTW_BASE_URL = 'https://nehtw.com/api';

export default function OrderV2Page() {
  const [urls, setUrls] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract site and ID from URL
  const parseStockUrl = (url: string): { site: string; id: string } | null => {
    try {
      const urlObj = new URL(url);
      
      // Shutterstock: https://www.shutterstock.com/image-vector/heart-logo-2365327491
      if (urlObj.hostname.includes('shutterstock.com')) {
        const id = url.split('-').pop() || '';
        return { site: 'shutterstock', id };
      }
      
      // Add more stock sites as needed
      return null;
    } catch {
      return null;
    }
  };

  // Create order with nehtw API
  const createOrder = async (url: string): Promise<Order | null> => {
    const parsed = parseStockUrl(url);
    if (!parsed) {
      console.error('Invalid stock URL:', url);
      return null;
    }

    try {
      const response = await fetch(
        `${NEHTW_BASE_URL}/stockorder/${parsed.site}/${parsed.id}`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': NEHTW_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: `${Date.now()}-${Math.random()}`,
        task_id: data.task_id,
        status: 'pending',
        url,
        site: parsed.site,
        stockId: parsed.id,
      };
    } catch (error) {
      console.error('Failed to create order:', error);
      return null;
    }
  };

  // Check order status
  const checkOrderStatus = async (taskId: string): Promise<string> => {
    try {
      const response = await fetch(
        `${NEHTW_BASE_URL}/order/${taskId}/status`,
        {
          headers: {
            'X-Api-Key': NEHTW_API_KEY,
          },
        }
      );

      const data = await response.json();
      return data.status || 'pending';
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
          headers: {
            'X-Api-Key': NEHTW_API_KEY,
          },
        }
      );

      const data = await response.json();
      return data.download_url || data.url || null;
    } catch (error) {
      console.error('Failed to get download link:', error);
      return null;
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
      const order = await createOrder(url);
      if (order) {
        newOrders.push(order);
      }
    }

    setOrders(prev => [...prev, ...newOrders]);
    setUrls('');
    setLoading(false);
  };

  // Poll order status
  useEffect(() => {
    const interval = setInterval(async () => {
      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
      
      for (const order of pendingOrders) {
        const status = await checkOrderStatus(order.task_id);
        
        if (status === 'completed') {
          const downloadUrl = await getDownloadLink(order.task_id);
          setOrders(prev =>
            prev.map(o =>
              o.id === order.id
                ? { ...o, status: 'completed', downloadUrl: downloadUrl || undefined }
                : o
            )
          );
        } else if (status === 'failed') {
          setOrders(prev =>
            prev.map(o => (o.id === order.id ? { ...o, status: 'failed' } : o))
          );
        } else {
          setOrders(prev =>
            prev.map(o => (o.id === order.id ? { ...o, status: 'processing' } : o))
          );
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Stock Order (v2)</h1>

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
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Process URLs'}
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-white/60 text-sm mb-1">
                    {order.site} - {order.stockId}
                  </p>
                  <p className="text-white/90 text-sm truncate">{order.url}</p>
                </div>
                <div className="ml-4">
                  {order.status === 'pending' && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
                      Pending
                    </span>
                  )}
                  {order.status === 'processing' && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      Processing
                    </span>
                  )}
                  {order.status === 'completed' && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                      Completed
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
                  className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg"
                >
                  Download File
                </a>
              )}
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/40 text-lg">No orders yet. Paste URLs above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
