import axios, { AxiosInstance } from 'axios'
import { logger } from './logger'

export class NehtwClient {
  private client: AxiosInstance
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = axios.create({
      baseURL: 'https://nehtw.com/api',
      headers: {
        'X-Api-Key': apiKey,
      },
      timeout: 30000,
    })

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`nehtw API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error('nehtw API Request Error:', error)
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`nehtw API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        logger.error('nehtw API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        })
        return Promise.reject(error)
      }
    )
  }

  // Stock Methods
  async getStockInfo(site: string, id: string, url?: string) {
    const endpoint = url
      ? `/stockinfo/${site}/${id}?url=${encodeURIComponent(url)}`
      : `/stockinfo/${site}/${id}`
    
    const response = await this.client.get(endpoint)
    return response.data
  }

  async orderStock(site: string, id: string, url?: string) {
    const endpoint = url
      ? `/stockorder/${site}/${id}?url=${encodeURIComponent(url)}`
      : `/stockorder/${site}/${id}`
    
    const response = await this.client.get(endpoint)
    return response.data
  }

  async checkOrderStatus(taskId: string, responseType: 'any' | 'gdrive' = 'any') {
    const response = await this.client.get(
      `/order/${taskId}/status?responsetype=${responseType}`
    )
    return response.data
  }

  async generateDownloadLink(taskId: string, responseType: 'any' | 'gdrive' | 'mydrivelink' | 'asia' = 'any') {
    const response = await this.client.get(
      `/v2/order/${taskId}/download?responsetype=${responseType}`
    )
    return response.data
  }

  async getStockSites() {
    const response = await this.client.get('/stocksites')
    return response.data
  }

  // AI Generation Methods
  async createAIGeneration(prompt: string) {
    const response = await this.client.get('/aig/create', {
      params: { prompt },
    })
    return response.data
  }

  async getAIGenerationResult(jobId: string) {
    const response = await this.client.get(`/aig/public/${jobId}`)
    return response.data
  }

  async performAIAction(jobId: string, action: 'vary' | 'upscale', index: number, varyType?: 'subtle' | 'strong') {
    const response = await this.client.post('/aig/actions', {
      job_id: jobId,
      action,
      index,
      vary_type: varyType,
    })
    return response.data
  }

  // Account Methods
  async getBalance() {
    const response = await this.client.get('/me')
    return response.data
  }

  async sendPoints(receiver: string, amount: number) {
    const response = await this.client.get('/sendpoint', {
      params: {
        apikey: this.apiKey,
        receiver,
        amount,
      },
    })
    return response.data
  }
}
