import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

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
