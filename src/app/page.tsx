
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

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
    cta: 'Get Started',
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
    cta: 'Choose Pro',
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
    cta: 'Choose Business',
  },
];


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Icons.logo className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">CardSync Pro</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-32">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Never Lose a Contact Again
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:mt-6 sm:text-xl">
            Effortlessly capture, organize, and manage business cards with the power of AI. Turn piles of cards into a searchable, digital database in seconds.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">Get Started for Free</Link>
            </Button>
          </div>
        </section>

        <section className="bg-secondary/50 py-20 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Image 
                            src="https://picsum.photos/seed/1/800/600"
                            width={800}
                            height={600}
                            alt="A person scanning a business card with their phone"
                            className="rounded-xl shadow-2xl"
                            data-ai-hint="scanning business card"
                        />
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-bold tracking-tight">AI-Powered Extraction</h3>
                            <p className="text-lg text-muted-foreground">
                                Just snap a photo. Our advanced AI accurately extracts all the important details—name, title, company, phone, email, and more—saving you from manual data entry.
                            </p>
                        </div>
                         <div className="space-y-2">
                            <h3 className="text-3xl font-bold tracking-tight">Add Voice Memos</h3>
                            <p className="text-lg text-muted-foreground">
                                Context is everything. Record a quick voice note after meeting someone to remember key details, follow-up actions, or personal connections.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-bold tracking-tight">Export & Integrate</h3>
                            <p className="text-lg text-muted-foreground">
                                Your data is yours. Export your contacts to CSV or XLSX to seamlessly integrate with your existing CRM or email marketing tools.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Find the Perfect Plan
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
              Start for free and scale as you grow. All plans include our core AI features.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className="flex flex-col">
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
                  <Button asChild className="w-full">
                     <Link href="/login">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-24 bg-secondary/50">
            <h3 className="text-3xl font-bold tracking-tight">Ready to streamline your networking?</h3>
            <p className="mt-3 max-w-md mx-auto text-muted-foreground">
                Start building your digital rolodex today.
            </p>
            <div className="mt-8">
                 <Button asChild size="lg">
                    <Link href="/login">Sign Up Now</Link>
                </Button>
            </div>
        </section>
      </main>
      <footer className="border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} CardSync Pro. All rights reserved.
          </div>
      </footer>
    </div>
  );
}
