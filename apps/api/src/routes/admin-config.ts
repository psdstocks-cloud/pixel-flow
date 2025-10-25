import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../lib/async-handler'
import { ValidationError } from '../lib/errors'
import { SystemConfigService } from '../services/system-config.service'

const router = express.Router()

router.get('/', requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { category } = req.query
  const configs = await SystemConfigService.getAll(category as string | undefined, true)
  res.json({ success: true, configs })
}))

router.get('/:key', requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
  const value = await SystemConfigService.get(req.params.key)
  if (value === null) {
    throw new ValidationError('Configuration not found')
  }
  res.json({ success: true, value })
}))

router.put('/:key', requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { value, description, category, isPublic } = req.body
  const admin = req.user!

  if (value === undefined) {
    throw new ValidationError('Value is required')
  }

  if (!admin.email) {
    throw new ValidationError('Admin email is required')
  }

  await SystemConfigService.set(
    req.params.key,
    value,
    admin.id,
    admin.email, // Type assertion ensures this is string
    req,
    {
      description,
      category,
      isPublic
    }
  )

  res.json({ success: true, message: 'Configuration updated successfully', key: req.params.key, value })
}))

router.delete('/:key', requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
  const admin = req.user!

  if (!admin.email) {
    throw new ValidationError('Admin email is required')
  }

  await SystemConfigService.delete(
    req.params.key,
    admin.id,
    admin.email, // Type assertion ensures this is string
    req
  )

  res.json({ success: true, message: 'Configuration deleted successfully' })
}))

router.get('/public/all', asyncHandler(async (req, res) => {
  const configs = await SystemConfigService.getAll(undefined, false)
  const publicConfigs: Record<string, any> = {}
  configs.forEach(config => {
    publicConfigs[config.key] = config.value
  })
  res.json({ success: true, configs: publicConfigs })
}))

export default router
