import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { setAccessToken } from '@/lib/store';

export async function POST(request: Request) {
  try {
    // Read the public_token sent from the frontend
    const { public_token } = await request.json();

    // Exchange it for a permanent access_token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = response.data.access_token;
    setAccessToken(accessToken);

    console.log('Access token stored successfully');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}