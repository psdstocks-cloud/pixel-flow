import { randomUUID } from 'crypto'

export type PackageWithSubscription = {
  id: string
  name: string
  description: string | null
  points: number
  price: number
  currency: string
  interval: string
  active: boolean
  subscription?: {
    id: string
    status: string
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  } | null
}

export const queries = {
  packages: ['billing', 'packages'],
} as const

export type MockPaymentMethod = {
  id: string
  label: string
  description: string
  processingTime: string
}

export type MockPaymentSession = {
  id: string
  userId: string
  packageId: string
  createdAt: string
  paymentMethods: MockPaymentMethod[]
}

const PAYMENT_METHODS: MockPaymentMethod[] = [
  {
    id: 'card',
    label: 'Credit or Debit Card',
    description: 'Visa, MasterCard, American Express',
    processingTime: 'Instant approval',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Checkout with your PayPal balance',
    processingTime: 'Instant approval',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Wire transfer for corporate accounts',
    processingTime: '1-2 business days',
  },
]

const MOCK_PACKAGES: PackageWithSubscription[] = [
  {
    id: 'starter-monthly',
    name: 'Starter',
    description: 'Perfect for trying out Pixel Flow with a small number of downloads.',
    points: 50,
    price: 9,
    currency: 'USD',
    interval: 'month',
    active: true,
    subscription: null,
  },
  {
    id: 'pro-monthly',
    name: 'Pro',
    description: 'Recommended for freelancers and small teams with regular needs.',
    points: 200,
    price: 29,
    currency: 'USD',
    interval: 'month',
    active: true,
    subscription: null,
  },
  {
    id: 'studio-annual',
    name: 'Studio (Annual)',
    description: 'Best value for agencies that rely on Pixel Flow all year long.',
    points: 3000,
    price: 249,
    currency: 'USD',
    interval: 'year',
    active: true,
    subscription: null,
  },
]

export function listMockPackages(): PackageWithSubscription[] {
  return MOCK_PACKAGES
}

export function findMockPackage(packageId: string): PackageWithSubscription | undefined {
  return MOCK_PACKAGES.find((item) => item.id === packageId)
}

export function createMockPaymentSession(userId: string, packageId: string): MockPaymentSession {
  const createdAt = new Date().toISOString()
  return {
    id: randomUUID(),
    userId,
    packageId,
    createdAt,
    paymentMethods: listMockPaymentMethods(),
  }
}

export function listMockPaymentMethods(): MockPaymentMethod[] {
  return PAYMENT_METHODS.map((method) => ({ ...method }))
}

export function findMockPaymentMethod(methodId: string): MockPaymentMethod | undefined {
  return PAYMENT_METHODS.find((method) => method.id === methodId)
}

export function simulateSubscription(packageId: string) {
  const pkg = MOCK_PACKAGES.find((item) => item.id === packageId)
  if (!pkg) {
    throw new Error('Selected package is not available.')
  }

  return {
    success: true,
    message:
      'Your subscription request has been recorded. Our team will reach out with payment instructions shortly.',
    packageId,
    pointsAwarded: pkg.points,
  }
}
