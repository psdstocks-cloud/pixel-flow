import { Request, Response } from 'express'
import { z } from 'zod'
import { StockService } from './stock.service'
import { AppError } from '../../middleware/errorHandler'

const stockService = new StockService()

// Validation schemas
const getStockInfoSchema = z.object({
  site: z.string(),
  id: z.string(),
  url: z.string().optional(),
})

const orderStockSchema = z.object({
  site: z.string(),
  id: z.string(),
  url: z.string().optional(),
})

const checkStatusSchema = z.object({
  taskId: z.string(),
})

// Get stock sites
export const getStockSites = async (req: Request, res: Response) => {
  const sites = await stockService.getStockSites()
  
  res.json({
    success: true,
    data: sites
  })
}

// Get stock info
export const getStockInfo = async (req: Request, res: Response) => {
  const { site, id, url } = getStockInfoSchema.parse(req.query)
  
  const stockInfo = await stockService.getStockInfo(site, id, url)
  
  res.json({
    success: true,
    data: stockInfo
  })
}

// Order stock download
export const orderStock = async (req: Request, res: Response) => {
  const userId = (req as any).user.id
  const { site, id, url } = orderStockSchema.parse(req.body)
  
  const result = await stockService.orderStock(userId, site, id, url)
  
  res.json({
    success: true,
    data: result,
    message: 'Stock order created successfully'
  })
}

// Check order status
export const checkOrderStatus = async (req: Request, res: Response) => {
  const { taskId } = checkStatusSchema.parse(req.params)
  
  const status = await stockService.checkOrderStatus(taskId)
  
  res.json({
    success: true,
    data: status
  })
}

// Get download link
export const getDownloadLink = async (req: Request, res: Response) => {
  const { taskId } = checkStatusSchema.parse(req.params)
  
  const downloadData = await stockService.getDownloadLink(taskId)
  
  res.json({
    success: true,
    data: downloadData
  })
}
