/**
 * System Configuration Service
 * Manages application-wide settings with audit logging
 */

import { prisma } from '@pixel-flow/database'
import { AuditLoggerService } from './audit-logger.service'
import { Request } from 'express'

export interface ConfigValue {
  key: string
  value: any
  description?: string
  category?: string
  isPublic?: boolean
}

export class SystemConfigService {
  /**
   * Get configuration value
   */
  static async get(key: string): Promise<any> {
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    })

    return config ? config.value : null
  }

  /**
   * Get all configurations (optionally filtered by category)
   */
  static async getAll(category?: string, includePrivate: boolean = false): Promise<any[]> {
    const where: any = {}

    if (category) {
      where.category = category
    }

    if (!includePrivate) {
      where.isPublic = true
    }

    return prisma.systemConfig.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })
  }

  /**
   * Set configuration value (with audit logging)
   */
  static async set(
    key: string,
    value: any,
    adminId: string,
    adminEmail: string,
    req: Request,
    options?: {
      description?: string
      category?: string
      isPublic?: boolean
    }
  ): Promise<void> {
    // Get old value for audit log
    const oldConfig = await prisma.systemConfig.findUnique({
      where: { key }
    })

    // Update or create
    await prisma.systemConfig.upsert({
      where: { key },
      create: {
        key,
        value,
        description: options?.description,
        category: options?.category || 'general',
        isPublic: options?.isPublic || false,
        updatedBy: adminId
      },
      update: {
        value,
        description: options?.description,
        category: options?.category,
        isPublic: options?.isPublic,
        updatedBy: adminId
      }
    })

    // Log the change
    await AuditLoggerService.logSystemConfigChange(
      adminId,
      adminEmail,
      key,
      oldConfig ? oldConfig.value : null,
      value,
      req
    )
  }

  /**
   * Delete configuration
   */
  static async delete(
    key: string,
    adminId: string,
    adminEmail: string,
    req: Request
  ): Promise<void> {
    const oldConfig = await prisma.systemConfig.findUnique({
      where: { key }
    })

    if (oldConfig) {
      await prisma.systemConfig.delete({
        where: { key }
      })

      // Log deletion
      await AuditLoggerService.logSystemConfigChange(
        adminId,
        adminEmail,
        key,
        oldConfig.value,
        null,
        req
      )
    }
  }

  /**
   * Bulk initialize default configs
   */
  static async initializeDefaults(): Promise<void> {
    const defaults = [
      // Security settings
      {
        key: 'security.max_login_attempts',
        value: 5,
        description: 'Maximum failed login attempts before lockout',
        category: 'security',
        isPublic: false
      },
      {
        key: 'security.lockout_duration_minutes',
        value: 30,
        description: 'Account lockout duration in minutes',
        category: 'security',
        isPublic: false
      },
      {
        key: 'security.session_timeout_hours',
        value: 24,
        description: 'Session timeout in hours',
        category: 'security',
        isPublic: false
      },
      
      // Feature flags
      {
        key: 'features.maintenance_mode',
        value: false,
        description: 'Enable maintenance mode (blocks all non-admin users)',
        category: 'feature_flags',
        isPublic: true
      },
      {
        key: 'features.new_user_registration',
        value: true,
        description: 'Allow new user registration',
        category: 'feature_flags',
        isPublic: true
      },
      {
        key: 'features.google_oauth',
        value: true,
        description: 'Enable Google OAuth login',
        category: 'feature_flags',
        isPublic: true
      },
      
      // Limits
      {
        key: 'limits.max_file_size_mb',
        value: 50,
        description: 'Maximum file upload size in MB',
        category: 'limits',
        isPublic: true
      },
      {
        key: 'limits.max_downloads_per_day',
        value: 100,
        description: 'Maximum downloads per user per day',
        category: 'limits',
        isPublic: false
      },
      {
        key: 'limits.free_credits_on_signup',
        value: 5,
        description: 'Free credits given to new users',
        category: 'limits',
        isPublic: false
      },
      
      // General
      {
        key: 'general.site_name',
        value: 'PixelFlow',
        description: 'Application name',
        category: 'general',
        isPublic: true
      },
      {
        key: 'general.support_email',
        value: 'support@pixelflow.com',
        description: 'Support contact email',
        category: 'general',
        isPublic: true
      }
    ]

    for (const config of defaults) {
      const exists = await prisma.systemConfig.findUnique({
        where: { key: config.key }
      })

      if (!exists) {
        await prisma.systemConfig.create({
          data: config
        })
      }
    }

    console.log('✅ System configurations initialized')
  }
}
