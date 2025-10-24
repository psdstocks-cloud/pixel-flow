import { Router } from 'express'
import { prisma } from '@pixel-flow/database'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Add credits to user account
router.post('/add-credits', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const { credits } = req.body

    if (!credits || credits <= 0) {
      return res.status(400).json({ error: 'Invalid credits amount' })
    }

    // Update user credits
    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: { 
        credits: { 
          increment: credits 
        } 
      }
    })

    res.json({ 
      success: true, 
      credits: updatedUser.credits 
    })
  } catch (error) {
    console.error('Add credits error:', error)
    res.status(500).json({ error: 'Failed to add credits' })
  }
})

// Process package purchase
router.post('/purchase-package', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const { packageId, paymentMethod } = req.body

    const user = await prisma.profile.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId }
    })

    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ error: 'Package not found or inactive' })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: pkg.price,
        currency: pkg.currency,
        status: 'completed',
        paymentMethod: paymentMethod || 'simulation'
      }
    })

    // Create package purchase
    await prisma.packagePurchase.create({
      data: {
        userId,
        packageId: pkg.id,
        creditsAdded: pkg.credits,
        amountPaid: pkg.price,
        currency: pkg.currency,
        paymentMethod: paymentMethod || 'simulation',
        paymentStatus: 'COMPLETED'
      }
    })

    // Update user credits
    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: {
        credits: {
          increment: Math.floor(pkg.credits)
        }
      }
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: 'CREDIT_PURCHASE',
        amount: pkg.credits,
        description: `Purchased ${pkg.name} package`,
        referenceId: payment.id
      }
    })

    res.json({
      success: true,
      payment,
      newCredits: updatedUser.credits,
      package: pkg
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    res.status(500).json({ error: 'Payment failed' })
  }
})

// Get user payment history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json({ payments })
  } catch (error) {
    console.error('Fetch payments error:', error)
    res.status(500).json({ error: 'Failed to fetch payment history' })
  }
})

export default router
