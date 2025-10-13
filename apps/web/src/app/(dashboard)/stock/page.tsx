'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StockSearch } from '@/components/stock/StockSearch'
import { StockGrid } from '@/components/stock/StockGrid'
import { StockPreview } from '@/components/stock/StockPreview'
import { useStockSearch } from '@/hooks/useStockSearch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Grid, List } from 'lucide-react'

export default function StockPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchState, setSearchState] = useState({
    query: searchParams.get('q') || '',
    site: searchParams.get('site') || 'shutterstock',
    page: parseInt(searchParams.get('page') || '1'),
    sort: searchParams.get('sort') || 'relevance',
    orientation: searchParams.get('orientation') || 'all',
    color: searchParams.get('color') || 'all',
  })

  const { data: stocks, isLoading, error } = useStockSearch(searchState)

  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchState.query) params.set('q', searchState.query)
    if (searchState.site !== 'shutterstock') params.set('site', searchState.site)
    if (searchState.page > 1) params.set('page', searchState.page.toString())
    if (searchState.sort !== 'relevance') params.set('sort', searchState.sort)
    if (searchState.orientation !== 'all') params.set('orientation', searchState.orientation)
    if (searchState.color !== 'all') params.set('color', searchState.color)
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/stock${newUrl}`, { scroll: false })
  }, [searchState, router])

  const handleSearchChange = (newParams: Partial<typeof searchState>) => {
    setSearchState(prev => ({ ...prev, ...newParams, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchState(prev => ({ ...prev, page }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Images</h1>
            <p className="text-gray-600">
              Search and download high-quality stock images from multiple sources
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {searchState.query && (
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-sm">
              {stocks?.pagination?.total || 0} results for "{searchState.query}"
            </Badge>
            <Badge variant="outline" className="text-sm">
              {searchState.site}
            </Badge>
          </div>
        )}
      </div>

      <StockSearch
        searchParams={searchState}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
      />

      <StockGrid
        stocks={stocks?.data || []}
        isLoading={isLoading}
        error={error}
        onStockSelect={setSelectedStock}
        viewMode={viewMode}
        pagination={{
          currentPage: searchState.page,
          totalPages: Math.ceil((stocks?.pagination?.total || 0) / 20),
          onPageChange: handlePageChange,
        }}
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
