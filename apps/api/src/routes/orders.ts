import { Router, Request, Response } from 'express';
import { prisma } from '@pixel-flow/database';
import { nehtwClient } from '../utils/nehtwClient';
import { parseStockURL } from '../utils/stockUrlParser';

const router = Router();

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { urls, responseType = 'any' } = req.body;
    const userId = req.headers['x-user-id'] as string;

    console.log('📥 Batch order request:', { userId, urls, responseType });

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, error: 'URLs array required' });
    }

    if (urls.length > 5) {
      return res.status(400).json({ success: false, error: 'Maximum 5 URLs per batch' });
    }

    // Parse URLs
    const parsedUrls = urls
      .map(url => parseStockURL(url))
      .filter((parsed): parsed is NonNullable<typeof parsed> => parsed !== null);

    console.log('🔗 Parsed URLs:', parsedUrls);

    if (parsedUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid stock URLs provided',
        details: 'Please provide valid URLs from supported stock sites'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log('👤 User found:', { id: user.id, balance: user.balance });

    // Get stock sites for pricing
    const stockSites = await prisma.stockSite.findMany();
    const stockSiteMap = new Map(stockSites.map(site => [site.name.toLowerCase(), site]));

    let totalCost = 0;
    for (const parsed of parsedUrls) {
      const site = stockSiteMap.get(parsed.site.toLowerCase());
      if (site) {
        totalCost += site.price;
      } else {
        console.warn(`⚠️ No pricing found for site: ${parsed.site}`);
      }
    }

    console.log('💰 Total cost:', totalCost, 'User balance:', user.balance);

    if (user.balance < totalCost) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        required: totalCost,
        available: user.balance,
      });
    }

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        userId,
        totalOrders: parsedUrls.length,
        totalCost,
        status: 'PROCESSING',
      },
    });

    console.log('📦 Batch created:', batch.id);

    const orders = [];
    const failedUrls: Array<{url: string, reason: string}> = [];

    // Process each URL
    for (const parsed of parsedUrls) {
      const site = stockSiteMap.get(parsed.site.toLowerCase());
      if (!site) {
        failedUrls.push({ url: parsed.url, reason: 'Site not supported' });
        continue;
      }

      console.log('🚀 Calling nehtw API for:', parsed.url);

      try {
        const nehtwResponse = await nehtwClient.createOrder(parsed.url, responseType);
        
        console.log('📨 nehtw response:', nehtwResponse);

        if (!nehtwResponse.success || !nehtwResponse.task_id) {
          failedUrls.push({ 
            url: parsed.url, 
            reason: nehtwResponse.error_message || 'Order creation failed' 
          });
          continue;
        }

        const order = await prisma.order.create({
          data: {
            userId,
            batchId: batch.id,
            taskId: nehtwResponse.task_id,
            site: parsed.site,
            stockId: parsed.id,
            stockUrl: parsed.url,
            status: 'PROCESSING',
            cost: site.price,
          },
        });

        orders.push(order);
      } catch (error: any) {
        console.error('❌ Error creating order:', error);
        failedUrls.push({ 
          url: parsed.url, 
          reason: error.message || 'Unknown error' 
        });
      }
    }

    // Update batch
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        totalOrders: orders.length,
        status: orders.length === 0 ? 'FAILED' : 'PROCESSING',
      },
    });

    // Deduct balance if successful orders
    if (orders.length > 0) {
      const actualCost = orders.reduce((sum, o) => sum + o.cost, 0);
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: actualCost } },
      });
      console.log('✅ Balance deducted:', actualCost);
    }

    return res.json({
      success: true,
      batchId: batch.id,
      orders,
      totalCost: orders.reduce((sum, o) => sum + o.cost, 0),
      remainingBalance: user.balance - orders.reduce((sum, o) => sum + o.cost, 0),
      failedUrls: failedUrls.length > 0 ? failedUrls : undefined,
    });
  } catch (error: any) {
    console.error('💥 Batch order error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:taskId/poll', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const order = await prisma.order.findFirst({
      where: { taskId, userId },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'COMPLETED' || order.status === 'ERROR' || order.status === 'TIMEOUT') {
      return res.json({ success: true, order, status: order.status });
    }

    const nehtwResponse = await nehtwClient.pollOrder(taskId);

    let updateData: any = {
      retryCount: { increment: 1 },
    };

    if (nehtwResponse.success) {
      if (nehtwResponse.status === 'completed' && nehtwResponse.download_link) {
        updateData.status = 'COMPLETED';
        updateData.downloadLink = nehtwResponse.download_link;
        updateData.fileName = nehtwResponse.file_name || 'download';
      } else if (nehtwResponse.status === 'processing') {
        updateData.status = 'PROCESSING';
      } else if (nehtwResponse.status === 'error') {
        updateData.status = 'ERROR';
        updateData.errorMessage = nehtwResponse.error_message || 'Unknown error';
      }
    } else {
      updateData.status = 'ERROR';
      updateData.errorMessage = nehtwResponse.error_message || 'Polling failed';
    }

    if (order.retryCount >= 60 && updateData.status !== 'COMPLETED') {
      updateData.status = 'TIMEOUT';
      updateData.errorMessage = 'Order timed out after 3 minutes';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    return res.json({ success: true, order: updatedOrder, status: updatedOrder.status });
  } catch (error: any) {
    console.error('Poll order error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/batches/:batchId', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, userId },
      include: { orders: true },
    });

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const stats = {
      total: batch.orders.length,
      completed: batch.orders.filter(o => o.status === 'COMPLETED').length,
      failed: batch.orders.filter(o => o.status === 'ERROR' || o.status === 'TIMEOUT').length,
      processing: batch.orders.filter(o => ['PROCESSING', 'READY', 'DOWNLOADING'].includes(o.status)).length,
    };

    let batchStatus = batch.status;
    if (stats.processing === 0) {
      if (stats.failed === stats.total) {
        batchStatus = 'FAILED';
      } else if (stats.completed === stats.total) {
        batchStatus = 'COMPLETED';
      } else {
        batchStatus = 'PARTIAL';
      }

      await prisma.batch.update({
        where: { id: batchId },
        data: {
          status: batchStatus,
          completedOrders: stats.completed,
          failedOrders: stats.failed,
        },
      });
    }

    return res.json({
      success: true,
      batch: {
        ...batch,
        status: batchStatus,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Get batch error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
