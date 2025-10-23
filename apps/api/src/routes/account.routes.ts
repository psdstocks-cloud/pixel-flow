import { Router, Request, Response } from 'express';
import nehtwService from '../services/nehtwService';

const router = Router();

/**
 * @route   GET /api/account/balance
 * @desc    Get NEHTW account balance
 * @access  Private (admin only)
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const result = await nehtwService.getAccountBalance();
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching account balance:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch balance' 
    });
  }
});

export default router;
