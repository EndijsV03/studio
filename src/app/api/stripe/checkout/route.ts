import { NextResponse, type NextRequest } from 'next/server';
import { createCheckoutSession } from '@/app/actions/stripe';

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    if (plan !== 'pro' && plan !== 'business') {
      return NextResponse.json({ error: 'Invalid plan specified.' }, { status: 400 });
    }
    const { url } = await createCheckoutSession(plan);
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error('Stripe checkout error:', e);
    // Return a more generic error to the client
    const message = e.message.includes('User is not authenticated')
      ? 'Authentication error. Please sign in again.'
      : 'An unexpected error occurred. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
