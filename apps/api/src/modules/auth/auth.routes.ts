import { Router } from 'express'
import { authMiddleware, authRateLimit } from '../../middleware'
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from './auth.controller'

const router = Router()

// Public routes
router.post('/register', authRateLimit, register)
router.post('/login', authRateLimit, login)
router.post('/forgot-password', authRateLimit, forgotPassword)
router.post('/reset-password', authRateLimit, resetPassword)

// Protected routes
router.get('/me', authMiddleware, getCurrentUser)

export default router
