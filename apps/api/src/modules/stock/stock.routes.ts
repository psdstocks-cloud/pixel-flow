import { Router } from 'express'
import { authMiddleware, stockDownloadRateLimit } from '../../middleware'
import {
  getStockSites,
  getStockInfo,
  orderStock,
  checkOrderStatus,
  getDownloadLink,
} from './stock.controller'

const router = Router()

// Public routes
router.get('/sites', getStockSites)
router.get('/info', getStockInfo)

// Protected routes
router.post('/order', authMiddleware, stockDownloadRateLimit, orderStock)
router.get('/status/:taskId', authMiddleware, checkOrderStatus)
router.get('/download/:taskId', authMiddleware, getDownloadLink)

export default router
