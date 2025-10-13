'use client'

import { useState } from 'react'
import { X, Download, Heart, Share2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface StockPreviewProps {
  stock: any
  onClose: () => void
}

export function StockPreview({ stock, onClose }: StockPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // TODO: Implement download logic
      console.log('Downloading stock:', stock)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleAddToCart = () => {
    // TODO: Implement add to cart logic
    console.log('Adding to cart:', stock)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Stock Image Preview</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative">
              <img
                src={stock.image}
                alt={stock.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              <Badge className="absolute top-4 right-4 bg-black bg-opacity-75 text-white">
                {stock.cost} credits
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download Now'}
              </Button>
              <Button variant="outline" onClick={handleAddToCart}>
                Add to Cart
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">{stock.title}</h2>
              <p className="text-gray-600 mb-4">by {stock.author}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Size:</span>
                  <span>{stock.sizeInBytes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Format:</span>
                  <span>{stock.ext?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Source:</span>
                  <span className="capitalize">{stock.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost:</span>
                  <span className="font-medium">{stock.cost} credits</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Actions</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-1" />
                  Favorite
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Original
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">License Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Commercial use allowed</p>
                <p>• No attribution required</p>
                <p>• High-resolution download</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
