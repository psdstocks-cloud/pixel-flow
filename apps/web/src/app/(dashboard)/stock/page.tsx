'use client'

import { useState } from 'react'
import { StockSearch } from '@/components/stock/StockSearch'
import { StockGrid } from '@/components/stock/StockGrid'
import { StockPreview } from '@/components/stock/StockPreview'
import { useStockSearch } from '@/hooks/useStockSearch'

export default function StockPage() {
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [searchParams, setSearchParams] = useState({
    query: '',
    site: 'shutterstock',
    page: 1,
  })

  const { data: stocks, isLoading, error } = useStockSearch(searchParams)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Images</h1>
        <p className="text-gray-600">
          Search and download high-quality stock images from multiple sources
        </p>
      </div>

      <StockSearch
        searchParams={searchParams}
        onSearchChange={setSearchParams}
        isLoading={isLoading}
      />

      <StockGrid
        stocks={stocks?.data || []}
        isLoading={isLoading}
        error={error}
        onStockSelect={setSelectedStock}
      />

      {selectedStock && (
        <StockPreview
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  )
}
