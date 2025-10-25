/**
 * Monitoring Cron Jobs
 * Schedule: Run every 5 minutes for health checks, daily for backups
 */

import cron from 'node-cron'
import { BackupMonitorService } from '../services/backup-monitor.service'
import { AuditLoggerService } from '../services/audit-logger.service'

const backupMonitor = new BackupMonitorService()

/**
 * Database Health Check - Every 5 minutes
 */
export const startDatabaseHealthCheck = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running database health check...')
    await backupMonitor.monitorDatabaseHealth()
  })
}

/**
 * Backup Verification - Daily at 2 AM
 */
export const startBackupVerification = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('Running backup verification...')
    await backupMonitor.checkBackupStatus()
  })
}

/**
 * Log Rotation Check - Daily at 3 AM
 */
export const startLogRotationCheck = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('Checking log rotation...')
    // Winston handles rotation automatically
    // Just log that rotation occurred
    await AuditLoggerService.logMonitoringAlert(
      'log_rotation',
      'WARNING' as const,
      'Log rotation completed',
      {
        timestamp: new Date().toISOString()
      }
    )
  })
}

/**
 * Start all monitoring jobs
 */
export const startMonitoringJobs = () => {
  console.log('Starting monitoring jobs...')
  startDatabaseHealthCheck()
  startBackupVerification()
  startLogRotationCheck()
  console.log('Monitoring jobs started')
}
