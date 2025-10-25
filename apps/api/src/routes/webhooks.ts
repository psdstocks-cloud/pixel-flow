import express, { Request, Response } from 'express'
import { AuditLoggerService } from '../services/audit-logger.service'
import crypto from 'crypto'

const router = express.Router()

/**
 * Verify Railway webhook signature
 */
function verifyRailwaySignature(req: Request): boolean {
  const signature = req.headers['x-railway-signature'] as string
  const secret = process.env.RAILWAY_WEBHOOK_SECRET
  
  if (!secret || !signature) {
    return false
  }

  const payload = JSON.stringify(req.body)
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Railway Deployment Webhook
 * Tracks: deployments, config changes, service starts/stops
 */
router.post('/railway/deployment', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature (if enabled)
    if (process.env.RAILWAY_WEBHOOK_SECRET && !verifyRailwaySignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const { 
      type, 
      deployment, 
      service, 
      project,
      environment,
      status,
      configChanges,
      environmentVariables,
      user 
    } = req.body

    // Log deployment event
    if (type === 'DEPLOYMENT') {
      await AuditLoggerService.logSystemConfigChange(
        'system',
        user?.email || 'railway@system',
        'deployment',
        {
          service: service?.name,
          environment: environment?.name,
          previousStatus: status?.previous
        },
        {
          service: service?.name,
          environment: environment?.name,
          currentStatus: status?.current,
          deploymentId: deployment?.id
        },
        req
      )
    }

    // Log configuration changes
    if (configChanges && Object.keys(configChanges).length > 0) {
      await AuditLoggerService.logSystemConfigChange(
        user?.id || 'system',
        user?.email || 'railway@system',
        'railway_config',
        configChanges.old || {},
        configChanges.new || {},
        req
      )
    }

    // Log environment variable changes (CRITICAL)
    if (environmentVariables) {
      const changedVars = Object.keys(environmentVariables.changed || {})
      const addedVars = Object.keys(environmentVariables.added || {})
      const removedVars = environmentVariables.removed || []

      if (changedVars.length > 0 || addedVars.length > 0 || removedVars.length > 0) {
        await AuditLoggerService.logSystemConfigChange(
          user?.id || 'system',
          user?.email || 'railway@system',
          'environment_variables',
          {
            changed: changedVars,
            removed: removedVars
          },
          {
            changed: changedVars,
            added: addedVars
          },
          req
        )
      }
    }

    res.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('Railway webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

/**
 * Vercel Deployment Webhook
 * Tracks: frontend deployments, build status
 */
router.post('/vercel/deployment', async (req: Request, res: Response) => {
  try {
    const { 
      type,
      deployment,
      team,
      user,
      project
    } = req.body

    if (type === 'deployment') {
      await AuditLoggerService.logSystemConfigChange(
        user?.id || 'system',
        user?.email || 'vercel@system',
        'vercel_deployment',
        {
          project: project?.name,
          previousDeployment: deployment?.meta?.previousDeploymentId
        },
        {
          project: project?.name,
          deployment: deployment?.url,
          deploymentId: deployment?.id,
          status: deployment?.readyState
        },
        req
      )
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Vercel webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

/**
 * Supabase Database Change Webhook
 * Tracks: schema changes, migrations
 */
router.post('/supabase/schema-change', async (req: Request, res: Response) => {
  try {
    const { 
      type,
      schema,
      table,
      operation,
      user
    } = req.body

    await AuditLoggerService.logSystemConfigChange(
      user?.id || 'system',
      user?.email || 'supabase@system',
      'database_schema',
      {
        schema: schema?.name,
        operation: 'before_change'
      },
      {
        schema: schema?.name,
        table: table?.name,
        operation
      },
      req
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Supabase webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

/**
 * Generic System Alert Webhook
 * For custom monitoring tools (Sentry, Datadog, etc.)
 */
router.post('/system/alert', async (req: Request, res: Response) => {
  try {
    const { 
      alertType,
      severity,
      message,
      metrics,
      source
    } = req.body

    await AuditLoggerService.logMonitoringAlert(
      alertType,
      severity || 'WARNING',
      message,
      {
        source,
        ...metrics
      }
    )

    res.json({ success: true })
  } catch (error) {
    console.error('System alert webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

export default router
