
'use server';

import { stripe } from '@/lib/stripe';
import { firestore } from '@/lib/firebase-admin';
import type { SubscriptionPlan } from '@/types';

/**
 * Handles the successful completion of a Stripe checkout session.
 * Verifies the session and updates the user's subscription plan in Firestore.
 * @param sessionId The ID of the Stripe checkout session.
 * @returns An object indicating success or an error message.
 */
export async function handleSubscriptionChange(sessionId: string): Promise<{ success: boolean; error?: string }> {
  if (!sessionId) {
    return { success: false, error: 'Session ID is missing.' };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return { success: false, error: 'Payment was not successful.' };
    }

    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as SubscriptionPlan;

    if (!userId || !plan) {
      return { success: false, error: 'Missing metadata from session.' };
    }

    // Update the user's profile in Firestore
    const userDocRef = firestore.collection('users').doc(userId);
    await userDocRef.update({
      subscriptionPlan: plan,
    });
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Error handling subscription change:', error);
    return { success: false, error: 'An unexpected error occurred while updating your subscription.' };
  }
}
