import { Router, Request, Response } from 'express';
import { prisma } from '@pixel-flow/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('Get packages error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load packages' });
  }
});

router.get('/stock-sites', async (req: Request, res: Response) => {
  try {
    const stockSites = await prisma.stockSite.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return res.json({
      success: true,
      stockSites,
    });
  } catch (error) {
    console.error('Get stock sites error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load stock sites' });
  }
});

router.post('/purchase', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.body;
    const userId = req.headers['x-user-id'] as string;

    console.log('💳 Purchase request:', { userId, packageId });

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        packageId,
        amount: pkg.price,
        pointsReceived: pkg.points,
        status: 'completed',
        paymentMethod: 'free_credit',
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: pkg.points },
      },
    });

    console.log('✅ Purchase completed:', {
      transactionId: transaction.id,
      pointsAdded: pkg.points,
      newBalance: updatedUser.balance,
    });

    return res.json({
      success: true,
      transaction,
      newBalance: updatedUser.balance,
      message: `Successfully added ${pkg.points} points to your account!`,
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ success: false, error: 'Purchase failed' });
  }
});

router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load transactions' });
  }
});

export default router;