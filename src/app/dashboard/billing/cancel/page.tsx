import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
           <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl">Payment Canceled</CardTitle>
          <CardDescription>
            Your transaction was not completed. Your plan has not been changed. You can try again from the billing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard/billing">Back to Billing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
