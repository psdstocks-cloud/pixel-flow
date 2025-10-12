'use client'

import { useState } from 'react'
import { Download, Heart, Eye } from 'lucide-react'
import { Button } from '@pixel-flow/ui/button'
import { Card, CardContent } from '@pixel-flow/ui/card'
import { Badge } from '@pixel-flow/ui/badge'
import { Skeleton } from '@pixel-flow/ui/skeleton'

interface StockGridProps {
  stocks: any[]
  isLoading: boolean
  error: any
  onStockSelect: (stock: any) => void
}

export function StockGrid({ stocks, isLoading, error, onStockSelect }: StockGridProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {stocks.map((stock, index) => (
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
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => {/* Add to cart */}}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <Badge className="absolute top-2 right-2 bg-black bg-opacity-75 text-white">
              {stock.cost} credits
            </Badge>
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
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Heart className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
