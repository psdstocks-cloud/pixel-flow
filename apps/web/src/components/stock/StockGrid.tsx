'use client'

import { useState } from 'react'
// import { Download, Heart, Eye, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCartStore } from '@/stores/cartStore'

interface StockGridProps {
  stocks: any[]
  isLoading: boolean
  error: any
  onStockSelect: (stock: any) => void
  viewMode?: 'grid' | 'list'
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
}

export function StockGrid({ 
  stocks, 
  isLoading, 
  error, 
  onStockSelect, 
  viewMode = 'grid',
  pagination 
}: StockGridProps) {
  const { addItem } = useCartStore()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const toggleFavorite = (stockId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(stockId)) {
        newFavorites.delete(stockId)
      } else {
        newFavorites.add(stockId)
      }
      return newFavorites
    })
  }

  const handleAddToCart = (stock: any) => {
    addItem({
      id: stock.id,
      stockId: stock.id,
      title: stock.title,
      image: stock.image,
      cost: stock.cost,
      author: stock.author,
      sizeInBytes: stock.sizeInBytes,
      site: stock.site,
      ext: stock.ext || 'jpg',
    })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading stock images</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
      }>
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No images found</p>
        <p className="text-sm text-gray-500">Try adjusting your search terms</p>
      </div>
    )
  }

  const renderStockCard = (stock: any, index: number) => (
    <Card key={`${stock.id}-${index}`} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative group">
        <img
          src={stock.image}
          alt={stock.title}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => onStockSelect(stock)}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onStockSelect(stock)}
            >
              Preview
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddToCart(stock)}
            >
              Add to Cart
            </Button>
          </div>
        </div>
        <Badge className="absolute top-2 right-2 bg-black bg-opacity-75 text-white">
          {stock.cost} credits
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 left-2 h-8 w-8 p-0 bg-black bg-opacity-50 hover:bg-opacity-75"
          onClick={() => toggleFavorite(stock.id)}
        >
          ♥
        </Button>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-sm mb-1 line-clamp-2">
          {stock.title}
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          by {stock.author}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {stock.sizeInBytes}
          </span>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {stock.site}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderListView = (stock: any, index: number) => (
    <Card key={`${stock.id}-${index}`} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        <div className="relative w-32 h-24 flex-shrink-0">
          <img
            src={stock.image}
            alt={stock.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onStockSelect(stock)}
          />
          <Badge className="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs">
            {stock.cost}
          </Badge>
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-1 line-clamp-1">
                {stock.title}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                by {stock.author}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{stock.sizeInBytes}</span>
                <Badge variant="outline" className="text-xs">
                  {stock.site}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => toggleFavorite(stock.id)}
              >
                ♥
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStockSelect(stock)}
              >
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() => handleAddToCart(stock)}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
        >
          Previous
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Next
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
      }>
        {stocks.map((stock, index) => {
          if (viewMode === 'grid') {
            return renderStockCard(stock, index)
          } else {
            return renderListView(stock, index)
          }
        })}
      </div>
{renderPagination()}
    </>
  )
}
