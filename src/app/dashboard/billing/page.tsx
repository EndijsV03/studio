
'use client';

import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

const paymentLinks = {
  pro: 'https://buy.stripe.com/test_8x23cocXH3Eq1Ej3KadEs01',
  business: 'https://buy.stripe.com/test_28E14gcXHfn8fv9dkKdEs00',
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For individuals just getting started.',
    features: [
      '10 Business Card Scans',
      'Contact Export (CSV, XLSX)',
      'Voice Note Attachments',
    ],
    cta: 'You are on this plan',
    isCurrent: true,
  },
  {
    name: 'Pro',
    planId: 'pro',
    price: '$15',
    pricePeriod: '/ month',
    description: 'For professionals networking frequently.',
    features: [
      '1,000 Business Card Scans',
      'Everything in Free',
      'Priority Support',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    name: 'Business',
    planId: 'business',
    price: '$40',
    pricePeriod: '/ month',
    description: 'For teams and power networkers.',
    features: [
      '10,000 Business Card Scans',
      'Everything in Pro',
      'Team Collaboration (Coming Soon)',
    ],
    cta: 'Upgrade to Business',
  },
];

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleUpgradeClick = async (planId: 'pro' | 'business') => {
      setIsLoading(planId);
      try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to upgrade.');
        }
        
        const paymentLink = paymentLinks[planId];
        // Construct the URL with parameters
        const url = new URL(paymentLink);
        url.searchParams.append('client_reference_id', user.uid);
        if (user.email) {
            url.searchParams.append('prefilled_email', user.email);
        }

        window.location.href = url.toString();

      } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Could not initiate checkout. Please try again.',
         });
         setIsLoading(null);
      }
  };
    
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Billing & Plans</h2>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={cn('flex flex-col', { 'border-primary': plan.isCurrent })}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="text-4xl font-bold">
                {plan.price}
                {plan.pricePeriod && <span className="text-sm font-normal text-muted-foreground">{plan.pricePeriod}</span>}
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                disabled={plan.isCurrent || !!isLoading}
                onClick={() => plan.planId && handleUpgradeClick(plan.planId as 'pro' | 'business')}
              >
                {isLoading === plan.planId ? <Loader2 className="animate-spin" /> : plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="text-center text-sm text-muted-foreground pt-8">
        <p>Payments are securely processed by Stripe.</p>
        <p>You can manage or cancel your subscription at any time.</p>
      </div>
    </div>
  );
}
