import axios from 'axios';

const NEHTW_API_KEY = process.env.NEHTW_API_KEY || 'A8K9bV5s2OX12E8cmS4I96mtmSNzv7';
const NEHTW_BASE_URL = 'https://nehtw.com/api';

if (!process.env.NEHTW_API_KEY) {
  console.warn('⚠️ NEHTW_API_KEY not set in environment, using fallback');
}

console.log('✅ nehtw API configured with key:', NEHTW_API_KEY.substring(0, 8) + '...');

export interface NehtwOrderResponse {
  success: boolean;
  task_id?: string;
  error_message?: string;
  message?: string;
}

export interface NehtwPollResponse {
  success: boolean;
  status?: string;
  download_link?: string;
  file_name?: string;
  error_message?: string;
  message?: string;
}

export const nehtwClient = {
  async createOrder(url: string, responseType: string = 'any'): Promise<NehtwOrderResponse> {
    try {
      console.log('🚀 Creating nehtw order:', { url, responseType });
      
      const response = await axios.post(
        `${NEHTW_BASE_URL}/order`,
        { url, response_type: responseType },
        {
          headers: {
            'X-Api-Key': NEHTW_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );
      
      console.log('✅ nehtw order created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ nehtw API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      return {
        success: false,
        error_message: error.response?.data?.message || error.response?.data?.error || error.message,
      };
    }
  },

  async pollOrder(taskId: string): Promise<NehtwPollResponse> {
    try {
      console.log('🔍 Polling nehtw order:', taskId);
      
      const response = await axios.get(
        `${NEHTW_BASE_URL}/order/${taskId}`,
        {
          headers: {
            'X-Api-Key': NEHTW_API_KEY,
          },
          timeout: 30000,
        }
      );
      
      console.log('📊 nehtw poll result:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ nehtw poll error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      return {
        success: false,
        error_message: error.response?.data?.message || error.response?.data?.error || error.message,
      };
    }
  },
};
