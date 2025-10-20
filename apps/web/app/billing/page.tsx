'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card, Toast } from '../../components'
import {
  queries,
  type MockPaymentMethod,
  type MockPaymentSession,
  type PackageWithSubscription,
} from '../../lib/billing'
import { useSession } from '../../lib/session'

type PackageCardProps = {
  pkg: PackageWithSubscription
  onSubscribe: (pkg: PackageWithSubscription) => void
  isProcessing: boolean
}

function PackageCard({ pkg, onSubscribe, isProcessing }: PackageCardProps) {
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
          onClick={() => onSubscribe(pkg)}
          disabled={isProcessing || hasActiveSubscription}
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
  const [selectedPackage, setSelectedPackage] = useState<PackageWithSubscription | null>(null)
  const [paymentSession, setPaymentSession] = useState<MockPaymentSession | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const packagesQuery = useQuery({
    queryKey: queries.packages,
    queryFn: async () => {
      const response = await fetch('/api/billing/packages')
      if (!response.ok) throw new Error('Failed to fetch packages')
      return response.json() as Promise<PackageWithSubscription[]>
    },
    enabled: isAuthenticated,
  })

  const createSessionMutation = useMutation({
    mutationFn: async (pkg: PackageWithSubscription) => {
      const response = await fetch('/api/billing/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      if (!response.ok) throw new Error('Unable to start checkout')
      return response.json() as Promise<{
        session: MockPaymentSession
        package: PackageWithSubscription
      }>
    },
    onSuccess: (data) => {
      setSelectedPackage(data.package)
      setPaymentSession(data.session)
      setSelectedMethod(null)
      setPaymentError(null)
    },
  })

  const finalizePaymentMutation = useMutation({
    mutationFn: async (variables: { sessionId: string; paymentMethodId: string }) => {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to confirm payment')
      }
      return response.json() as Promise<{
        success: boolean
        message: string
        pointsAwarded: number
        nextPaymentDue: string
        balance: { userId: string; points: number }
        package: PackageWithSubscription
        redirectUrl: string
      }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queries.packages })
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: ['stock', 'balance', userId] })
      }
    },
  })

  const availableMethods: MockPaymentMethod[] = useMemo(() => {
    return paymentSession?.paymentMethods ?? []
  }, [paymentSession])

  const closeModal = () => {
    setPaymentSession(null)
    setSelectedPackage(null)
    setSelectedMethod(null)
    setPaymentError(null)
    finalizePaymentMutation.reset()
    createSessionMutation.reset()
  }

  const confirmPayment = () => {
    if (!paymentSession || !selectedMethod) {
      setPaymentError('Please select a payment method to continue.')
      return
    }
    setPaymentError(null)
    finalizePaymentMutation.mutate({
      sessionId: paymentSession.id,
      paymentMethodId: selectedMethod,
    })
  }

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

      {createSessionMutation.isError && (
        <Toast
          title="Unable to start checkout"
          message={createSessionMutation.error instanceof Error ? createSessionMutation.error.message : 'We could not create a payment session. Please try again.'}
          variant="error"
        />
      )}

      {finalizePaymentMutation.isError && (
        <Toast
          title="Payment failed"
          message={finalizePaymentMutation.error instanceof Error ? finalizePaymentMutation.error.message : 'Unable to process your payment.'}
          variant="error"
        />
      )}

      {finalizePaymentMutation.isSuccess && (
        <Toast
          title="Payment confirmed"
          message={finalizePaymentMutation.data?.message}
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
                onSubscribe={(selected) => createSessionMutation.mutate(selected)}
                isProcessing={createSessionMutation.isPending}
              />
            ))
          )}
        </div>
      </div>

      {paymentSession && selectedPackage && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-header">
              <h2>Select payment method</h2>
              <p>Complete your subscription for the <strong>{selectedPackage.name}</strong> plan.</p>
            </div>

            <div className="modal-summary">
              <div>
                <span className="summary-label">Price</span>
                <span className="summary-value">
                  ${selectedPackage.price}
                  <span className="summary-interval">/{selectedPackage.interval}</span>
                </span>
              </div>
              <div>
                <span className="summary-label">Points credited</span>
                <span className="summary-value">{selectedPackage.points}</span>
              </div>
            </div>

            <div className="modal-section">
              <h3>Choose a payment method</h3>
              <div className="payment-method-grid">
                {availableMethods.map((method) => {
                  const active = selectedMethod === method.id
                  return (
                    <button
                      key={method.id}
                      type="button"
                      className={`payment-method ${active ? 'active' : ''}`}
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={finalizePaymentMutation.isPending}
                    >
                      <span className="payment-title">{method.label}</span>
                      <span className="payment-description">{method.description}</span>
                      <span className="payment-meta">{method.processingTime}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {paymentError && <p className="modal-error">{paymentError}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={closeModal}
                disabled={createSessionMutation.isPending || finalizePaymentMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={confirmPayment}
                disabled={finalizePaymentMutation.isPending}
              >
                {finalizePaymentMutation.isPending ? 'Processing…' : 'Confirm payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
