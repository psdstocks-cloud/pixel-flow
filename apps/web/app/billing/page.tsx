'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, Toast } from '../../components'
import { queries, type PackageWithSubscription } from '../../lib/billing'
import { useSession } from '../../lib/session'

type PackageCardProps = {
  pkg: PackageWithSubscription
  onSubscribe: (packageId: string) => void
  isSubscribing: boolean
}

function PackageCard({ pkg, onSubscribe, isSubscribing }: PackageCardProps) {
  const hasActiveSubscription = pkg.subscription?.status === 'active'
  const isCanceled = pkg.subscription?.status === 'canceled'

  return (
    <Card
      title={pkg.name}
      description={pkg.description || ''}
      headerSlot={
        <div className="text-right">
          <div className="text-2xl font-bold">
            ${pkg.price}
            <span className="text-sm font-normal text-gray-500">/{pkg.interval}</span>
          </div>
          <div className="text-sm text-gray-500">{pkg.points} points</div>
        </div>
      }
    >
      <div className="space-y-4">
        {hasActiveSubscription && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm font-medium text-green-800">Active Subscription</div>
            <div className="text-xs text-green-600">
              Renews on {new Date(pkg.subscription!.currentPeriodEnd).toLocaleDateString()}
            </div>
          </div>
        )}

        {isCanceled && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm font-medium text-yellow-800">Subscription Canceled</div>
            <div className="text-xs text-yellow-600">
              Access until {new Date(pkg.subscription!.currentPeriodEnd).toLocaleDateString()}
            </div>
          </div>
        )}

        <button
          type="button"
          className={`w-full ${hasActiveSubscription ? 'secondary' : 'primary'}`}
          onClick={() => onSubscribe(pkg.id)}
          disabled={isSubscribing || hasActiveSubscription}
        >
          {hasActiveSubscription ? 'Current Plan' : isCanceled ? 'Reactivate' : 'Subscribe'}
        </button>
      </div>
    </Card>
  )
}

export default function BillingPage() {
  const { session, status: sessionStatus } = useSession()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null
  const isAuthenticated = Boolean(userId)

  const packagesQuery = useQuery({
    queryKey: queries.packages,
    queryFn: async () => {
      const response = await fetch('/api/billing/packages')
      if (!response.ok) throw new Error('Failed to fetch packages')
      return response.json() as Promise<PackageWithSubscription[]>
    },
    enabled: isAuthenticated,
  })

  const subscribeMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      if (!response.ok) throw new Error('Failed to subscribe')
      return response.json() as Promise<{
        success: boolean
        message: string
        pointsAwarded: number
        redirectUrl: string
      }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queries.packages })
      queryClient.invalidateQueries({ queryKey: ['stock', 'balance', userId] })
    },
  })

  if (sessionStatus === 'loading') {
    return (
      <section className="billing-hero">
        <Toast title="Loading account" message="Fetching your billing details." variant="info" />
      </section>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="billing-hero">
        <h1>Billing & Plans</h1>
        <p>Please sign in to view available packages and manage your subscription.</p>
        <Link href="/login" className="primary">
          Sign In
        </Link>
      </section>
    )
  }

  return (
    <main>
      <section className="billing-hero">
        <h1>Choose Your Plan</h1>
        <p>Select a package that fits your stock download needs. Points are credited monthly.</p>
        <p className="note">Payment processing is currently handled manually while we finalize our Stripe integration.</p>
      </section>

      {subscribeMutation.isError && (
        <Toast
          title="Subscription failed"
          message={subscribeMutation.error instanceof Error ? subscribeMutation.error.message : 'Unable to process subscription.'}
          variant="error"
        />
      )}

      {subscribeMutation.isSuccess && (
        <Toast
          title="Subscription request received"
          message={
            subscribeMutation.data?.message ??
            'We have recorded your request and will be in touch to complete payment.'
          }
          variant="success"
        />
      )}

      <div className="tab-panel single">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packagesQuery.isLoading ? (
            <div className="col-span-full">
              <Toast title="Loading packages" message="Fetching available plans." variant="info" />
            </div>
          ) : packagesQuery.isError ? (
            <div className="col-span-full">
              <Toast
                title="Unable to load packages"
                message={packagesQuery.error instanceof Error ? packagesQuery.error.message : 'Package list unavailable.'}
                variant="error"
              />
            </div>
          ) : (
            packagesQuery.data?.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSubscribe={(packageId) => subscribeMutation.mutate(packageId)}
                isSubscribing={subscribeMutation.isPending}
              />
            ))
          )}
        </div>
      </div>
    </main>
  )
}
