import { Router, Request, Response } from 'express';
import nehtwService from '../services/nehtwService';

const router = Router();

// ✅ Add this interface at the top
interface StockItem {
  site: string;
  id: string;
  url?: string;
}


/**
 * @route   GET /api/stock/sites
 * @desc    Get list of supported stock sites
 * @access  Public (will add auth later)
 */
router.get('/sites', async (req: Request, res: Response) => {
  try {
    const result = await nehtwService.getStockSites();
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching stock sites:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch stock sites' 
    });
  }
});

/**
 * @route   POST /api/stock/info
 * @desc    Get stock information (cost, preview, etc.)
 * @access  Public
 * @body    { site: string, id: string, url?: string }
 */
router.post('/info', async (req: Request, res: Response) => {
  try {
    const { site, id, url } = req.body;
    
    // Validate input
    if (!url && (!site || !id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either provide url OR both site and id' 
      });
    }
    
    // If URL provided, try to parse it
    let parsedSite = site;
    let parsedId = id;
    
    if (url && !site) {
      const parsed = nehtwService.parseStockURL(url);
      if (!parsed) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or unsupported stock URL format',
        });
      }
      parsedSite = parsed.site;
      parsedId = parsed.id;
    }
    
    const result = await nehtwService.getStockInfo(parsedSite, parsedId, url);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching stock info:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch stock info' 
    });
  }
});

/**
 * @route   POST /api/stock/order
 * @desc    Create a new stock download order
 * @access  Private (TODO: Add auth middleware)
 * @body    { site: string, id: string, url?: string }
 */
router.post('/order', async (req: Request, res: Response) => {
  try {
    const { site, id, url } = req.body;
    
    // Validate input
    if (!url && (!site || !id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either provide url OR both site and id' 
      });
    }
    
    // Parse URL if provided
    let parsedSite = site;
    let parsedId = id;
    
    if (url && !site) {
      const parsed = nehtwService.parseStockURL(url);
      if (!parsed) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or unsupported stock URL format',
        });
      }
      parsedSite = parsed.site;
      parsedId = parsed.id;
    }
    
    // TODO: Check user authentication
    // TODO: Check user balance/credits
    // TODO: Deduct credits before creating order
    
    const result = await nehtwService.createOrder(parsedSite, parsedId, url);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // TODO: Save order to database
    // await prisma.order.create({
    //   data: {
    //     userId: req.user.id,
    //     taskId: result.data.task_id,
    //     site: parsedSite,
    //     stockId: parsedId,
    //     status: 'pending',
    //     cost: result.data.cost,
    //   },
    // });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create order' 
    });
  }
});

/**
 * @route   GET /api/stock/order/:taskId/status
 * @desc    Check order status
 * @access  Private
 */
router.get('/order/:taskId/status', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    // TODO: Verify user owns this order
    
    const result = await nehtwService.checkOrderStatus(taskId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // TODO: Update order status in database
    // await prisma.order.update({
    //   where: { taskId },
    //   data: { 
    //     status: result.data.status,
    //     updatedAt: new Date(),
    //   },
    // });
    
    res.json(result);
  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check order status' 
    });
  }
});

/**
 * @route   GET /api/stock/order/:taskId/download
 * @desc    Generate download link for completed order
 * @access  Private
 */
router.get('/order/:taskId/download', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { responseType = 'any' } = req.query;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    // TODO: Verify user owns this order
    // TODO: Check order status is 'ready'
    
    const result = await nehtwService.generateDownloadLink(
      taskId, 
      responseType as any
    );
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // TODO: Update order status to 'downloaded'
    // TODO: Log download in transaction history
    
    res.json(result);
  } catch (error) {
    console.error('Error generating download link:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate download link' 
    });
  }
});

/**
 * @route   POST /api/stock/download
 * @desc    Complete workflow: Create order + poll + generate download
 * @access  Private
 * @body    { site: string, id: string, url?: string }
 */
router.post('/download', async (req: Request, res: Response) => {
  try {
    const { site, id, url } = req.body;
    
    // Validate input
    if (!url && (!site || !id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either provide url OR both site and id' 
      });
    }
    
    // Parse URL if provided
    let parsedSite = site;
    let parsedId = id;
    
    if (url && !site) {
      const parsed = nehtwService.parseStockURL(url);
      if (!parsed) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or unsupported stock URL format',
        });
      }
      parsedSite = parsed.site;
      parsedId = parsed.id;
    }
    
    // TODO: Check user authentication
    // TODO: Check user balance/credits
    // TODO: Deduct credits
    
    console.log(`🚀 Starting complete download workflow for ${parsedSite}/${parsedId}`);
    
    const result = await nehtwService.downloadStockWorkflow(
      parsedSite,
      parsedId,
      url
    );
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // TODO: Save completed order to database
    
    res.json(result);
  } catch (error) {
    console.error('Error in download workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Download workflow failed' 
    });
  }
});

/**
 * @route   POST /api/stock/batch-download
 * @desc    Download multiple stock assets at once (up to 5)
 * @access  Private
 * @body    { urls: string[] } or { items: [{ site, id }] }
 */
/**
 * @route   POST /api/stock/batch-download
 * @desc    Download multiple stock assets at once (up to 5)
 * @access  Private
 * @body    { urls: string[] } or { items: [{ site, id }] }
 */
router.post('/batch-download', async (req: Request, res: Response) => {
  try {
    const { urls, items } = req.body;
    
    if (!urls && !items) {
      return res.status(400).json({
        success: false,
        error: 'Provide either urls array or items array',
      });
    }
    
    // ✅ FIXED: Added explicit type
    const stockItems: Array<{ site: string; id: string; url?: string }> = [];
    
    // Parse URLs if provided
    if (urls && Array.isArray(urls)) {
      if (urls.length > 5) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 5 URLs allowed per batch',
        });
      }
      
      for (const url of urls) {
        const parsed = nehtwService.parseStockURL(url);
        if (parsed) {
          stockItems.push({ ...parsed, url });
        }
      }
    }
    
    // Use items if provided
    if (items && Array.isArray(items)) {
      if (items.length > 5) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 5 items allowed per batch',
        });
      }
      stockItems.push(...items);
    }
    
    if (stockItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid stock items found',
      });
    }
    
    // TODO: Check total cost against user balance
    
    console.log(`🚀 Starting batch download for ${stockItems.length} items`);
    
    // Process all items in parallel
    const results = await Promise.allSettled(
      stockItems.map(item => 
        nehtwService.downloadStockWorkflow(item.site, item.id, item.url)
      )
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    res.json({
      success: true,
      data: {
        total: stockItems.length,
        successful: successCount,
        failed: failureCount,
        results: results.map((result, index) => ({
          item: stockItems[index],
          success: result.status === 'fulfilled',
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason : null,
        })),
      },
    });
  } catch (error) {
    console.error('Error in batch download:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Batch download failed' 
    });
  }
});


/**
 * @route   POST /api/stock/parse-url
 * @desc    Parse stock URL to extract site and ID
 * @access  Public
 * @body    { url: string }
 */
router.post('/parse-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }
    
    const parsed = nehtwService.parseStockURL(url);
    
    if (!parsed) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or unsupported stock URL format',
      });
    }
    
    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error('Error parsing URL:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse URL' 
    });
  }
});

export default router;