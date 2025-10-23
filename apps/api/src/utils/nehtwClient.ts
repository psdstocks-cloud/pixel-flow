/**
 * Nehtw API Client Wrapper
 */

export interface NehtwStockInfo {
  image: string
  title: string
  id: string
  source: string
  cost: number
  ext: string
  name: string
  author: string
  sizeInBytes: string
}

export interface NehtwOrderResponse {
  success: boolean
  task_id?: string
  message?: string
}

export interface NehtwStatusResponse {
  success: boolean
  status: 'processing' | 'ready'
  message?: string
}

export interface NehtwDownloadResponse {
  success: boolean
  status: 'downloading' | 'ready'
  downloadLink?: string
  fileName?: string
  linkType?: string
  message?: string
}

export class NehtwAPIClient {
  private readonly apiKey: string
  private readonly baseURL = 'https://nehtw.com/api'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Make authenticated request
   */
  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'X-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Nehtw API error: ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * Step 1: Get stock information
   */
  async getStockInfo(site: string, id: string, fullUrl?: string): Promise<NehtwStockInfo> {
    const encodedUrl = fullUrl ? encodeURIComponent(fullUrl) : ''
    const endpoint = `/stockinfo/${site}/${id}${encodedUrl ? `?url=${encodedUrl}` : ''}`

    const data: { success: boolean; data?: NehtwStockInfo } = await this.fetch(endpoint)

    if (!data.success || !data.data) {
      throw new Error(data.data ? 'Failed to fetch stock info' : 'Failed to fetch stock info')
    }

    return data.data
  }

  /**
   * Step 2: Create order
   */
  async createOrder(site: string, id: string, fullUrl?: string): Promise<string> {
    const encodedUrl = fullUrl ? encodeURIComponent(fullUrl) : ''
    const endpoint = `/stockorder/${site}/${id}${encodedUrl ? `?url=${encodedUrl}` : ''}`

    const data: NehtwOrderResponse = await this.fetch(endpoint)

    if (!data.success || !data.task_id) {
      throw new Error(data.message || 'Failed to create order')
    }

    return data.task_id
  }

  /**
   * Step 3: Check order status
   */
  async checkOrderStatus(taskId: string, responseType: string = 'any'): Promise<NehtwStatusResponse> {
    const endpoint = `/order/${taskId}/status?responsetype=${responseType}`
    return this.fetch<NehtwStatusResponse>(endpoint)
  }

  /**
   * Step 4: Generate download link
   */
  async generateDownloadLink(taskId: string, responseType: string = 'any'): Promise<NehtwDownloadResponse> {
    const endpoint = `/v2/order/${taskId}/download?responsetype=${responseType}`
    return this.fetch<NehtwDownloadResponse>(endpoint)
  }

  /**
   * Get stock sites pricing
   */
  async getStockSites(): Promise<Record<string, unknown>> {
    return this.fetch('/stocksites')
  }
}
