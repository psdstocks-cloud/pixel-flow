import Link from 'next/link'
// import { 
//   Search, 
//   Sparkles, 
//   Scissors, 
//   Folder, 
//   Download,
//   TrendingUp,
//   Clock,
//   Star
// } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">
          Ready to create amazing visuals? Choose your next project.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                📥
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Downloads</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                ⭐
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credits</p>
                <p className="text-2xl font-bold">150</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                📁
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Files</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                📈
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              🔍
              Stock Images
            </CardTitle>
            <CardDescription>
              Download high-quality stock images from multiple sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/stock">Browse Stock Images</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              ✨
              AI Generation
            </CardTitle>
            <CardDescription>
              Create unique artwork with AI-powered image generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/ai-generation">Generate Images</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              ✂️
              Background Removal
            </CardTitle>
            <CardDescription>
              Remove backgrounds from images with AI precision
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/background-removal">Remove Backgrounds</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Downloads</CardTitle>
            <CardDescription>Your latest stock image downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Business Meeting', type: 'Stock Image', credits: 2, time: '2 hours ago' },
                { name: 'Mountain Landscape', type: 'AI Generated', credits: 10, time: '1 day ago' },
                { name: 'Product Photo', type: 'Background Removed', credits: 3, time: '3 days ago' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.credits} credits</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
            <CardDescription>Get the most out of Pixel Flow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  🕐
                </div>
                <div>
                  <p className="font-medium text-sm">Batch Downloads</p>
                  <p className="text-xs text-gray-500">Add multiple images to your cart for efficient downloading</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  ⭐
                </div>
                <div>
                  <p className="font-medium text-sm">Save Credits</p>
                  <p className="text-xs text-gray-500">Use AI generation for unique images instead of expensive stock photos</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  📁
                </div>
                <div>
                  <p className="font-medium text-sm">Organize Files</p>
                  <p className="text-xs text-gray-500">Create folders to keep your downloads organized</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
