/**
 * Billing Types
 *
 * Type definitions for billing and subscription management.
 */

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'trialing' 
  | 'unpaid';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface PortalResponse {
  portalUrl: string;
}

export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  priceId: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

