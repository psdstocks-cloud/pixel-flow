/**
 * Comprehensive Audit Logging Service
 * GDPR, SOC 2, PCI-DSS Compliant
 */

import { prisma } from '@pixel-flow/database'
import { Request } from 'express'
import winston from 'winston'

// Winston logger for file-based audit trail
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'pixel-flow-api' },
  transports: [
    // Separate file for audit logs (required for PCI-DSS)
    new winston.transports.File({ 
      filename: 'logs/audit.log',
      maxsize: 10485760, // 10MB
      maxFiles: 365, // Keep 1 year (PCI-DSS requirement)
    }),
    // Critical events in separate file
    new winston.transports.File({ 
      filename: 'logs/audit-critical.log',
      level: 'error',
      maxsize: 10485760,
      maxFiles: 365,
    }),
  ]
})

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  winstonLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

interface AuditLogData {
  eventType: string
  eventCategory: string
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  userId?: string
  userEmail?: string
  actorType?: string
  ipAddress: string
  userAgent?: string
  sessionId?: string
  action: string
  resource?: string
  resourceId?: string
  oldValue?: any
  newValue?: any
  status?: string
  errorMessage?: string
  metadata?: Record<string, any>
  isPii?: boolean
  isPayment?: boolean
  requiresReview?: boolean
}

export class AuditLoggerService {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      // Store in database
      await prisma.auditLog.create({
        data: {
          eventType: data.eventType as any,
          eventCategory: data.eventCategory as any,
          severity: data.severity || 'INFO',
          userId: data.userId,
          userEmail: data.userEmail,
          actorType: data.actorType || 'user',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          oldValue: data.oldValue,
          newValue: data.newValue,
          status: data.status || 'success',
          errorMessage: data.errorMessage,
          metadata: data.metadata,
          isPii: data.isPii || false,
          isPayment: data.isPayment || false,
          requiresReview: data.requiresReview || false,
        }
      })

      // Also log to Winston (file-based)
      winstonLogger.info({
        ...data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      // Never let audit logging break the application
      console.error('Audit log failed:', error)
      winstonLogger.error('Audit log database write failed', { error, data })
    }
  }

  /**
   * Extract context from Express request
   */
  static extractContext(req: Request): { ipAddress: string; userAgent?: string; sessionId?: string } {
    return {
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown',
      userAgent: req.headers['user-agent'],
      sessionId: req.headers['x-session-id']?.toString()
    }
  }

  // ============================================
  // AUTHENTICATION EVENTS
  // ============================================

  static async logUserLogin(userId: string, userEmail: string, req: Request, success: boolean) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'AUTHENTICATION',
      eventCategory: 'SECURITY',
      severity: success ? 'INFO' : 'WARNING',
      userId,
      userEmail,
      action: success ? 'USER_LOGIN_SUCCESS' : 'USER_LOGIN_FAILED',
      status: success ? 'success' : 'failure',
      isPii: true,
      ...context
    })
  }

  static async logUserLogout(userId: string, userEmail: string, req: Request) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'AUTHENTICATION',
      eventCategory: 'SECURITY',
      userId,
      userEmail,
      action: 'USER_LOGOUT',
      isPii: true,
      ...context
    })
  }

  static async logUserRegistration(userId: string, userEmail: string, req: Request) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'AUTHENTICATION',
      eventCategory: 'USER_MANAGEMENT',
      userId,
      userEmail,
      action: 'USER_REGISTRATION',
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  // ============================================
  // PASSWORD EVENTS
  // ============================================

  static async logPasswordChange(userId: string, userEmail: string, req: Request) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'AUTHENTICATION',
      eventCategory: 'SECURITY',
      severity: 'WARNING',
      userId,
      userEmail,
      action: 'PASSWORD_CHANGE',
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  static async logPasswordReset(userEmail: string, req: Request) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'AUTHENTICATION',
      eventCategory: 'SECURITY',
      severity: 'WARNING',
      userEmail,
      action: 'PASSWORD_RESET_REQUESTED',
      isPii: true,
      ...context
    })
  }

  // ============================================
  // DATA ACCESS EVENTS
  // ============================================

  static async logDataAccess(
    userId: string,
    userEmail: string,
    resource: string,
    resourceId: string,
    req: Request,
    metadata?: Record<string, any>
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'DATA_ACCESS',
      eventCategory: 'DATA_PROCESSING',
      userId,
      userEmail,
      resource,
      resourceId,
      action: 'DATA_ACCESS',
      metadata,
      isPii: true,
      ...context
    })
  }

  // ============================================
  // DATA MODIFICATION EVENTS
  // ============================================

  static async logDataModification(
    userId: string,
    userEmail: string,
    resource: string,
    resourceId: string,
    oldValue: any,
    newValue: any,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'DATA_MODIFICATION',
      eventCategory: 'DATA_PROCESSING',
      severity: 'WARNING',
      userId,
      userEmail,
      resource,
      resourceId,
      oldValue,
      newValue,
      action: 'DATA_UPDATE',
      isPii: true,
      ...context
    })
  }

  static async logDataDeletion(
    userId: string,
    userEmail: string,
    resource: string,
    resourceId: string,
    oldValue: any,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'DATA_DELETION',
      eventCategory: 'DATA_PROCESSING',
      severity: 'CRITICAL',
      userId,
      userEmail,
      resource,
      resourceId,
      oldValue,
      action: 'DATA_DELETE',
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  // ============================================
  // ROLE & PERMISSION EVENTS
  // ============================================

  static async logRoleChange(
    adminUserId: string,
    adminEmail: string,
    targetUserId: string,
    targetEmail: string,
    oldRole: string,
    newRole: string,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'AUTHORIZATION',
      eventCategory: 'USER_MANAGEMENT',
      severity: 'CRITICAL',
      userId: adminUserId,
      userEmail: adminEmail,
      resource: 'user_role',
      resourceId: targetUserId,
      oldValue: { role: oldRole, targetEmail },
      newValue: { role: newRole, targetEmail },
      action: 'ROLE_CHANGE',
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  // ============================================
  // PAYMENT EVENTS
  // ============================================

  static async logPaymentEvent(
    userId: string,
    userEmail: string,
    action: string,
    amount: number,
    paymentId: string,
    req: Request,
    metadata?: Record<string, any>
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'PAYMENT',
      eventCategory: 'FINANCIAL',
      severity: 'WARNING',
      userId,
      userEmail,
      resource: 'payment',
      resourceId: paymentId,
      action,
      metadata: { ...metadata, amount },
      isPayment: true,
      requiresReview: true,
      ...context
    })
  }

  // ============================================
  // SESSION EVENTS
  // ============================================

  static async logSessionTermination(
    userId: string,
    userEmail: string,
    reason: string,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'SESSION_MANAGEMENT',
      eventCategory: 'SECURITY',
      severity: 'WARNING',
      userId,
      userEmail,
      action: 'SESSION_TERMINATED',
      metadata: { reason },
      isPii: true,
      ...context
    })
  }

  // ============================================
  // SECURITY EVENTS
  // ============================================

  static async logSecurityEvent(
    severity: 'WARNING' | 'ERROR' | 'CRITICAL',
    action: string,
    req: Request,
    metadata?: Record<string, any>
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'SECURITY_EVENT',
      eventCategory: 'SECURITY',
      severity,
      action,
      metadata,
      requiresReview: severity === 'CRITICAL',
      ...context
    })
  }

  // ============================================
  // API ACCESS TO SENSITIVE DATA
  // ============================================

  static async logSensitiveApiAccess(
    userId: string,
    userEmail: string,
    endpoint: string,
    method: string,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'DATA_ACCESS',
      eventCategory: 'API',
      userId,
      userEmail,
      resource: 'api_endpoint',
      resourceId: endpoint,
      action: `API_${method}_${endpoint}`,
      metadata: { method, endpoint },
      isPii: true,
      ...context
    })
  }

  // ============================================
  // GDPR-SPECIFIC EVENTS
  // ============================================

  /**
   * Data Portability - User requests data export (GDPR Article 20)
   */
  static async logDataPortabilityRequest(
    userId: string,
    userEmail: string,
    exportFormat: string,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'DATA_EXPORT',
      eventCategory: 'COMPLIANCE',
      severity: 'CRITICAL',
      userId,
      userEmail,
      action: 'GDPR_DATA_PORTABILITY_REQUEST',
      metadata: { exportFormat, article: 'GDPR Article 20' },
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  /**
   * Right to be Forgotten - User requests account deletion (GDPR Article 17)
   */
  static async logRightToBeForgotten(
    userId: string,
    userEmail: string,
    reason: string,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'DATA_DELETION',
      eventCategory: 'COMPLIANCE',
      severity: 'CRITICAL',
      userId,
      userEmail,
      action: 'GDPR_RIGHT_TO_BE_FORGOTTEN',
      metadata: { reason, article: 'GDPR Article 17' },
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  /**
   * Consent Management - Marketing/cookie consent changes
   */
  static async logConsentChange(
    userId: string,
    userEmail: string,
    consentType: 'marketing' | 'analytics' | 'cookies' | 'third_party',
    granted: boolean,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'CONSENT_MANAGEMENT',
      eventCategory: 'COMPLIANCE',
      userId,
      userEmail,
      action: granted ? 'CONSENT_GRANTED' : 'CONSENT_WITHDRAWN',
      metadata: { consentType, timestamp: new Date().toISOString() },
      isPii: true,
      ...context
    })
  }

  /**
   * Data Breach Notification (GDPR Article 33)
   */
  static async logDataBreach(
    severity: 'WARNING' | 'ERROR' | 'CRITICAL',
    affectedRecords: number,
    breachType: string,
    description: string,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'SECURITY_EVENT',
      eventCategory: 'SECURITY',
      severity,
      actorType: 'system',
      action: 'DATA_BREACH_DETECTED',
      metadata: { 
        affectedRecords, 
        breachType, 
        description,
        article: 'GDPR Article 33',
        notificationRequired: affectedRecords > 0
      },
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  /**
   * Third-Party Data Sharing
   */
  static async logThirdPartyDataSharing(
    userId: string,
    userEmail: string,
    thirdParty: string,
    dataShared: string[],
    purpose: string,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'DATA_ACCESS',
      eventCategory: 'COMPLIANCE',
      severity: 'WARNING',
      userId,
      userEmail,
      action: 'THIRD_PARTY_DATA_SHARING',
      metadata: { thirdParty, dataShared, purpose },
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  // ============================================
  // SOC 2-SPECIFIC EVENTS
  // ============================================

  /**
   * System Configuration Changes
   */
  static async logSystemConfigChange(
    adminUserId: string,
    adminEmail: string,
    configKey: string,
    oldValue: any,
    newValue: any,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'SYSTEM_CONFIG',
      eventCategory: 'SYSTEM',
      severity: 'CRITICAL',
      userId: adminUserId,
      userEmail: adminEmail,
      actorType: 'admin',
      action: 'SYSTEM_CONFIG_CHANGE',
      resource: 'system_config',
      resourceId: configKey,
      oldValue,
      newValue,
      requiresReview: true,
      ...context
    })
  }

  /**
   * Access Control Changes - New users, permission modifications
   */
  static async logAccessControlChange(
    adminUserId: string,
    adminEmail: string,
    targetUserId: string,
    targetEmail: string,
    changeType: 'user_added' | 'user_removed' | 'permission_changed',
    details: Record<string, any>,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'AUTHORIZATION',
      eventCategory: 'USER_MANAGEMENT',
      severity: 'CRITICAL',
      userId: adminUserId,
      userEmail: adminEmail,
      actorType: 'admin',
      resource: 'access_control',
      resourceId: targetUserId,
      action: `ACCESS_CONTROL_${changeType.toUpperCase()}`,
      metadata: { targetEmail, ...details },
      isPii: true,
      requiresReview: true,
      ...context
    })
  }

  /**
   * Encryption Key Rotation
   */
  static async logEncryptionKeyRotation(
    keyType: string,
    keyId: string,
    rotatedBy: string,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'SYSTEM_CONFIG',
      eventCategory: 'SECURITY',
      severity: 'CRITICAL',
      actorType: 'admin',
      userEmail: rotatedBy,
      action: 'ENCRYPTION_KEY_ROTATION',
      resource: 'encryption_key',
      resourceId: keyId,
      metadata: { keyType, rotatedAt: new Date().toISOString() },
      requiresReview: true,
      ...context
    })
  }

  /**
   * Backup Operations
   */
  static async logBackupOperation(
    backupType: 'full' | 'incremental' | 'differential',
    status: 'success' | 'failure',
    sizeBytes: number,
    duration: number,
    errorMessage?: string
  ) {
    await this.log({
      eventType: 'SYSTEM_CONFIG',
      eventCategory: 'SYSTEM',
      severity: status === 'failure' ? 'ERROR' : 'INFO',
      actorType: 'system',
      action: `BACKUP_${status.toUpperCase()}`,
      metadata: { 
        backupType, 
        sizeBytes, 
        duration,
        timestamp: new Date().toISOString()
      },
      status,
      errorMessage,
      requiresReview: status === 'failure',
      ipAddress: 'system',
    })
  }

  /**
   * Monitoring Alerts - System health issues
   */
  static async logMonitoringAlert(
    alertType: string,
    severity: 'WARNING' | 'ERROR' | 'CRITICAL',
    message: string,
    metrics: Record<string, any>
  ) {
    await this.log({
      eventType: 'SECURITY_EVENT',
      eventCategory: 'SYSTEM',
      severity,
      actorType: 'system',
      action: 'MONITORING_ALERT',
      metadata: { alertType, metrics, message },
      requiresReview: severity === 'CRITICAL',
      ipAddress: 'system',
    })
  }

  // ============================================
  // PCI-DSS-SPECIFIC EVENTS
  // ============================================

  /**
   * Cardholder Data Access (PCI-DSS Requirement 10.2.1)
   */
  static async logCardholderDataAccess(
    userId: string,
    userEmail: string,
    cardLast4: string,
    accessType: 'view' | 'process' | 'modify' | 'delete',
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'DATA_ACCESS',
      eventCategory: 'FINANCIAL',
      severity: 'CRITICAL',
      userId,
      userEmail,
      action: `CARDHOLDER_DATA_${accessType.toUpperCase()}`,
      resource: 'payment_card',
      resourceId: `****${cardLast4}`,
      metadata: { pciRequirement: '10.2.1' },
      isPayment: true,
      requiresReview: true,
      ...context
    })
  }

  /**
   * Firewall Rule Changes (PCI-DSS Requirement 1.1.7)
   */
  static async logFirewallRuleChange(
    adminUserId: string,
    adminEmail: string,
    ruleAction: 'added' | 'modified' | 'deleted',
    ruleDetails: Record<string, any>,
    req: Request
  ) {
    const context = this.extractContext(req)
    await this.log({
      eventType: 'SYSTEM_CONFIG',
      eventCategory: 'SECURITY',
      severity: 'CRITICAL',
      userId: adminUserId,
      userEmail: adminEmail,
      actorType: 'admin',
      action: `FIREWALL_RULE_${ruleAction.toUpperCase()}`,
      resource: 'firewall',
      metadata: { ...ruleDetails, pciRequirement: '1.1.7' },
      requiresReview: true,
      ...context
    })
  }

  /**
   * Anti-Malware Updates (PCI-DSS Requirement 5.2)
   */
  static async logAntiMalwareUpdate(
    updateType: 'definitions' | 'engine' | 'full',
    version: string,
    status: 'success' | 'failure',
    errorMessage?: string
  ) {
    await this.log({
      eventType: 'SYSTEM_CONFIG',
      eventCategory: 'SECURITY',
      severity: status === 'failure' ? 'ERROR' : 'INFO',
      actorType: 'system',
      action: 'ANTIMALWARE_UPDATE',
      metadata: { 
        updateType, 
        version, 
        pciRequirement: '5.2',
        timestamp: new Date().toISOString()
      },
      status,
      errorMessage,
      requiresReview: status === 'failure',
      ipAddress: 'system',
    })
  }

  /**
   * Vulnerability Scan Results (PCI-DSS Requirement 11.2)
   */
  static async logVulnerabilityScan(
    scanType: 'internal' | 'external' | 'asv',
    vulnerabilitiesFound: number,
    criticalCount: number,
    scanProvider: string,
    reportUrl?: string
  ) {
    await this.log({
      eventType: 'SECURITY_EVENT',
      eventCategory: 'COMPLIANCE',
      severity: criticalCount > 0 ? 'CRITICAL' : vulnerabilitiesFound > 0 ? 'WARNING' : 'INFO',
      actorType: 'system',
      action: 'VULNERABILITY_SCAN_COMPLETED',
      metadata: { 
        scanType, 
        vulnerabilitiesFound, 
        criticalCount,
        scanProvider,
        reportUrl,
        pciRequirement: '11.2',
        timestamp: new Date().toISOString()
      },
      requiresReview: criticalCount > 0,
      ipAddress: 'system',
    })
  }

  /**
   * Penetration Test Results (PCI-DSS Requirement 11.3)
   */
  static async logPenetrationTest(
    testType: 'internal' | 'external' | 'application',
    findingsCount: number,
    criticalCount: number,
    testProvider: string,
    reportUrl?: string
  ) {
    await this.log({
      eventType: 'SECURITY_EVENT',
      eventCategory: 'COMPLIANCE',
      severity: criticalCount > 0 ? 'CRITICAL' : 'WARNING',
      actorType: 'system',
      action: 'PENETRATION_TEST_COMPLETED',
      metadata: { 
        testType, 
        findingsCount, 
        criticalCount,
        testProvider,
        reportUrl,
        pciRequirement: '11.3',
        timestamp: new Date().toISOString()
      },
      requiresReview: true,
      ipAddress: 'system',
    })
  }
}
