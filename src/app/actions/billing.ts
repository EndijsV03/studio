
'use server';

import { stripe } from '@/lib/stripe';
import { auth, firestore } from '@/lib/firebase-admin';
import { headers, cookies } from 'next/headers';

// TODO: Replace with your actual Stripe Price IDs
const PRICE_ID_MAP = {
  pro: 'price_1PKw0B2KSlelBWWN8zTv812a', // Replace with your Pro Plan Price ID
  business: 'price_1PKw1b2KSlelBWWNACTEtD3L', // Replace with your Business Plan Price ID
};

async function getCurrentUser() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

export async function createCheckoutSession(planId: 'pro' | 'business') {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Authentication failed. Please log in again.' };
    }

    const priceId = PRICE_ID_MAP[planId];
    if (!priceId) {
      return { error: 'Invalid plan selected.' };
    }

    const origin = headers().get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    const userDocRef = firestore.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email!,
            name: user.name || undefined,
            metadata: {
                firebaseUID: user.uid,
            },
        });
        stripeCustomerId = customer.id;
        await userDocRef.set({ stripeCustomerId }, { merge: true });
    }

    const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{
            price: priceId,
            quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${origin}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/billing/cancel`,
        metadata: {
            userId: user.uid,
            planId,
        }
    });

    return { url: session.url };

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
