/**
 * Microsoft Outlook OAuth Token Refresh API Route
 * 
 * Erneuert ein abgelaufenes Access Token
 */

import { NextRequest, NextResponse } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'YOUR_MICROSOFT_CLIENT_SECRET';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Refresh the token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Microsoft token refresh error:', error);
      return NextResponse.json(
        { message: error.error_description || error.error || 'Token refresh failed' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });
  } catch (error: any) {
    console.error('Microsoft token refresh error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
