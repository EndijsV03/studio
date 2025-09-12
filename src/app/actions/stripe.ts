'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase-admin'; // Using admin SDK on server
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { firestore } from '@/lib/firebase-admin';

// This is a placeholder. In a real app, you would fetch these from your database
// or a configuration file. Replace these with your actual Stripe Price IDs.
const PRICE_IDS = {
  pro: 'price_1P...', // Replace with your Pro plan Price ID
  business: 'price_1P...', // Replace with your Business plan Price ID
};

type Plan = 'pro' | 'business';

export async function createCheckoutSession(plan: Plan) {
  const headersList = headers();
  const authorization = headersList.get('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('User is not authenticated.');
  }

  const idToken = authorization.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid authentication token.');
  }

  const uid = decodedToken.uid;
  const email = decodedToken.email;

  if (!uid || !email) {
    throw new Error('Authentication failed.');
  }
  
  const userRef = firestore.collection('users').doc(uid);
  const userDoc = await userRef.get();
  const userProfile = userDoc.data();
  
  let stripeCustomerId = userProfile?.stripeCustomerId;

  // Create a new Stripe customer if one doesn't exist
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email });
    stripeCustomerId = customer.id;
    await userRef.update({ stripeCustomerId });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    throw new Error('Invalid plan selected.');
  }

  // Define the base URL for redirection
  const baseUrl = headersList.get('x-forwarded-proto') + '://' + headersList.get('host');
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
  });

  if (!session.url) {
    throw new Error('Could not create Stripe checkout session.');
  }
  
  // Return the URL for client-side redirection
  return { url: session.url };
}
