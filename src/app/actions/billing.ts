
'use server';

import { stripe } from '@/lib/stripe';
import { auth as adminAuth, firestore } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

const PRICE_ID_MAP = {
  pro: 'price_1PKw0B2KSlelBWWN8zTv812a',
  business: 'price_1PKw1b2KSlelBWWNACTEtD3L',
};

export async function createCheckoutSession(planId: 'pro' | 'business', idToken: string) {
  try {
    let decodedToken;
    try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
        console.error("Error verifying ID token:", error);
        return { error: 'Authentication failed. Please log in again.' };
    }
    
    const user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
    };

    if (!user) {
      return { error: 'You must be logged in to subscribe.' };
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
            name: user.displayName || undefined,
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
        cancel_url: `${origin}/dashboard/billing`,
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
