import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import nehtwService from '../services/nehtwService'; // ✅ CORRECT IMPORT

const router = Router();
const prisma = new PrismaClient();

/**
 * Create a new order
 * POST /api/orders
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url, site, id, responseType = 'any' } = req.body;

    if (!url && (!site || !id)) {
      return res.status(400).json({
        success: false,
        error: 'Either url or (site + id) is required',
      });
    }

    // Parse URL if provided
    let parsed = { site, id, url };
    if (url && !site) {
      const parsedUrl = nehtwService.parseStockURL(url);
      if (!parsedUrl) {
        return res.status(400).json({
          success: false,
          error: 'Invalid stock URL format',
        });
      }
      parsed = { ...parsedUrl, url };
    }

    // ✅ FIXED: Use nehtwService instead of nehtwService
    const nehtwResponse = await nehtwService.createOrder(
      parsed.site,
      parsed.id,
      parsed.url
    );

    if (!nehtwResponse.success) {
      return res.status(500).json(nehtwResponse);
    }

    // TODO: Save order to database
    // const order = await prisma.order.create({
    //   data: {
    //     taskId: nehtwResponse.data.task_id,
    //     site: parsed.site,
    //     stockId: parsed.id,
    //     status: 'pending',
    //     cost: nehtwResponse.data.cost,
    //   },
    // });

    res.json({
      success: true,
      data: nehtwResponse.data,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get order status
 * GET /api/orders/:taskId/status
 */
router.get('/:taskId/status', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    // ✅ FIXED: Use nehtwService instead of nehtwService
    const nehtwResponse = await nehtwService.checkOrderStatus(taskId);

    if (!nehtwResponse.success) {
      return res.status(500).json(nehtwResponse);
    }

    // TODO: Update order status in database
    // await prisma.order.update({
    //   where: { taskId },
    //   data: { status: nehtwResponse.data.status },
    // });

    res.json({
      success: true,
      data: nehtwResponse.data,
    });
  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Generate download link
 * GET /api/orders/:taskId/download
 */
router.get('/:taskId/download', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    // ✅ Use nehtwService
    const nehtwResponse = await nehtwService.generateDownloadLink(taskId);

    if (!nehtwResponse.success) {
      return res.status(500).json(nehtwResponse);
    }

    res.json({
      success: true,
      data: nehtwResponse.data,
    });
  } catch (error) {
    console.error('Error generating download link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Complete download workflow
 * POST /api/orders/download-workflow
 */
router.post('/download-workflow', async (req: Request, res: Response) => {
  try {
    const { url, site, id } = req.body;

    if (!url && (!site || !id)) {
      return res.status(400).json({
        success: false,
        error: 'Either url or (site + id) is required',
      });
    }

    let parsed = { site, id, url };
    if (url && !site) {
      const parsedUrl = nehtwService.parseStockURL(url);
      if (!parsedUrl) {
        return res.status(400).json({
          success: false,
          error: 'Invalid stock URL format',
        });
      }
      parsed = { ...parsedUrl, url };
    }

    // ✅ Use the complete workflow method
    const nehtwResponse = await nehtwService.downloadStockWorkflow(
      parsed.site,
      parsed.id,
      parsed.url
    );

    if (!nehtwResponse.success) {
      return res.status(500).json(nehtwResponse);
    }

    res.json({
      success: true,
      data: nehtwResponse.data,
    });
  } catch (error) {
    console.error('Error in download workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
