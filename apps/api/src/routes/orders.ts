import { Router } from 'express';
import { OrderStatus, BatchStatus } from '@prisma/client';
import { authMiddleware, requireNehtwKey } from '../middleware/auth';
import { asyncHandler, APIError } from '../middleware/errorHandler';
import { NehtwAPIClient } from '../utils/nehtwClient';
import { parseStockURL, validateURLs, requiresFullURL } from '../utils/stockUrlParser';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * POST /api/orders/batch
 * Create batch order (Step 1 & 2 combined)
 */
router.post(
  '/orders/batch',
  authMiddleware,
  requireNehtwKey,
  asyncHandler(async (req, res) => {
    const { urls, responseType = 'any' } = req.body;
    const user = req.user!; // Assert user exists after authMiddleware

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new APIError('URLs array is required', 400);
    }

    if (urls.length > 5) {
      throw new APIError('Maximum 5 URLs per batch', 400);
    }

    // Validate response type
    const validResponseTypes = ['any', 'gdrive', 'mydrivelink', 'asia'];
    if (!validResponseTypes.includes(responseType)) {
      throw new APIError('Invalid response type', 400);
    }

    // Parse and validate URLs
    const { valid: parsedUrls, invalid: invalidUrls } = validateURLs(urls);

    if (invalidUrls.length > 0) {
      throw new APIError(
        `Invalid URLs detected: ${invalidUrls.join(', ')}`,
        400
      );
    }

    // Initialize Nehtw client
    const client = new NehtwAPIClient(user.nehtwApiKey!);

    // Step 1: Fetch stock info for all URLs
    const stockInfoPromises = parsedUrls.map(async ({ site, id, url }) => {
      try {
        const needsFullURL = requiresFullURL(site);
        const stockInfo = await client.getStockInfo(
          site,
          id,
          needsFullURL ? url : undefined
        );
        return { url, site, id, stockInfo, error: null };
      } catch (err: any) {
        return {
          url,
          site,
          id,
          stockInfo: null,
          error: err.message || 'Failed to fetch info',
        };
      }
    });

    const stockResults = await Promise.all(stockInfoPromises);

    // Filter successful results
    const successfulResults = stockResults.filter((r) => r.stockInfo);

    if (successfulResults.length === 0) {
      throw new APIError('Failed to fetch info for all URLs', 400);
    }

    // Calculate total cost
    const totalCost = successfulResults.reduce(
      (sum, r) => sum + (r.stockInfo!.cost || 0),
      0
    );

    // Check user balance
    if (user.balance < totalCost) {
      throw new APIError(
        `Insufficient balance. Required: ${totalCost} pts, Available: ${user.balance} pts`,
        400
      );
    }

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        userId: user.id,
        totalOrders: successfulResults.length,
        totalCost,
        status: BatchStatus.PROCESSING,
      },
    });

    // Step 2: Create orders with Nehtw
    const orderPromises = successfulResults.map(
      async ({ url, site, id, stockInfo }, index) => {
        try {
          const needsFullURL = requiresFullURL(site);
          const taskId = await client.createOrder(
            site,
            id,
            needsFullURL ? url : undefined
          );

          // Create order in database
          return await prisma.order.create({
            data: {
              userId: user.id,
              taskId,
              site,
              stockId: id,
              stockUrl: url,
              cost: stockInfo!.cost,
              status: OrderStatus.PROCESSING,
              responseType,
              batchId: batch.id,
              batchOrder: index,
              stockTitle: stockInfo!.title,
              stockImage: stockInfo!.image,
              stockAuthor: stockInfo!.author,
              stockFormat: stockInfo!.ext,
              stockSize: stockInfo!.sizeInBytes,
              stockSource: stockInfo!.source,
            },
          });
        } catch (err: any) {
          console.error(`Order creation failed for ${url}:`, err);
          return null;
        }
      }
    );

    const orders = (await Promise.all(orderPromises)).filter(Boolean);

    if (orders.length === 0) {
      throw new APIError('Failed to create any orders', 500);
    }

    // Deduct points from user
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: totalCost } },
    });

    res.json({
      success: true,
      batchId: batch.id,
      orders,
      totalCost,
      remainingBalance: user.balance - totalCost,
      failedUrls: stockResults.filter((r) => !r.stockInfo).map((r) => r.url),
    });
  })
);

/**
 * POST /api/orders/:taskId/poll
 * Poll single order status (Step 3 & 4)
 */
router.post(
  '/orders/:taskId/poll',
  authMiddleware,
  requireNehtwKey,
  asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const user = req.user!; // Assert user exists after authMiddleware

    // Find order
    const order = await prisma.order.findFirst({
      where: { taskId, userId: user.id },
    });

    if (!order) {
      throw new APIError('Order not found', 404);
    }

    // If already completed or errored, return current state
    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.ERROR ||
      order.status === OrderStatus.TIMEOUT
    ) {
      return res.json({ success: true, order });
    }

    // Check retry limit
    if (order.retryCount >= order.maxRetries) {
      const updatedOrder = await prisma.order.update({
        where: { taskId },
        data: {
          status: OrderStatus.TIMEOUT,
          errorMessage: 'Polling timeout exceeded (3 minutes)',
        },
      });
      return res.json({
        success: false,
        error: 'Timeout',
        order: updatedOrder,
      });
    }

    // Initialize Nehtw client
    const client = new NehtwAPIClient(user.nehtwApiKey!);

    // Step 3: Check order status
    const statusData = await client.checkOrderStatus(taskId, order.responseType);

    if (!statusData.success) {
      const updatedOrder = await prisma.order.update({
        where: { taskId },
        data: {
          status: OrderStatus.ERROR,
          errorMessage: statusData.message || 'Status check failed',
          retryCount: { increment: 1 },
        },
      });
      return res.json({
        success: false,
        error: statusData.message,
        order: updatedOrder,
      });
    }

    // If ready, generate download link (Step 4)
    if (statusData.status === 'ready') {
      const downloadData = await client.generateDownloadLink(taskId, order.responseType);

      if (downloadData.success && downloadData.status === 'ready' && downloadData.downloadLink) {
        const updatedOrder = await prisma.order.update({
          where: { taskId },
          data: {
            status: OrderStatus.COMPLETED,
            downloadLink: downloadData.downloadLink,
            fileName: downloadData.fileName,
            linkType: downloadData.linkType,
            completedAt: new Date(),
          },
        });

        return res.json({
          success: true,
          order: updatedOrder,
          status: 'completed',
        });
      } else {
        const updatedOrder = await prisma.order.update({
          where: { taskId },
          data: {
            status: OrderStatus.DOWNLOADING,
            retryCount: { increment: 1 },
          },
        });

        return res.json({
          success: true,
          order: updatedOrder,
          status: 'downloading',
        });
      }
    } else {
      const updatedOrder = await prisma.order.update({
        where: { taskId },
        data: { retryCount: { increment: 1 } },
      });

      return res.json({
        success: true,
        order: updatedOrder,
        status: 'processing',
      });
    }
  })
);

/**
 * GET /api/batches/:batchId
 * Get batch status with all orders
 */
router.get(
  '/batches/:batchId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    const user = req.user!; // Assert user exists after authMiddleware

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, userId: user.id },
      include: {
        orders: {
          orderBy: { batchOrder: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new APIError('Batch not found', 404);
    }

    // Calculate statistics
    const completed = batch.orders.filter(
      (order) => order.status === OrderStatus.COMPLETED
    ).length;
    
    const failed = batch.orders.filter(
      (order) => order.status === OrderStatus.ERROR || order.status === OrderStatus.TIMEOUT
    ).length;
    
    const processing = batch.orders.filter(
      (order) =>
        order.status === OrderStatus.PROCESSING ||
        order.status === OrderStatus.READY ||
        order.status === OrderStatus.DOWNLOADING
    ).length;

    // Update batch status if all orders are done
    if (completed + failed === batch.totalOrders) {
      const newStatus =
        failed === 0
          ? BatchStatus.COMPLETED
          : completed === 0
          ? BatchStatus.FAILED
          : BatchStatus.PARTIAL;

      await prisma.batch.update({
        where: { id: batchId },
        data: {
          status: newStatus,
          completedOrders: completed,
          failedOrders: failed,
          completedAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      batch: {
        ...batch,
        stats: {
          total: batch.totalOrders,
          completed,
          failed,
          processing,
        },
      },
    });
  })
);

/**
 * GET /api/orders
 * Get user's order history (paginated)
 */
router.get(
  '/orders',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = req.user!; // Assert user exists after authMiddleware
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

export default router;
