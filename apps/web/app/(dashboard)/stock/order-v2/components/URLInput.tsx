'use client';

import { useState } from 'react';

interface URLInputProps {
  onURLsChange: (urls: string[]) => void;
  maxURLs?: number;
}

export function URLInput({ onURLsChange, maxURLs = 5 }: URLInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [urls, setUrls] = useState<string[]>([]);

  const validateURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const urlList = value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
      .slice(0, maxURLs);

    setUrls(urlList);
    onURLsChange(urlList);
  };

  const parseSiteFromURL = (url: string): string | null => {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      if (hostname.includes('adobe.com')) return 'Adobe Stock';
      if (hostname.includes('shutterstock.com')) return 'Shutterstock';
      if (hostname.includes('freepik.com')) return 'Freepik';
      if (hostname.includes('123rf.com')) return '123RF';
      if (hostname.includes('istockphoto.com')) return 'iStock';
      return hostname;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-white font-semibold text-lg">
          Paste Stock URLs
        </label>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full transition-all ${
            urls.length >= maxURLs
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'bg-white/10 text-gray-400'
          }`}
        >
          {urls.length} / {maxURLs}
        </span>
      </div>

      <textarea
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="https://stock.adobe.com/images/123456&#10;https://www.shutterstock.com/image-photo/789012&#10;..."
        className="w-full h-48 bg-white/5 border-2 border-white/20 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none font-mono text-sm"
      />

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, index) => {
            const isValid = validateURL(url);
            const siteName = parseSiteFromURL(url);

            return (
              <div
                key={index}
                className={`px-3 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
                  isValid
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                <span>{isValid ? '✓' : '✕'}</span>
                <span className="truncate max-w-xs">
                  {siteName || 'Invalid URL'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            setInputValue('');
            setUrls([]);
            onURLsChange([]);
          }}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg border border-white/10 transition-all"
        >
          Clear All
        </button>
        <button
          onClick={() => {
            const examples = [
              'https://stock.adobe.com/images/123456',
              'https://www.shutterstock.com/image-photo/test-789012',
            ];
            setInputValue(examples.join('\n'));
            handleInputChange(examples.join('\n'));
          }}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg border border-white/10 transition-all"
        >
          + Add Examples
        </button>
      </div>
    </div>
  );
}
