
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Home, LogOut, Loader2, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

async function createSession(idToken: string): Promise<boolean> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
    });
    return res.ok;
}

async function clearSession(): Promise<boolean> {
    const res = await fetch('/api/auth/logout', {
        method: 'POST',
    });
    return res.ok;
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const idToken = await user.getIdToken(true);
          const sessionCreated = await createSession(idToken);
          if (!sessionCreated) {
             throw new Error('Could not create server session.');
          }
        } catch(error) {
           console.error("Session creation failed:", error);
           // If session creation fails, sign out the user to prevent an inconsistent state
           await handleSignOut();
           toast({
              variant: 'destructive',
              title: 'Authentication Error',
              description: 'Could not create a secure session. Please try logging in again.',
           });
        }
      } else {
        setCurrentUser(null);
        await clearSession();
        router.push('/login');
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle session clearing and redirect
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'An error occurred while signing out.',
      });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'My Contacts', icon: Home },
    { href: '/dashboard/billing', label: 'Billing', icon: DollarSign },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="sr-only">CardSync Pro</span>
          </Link>
          {navItems.map((item) => (
             <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-foreground ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground'}`}
             >
                {item.label}
             </Link>
          ))}
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
             {/* Future search bar location */}
          </div>
           <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
           </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
