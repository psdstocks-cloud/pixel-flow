import { Worker, Queue } from 'bullmq'
import { redis } from '../../config/redis'
import { prisma } from '@pixel-flow/database'
import { NehtwClient } from '../../utils/nehtw-client'
import { config } from '../../config'
import { logger } from '../../utils/logger'

const nehtwClient = new NehtwClient(config.nehtw.apiKey)

// Create queue
export const stockQueue = new Queue('stock-downloads', {
  connection: redis,
})

// Add job to queue
export async function addStockDownloadJob(orderId: string, taskId: string) {
  await stockQueue.add(
    'process-stock-download',
    { orderId, taskId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  )
}

// Worker to process stock downloads
const worker = new Worker(
  'stock-downloads',
  async (job) => {
    const { orderId, taskId } = job.data
    
    logger.info(`Processing stock download: ${orderId}, task: ${taskId}`)
    
    try {
      // Check order status with nehtw
      const status = await nehtwClient.checkOrderStatus(taskId)
      
      if (status.status === 'completed') {
        // Get download link
        const downloadData = await nehtwClient.generateDownloadLink(taskId)
        
        // Update order as completed
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          }
        })
        
        logger.info(`Stock download completed: ${orderId}`)
        
        // TODO: Download file and store in R2
        // TODO: Deduct credits from user
        // TODO: Create file record
        
      } else if (status.status === 'failed') {
        // Update order as failed
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'FAILED',
            errorMessage: status.error_message,
          }
        })
        
        logger.error(`Stock download failed: ${orderId}, error: ${status.error_message}`)
        
      } else {
        // Still processing, reschedule job
        throw new Error('Still processing, will retry')
      }
      
    } catch (error) {
      logger.error(`Stock download error: ${orderId}`, error)
      throw error
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
)

worker.on('completed', (job) => {
  logger.info(`Stock download job completed: ${job.id}`)
})

worker.on('failed', (job, err) => {
  logger.error(`Stock download job failed: ${job?.id}`, err)
})

export { worker as stockWorker }
