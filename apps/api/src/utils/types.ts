/**
 * Shared types for Order system
 */

export interface BatchOrderRequest {
  urls: string[]
  responseType?: 'any' | 'gdrive' | 'mydrivelink' | 'asia'
}

export interface BatchOrderResponse {
  success: boolean
  batchId?: string
  orders?: unknown[]
  totalCost?: number
  remainingBalance?: number
  error?: string
}

export interface OrderPollResponse {
  success: boolean
  order?: unknown
  status?: string
  error?: string
}
