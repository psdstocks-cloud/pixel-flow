'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function StockPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchState, setSearchState] = useState({
    query: '',
    site: 'shutterstock',
    page: 1,
    sort: 'relevance',
    orientation: 'all',
    color: 'all',
  })

  // Mock data for static generation
  const stocks = {
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    }
  }
  const isLoading = false
  const error = null

  const handleSearchChange = (newParams: Partial<typeof searchState>) => {
    setSearchState(prev => ({ ...prev, ...newParams, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchState(prev => ({ ...prev, page }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Images</h1>
        <p className="text-gray-600">
          Search and download high-quality stock images from multiple sources
        </p>
      </div>

      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Stock Images</h2>
        <p className="text-gray-600 mb-8">Search and download high-quality stock images</p>
        <Button size="lg">
          Start Searching
        </Button>
      </div>
    </div>
  )
}
