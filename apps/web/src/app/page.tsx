import Link from 'next/link'
import { Button } from '@pixel-flow/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pixel-flow/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Pixel Flow
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your all-in-one creative platform for stock images, AI generation, and design tools.
            Download, create, and manage your visual content with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signin">Get Started</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Stock Images</CardTitle>
              <CardDescription>
                Download high-quality stock images from multiple sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Shutterstock, Adobe Stock, Freepik</li>
                <li>• Instant downloads</li>
                <li>• Credit-based pricing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Generation</CardTitle>
              <CardDescription>
                Create unique artwork with AI-powered image generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Text-to-image generation</li>
                <li>• Variations and upscaling</li>
                <li>• Prompt templates</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Background Removal</CardTitle>
              <CardDescription>
                Remove backgrounds from images with AI precision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• One-click background removal</li>
                <li>• Before/after comparison</li>
                <li>• Batch processing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
