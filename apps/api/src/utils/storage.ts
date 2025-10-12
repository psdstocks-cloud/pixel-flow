import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from '../config'

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
})

export class StorageService {
  private bucketName = config.r2.bucketName

  // Upload file to R2
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
    metadata?: Record<string, string>
  ) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    })

    await s3Client.send(command)
    return `${config.r2.publicUrl}/${key}`
  }

  // Get signed URL for file access
  async getSignedUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  }

  // Delete file from R2
  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    await s3Client.send(command)
  }

  // Generate storage key for files
  generateStorageKey(userId: string, type: string, filename: string): string {
    const timestamp = Date.now()
    const extension = filename.split('.').pop()
    return `${type}/${userId}/${timestamp}_${filename}`
  }

  // Generate thumbnail key
  generateThumbnailKey(storageKey: string): string {
    const parts = storageKey.split('/')
    const filename = parts[parts.length - 1]
    const nameWithoutExt = filename.split('.')[0]
    const extension = filename.split('.').pop()
    
    parts[parts.length - 1] = `${nameWithoutExt}_thumb.${extension}`
    return parts.join('/')
  }
}
