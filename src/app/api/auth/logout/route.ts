
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        cookies().delete('session');
        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Session logout error:', error);
        return new NextResponse(JSON.stringify({ error: 'Failed to log out.' }), { status: 500 });
    }
}
