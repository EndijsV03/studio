
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { firestore } from '@/lib/firebase-admin';
import type { SubscriptionPlan } from '@/types';


const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

// TODO: Replace with your actual Stripe Price IDs
const PRICE_ID_TO_PLAN_MAP: Record<string, SubscriptionPlan> = {
  'price_1PKw0B2KSlelBWWN8zTv812a': 'pro', // Replace with your Pro Plan Price ID
  'price_1PKw1b2KSlelBWWNACTEtD3L': 'business', // Replace with your Business Plan Price ID
};

async function updateSubscription(subscription: Stripe.Subscription) {
    const priceId = subscription.items.data[0].price.id;
    const plan = PRICE_ID_TO_PLAN_MAP[priceId];

    if (!plan) {
        console.error(`Webhook Error: Unrecognized price ID: ${priceId}`);
        return;
    }

    const userRef = firestore.collection('users').where('stripeCustomerId', '==', subscription.customer);
    const userSnapshot = await userRef.get();

    if (userSnapshot.empty) {
        console.error(`Webhook Error: No user found for Stripe customer ID: ${subscription.customer}`);
        return;
    }

    const userId = userSnapshot.docs[0].id;
    const userDocRef = firestore.collection('users').doc(userId);

    await userDocRef.update({
        subscriptionPlan: plan,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        stripePriceId: priceId,
    });
     console.log(`Updated subscription for user ${userId} to plan ${plan}`);
}

async function cancelSubscription(subscription: Stripe.Subscription) {
     const userRef = firestore.collection('users').where('stripeSubscriptionId', '==', subscription.id);
     const userSnapshot = await userRef.get();

     if (userSnapshot.empty) {
        console.error(`Webhook Error: No user found for Stripe subscription ID: ${subscription.id}`);
        return;
    }
    
    const userId = userSnapshot.docs[0].id;
    const userDocRef = firestore.collection('users').doc(userId);

    await userDocRef.update({
        subscriptionPlan: 'free',
        stripeSubscriptionStatus: subscription.status,
    });
    console.log(`Canceled subscription for user ${userId}. Set plan to free.`);
}


export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Webhook secret or signature missing.');
    return new NextResponse('Webhook secret not configured', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
            await updateSubscription(subscription);
          }
          break;

        case 'customer.subscription.updated':
          const subscriptionUpdated = event.data.object as Stripe.Subscription;
          await updateSubscription(subscriptionUpdated);
          break;

        case 'customer.subscription.deleted':
           const subscriptionDeleted = event.data.object as Stripe.Subscription;
           await cancelSubscription(subscriptionDeleted);
           break;

        default:
          throw new Error(`Unhandled relevant event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return new NextResponse('Webhook handler failed. See logs.', { status: 500 });
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
