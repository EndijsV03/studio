
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        if (!idToken) {
            return new NextResponse(JSON.stringify({ error: 'ID token is required' }), { status: 400 });
        }

        // Set session expiration to 5 days.
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        
        const options = {
            name: 'session',
            value: sessionCookie,
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        };

        // Set the cookie.
        cookies().set(options);

        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Session login error:', error);
        // Add a more detailed log for debugging
        if ((error as any).code === 'auth/argument-error' || (error as any).message.includes('Firebase App is not initialized')) {
            console.error("Firebase Admin SDK is not initialized. Check your environment variables in .env.");
        }
        return new NextResponse(JSON.stringify({ error: 'Could not create a secure session.' }), { status: 401 });
    }
}
