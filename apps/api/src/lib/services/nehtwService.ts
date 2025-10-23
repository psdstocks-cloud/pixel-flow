import axios from 'axios';

const NEHTW_BASE_URL = 'https://nehtw.com/api';
const API_KEY = process.env.NEHTW_API_KEY || '';

export class NEHTWService {
  private headers = {
    'X-Api-Key': API_KEY,
  };

  // Step 1: Get stock info
  async getStockInfo(site: string, id: string, url?: string) {
    try {
      const endpoint = url 
        ? `${NEHTW_BASE_URL}/stockinfo/${site}/${id}?url=${encodeURIComponent(url)}`
        : `${NEHTW_BASE_URL}/stockinfo/${site}/${id}`;
      
      const response = await axios.get(endpoint, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get stock info: ${error}`);
    }
  }

  // Step 2: Create order
  async createOrder(site: string, id: string, url?: string) {
    try {
      const endpoint = url
        ? `${NEHTW_BASE_URL}/stockorder/${site}/${id}?url=${encodeURIComponent(url)}`
        : `${NEHTW_BASE_URL}/stockorder/${site}/${id}`;
      
      const response = await axios.get(endpoint, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  // Step 3: Check order status
  async checkOrderStatus(taskId: string, responseType: 'any' | 'gdrive' = 'any') {
    try {
      const response = await axios.get(
        `${NEHTW_BASE_URL}/order/${taskId}/status?responsetype=${responseType}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to check order status: ${error}`);
    }
  }

  // Step 4: Generate download link
  async generateDownloadLink(taskId: string, responseType: 'any' | 'gdrive' | 'mydrivelink' | 'asia' = 'any') {
    try {
      const response = await axios.get(
        `${NEHTW_BASE_URL}/v2/order/${taskId}/download?responsetype=${responseType}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate download link: ${error}`);
    }
  }

  // Get supported stock sites
  async getStockSites() {
    try {
      const response = await axios.get(`${NEHTW_BASE_URL}/stocksites`, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get stock sites: ${error}`);
    }
  }

  // Get account balance
  async getBalance() {
    try {
      const response = await axios.get(`${NEHTW_BASE_URL}/me`, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }
}

export default new NEHTWService();
