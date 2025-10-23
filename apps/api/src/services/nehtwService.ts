import axios from 'axios';
import {
  NEHTWApiResponse,
  StockSite,
  StockInfo,
  OrderResponse,
  OrderStatusResponse,
  DownloadResponse,
  AccountBalance,
  NEHTWError,
} from '../types/nehtw.types';

/**
 * NEHTW API Service Wrapper
 */
class NEHTWService {
  private client: any;
  private readonly baseURL = 'https://nehtw.com/api';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.NEHTW_API_KEY || '';

    if (!this.apiKey) {
      console.error('❌ NEHTW_API_KEY is not set in environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        return Promise.reject(this.handleError(error));
      }
    );

    console.log(`✅ NEHTW Service initialized with key: ${this.apiKey.substring(0, 8)}...`);
  }

  private handleError(error: any): NEHTWError {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || error.message,
        code: error.response.status.toString(),
        details: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'No response from NEHTW API',
        code: 'NO_RESPONSE',
      };
    } else {
      return {
        success: false,
        error: error.message,
        code: 'REQUEST_ERROR',
      };
    }
  }

  async getStockSites(): Promise<NEHTWApiResponse<StockSite[]>> {
    try {
      const response = await this.client.get('/stocksites');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching stock sites:', error);
      return error as NEHTWError;
    }
  }

  async getStockInfo(
    site: string,
    id: string,
    url?: string
  ): Promise<NEHTWApiResponse<StockInfo>> {
    try {
      let endpoint = `/stockinfo/${site}/${id}`;
      if (url) {
        endpoint += `?url=${encodeURIComponent(url)}`;
      }
      const response = await this.client.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching stock info for ${site}/${id}:`, error);
      return error as NEHTWError;
    }
  }

  async createOrder(
    site: string,
    id: string,
    url?: string
  ): Promise<NEHTWApiResponse<OrderResponse>> {
    try {
      let endpoint = `/stockorder/${site}/${id}`;
      if (url) {
        endpoint += `?url=${encodeURIComponent(url)}`;
      }
      const response = await this.client.get(endpoint);
      console.log(`✅ Order created: Task ID ${response.data.task_id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error creating order for ${site}/${id}:`, error);
      return error as NEHTWError;
    }
  }

  async checkOrderStatus(
    taskId: string,
    responseType: 'any' | 'gdrive' = 'any'
  ): Promise<NEHTWApiResponse<OrderStatusResponse>> {
    try {
      const response = await this.client.get(
        `/order/${taskId}/status?responsetype=${responseType}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error checking status for task ${taskId}:`, error);
      return error as NEHTWError;
    }
  }

  async generateDownloadLink(
    taskId: string,
    responseType: 'any' | 'gdrive' | 'mydrivelink' | 'asia' = 'any'
  ): Promise<NEHTWApiResponse<DownloadResponse>> {
    try {
      const response = await this.client.get(
        `/v2/order/${taskId}/download?responsetype=${responseType}`
      );
      console.log(`✅ Download link generated for task ${taskId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error generating download link for task ${taskId}:`, error);
      return error as NEHTWError;
    }
  }

  async getAccountBalance(): Promise<NEHTWApiResponse<AccountBalance>> {
    try {
      const response = await this.client.get('/me');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return error as NEHTWError;
    }
  }

  async downloadStockWorkflow(
    site: string,
    id: string,
    url?: string,
    maxAttempts: number = 30,
    pollInterval: number = 2000
  ): Promise<NEHTWApiResponse<DownloadResponse>> {
    try {
      const orderResult = await this.createOrder(site, id, url);
      
      if (!orderResult.success || !orderResult.data) {
        return orderResult as NEHTWError;
      }

      const taskId = orderResult.data.task_id;
      console.log(`📦 Polling order status for task ${taskId}...`);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const statusResult = await this.checkOrderStatus(taskId);
        
        if (!statusResult.success || !statusResult.data) {
          return statusResult as NEHTWError;
        }

        const status = statusResult.data.status;
        console.log(`[Attempt ${attempt}/${maxAttempts}] Status: ${status}`);

        if (status === 'ready' || status === 'completed') {
          return await this.generateDownloadLink(taskId);
        }

        if (status === 'error') {
          return {
            success: false,
            error: statusResult.data.error || 'Order failed',
            code: 'ORDER_ERROR',
          } as NEHTWError;
        }
      }

      return {
        success: false,
        error: 'Order timeout: Max polling attempts reached',
        code: 'TIMEOUT',
      } as NEHTWError;
    } catch (error) {
      console.error('Error in download workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'WORKFLOW_ERROR',
      } as NEHTWError;
    }
  }

  parseStockURL(url: string): { site: string; id: string } | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      
      if (hostname.includes('shutterstock.com')) {
        const match = url.match(/image-(\d+)/);
        return match ? { site: 'shutterstock', id: match[1] } : null;
      }
      
      if (hostname.includes('istockphoto.com')) {
        const match = url.match(/\/gm(\d+)/);
        return match ? { site: 'istock', id: match[1] } : null;
      }
      
      if (hostname.includes('stock.adobe.com')) {
        const match = url.match(/detail\/(\d+)/);
        return match ? { site: 'adobestock', id: match[1] } : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing stock URL:', error);
      return null;
    }
  }
}

export default new NEHTWService();