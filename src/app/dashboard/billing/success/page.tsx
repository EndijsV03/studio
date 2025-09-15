
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="mt-4 text-2xl">Payment Successful!</CardTitle>
        <CardDescription>
          Thank you for your payment. Your subscription is being updated now. This may take a moment to reflect in your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}


export default function SuccessPage() {
  return (
    // The Suspense boundary is good practice for pages that use search parameters.
    <div className="flex items-center justify-center h-full">
       <Suspense>
         <SuccessContent />
       </Suspense>
    </div>
  );
}
