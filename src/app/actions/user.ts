
'use server';

import { stripe } from '@/lib/stripe';
import { firestore } from '@/lib/firebase-admin';
import type { SubscriptionPlan } from '@/types';

// The Price IDs from your Stripe dashboard.
// These are used to identify which plan was purchased.
const PRICE_ID_TO_PLAN_MAP: Record<string, SubscriptionPlan> = {
  'price_1PKw0B2KSlelBWWN8zTv812a': 'pro', // Replace with your actual Pro Price ID
  'price_1PKw1b2KSlelBWWNACTEtD3L': 'business', // Replace with your actual Business Price ID
};

/**
 * Handles the successful completion of a Stripe checkout session from a Payment Link.
 * Verifies the session and updates the user's subscription plan in Firestore.
 * @param sessionId The ID of the Stripe checkout session.
 * @returns An object indicating success or an error message.
 */
export async function handleSubscriptionChange(sessionId: string): Promise<{ success: boolean; error?: string }> {
  if (!sessionId) {
    return { success: false, error: 'Session ID is missing.' };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    if (session.payment_status !== 'paid') {
      return { success: false, error: 'Payment was not successful.' };
    }

    const userId = session.client_reference_id;
    if (!userId) {
      return { success: false, error: 'User ID was not found in the Stripe session.' };
    }

    // Determine the plan purchased from the line items
    const priceId = session.line_items?.data[0]?.price?.id;
    if (!priceId) {
      return { success: false, error: 'Could not determine the purchased plan.' };
    }

    const plan = PRICE_ID_TO_PLAN_MAP[priceId];
    if (!plan) {
      return { success: false, error: `Unrecognized price ID: ${priceId}` };
    }

    // Update the user's profile in Firestore
    const userDocRef = firestore.collection('users').doc(userId);
    
    // Also store the Stripe Customer ID for future use (e.g., billing portal)
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    await userDocRef.update({
      subscriptionPlan: plan,
      stripeCustomerId: stripeCustomerId || null,
    });
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Error handling subscription change:', error);
    return { success: false, error: 'An unexpected error occurred while updating your subscription.' };
  }
}
