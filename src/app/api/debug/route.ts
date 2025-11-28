import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    firebase: {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
    },
    firebaseAdmin: {
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING',
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY ? 'SET' : 'MISSING',
    },
    timestamp: new Date().toISOString()
  });
}
