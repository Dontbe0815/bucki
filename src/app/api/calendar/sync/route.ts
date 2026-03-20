/**
 * Calendar Sync API Route
 * 
 * Synchronisiert Events mit verbundenen Kalendern
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, accessToken, calendarId, events, settings } = body;

    if (!provider || !accessToken || !calendarId) {
      return NextResponse.json(
        { message: 'Provider, access token, and calendar ID are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results = {
      success: true,
      provider,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: [] as any[],
      syncDuration: 0,
    };

    if (provider === 'google') {
      // Sync with Google Calendar
      for (const event of events || []) {
        try {
          if (event.externalEventId) {
            // Update existing event
            const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${event.externalEventId}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  summary: event.title,
                  description: event.description,
                  start: event.allDay
                    ? { date: event.startDateTime.split('T')[0] }
                    : { dateTime: event.startDateTime },
                  end: event.allDay
                    ? { date: event.endDateTime.split('T')[0] }
                    : { dateTime: event.endDateTime },
                  recurrence: event.isRecurring ? [event.recurrenceRule] : undefined,
                  reminders: settings?.addReminders ? {
                    useDefault: false,
                    overrides: [
                      { method: 'popup', minutes: settings.defaultReminderMinutes || 60 },
                    ],
                  } : undefined,
                }),
              }
            );

            if (response.ok) {
              results.eventsUpdated++;
            } else if (response.status === 401) {
              results.errors.push({
                provider: 'google',
                error: 'TOKEN_EXPIRED',
                recoverable: true,
              });
            } else {
              const error = await response.json();
              results.errors.push({
                provider: 'google',
                error: error.error?.message || 'Update failed',
                recoverable: false,
              });
            }
          } else {
            // Create new event
            const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  summary: event.title,
                  description: event.description,
                  start: event.allDay
                    ? { date: event.startDateTime.split('T')[0] }
                    : { dateTime: event.startDateTime },
                  end: event.allDay
                    ? { date: event.endDateTime.split('T')[0] }
                    : { dateTime: event.endDateTime },
                  recurrence: event.isRecurring ? [event.recurrenceRule] : undefined,
                  reminders: settings?.addReminders ? {
                    useDefault: false,
                    overrides: [
                      { method: 'popup', minutes: settings.defaultReminderMinutes || 60 },
                    ],
                  } : undefined,
                }),
              }
            );

            if (response.ok) {
              results.eventsCreated++;
            } else if (response.status === 401) {
              results.errors.push({
                provider: 'google',
                error: 'TOKEN_EXPIRED',
                recoverable: true,
              });
            } else {
              const error = await response.json();
              results.errors.push({
                provider: 'google',
                error: error.error?.message || 'Create failed',
                recoverable: false,
              });
            }
          }
        } catch (e: any) {
          results.errors.push({
            provider: 'google',
            error: e.message,
            recoverable: false,
          });
        }
      }
    } else if (provider === 'outlook') {
      // Sync with Microsoft Outlook
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      for (const event of events || []) {
        try {
          const outlookEvent = {
            subject: event.title,
            body: {
              contentType: 'text',
              content: event.description,
            },
            start: {
              dateTime: event.startDateTime,
              timeZone: timeZone,
            },
            end: {
              dateTime: event.endDateTime,
              timeZone: timeZone,
            },
            isAllDay: event.allDay,
          };

          if (event.externalEventId) {
            // Update existing event
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${event.externalEventId}`,
              {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(outlookEvent),
              }
            );

            if (response.ok) {
              results.eventsUpdated++;
            } else if (response.status === 401) {
              results.errors.push({
                provider: 'outlook',
                error: 'TOKEN_EXPIRED',
                recoverable: true,
              });
            } else {
              const error = await response.json();
              results.errors.push({
                provider: 'outlook',
                error: error.error?.message || 'Update failed',
                recoverable: false,
              });
            }
          } else {
            // Create new event
            const response = await fetch(
              `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(outlookEvent),
              }
            );

            if (response.ok) {
              results.eventsCreated++;
            } else if (response.status === 401) {
              results.errors.push({
                provider: 'outlook',
                error: 'TOKEN_EXPIRED',
                recoverable: true,
              });
            } else {
              const error = await response.json();
              results.errors.push({
                provider: 'outlook',
                error: error.error?.message || 'Create failed',
                recoverable: false,
              });
            }
          }
        } catch (e: any) {
          results.errors.push({
            provider: 'outlook',
            error: e.message,
            recoverable: false,
          });
        }
      }
    } else {
      return NextResponse.json(
        { message: 'Unsupported provider' },
        { status: 400 }
      );
    }

    results.success = results.errors.length === 0;
    results.syncDuration = Date.now() - startTime;

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
