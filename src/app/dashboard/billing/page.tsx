
'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpgradeClick = (planName: string) => {
      setIsLoading(true);
      // This is where you would initiate the Stripe Checkout flow.
      // For now, we'll just simulate a loading state.
      console.log(`Upgrading to ${planName}`);
      setTimeout(() => setIsLoading(false), 2000);
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
                disabled={plan.isCurrent || isLoading}
                onClick={() => handleUpgradeClick(plan.name)}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="text-center text-sm text-muted-foreground pt-8">
        <p>Payments will be powered by Stripe. You will be redirected to a secure payment page.</p>
        <p>You can cancel your subscription at any time.</p>
      </div>
    </div>
  );
}
