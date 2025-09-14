
'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase-admin'; // Using admin SDK on server
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { firestore } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import type { UserProfile } from '@/types';

// Replace these with your actual Stripe Price IDs from your Stripe dashboard.
// Using common test price IDs for demonstration.
const PRICE_IDS = {
  pro: 'price_1HPv3l2eZvKYlo2CRWc1q1s3', // Example: Pro Plan Test ID
  business: 'price_1HPv3l2eZvKYlo2Cs7C9p3f2', // Example: Business Plan Test ID
};

type Plan = 'pro' | 'business';

interface CreateCheckoutSessionArgs {
  plan: Plan;
  userId: string;
}

export async function createCheckoutSession({ plan, userId }: CreateCheckoutSessionArgs): Promise<{ url?: string, error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    return { error: 'The application URL is not configured. Please set NEXT_PUBLIC_APP_URL.' };
  }
  
  try {
    const userDocRef = firestore.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return { error: 'User not found.' };
    }
    const userProfile = userDoc.data() as UserProfile;

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return { error: 'Invalid plan selected.' };
    }

    let stripeCustomerId = userProfile.stripeCustomerId;

    // Create a Stripe customer if one doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ 
        email: userProfile.email,
        metadata: {
          firebaseUID: userId,
        },
      });
      stripeCustomerId = customer.id;
      // Store the new customer ID in Firestore.
      await userDocRef.update({ stripeCustomerId });
    }

    const successUrl = `${baseUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/billing/cancel`;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Pass the plan and user ID to the webhook/success page
      metadata: {
        plan: plan,
        userId: userId,
      }
    });

    if (!session.url) {
      return { error: 'Could not create Stripe checkout session.' };
    }
    
    return { url: session.url };

  } catch (e: any) {
    console.error("Stripe Action Error:", e);
    return { error: 'An unexpected error occurred while creating the checkout session.' };
  }
}
