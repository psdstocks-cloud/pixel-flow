'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { Button } from '@pixel-flow/ui/button'
import { Input } from '@pixel-flow/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pixel-flow/ui/select'
import { Card, CardContent } from '@pixel-flow/ui/card'

interface StockSearchProps {
  searchParams: {
    query: string
    site: string
    page: number
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

export function StockSearch({ searchParams, onSearchChange, isLoading }: StockSearchProps) {
  const [query, setQuery] = useState(searchParams.query)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange({
      ...searchParams,
      query,
      page: 1,
    })
  }

  const handleSiteChange = (site: string) => {
    onSearchChange({
      ...searchParams,
      site,
      page: 1,
    })
  }

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
            <Select value={searchParams.site} onValueChange={handleSiteChange}>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
