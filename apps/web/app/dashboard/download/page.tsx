'use client'
export const dynamic = 'force-dynamic'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';

interface Download {
  id: string;
  taskId: string;
  fileName: string;
  source: string;
  status: 'processing' | 'ready' | 'error';
  downloadLink?: string;
  thumbnail?: string;
  createdAt: string;
  cost: number;
}

export default function DownloadCenterPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ready' | 'processing' | 'error'>('all');

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const stored = localStorage.getItem('pixel-flow-downloads');
      if (stored) {
        setDownloads(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (taskId: string) => {
    try {
      const response = await fetch(
        `https://nehtw.com/api/order/${taskId}/status?responsetype=any`,
        {
          headers: {
            'X-Api-Key': process.env.NEXT_PUBLIC_NEHTW_API_KEY || '',
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setDownloads(prev =>
          prev.map(d =>
            d.taskId === taskId
              ? { ...d, status: data.status }
              : d
          )
        );
        
        if (data.status === 'ready') {
          await generateDownloadLink(taskId);
        }
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const generateDownloadLink = async (taskId: string) => {
    try {
      const response = await fetch(
        `https://nehtw.com/api/v2/order/${taskId}/download?responsetype=any`,
        {
          headers: {
            'X-Api-Key': process.env.NEXT_PUBLIC_NEHTW_API_KEY || '',
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.downloadLink) {
        setDownloads(prev =>
          prev.map(d =>
            d.taskId === taskId
              ? { ...d, downloadLink: data.downloadLink, fileName: data.fileName }
              : d
          )
        );
      }
    } catch (error) {
      console.error('Failed to generate download link:', error);
    }
  };

  const handleDownload = (downloadLink: string) => {
    window.open(downloadLink, '_blank');
  };

  const filteredDownloads = downloads.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const stats = {
    total: downloads.length,
    ready: downloads.filter(d => d.status === 'ready').length,
    processing: downloads.filter(d => d.status === 'processing').length,
    error: downloads.filter(d => d.status === 'error').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading downloads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Download Center</h1>
          <p className="text-gray-400">Manage and access all your downloaded files</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Total Downloads</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-green-500/20">
            <div className="text-gray-400 text-sm mb-1">Ready</div>
            <div className="text-3xl font-bold text-green-400">{stats.ready}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-yellow-500/20">
            <div className="text-gray-400 text-sm mb-1">Processing</div>
            <div className="text-3xl font-bold text-yellow-400">{stats.processing}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-red-500/20">
            <div className="text-gray-400 text-sm mb-1">Failed</div>
            <div className="text-3xl font-bold text-red-400">{stats.error}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'ready', 'processing', 'error'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filteredDownloads.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No downloads found</h3>
            <p className="text-gray-400">Start ordering stock images to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDownloads.map((download) => (
              <div key={download.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500/50 transition">
                <div className="flex items-start gap-4">
                  {download.thumbnail && (
                    <div className="flex-shrink-0">
                      <img src={download.thumbnail} alt={download.fileName} className="w-24 h-24 object-cover rounded-lg" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {download.fileName || 'Unnamed file'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span>{new Date(download.createdAt).toLocaleDateString()}</span>
                      <span>{download.source}</span>
                      <span>{download.cost} credits</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        download.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                        download.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {download.status === 'ready' && '✓ Ready'}
                        {download.status === 'processing' && '⟳ Processing'}
                        {download.status === 'error' && '✕ Error'}
                      </span>

                      {download.status === 'processing' && (
                        <button onClick={() => checkStatus(download.taskId)} className="text-sm text-purple-400 hover:text-purple-300">
                          Check Status
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {download.status === 'ready' && download.downloadLink ? (
                      <button onClick={() => handleDownload(download.downloadLink!)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
                        Download
                      </button>
                    ) : download.status === 'ready' ? (
                      <button onClick={() => generateDownloadLink(download.taskId)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                        Generate Link
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">Waiting...</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
