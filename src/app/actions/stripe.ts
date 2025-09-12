
'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase-admin'; // Using admin SDK on server
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { firestore } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// Replace these with your actual Stripe Price IDs from your Stripe dashboard.
const PRICE_IDS = {
  pro: 'price_1S6djo2KSlelBWWNnPLltBAX', // Example: price_1PABC...
  business: 'price_1S6dkf2KSlelBWWNeD4KalIb', // Example: price_1PXYZ...
};

type Plan = 'pro' | 'business';

export async function createCheckoutSession(plan: Plan): Promise<{ url?: string, error?: string }> {
  // Use a reliable environment variable for the base URL.
  // This avoids issues with proxy headers in environments like Cloud Workstations.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    return { error: 'The application URL is not configured. Please set NEXT_PUBLIC_APP_URL.' };
  }
  
  // In a real scenario, you would get the user's UID and email securely from their session.
  // This is a placeholder for demonstration purposes. In a production app, you would
  // use a session management library to securely get the current user's identity.
  const userEmail = 'placeholder-user@example.com'; 

  try {
    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return { error: 'Invalid plan selected.' };
    }

    const successUrl = `${baseUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/billing/cancel`;
    
    // In a real app, you would look up the user in your DB to find their stripeCustomerId.
    // For this example, we'll create a new customer every time for simplicity.
    const customer = await stripe.customers.create({ email: userEmail });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
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
