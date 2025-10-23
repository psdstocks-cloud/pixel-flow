import axios from 'axios';

const NEHTW_BASE_URL = 'https://nehtw.com/api';
const NEHTW_API_KEY = process.env.NEHTW_API_KEY;

if (!NEHTW_API_KEY) {
  console.error('⚠️ NEHTW_API_KEY not configured in environment variables');
}

interface NehtwOrderRequest {
  url: string;
  responseType: string;
}

interface NehtwOrderResponse {
  success: boolean;
  task_id?: string;
  error?: string;
  message?: string;
}

interface NehtwPollResponse {
  success: boolean;
  status: string;
  download_link?: string;
  file_name?: string;
  error_message?: string;
}

export class NehtwClient {
  private apiKey: string;

  constructor() {
    if (!NEHTW_API_KEY) {
      throw new Error('Nehtw API key not configured in environment variables');
    }
    this.apiKey = NEHTW_API_KEY;
  }

  async createOrder(url: string, responseType: string = 'any'): Promise<NehtwOrderResponse> {
    try {
      const response = await axios.post<NehtwOrderResponse>(
        `${NEHTW_BASE_URL}/order`,
        { url, responseType },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Nehtw order error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create order',
      };
    }
  }

  async pollOrder(taskId: string): Promise<NehtwPollResponse> {
    try {
      const response = await axios.post<NehtwPollResponse>(
        `${NEHTW_BASE_URL}/poll`,
        { task_id: taskId },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Nehtw poll error:', error.response?.data || error.message);
      return {
        success: false,
        status: 'error',
        error_message: error.response?.data?.error || error.message || 'Failed to poll order',
      };
    }
  }
}

export const nehtwClient = new NehtwClient();
