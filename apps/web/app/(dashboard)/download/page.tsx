'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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
      // TODO: Replace with actual API call to your backend
      // For now, loading from localStorage as fallback
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
        // Update download status
        setDownloads(prev =>
          prev.map(d =>
            d.taskId === taskId
              ? { ...d, status: data.status }
              : d
          )
        );
        
        // If ready, generate download link
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

  const handleDownload = (downloadLink: string, fileName: string) => {
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Download Center</h1>
          <p className="text-gray-400">Manage and access all your downloaded files</p>
        </div>

        {/* Stats Cards */}
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

        {/* Filters */}
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

        {/* Downloads List */}
        {filteredDownloads.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <svg
              className="w-16 h-16 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No downloads found</h3>
            <p className="text-gray-400">Start ordering stock images to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDownloads.map((download) => (
              <div
                key={download.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500/50 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {download.thumbnail && (
                    <div className="flex-shrink-0">
                      <img
                        src={download.thumbnail}
                        alt={download.fileName}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {download.fileName || 'Unnamed file'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(download.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {download.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {download.cost} credits
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          download.status === 'ready'
                            ? 'bg-green-500/20 text-green-400'
                            : download.status === 'processing'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {download.status === 'ready' && '✓ Ready'}
                        {download.status === 'processing' && '⟳ Processing'}
                        {download.status === 'error' && '✕ Error'}
                      </span>

                      {download.status === 'processing' && (
                        <button
                          onClick={() => checkStatus(download.taskId)}
                          className="text-sm text-purple-400 hover:text-purple-300"
                        >
                          Check Status
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {download.status === 'ready' && download.downloadLink ? (
                      <button
                        onClick={() => handleDownload(download.downloadLink!, download.fileName)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    ) : download.status === 'ready' ? (
                      <button
                        onClick={() => generateDownloadLink(download.taskId)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                      >
                        Generate Link
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
                        Waiting...
                      </div>
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
