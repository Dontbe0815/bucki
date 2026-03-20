/**
 * Microsoft Outlook OAuth Token Exchange API Route
 * 
 * Tauscht den Authorization Code gegen Access und Refresh Tokens
 */

import { NextRequest, NextResponse } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'YOUR_MICROSOFT_CLIENT_SECRET';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code) {
      return NextResponse.json(
        { message: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Microsoft token exchange error:', error);
      return NextResponse.json(
        { message: error.error_description || error.error || 'Token exchange failed' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    let email: string | undefined;
    try {
      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.mail || userInfo.userPrincipalName;
      }
    } catch (e) {
      console.error('Failed to fetch user info:', e);
    }

    return NextResponse.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      email,
    });
  } catch (error: any) {
    console.error('Microsoft token exchange error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
