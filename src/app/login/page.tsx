'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignIn = async (provider: 'google' | 'microsoft') => {
    const authProvider =
      provider === 'google'
        ? new GoogleAuthProvider()
        : new OAuthProvider('microsoft.com');

    try {
      await signInWithPopup(auth, authProvider);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <Icons.logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Welcome to CardSync Pro</CardTitle>
          <CardDescription>Sign in to continue to your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => handleSignIn('google')}>
            Sign In with Google
          </Button>
          <Button className="w-full" onClick={() => handleSignIn('microsoft')}>
            Sign In with Microsoft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
