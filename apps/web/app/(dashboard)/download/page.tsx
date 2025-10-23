'use client';

import { useState } from 'react';
import { Loader2, Check, X, AlertCircle, Download, Plus, Trash2 } from 'lucide-react';

// Types
interface DownloadItem {
  id: string;
  url: string;
  site?: string;
  stockId?: string;
  status: 'idle' | 'validating' | 'processing' | 'ready' | 'error' | 'downloaded';
  progress: number;
  taskId?: string;
  downloadUrl?: string;
  error?: string;
  cost?: number;
}

export default function DownloadPage() {
  const [urls, setUrls] = useState<string[]>(['']);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add new URL input field
  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, '']);
    }
  };

  // Remove URL input field
  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  // Update URL value
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  // Parse and validate URL
const validateUrl = async (url: string): Promise<{ success: boolean; data?: { site: string; id: string }; error?: string }> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/parse-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Failed to validate URL' };
  }
};

  // Start download for single item
  const startDownload = async (item: DownloadItem) => {
    try {
      // Update status to processing
      setDownloads(prev => prev.map(d => 
        d.id === item.id ? { ...d, status: 'processing', progress: 10 } : d
      ));

      // Call download workflow API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: item.site,
          id: item.stockId,
          url: item.url,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Download completed
        setDownloads(prev => prev.map(d => 
          d.id === item.id 
            ? { 
                ...d, 
                status: 'ready', 
                progress: 100,
                downloadUrl: result.data?.download_url,
                taskId: result.data?.task_id,
              } 
            : d
        ));
        if (result.success && result.data) {  // ← Add check for result.data
  // Update with parsed data
  setDownloads(prev => prev.map(d => 
    d.id === item.id 
      ? { 
          ...d, 
          site: result.data.site,
          stockId: result.data.id,
          status: 'idle',
          progress: 5,
        } 
      : d
  ));
}
      } else {
        // Download failed
        setDownloads(prev => prev.map(d => 
          d.id === item.id 
            ? { ...d, status: 'error', error: result.error || 'Download failed' } 
            : d
        ));
      }
    } catch (error) {
      setDownloads(prev => prev.map(d => 
        d.id === item.id 
          ? { ...d, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } 
          : d
      ));
    }
  };

  // Process all URLs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const validUrls = urls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      alert('Please enter at least one URL');
      setIsProcessing(false);
      return;
    }

    // Create download items
    const newDownloads: DownloadItem[] = validUrls.map((url, index) => ({
      id: `download-${Date.now()}-${index}`,
      url,
      status: 'validating',
      progress: 0,
    }));

    setDownloads(newDownloads);

    // Validate all URLs
    // Validate all URLs
for (const item of newDownloads) {
  const result = await validateUrl(item.url);
  
  if (result.success && result.data) {  // ✅ Added result.data check
    // Update with parsed data
    setDownloads(prev => prev.map(d => 
      d.id === item.id 
        ? { 
            ...d, 
            site: result.data!.site,      // ✅ Use ! to assert it exists
            stockId: result.data!.id,     // ✅ Use ! to assert it exists
            status: 'idle',
            progress: 5,
          } 
        : d
    ));
  } else {
    // Mark as error
    setDownloads(prev => prev.map(d => 
      d.id === item.id 
        ? { ...d, status: 'error', error: result.error || 'Invalid URL' } 
        : d
    ));
  }
}

    // Start downloads for valid items
    const validDownloads = newDownloads.filter(d => d.status !== 'error');
    for (const item of validDownloads) {
      await startDownload(item);
    }

    setIsProcessing(false);
  };

  // Clear all downloads
  const clearDownloads = () => {
    setDownloads([]);
    setUrls(['']);
  };

  // Get status icon
  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'validating':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
      case 'ready':
      case 'downloaded':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'error':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Download Stock Assets</h1>
        <p className="text-gray-600">
          Paste up to 5 stock URLs from supported platforms and download instantly
        </p>
      </div>

      {/* Supported Platforms Badge */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Supported platforms:</strong> Shutterstock, iStock, Adobe Stock, and more
        </p>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="space-y-3 mb-4">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    placeholder={`Stock URL ${index + 1}`}
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrlField(index)}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add URL Button */}
          {urls.length < 5 && (
            <button
              type="button"
              onClick={addUrlField}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
              disabled={isProcessing}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Another URL</span>
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || urls.every(u => !u.trim())}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Start Download
              </>
            )}
          </button>
        </div>
      </form>

      {/* Downloads List */}
      {downloads.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold">Download Progress</h2>
            <button
              onClick={clearDownloads}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Download Items */}
          <div className="divide-y divide-gray-200">
            {downloads.map((item) => (
              <div key={item.id} className="p-6">
                {/* Item Header */}
                <div className="flex items-start gap-4 mb-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(item.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.url}
                    </p>
                    {item.site && item.stockId && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.site} • ID: {item.stockId}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'ready' || item.status === 'downloaded'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : item.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status === 'validating' && 'Validating'}
                      {item.status === 'processing' && 'Processing'}
                      {item.status === 'ready' && 'Ready'}
                      {item.status === 'downloaded' && 'Downloaded'}
                      {item.status === 'error' && 'Failed'}
                      {item.status === 'idle' && 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {(item.status === 'processing' || item.status === 'validating') && (
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.progress}%</p>
                  </div>
                )}

                {/* Error Message */}
                {item.status === 'error' && item.error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{item.error}</p>
                  </div>
                )}

                {/* Download Button */}
                {item.status === 'ready' && item.downloadUrl && (
                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold mb-3">How It Works</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Paste stock asset URLs (up to 5 at once)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Click &quot;Start Download&quot; to process your requests</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Wait for processing (usually 30-60 seconds per file)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>Download your files instantly, no watermarks!</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
