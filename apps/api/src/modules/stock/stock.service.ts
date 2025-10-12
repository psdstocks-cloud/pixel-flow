import { NehtwClient } from '../../utils/nehtw-client'
import { redis } from '../../config/redis'
import { prisma } from '@pixel-flow/database'
import { AppError } from '../../middleware/errorHandler'
import { config } from '../../config'

const nehtwClient = new NehtwClient(config.nehtw.apiKey)

export class StockService {
  // Get stock sites with caching
  async getStockSites() {
    const cacheKey = 'stock:sites'
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const sites = await nehtwClient.getStockSites()
    
    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(sites))
    
    return sites
  }

  // Get stock info with caching
  async getStockInfo(site: string, id: string, url?: string) {
    const cacheKey = `stock:info:${site}:${id}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const stockInfo = await nehtwClient.getStockInfo(site, id, url)
    
    // Cache for 30 minutes
    await redis.setex(cacheKey, 1800, JSON.stringify(stockInfo))
    
    return stockInfo
  }

  // Order stock download
  async orderStock(userId: string, site: string, id: string, url?: string) {
    // Get stock info first
    const stockInfo = await this.getStockInfo(site, id, url)
    
    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    if (!user) {
      throw new AppError(404, 'User not found')
    }

    if (user.credits < stockInfo.cost) {
      throw new AppError(400, 'Insufficient credits')
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        type: 'STOCK_DOWNLOAD',
        status: 'PENDING',
        creditsCost: stockInfo.cost,
        stockSite: site,
        stockId: id,
        stockUrl: url,
        stockTitle: stockInfo.title,
        stockAuthor: stockInfo.author,
      }
    })

    // Order from nehtw
    const nehtwOrder = await nehtwClient.orderStock(site, id, url)
    
    // Update order with nehtw task ID
    await prisma.order.update({
      where: { id: order.id },
      data: { nehtwTaskId: nehtwOrder.task_id }
    })

    return {
      orderId: order.id,
      taskId: nehtwOrder.task_id,
      status: 'PENDING'
    }
  }

  // Check order status
  async checkOrderStatus(taskId: string) {
    const order = await prisma.order.findUnique({
      where: { nehtwTaskId: taskId }
    })

    if (!order) {
      throw new AppError(404, 'Order not found')
    }

    // Check with nehtw API
    const status = await nehtwClient.checkOrderStatus(taskId)
    
    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: status.status === 'completed' ? 'COMPLETED' : 'PROCESSING',
        errorMessage: status.error_message,
      }
    })

    return status
  }

  // Get download link
  async getDownloadLink(taskId: string) {
    const order = await prisma.order.findUnique({
      where: { nehtwTaskId: taskId }
    })

    if (!order) {
      throw new AppError(404, 'Order not found')
    }

    if (order.status !== 'COMPLETED') {
      throw new AppError(400, 'Order not completed yet')
    }

    // Get download link from nehtw
    const downloadData = await nehtwClient.generateDownloadLink(taskId)
    
    return downloadData
  }
}
