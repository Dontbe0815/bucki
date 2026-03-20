/**
 * Google Calendar API Integration
 * 
 * Hinweis: OAuth-Client-ID und Secret müssen in der .env.local Datei konfiguriert werden:
 * GOOGLE_CLIENT_ID=your_client_id
 * GOOGLE_CLIENT_SECRET=your_client_secret
 */

import type { 
  CalendarConnection, 
  GoogleCalendar, 
  GoogleCalendarEvent,
  CalendarSyncSettings,
  SyncedCalendarEvent,
  CalendarSyncResult,
  CalendarSyncError
} from '@/lib/types';

// OAuth Configuration - muss vom User konfiguriert werden
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';

// Scopes für Google Calendar Zugriff
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

// Redirect URI wird dynamisch generiert
const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/calendar/google/callback`;
  }
  return '/api/calendar/google/callback';
};

/**
 * Generiert die OAuth-URL für Google
 */
export function getGoogleAuthUrl(state: string): string {
  const redirectUri = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/calendar/google/callback`
    : '/api/calendar/google/callback';
    
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Tauscht den Authorization Code gegen Tokens
 */
export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email?: string;
}> {
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/google/callback`
    : '/api/calendar/google/callback';

  const response = await fetch('/api/calendar/google/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Token exchange failed');
  }

  return response.json();
}

/**
 * Erneuert ein abgelaufenes Access Token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch('/api/calendar/google/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Token refresh failed');
  }

  return response.json();
}

/**
 * Ruft alle Kalender des Users ab
 */
export async function getGoogleCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('Failed to fetch calendars');
  }

  const data = await response.json();
  return data.items.map((item: any) => ({
    id: item.id,
    summary: item.summary,
    primary: item.primary,
    accessRole: item.accessRole,
  }));
}

/**
 * Erstellt ein neues Event im Google Calendar
 */
export async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: Omit<GoogleCalendarEvent, 'id'>
): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create event');
  }

  return response.json();
}

/**
 * Aktualisiert ein bestehendes Event
 */
export async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('Failed to update event');
  }

  return response.json();
}

/**
 * Löscht ein Event
 */
export async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 410) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('Failed to delete event');
  }
}

/**
 * Erstellt ein Google Calendar Event aus einer Mietzahlung
 */
export function createRentPaymentEvent(
  tenantName: string,
  propertyName: string,
  unitNumber: string,
  amount: number,
  dueDate: string,
  reminderMinutes: number = 60,
  isRecurring: boolean = true
): Omit<GoogleCalendarEvent, 'id'> {
  const date = new Date(dueDate);
  const endEventDate = new Date(date);
  endEventDate.setDate(endEventDate.getDate() + 1);

  const event: Omit<GoogleCalendarEvent, 'id'> = {
    summary: `Miete: ${tenantName} - ${formatCurrency(amount)}`,
    description: `Mietzahlung fällig\n\nMieter: ${tenantName}\nImmobilie: ${propertyName}\nEinheit: ${unitNumber}\nBetrag: ${formatCurrency(amount)}`,
    start: {
      date: dueDate.split('T')[0],
    },
    end: {
      date: endEventDate.toISOString().split('T')[0],
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: reminderMinutes },
        { method: 'email', minutes: reminderMinutes * 24 }, // 1 Tag vorher
      ],
    },
  };

  if (isRecurring) {
    event.recurrence = ['RRULE:FREQ=MONTHLY;BYMONTHDAY=3'];
  }

  return event;
}

/**
 * Erstellt ein Google Calendar Event aus einem Wartungstermin
 */
export function createMaintenanceEvent(
  title: string,
  description: string,
  propertyName: string,
  unitNumber: string,
  scheduledDate: string,
  duration: number = 60
): Omit<GoogleCalendarEvent, 'id'> {
  const start = new Date(scheduledDate);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  return {
    summary: `Wartung: ${title}`,
    description: `${description}\n\nImmobilie: ${propertyName}\nEinheit: ${unitNumber}`,
    start: {
      dateTime: start.toISOString(),
    },
    end: {
      dateTime: end.toISOString(),
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 1440 }, // 1 Tag vorher
      ],
    },
  };
}

/**
 * Erstellt ein Google Calendar Event für Vertragsablauf
 */
export function createContractExpiryEvent(
  tenantName: string,
  propertyName: string,
  unitNumber: string,
  expiryDate: string,
  noticePeriod: number = 3
): Omit<GoogleCalendarEvent, 'id'> {
  const date = new Date(expiryDate);
  const noticeDate = new Date(date);
  noticeDate.setMonth(noticeDate.getMonth() - noticePeriod);

  return {
    summary: `Vertragsende: ${tenantName}`,
    description: `Mietvertrag endet am ${formatDate(expiryDate)}\n\nKündigungsfrist: ${noticePeriod} Monate\nKündigungsfrist endet: ${formatDate(noticeDate.toISOString())}\n\nImmobilie: ${propertyName}\nEinheit: ${unitNumber}`,
    start: {
      date: expiryDate.split('T')[0],
    },
    end: {
      date: date.toISOString().split('T')[0],
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 * 30 }, // 30 Tage vorher
        { method: 'email', minutes: 1440 * 7 }, // 7 Tage vorher
        { method: 'popup', minutes: 1440 }, // 1 Tag vorher
      ],
    },
  };
}

/**
 * Erstellt ein Event für Betriebskostenabrechnung
 */
export function createUtilitySettlementEvent(
  propertyName: string,
  year: number,
  dueDate: string
): Omit<GoogleCalendarEvent, 'id'> {
  const date = new Date(dueDate);
  const endEventDate = new Date(date);
  endEventDate.setDate(endEventDate.getDate() + 1);

  return {
    summary: `Betriebskostenabrechnung ${year}: ${propertyName}`,
    description: `Betriebskostenabrechnung für das Jahr ${year}\n\nImmobilie: ${propertyName}\nFällig: ${formatDate(dueDate)}`,
    start: {
      date: dueDate.split('T')[0],
    },
    end: {
      date: endEventDate.toISOString().split('T')[0],
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 * 14 }, // 14 Tage vorher
        { method: 'popup', minutes: 1440 * 3 }, // 3 Tage vorher
      ],
    },
  };
}

/**
 * Erstellt ein Event für eine Inspektion
 */
export function createInspectionEvent(
  propertyName: string,
  unitNumber: string,
  inspectionType: string,
  scheduledDate: string,
  duration: number = 60
): Omit<GoogleCalendarEvent, 'id'> {
  const start = new Date(scheduledDate);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  return {
    summary: `Inspektion: ${propertyName} - ${unitNumber}`,
    description: `${inspectionType}\n\nImmobilie: ${propertyName}\nEinheit: ${unitNumber}\nDauer: ca. ${duration} Minuten`,
    start: {
      dateTime: start.toISOString(),
    },
    end: {
      dateTime: end.toISOString(),
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'email', minutes: 1440 }, // 1 Tag vorher
      ],
    },
  };
}

/**
 * Synchronisiert Events mit Google Calendar
 */
export async function syncWithGoogleCalendar(
  connection: CalendarConnection,
  events: SyncedCalendarEvent[],
  settings: CalendarSyncSettings
): Promise<CalendarSyncResult> {
  const startTime = Date.now();
  const errors: CalendarSyncError[] = [];
  let eventsCreated = 0;
  let eventsUpdated = 0;
  let eventsDeleted = 0;

  let accessToken = connection.accessToken!;
  
  // Prüfe ob Token erneuert werden muss
  if (connection.tokenExpiry && new Date(connection.tokenExpiry) < new Date()) {
    try {
      const newTokens = await refreshGoogleToken(connection.refreshToken!);
      accessToken = newTokens.accessToken;
    } catch (error) {
      return {
        success: false,
        provider: 'google',
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [{
          provider: 'google',
          error: 'Token refresh failed',
          timestamp: new Date().toISOString(),
          recoverable: false,
        }],
        syncDuration: Date.now() - startTime,
      };
    }
  }

  for (const event of events) {
    try {
      if (event.externalEventId) {
        // Update bestehendes Event
        await updateGoogleEvent(accessToken, connection.calendarId!, event.externalEventId, {
          summary: event.title,
          description: event.description,
          start: event.allDay 
            ? { date: event.startDateTime.split('T')[0] }
            : { dateTime: event.startDateTime },
          end: event.allDay
            ? { date: event.endDateTime.split('T')[0] }
            : { dateTime: event.endDateTime },
        });
        eventsUpdated++;
      } else {
        // Neues Event erstellen
        const googleEvent = await createGoogleEvent(accessToken, connection.calendarId!, {
          summary: event.title,
          description: event.description,
          start: event.allDay 
            ? { date: event.startDateTime.split('T')[0] }
            : { dateTime: event.startDateTime },
          end: event.allDay
            ? { date: event.endDateTime.split('T')[0] }
            : { dateTime: event.endDateTime },
          recurrence: event.isRecurring ? [event.recurrenceRule!] : undefined,
          reminders: settings.addReminders ? {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: settings.defaultReminderMinutes },
            ],
          } : undefined,
        });
        event.externalEventId = googleEvent.id;
        eventsCreated++;
      }
    } catch (error: any) {
      errors.push({
        provider: 'google',
        error: error.message,
        timestamp: new Date().toISOString(),
        recoverable: error.message === 'TOKEN_EXPIRED',
      });
    }
  }

  return {
    success: errors.length === 0,
    provider: 'google',
    eventsCreated,
    eventsUpdated,
    eventsDeleted,
    errors,
    syncDuration: Date.now() - startTime,
  };
}

// Helper Funktionen
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Widerruft den Zugriff auf Google Calendar
 */
export async function revokeGoogleAccess(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      { method: 'POST' }
    );
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  refreshGoogleToken,
  getGoogleCalendars,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  createRentPaymentEvent,
  createMaintenanceEvent,
  createContractExpiryEvent,
  createUtilitySettlementEvent,
  createInspectionEvent,
  syncWithGoogleCalendar,
  revokeGoogleAccess,
};
