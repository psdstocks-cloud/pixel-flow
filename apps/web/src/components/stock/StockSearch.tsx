'use client'

import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@pixel-flow/ui/button'
import { Input } from '@pixel-flow/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pixel-flow/ui/select'
import { Card, CardContent } from '@pixel-flow/ui/card'
import { Badge } from '@pixel-flow/ui/badge'
import { Separator } from '@pixel-flow/ui/separator'

interface StockSearchProps {
  searchParams: {
    query: string
    site: string
    page: number
    sort: string
    orientation: string
    color: string
  }
  onSearchChange: (params: any) => void
  isLoading: boolean
}

const STOCK_SITES = [
  { value: 'shutterstock', label: 'Shutterstock' },
  { value: 'adobestock', label: 'Adobe Stock' },
  { value: 'freepik', label: 'Freepik' },
  { value: 'unsplash', label: 'Unsplash' },
  { value: 'pexels', label: 'Pexels' },
  { value: 'pixabay', label: 'Pixabay' },
  { value: 'pngtree', label: 'PNGTree' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'downloads', label: 'Most Downloaded' },
]

const ORIENTATION_OPTIONS = [
  { value: 'all', label: 'All Orientations' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'square', label: 'Square' },
]

const COLOR_OPTIONS = [
  { value: 'all', label: 'All Colors' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'gray', label: 'Gray' },
]

export function StockSearch({ searchParams, onSearchChange, isLoading }: StockSearchProps) {
  const [query, setQuery] = useState(searchParams.query)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange({
      ...searchParams,
      query,
      page: 1,
    })
  }

  const handleFilterChange = (key: string, value: string) => {
    onSearchChange({
      ...searchParams,
      [key]: value,
      page: 1,
    })
  }

  const clearFilters = () => {
    onSearchChange({
      ...searchParams,
      sort: 'relevance',
      orientation: 'all',
      color: 'all',
      page: 1,
    })
  }

  const hasActiveFilters = searchParams.sort !== 'relevance' || 
                          searchParams.orientation !== 'all' || 
                          searchParams.color !== 'all'

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for images..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={searchParams.site} onValueChange={(value) => handleFilterChange('site', value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {STOCK_SITES.map((site) => (
                  <SelectItem key={site.value} value={site.value}>
                    {site.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {[searchParams.sort !== 'relevance', searchParams.orientation !== 'all', searchParams.color !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {showFilters && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort by</label>
                  <Select value={searchParams.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Orientation</label>
                  <Select value={searchParams.orientation} onValueChange={(value) => handleFilterChange('orientation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIENTATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
                  <Select value={searchParams.color} onValueChange={(value) => handleFilterChange('color', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Color" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {searchParams.sort !== 'relevance' && (
                      <Badge variant="secondary" className="text-xs">
                        Sort: {SORT_OPTIONS.find(opt => opt.value === searchParams.sort)?.label}
                      </Badge>
                    )}
                    {searchParams.orientation !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {ORIENTATION_OPTIONS.find(opt => opt.value === searchParams.orientation)?.label}
                      </Badge>
                    )}
                    {searchParams.color !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {COLOR_OPTIONS.find(opt => opt.value === searchParams.color)?.label}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                </div>
              )}
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
