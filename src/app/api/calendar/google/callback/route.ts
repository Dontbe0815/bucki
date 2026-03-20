/**
 * Google OAuth Callback API Route
 * 
 * Verarbeitet den OAuth Callback von Google
 */

import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    const errorDesc = searchParams.get('error_description') || error;
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=${encodeURIComponent(errorDesc)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?calendar_error=no_code', request.url)
    );
  }

  try {
    const redirectUri = `${new URL(request.url).origin}/api/calendar/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Google token exchange error:', errorData);
      return NextResponse.redirect(
        new URL(`/settings?calendar_error=${encodeURIComponent(errorData.error || 'token_exchange_failed')}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    let email = '';
    let name = '';
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.email || '';
        name = userInfo.name || '';
      }
    } catch (e) {
      console.error('Failed to fetch user info:', e);
    }

    // Get primary calendar
    let calendarId = 'primary';
    let calendarName = 'Primärer Kalender';
    try {
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        const primaryCalendar = calendarData.items?.find((cal: any) => cal.primary);
        if (primaryCalendar) {
          calendarId = primaryCalendar.id;
          calendarName = primaryCalendar.summary || 'Primärer Kalender';
        }
      }
    } catch (e) {
      console.error('Failed to fetch calendars:', e);
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Create redirect URL with token data
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('google_connected', 'true');
    redirectUrl.searchParams.set('google_email', email);
    redirectUrl.searchParams.set('google_name', name);
    redirectUrl.searchParams.set('google_calendar_id', calendarId);
    redirectUrl.searchParams.set('google_calendar_name', calendarName);
    redirectUrl.searchParams.set('google_access_token', tokenData.access_token);
    redirectUrl.searchParams.set('google_refresh_token', tokenData.refresh_token);
    redirectUrl.searchParams.set('google_expires_at', expiresAt);

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=${encodeURIComponent(error.message || 'unknown_error')}`, request.url)
    );
  }
}
