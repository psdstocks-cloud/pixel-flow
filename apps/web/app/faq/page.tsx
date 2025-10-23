/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the top right corner, enter your email and password, and verify your email address. You will receive 20 free credits to get started!'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and ACH bank transfers for enterprise plans. All payments are processed securely through Stripe.'
      },
      {
        question: 'How does the credit system work?',
        answer: 'Each download costs 1 credit. When you subscribe to a plan, you receive a monthly credit allowance. Credits are deducted when you download an image or generate AI content. Unused credits expire at the end of each billing cycle.'
      },
      {
        question: 'Can I try before I buy?',
        answer: 'Yes! New users receive 20 free credits upon signup. You can browse our entire library, download previews, and test our services before committing to a paid plan.'
      },
      {
        question: 'How do I download my first image?',
        answer: 'After signing up, browse our stock library, click on any image you like, preview the quality, and click "Download". The image will be added to your download queue and processed within seconds.'
      }
    ]
  },
  {
    title: 'Credits & Billing',
    icon: '💳',
    items: [
      {
        question: 'What are download credits?',
        answer: 'Download credits are the currency used on Pixel Flow. Each credit allows you to download one stock image or generate one AI image. Credits are included with your monthly subscription or can be purchased separately.'
      },
      {
        question: 'Do credits expire?',
        answer: 'Yes, credits reset at the beginning of each billing cycle. For example, if you have the Pro plan with 500 credits/month, unused credits do not roll over to the next month. However, one-time credit purchases never expire.'
      },
      {
        question: 'Can I get a refund?',
        answer: 'We offer a 7-day money-back guarantee for new subscriptions. If you are not satisfied, contact support@pixelflow.com within 7 days of your purchase. Individual credit purchases are non-refundable once used.'
      },
      {
        question: 'How do I upgrade/downgrade my plan?',
        answer: 'Go to Account Settings > Billing > Change Plan. Upgrades take effect immediately with prorated charges. Downgrades take effect at the start of your next billing cycle. You will keep your current credits until then.'
      },
      {
        question: 'What happens if I cancel?',
        answer: 'You can cancel anytime. Your subscription will remain active until the end of your current billing period. After cancellation, you will not be charged again, but you will lose access to subscription features and unused credits.'
      },
      {
        question: 'Can I purchase additional credits?',
        answer: 'Yes! You can buy credit packs anytime from the Pricing page. These one-time purchases never expire and stack with your subscription credits. Available packs: 50 credits ($25), 100 credits ($45), 250 credits ($100).'
      }
    ]
  },
  {
    title: 'Downloads & Usage',
    icon: '📥',
    items: [
      {
        question: 'What file formats do you offer?',
        answer: 'All images are available in high-resolution JPG and PNG formats. For enterprise customers, we also offer RAW, TIFF, and PSD formats upon request. AI-generated images are provided in PNG format with transparency support.'
      },
      {
        question: 'What are the image resolutions?',
        answer: 'Standard downloads are 4K resolution (3840x2160 or higher). We also offer 2K, HD, and web-optimized versions. The exact resolution depends on the original image. You can preview dimensions before downloading.'
      },
      {
        question: 'Can I use images commercially?',
        answer: 'Yes! All images come with a royalty-free commercial license. You can use them in websites, marketing materials, products, and more. The license covers unlimited projects and clients. Attribution is not required but appreciated.'
      },
      {
        question: 'Do I need to credit Pixel Flow?',
        answer: 'No, attribution is not required. However, we appreciate it when you credit Pixel Flow or the original photographer. For example: "Photo by [Artist Name] via Pixel Flow".'
      },
      {
        question: "What's your license agreement?",
        answer: 'Our Royalty-Free License allows unlimited commercial and personal use. You cannot resell, redistribute, or sublicense the images as-is. You cannot use images in trademark registration. Full license terms are available on our License page.'
      }
    ]
  },
  {
    title: 'Technical Support',
    icon: '🔧',
    items: [
      {
        question: 'Download failed - what should I do?',
        answer: 'First, check your internet connection. Then try refreshing the page and clicking download again. If the problem persists, go to Dashboard > Downloads and click "Retry". Contact support if the issue continues with your order number.'
      },
      {
        question: 'My download is slow',
        answer: 'Download speed depends on your internet connection and file size. Large 4K images may take 30-60 seconds. We recommend using a stable WiFi connection. You can also try downloading during off-peak hours for faster speeds.'
      },
      {
        question: "I can't log in to my account",
        answer: 'Make sure you are using the correct email and password. Try clicking "Forgot Password" to reset. Clear your browser cache and cookies. If you signed up with Google/social login, use that method instead of email/password.'
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page. Enter your email address and we will send a password reset link. Check your spam folder if you do not receive it within 5 minutes. The link expires after 24 hours.'
      },
      {
        question: 'Browser compatibility issues',
        answer: 'Pixel Flow works best on Chrome, Firefox, Safari, and Edge (latest versions). Make sure JavaScript is enabled and cookies are allowed. Clear your cache or try incognito mode. For older browsers, please update to the latest version.'
      }
    ]
  },
  {
    title: 'Stock Images',
    icon: '🖼️',
    items: [
      {
        question: 'How many images are available?',
        answer: 'Our library contains over 10 million high-quality stock images from photographers worldwide. We add 50,000+ new images every month across categories like business, nature, technology, lifestyle, and more.'
      },
      {
        question: 'Can I request specific images?',
        answer: 'Yes! Enterprise customers can submit custom image requests. We will work with our photographer network to capture or source the exact images you need. Standard turnaround is 7-14 days. Contact sales@pixelflow.com for details.'
      },
      {
        question: 'How often is new content added?',
        answer: 'We add fresh content daily! Our curated team reviews and publishes 1,500+ new images every day. Follow our blog or enable notifications to discover trending and seasonal content as soon as it is released.'
      },
      {
        question: 'Can I favorite/bookmark images?',
        answer: 'Yes! Click the heart icon on any image to save it to your Favorites. Access your collection from Dashboard > Favorites. You can organize favorites into custom collections and share collections with team members (Pro+ plans).'
      }
    ]
  },
  {
    title: 'AI Generation (Coming Soon)',
    icon: '🤖',
    items: [
      {
        question: 'How does AI generation work?',
        answer: 'Simply describe what you want in plain text (e.g., "sunset over mountains with purple sky"). Our AI will generate 4 unique variations in seconds. You can then upscale, edit, or create variations of your favorite result. Powered by state-of-the-art AI models.'
      },
      {
        question: 'How many credits does AI generation cost?',
        answer: 'Generating 4 image variations costs 1 credit. Upscaling an image to 4K costs 1 credit. Creating variations from an existing image costs 1 credit. Each operation is clearly priced before you confirm.'
      },
      {
        question: 'What styles are available?',
        answer: 'Choose from 20+ artistic styles: Photorealistic, Digital Art, Watercolor, Oil Painting, Anime, 3D Render, Sketch, Pop Art, and more. You can also combine styles or use custom style references from uploaded images.'
      },
      {
        question: 'Can I edit generated images?',
        answer: 'Yes! Use our built-in editor to crop, resize, adjust colors, remove backgrounds, and add text. For advanced editing, download the full-resolution PNG and use your preferred editing software. All AI images come with commercial usage rights.'
      }
    ]
  },
  {
    title: 'Account Management',
    icon: '⚙️',
    items: [
      {
        question: 'How do I change my email?',
        answer: 'Go to Dashboard > Account Settings > Email. Enter your new email address and verify it via the confirmation link sent to both your old and new email. This ensures account security. The change takes effect immediately after verification.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'We are sorry to see you go! Go to Dashboard > Account Settings > Delete Account. You will be asked to confirm. Warning: This action is permanent and cannot be undone. All data, downloads, and credits will be lost. Export your data first if needed.'
      },
      {
        question: 'Can I transfer credits to another account?',
        answer: 'Credits are non-transferable between accounts for security reasons. However, if you have a team/enterprise plan, you can share credits with team members within your organization workspace. Contact support for multi-user arrangements.'
      },
      {
        question: 'How do I update payment info?',
        answer: 'Go to Dashboard > Billing > Payment Methods. Click "Add Payment Method" or "Edit" on existing cards. You can set a default payment method for subscriptions. All payment info is encrypted and processed securely through Stripe.'
      }
    ]
  },
  {
    title: 'Business & Enterprise',
    icon: '🏢',
    items: [
      {
        question: 'Do you offer team plans?',
        answer: 'Yes! Team plans start at 5 users with shared credit pools, centralized billing, admin controls, and usage analytics. Each team member gets their own account. Volume discounts available for 10+ users. Contact sales@pixelflow.com for pricing.'
      },
      {
        question: 'Can I get a custom plan?',
        answer: 'Absolutely! We create custom plans for agencies, corporations, and high-volume users. Options include: dedicated account manager, priority support, custom integrations, white-label solutions, and flexible credit allocations. Minimum 500 credits/month.'
      },
      {
        question: 'Do you provide invoices?',
        answer: 'Yes, invoices are automatically generated and emailed after each payment. Access past invoices in Dashboard > Billing > Invoices. For ACH/wire transfers or custom billing terms, contact our finance team at billing@pixelflow.com.'
      },
      {
        question: 'What about bulk licensing?',
        answer: 'Enterprise customers can license our entire library or specific collections for internal use. Options include: site-wide access, offline usage, redistribution rights, and exclusive content. Pricing starts at $5,000/year. Schedule a consultation for details.'
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = faqData.map(category => ({
    ...category,
    items: category.items.filter(item =>
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-300 mb-8">
            Find answers to common questions about Pixel Flow
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full px-6 py-4 pl-14 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition"
            />
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-purple-400">8</div>
            <div className="text-sm text-gray-300">Categories</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-purple-400">40+</div>
            <div className="text-sm text-gray-300">Questions</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-purple-400">24h</div>
            <div className="text-sm text-gray-300">Support Response</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center border border-white/20">
            <div className="text-2xl font-bold text-purple-400">98%</div>
            <div className="text-sm text-gray-300">Satisfied</div>
          </div>
        </div>

        {/* FAQ Categories */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No results found for "{searchQuery}"</p>
            <button onClick={() => setSearchQuery('')} className="mt-4 text-purple-400 hover:text-purple-300">
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category, catIndex) => (
              <div key={catIndex} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  {category.title}
                </h2>
                
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => {
                    const key = `${catIndex}-${itemIndex}`;
                    const isOpen = openItems[key];
                    
                    return (
                      <div key={itemIndex} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition"
                        >
                          <span className="text-white font-medium pr-4">{item.question}</span>
                          <svg
                            className={`w-5 h-5 text-purple-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-4 text-gray-300 leading-relaxed">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
          <p className="text-white/90 mb-6">
            Our support team is here to help you get the most out of Pixel Flow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Contact Support
            </Link>
            <Link
              href="/"
              className="px-8 py-3 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
