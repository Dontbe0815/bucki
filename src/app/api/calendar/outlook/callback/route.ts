/**
 * Microsoft Outlook OAuth Callback API Route
 * 
 * Verarbeitet den OAuth Callback von Microsoft
 */

import { NextRequest, NextResponse } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'YOUR_MICROSOFT_CLIENT_SECRET';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';

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
    const redirectUri = `${new URL(request.url).origin}/api/calendar/outlook/callback`;

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
      const errorData = await tokenResponse.json();
      console.error('Microsoft token exchange error:', errorData);
      return NextResponse.redirect(
        new URL(`/settings?calendar_error=${encodeURIComponent(errorData.error || 'token_exchange_failed')}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    let email = '';
    let name = '';
    try {
      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.mail || userInfo.userPrincipalName || '';
        name = userInfo.displayName || '';
      }
    } catch (e) {
      console.error('Failed to fetch user info:', e);
    }

    // Get default calendar
    let calendarId = '';
    let calendarName = 'Standardkalender';
    try {
      const calendarResponse = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        const defaultCalendar = calendarData.value?.find((cal: any) => cal.isDefaultCalendar);
        if (defaultCalendar) {
          calendarId = defaultCalendar.id;
          calendarName = defaultCalendar.name || 'Standardkalender';
        } else if (calendarData.value?.length > 0) {
          calendarId = calendarData.value[0].id;
          calendarName = calendarData.value[0].name || 'Standardkalender';
        }
      }
    } catch (e) {
      console.error('Failed to fetch calendars:', e);
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Create redirect URL with token data
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('outlook_connected', 'true');
    redirectUrl.searchParams.set('outlook_email', email);
    redirectUrl.searchParams.set('outlook_name', name);
    redirectUrl.searchParams.set('outlook_calendar_id', calendarId);
    redirectUrl.searchParams.set('outlook_calendar_name', calendarName);
    redirectUrl.searchParams.set('outlook_access_token', tokenData.access_token);
    redirectUrl.searchParams.set('outlook_refresh_token', tokenData.refresh_token);
    redirectUrl.searchParams.set('outlook_expires_at', expiresAt);

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Microsoft OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=${encodeURIComponent(error.message || 'unknown_error')}`, request.url)
    );
  }
}
