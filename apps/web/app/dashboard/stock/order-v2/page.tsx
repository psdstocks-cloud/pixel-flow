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
  name: string;
  url: string;
}

const NEHTW_API_KEY = 'A8K9bV5s2OX12E8cmS4I96mtmSNzv7';
const NEHTW_BASE_URL = 'https://nehtw.com/api';
const CREDITS_PER_DOWNLOAD = 2; // Fixed price for all downloads

// Supported stock sites with their URLs
const STOCK_SITES: Record<string, StockSite> = {
  shutterstock: { active: true, name: 'Shutterstock', url: 'https://www.shutterstock.com' },
  adobestock: { active: true, name: 'Adobe Stock', url: 'https://stock.adobe.com' },
  freepik: { active: true, name: 'Freepik', url: 'https://www.freepik.com' },
  istockphoto: { active: true, name: 'iStock', url: 'https://www.istockphoto.com' },
  depositphotos: { active: true, name: 'Depositphotos', url: 'https://depositphotos.com' },
  '123rf': { active: true, name: '123RF', url: 'https://www.123rf.com' },
  dreamstime: { active: true, name: 'Dreamstime', url: 'https://www.dreamstime.com' },
  pond5: { active: true, name: 'Pond5', url: 'https://www.pond5.com' },
};

export default function OrderV2Page() {
  const [urls, setUrls] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(20); // Mock balance - replace with real Supabase data
  const [showAllSites, setShowAllSites] = useState(false);

  // Extract site and ID from URL
  const parseStockUrl = (url: string): { site: string; id: string } | null => {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname.includes('shutterstock.com')) {
        const id = url.split('-').pop() || '';
        return { site: 'shutterstock', id };
      }
      
      if (urlObj.hostname.includes('adobestock') || urlObj.hostname.includes('stock.adobe')) {
        const id = url.split('/').pop()?.split('?')[0] || '';
        return { site: 'adobestock', id };
      }

      if (urlObj.hostname.includes('freepik.com')) {
        const match = url.match(/\d+$/);
        return { site: 'freepik', id: match ? match[0] : '' };
      }

      if (urlObj.hostname.includes('istockphoto.com')) {
        const match = url.match(/gm(\d+)/);
        return { site: 'istockphoto', id: match ? match[1] : '' };
      }
      
      return null;
    } catch {
      return null;
    }
  };

  // Get stock info (preview, title, etc)
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
        // Override cost with our fixed price
        return { ...result.data, cost: CREDITS_PER_DOWNLOAD };
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
    if (userBalance < CREDITS_PER_DOWNLOAD) {
      alert('Insufficient credits!');
      return;
    }

    try {
      const response = await fetch(
        `${NEHTW_BASE_URL}/stockorder/${order.site}/${order.stockId}`,
        {
          headers: { 'X-Api-Key': NEHTW_API_KEY },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        // Deduct credits from user balance
        setUserBalance(prev => prev - CREDITS_PER_DOWNLOAD);
        
        setOrders(prev =>
          prev.map(o =>
            o.id === order.id
              ? { ...o, task_id: data.task_id, status: 'pending' }
              : o
          )
        );
        
        // TODO: Update user balance in Supabase
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
    }, 5000);

    return () => clearInterval(interval);
  }, [orders]);

  const displayedSites = showAllSites 
    ? Object.entries(STOCK_SITES) 
    : Object.entries(STOCK_SITES).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Stock Order (v2)</h1>
          <div className="text-white/90 text-lg font-semibold">
            Balance: <span className="text-green-400">{userBalance}</span> Credits
          </div>
        </div>

        {/* Supported Sites - Compact Pills Design */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/90 font-semibold text-lg">
              Supported Stock Sites ({Object.keys(STOCK_SITES).length})
            </h2>
            <span className="text-yellow-400 font-semibold text-sm">
              {CREDITS_PER_DOWNLOAD} Credits per download
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {displayedSites.map(([key, site]) => (
              <a
                key={key}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-white/10 rounded-full transition-all duration-200 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full group-hover:animate-pulse"></span>
                <span className="text-white/90 text-sm font-medium">{site.name}</span>
                <svg className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
            
            {Object.keys(STOCK_SITES).length > 4 && (
              <button
                onClick={() => setShowAllSites(!showAllSites)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-200"
              >
                <span className="text-white/70 text-sm">
                  {showAllSites ? 'Show Less' : `+${Object.keys(STOCK_SITES).length - 4} More`}
                </span>
              </button>
            )}
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
                        Cost: {CREDITS_PER_DOWNLOAD} Credits
                      </p>
                    </div>
                    
                    {/* Confirm Button */}
                    <button
                      onClick={() => confirmOrder(order)}
                      disabled={userBalance < CREDITS_PER_DOWNLOAD}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {userBalance < CREDITS_PER_DOWNLOAD
                        ? 'Insufficient Credits'
                        : `Confirm Order (${CREDITS_PER_DOWNLOAD} Credits)`}
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
                        {STOCK_SITES[order.site]?.name || order.site} - {order.stockId}
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
