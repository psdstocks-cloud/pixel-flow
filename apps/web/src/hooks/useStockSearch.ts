import { useQuery } from '@tanstack/react-query'

interface StockSearchParams {
  query: string
  site: string
  page: number
}

interface StockSearchResponse {
  data: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function searchStocks(params: StockSearchParams): Promise<StockSearchResponse> {
  const searchParams = new URLSearchParams({
    query: params.query,
    site: params.site,
    page: params.page.toString(),
  })

  const response = await fetch(`/api/stock/search?${searchParams}`)
  
  if (!response.ok) {
    throw new Error('Failed to search stocks')
  }

  return response.json()
}

export function useStockSearch(params: StockSearchParams) {
  return useQuery({
    queryKey: ['stocks', params],
    queryFn: () => searchStocks(params),
    enabled: !!params.query && params.query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
