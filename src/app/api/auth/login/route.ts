
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        if (!idToken) {
            return new NextResponse(JSON.stringify({ error: 'ID token is required' }), { status: 400 });
        }

        // Set session expiration to 5 days.
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        
        const cookie = serialize('session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        const response = new NextResponse(JSON.stringify({ success: true }), { status: 200 });
        response.headers.set('Set-Cookie', cookie);
        
        return response;

    } catch (error) {
        console.error('Session login error:', error);
        if ((error as any).code === 'auth/argument-error' || (error as any).message.includes('Firebase App is not initialized')) {
            console.error("Firebase Admin SDK is not initialized. Check your environment variables in .env.");
        }
        return new NextResponse(JSON.stringify({ error: 'Could not create a secure session.' }), { status: 401 });
    }
}
