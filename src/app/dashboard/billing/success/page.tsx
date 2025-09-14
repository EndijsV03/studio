
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { handleSubscriptionChange } from '@/app/actions/user';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No session ID provided. Your plan may not have been updated.');
      return;
    }

    async function updateSubscription() {
      const { success, error } = await handleSubscriptionChange(sessionId!);
      if (success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(error || 'An unknown error occurred while updating your plan.');
      }
    }

    updateSubscription();
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
           <div className="mx-auto p-4 rounded-full w-fit">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">Finalizing Your Subscription...</CardTitle>
          <CardDescription>
            Please wait while we confirm your payment and update your account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl">An Error Occurred</CardTitle>
          <CardDescription>
            {errorMessage} Please contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard/billing">Back to Billing</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="mt-4 text-2xl">Payment Successful!</CardTitle>
        <CardDescription>
          Thank you for upgrading your plan. Your account has been updated and you can now enjoy your new features.
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
    <div className="flex items-center justify-center h-full">
       <Suspense fallback={<div>Loading...</div>}>
         <SuccessContent />
       </Suspense>
    </div>
  );
}
