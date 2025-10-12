import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@pixel-flow/database'
import { config } from '../../config'
import { AppError } from '../../middleware/errorHandler'
import { authRateLimit } from '../../middleware/rateLimit'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

// Register endpoint
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = registerSchema.parse(req.body)

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw new AppError(400, 'User already exists with this email')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'FREE',
      credits: 20, // Welcome bonus
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      credits: true,
      createdAt: true,
    }
  })

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )

  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
    message: 'User registered successfully'
  })
}

// Login endpoint
export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !user.password) {
    throw new AppError(401, 'Invalid credentials')
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials')
  }

  // Check if user is active
  if (!user.isActive || user.isBanned) {
    throw new AppError(401, 'Account is inactive or banned')
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits,
      },
      token,
    },
    message: 'Login successful'
  })
}

// Forgot password endpoint
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body)

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If an account with that email exists, we sent a password reset link'
    })
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user.id, type: 'password_reset' },
    config.jwt.secret,
    { expiresIn: '1h' }
  )

  // Store reset token in database
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      ipAddress: req.ip,
    }
  })

  // TODO: Send email with reset link
  // await sendPasswordResetEmail(user.email, resetToken)

  res.json({
    success: true,
    message: 'If an account with that email exists, we sent a password reset link'
  })
}

// Reset password endpoint
export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body)

  // Find reset token
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
    throw new AppError(400, 'Invalid or expired reset token')
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Update user password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword }
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() }
    })
  ])

  res.json({
    success: true,
    message: 'Password reset successfully'
  })
}

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  const user = (req as any).user

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      credits: true,
      storageUsedBytes: true,
      storageLimit: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    }
  })

  res.json({
    success: true,
    data: fullUser
  })
}
