
'use server';

import { stripe } from '@/lib/stripe';
import { firestore } from '@/lib/firebase-admin';
import type { SubscriptionPlan } from '@/types';

// This mapping connects the Stripe Price ID to your internal plan names.
// Ensure these Price IDs match the ones in your Stripe Payment Links.
const PRICE_ID_TO_PLAN_MAP: Record<string, SubscriptionPlan> = {
  'price_1PKw0B2KSlelBWWN8zTv812a': 'pro', // Pro Plan Price ID from your Stripe dashboard
  'price_1PKw1b2KSlelBWWNACTEtD3L': 'business', // Business Plan Price ID
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
    // 1. Retrieve the session from Stripe to verify it's valid and paid.
    // We expand 'line_items' to see what was purchased.
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    // 2. Check if the payment was successful.
    if (session.payment_status !== 'paid') {
      return { success: false, error: 'Payment was not successful.' };
    }

    // 3. Get the user ID from the client_reference_id we passed in the URL.
    const userId = session.client_reference_id;
    if (!userId) {
      return { success: false, error: 'User ID was not found in the Stripe session.' };
    }

    // 4. Determine which plan was purchased from the price ID in the line items.
    const priceId = session.line_items?.data[0]?.price?.id;
    if (!priceId) {
      return { success: false, error: 'Could not determine the purchased plan.' };
    }

    const plan = PRICE_ID_TO_PLAN_MAP[priceId];
    if (!plan) {
      // This error means the Price ID from Stripe doesn't match our mapping.
      // This can happen if the Payment Links are updated without updating the code.
      return { success: false, error: `Unrecognized price ID: ${priceId}` };
    }
    
    // 5. Get the Stripe Customer ID for future use (e.g., billing portal).
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    // 6. Update the user's profile in Firestore with the new plan.
    const userDocRef = firestore.collection('users').doc(userId);
    await userDocRef.update({
      subscriptionPlan: plan,
      stripeCustomerId: stripeCustomerId || null,
    });
    
    console.log(`Successfully updated user ${userId} to plan ${plan}`);
    return { success: true };
    
  } catch (error: any) {
    console.error('Error handling subscription change:', error);
    return { success: false, error: 'An unexpected error occurred while updating your subscription.' };
  }
}
