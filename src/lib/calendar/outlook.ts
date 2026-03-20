/**
 * Microsoft Outlook Calendar API Integration via Microsoft Graph
 * 
 * Hinweis: OAuth-Client-ID und Secret müssen in der .env.local Datei konfiguriert werden:
 * MICROSOFT_CLIENT_ID=your_client_id
 * MICROSOFT_CLIENT_SECRET=your_client_secret
 * MICROSOFT_TENANT_ID=common (oder spezifische Tenant ID)
 */

import type { 
  CalendarConnection, 
  OutlookCalendar, 
  OutlookCalendarEvent,
  CalendarSyncSettings,
  SyncedCalendarEvent,
  CalendarSyncResult,
  CalendarSyncError
} from '@/lib/types';

// OAuth Configuration - muss vom User konfiguriert werden
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'YOUR_MICROSOFT_CLIENT_SECRET';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';

// Microsoft Graph API Scopes
const MICROSOFT_SCOPES = [
  'offline_access',
  'Calendars.ReadWrite',
  'Calendars.Read',
  'User.Read',
  'email',
].join(' ');

/**
 * Generiert die OAuth-URL für Microsoft
 */
export function getMicrosoftAuthUrl(state: string): string {
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/outlook/callback`
    : '/api/calendar/outlook/callback';

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: MICROSOFT_SCOPES,
    response_mode: 'query',
    prompt: 'consent',
    state: state,
  });

  return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Tauscht den Authorization Code gegen Tokens
 */
export async function exchangeMicrosoftCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email?: string;
}> {
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/outlook/callback`
    : '/api/calendar/outlook/callback';

  const response = await fetch('/api/calendar/outlook/token', {
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
export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch('/api/calendar/outlook/refresh', {
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
export async function getMicrosoftCalendars(accessToken: string): Promise<OutlookCalendar[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
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
  return data.value.map((item: any) => ({
    id: item.id,
    name: item.name,
    isDefaultCalendar: item.isDefaultCalendar,
    canEdit: item.canEdit,
  }));
}

/**
 * Erstellt ein neues Event im Outlook Calendar
 */
export async function createMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  event: Omit<OutlookCalendarEvent, 'id'>
): Promise<OutlookCalendarEvent> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`,
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
export async function updateMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<OutlookCalendarEvent>
): Promise<OutlookCalendarEvent> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'PATCH',
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
export async function deleteMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('Failed to delete event');
  }
}

/**
 * Erstellt ein Outlook Calendar Event aus einer Mietzahlung
 */
export function createOutlookRentPaymentEvent(
  tenantName: string,
  propertyName: string,
  unitNumber: string,
  amount: number,
  dueDate: string,
  reminderMinutes: number = 60,
  isRecurring: boolean = true
): Omit<OutlookCalendarEvent, 'id'> {
  const date = new Date(dueDate);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const event: Omit<OutlookCalendarEvent, 'id'> = {
    subject: `Miete: ${tenantName} - ${formatCurrency(amount)}`,
    body: {
      contentType: 'text',
      content: `Mietzahlung fällig\n\nMieter: ${tenantName}\nImmobilie: ${propertyName}\nEinheit: ${unitNumber}\nBetrag: ${formatCurrency(amount)}`,
    },
    start: {
      dateTime: date.toISOString(),
      timeZone: timeZone,
    },
    end: {
      dateTime: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      timeZone: timeZone,
    },
    isAllDay: true,
  };

  if (isRecurring) {
    event.recurrence = {
      pattern: {
        type: 'absoluteMonthly',
        interval: 1,
      },
      range: {
        type: 'noEnd',
        startDate: dueDate.split('T')[0],
      },
    };
  }

  return event;
}

/**
 * Erstellt ein Outlook Calendar Event aus einem Wartungstermin
 */
export function createOutlookMaintenanceEvent(
  title: string,
  description: string,
  propertyName: string,
  unitNumber: string,
  scheduledDate: string,
  duration: number = 60
): Omit<OutlookCalendarEvent, 'id'> {
  const start = new Date(scheduledDate);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    subject: `Wartung: ${title}`,
    body: {
      contentType: 'text',
      content: `${description}\n\nImmobilie: ${propertyName}\nEinheit: ${unitNumber}`,
    },
    start: {
      dateTime: start.toISOString(),
      timeZone: timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: timeZone,
    },
    isAllDay: false,
  };
}

/**
 * Erstellt ein Outlook Calendar Event für Vertragsablauf
 */
export function createOutlookContractExpiryEvent(
  tenantName: string,
  propertyName: string,
  unitNumber: string,
  expiryDate: string,
  noticePeriod: number = 3
): Omit<OutlookCalendarEvent, 'id'> {
  const date = new Date(expiryDate);
  const noticeDate = new Date(date);
  noticeDate.setMonth(noticeDate.getMonth() - noticePeriod);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    subject: `Vertragsende: ${tenantName}`,
    body: {
      contentType: 'text',
      content: `Mietvertrag endet am ${formatDate(expiryDate)}\n\nKündigungsfrist: ${noticePeriod} Monate\nKündigungsfrist endet: ${formatDate(noticeDate.toISOString())}\n\nImmobilie: ${propertyName}\nEinheit: ${unitNumber}`,
    },
    start: {
      dateTime: date.toISOString(),
      timeZone: timeZone,
    },
    end: {
      dateTime: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      timeZone: timeZone,
    },
    isAllDay: true,
  };
}

/**
 * Erstellt ein Event für Betriebskostenabrechnung
 */
export function createOutlookUtilitySettlementEvent(
  propertyName: string,
  year: number,
  dueDate: string
): Omit<OutlookCalendarEvent, 'id'> {
  const date = new Date(dueDate);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    subject: `Betriebskostenabrechnung ${year}: ${propertyName}`,
    body: {
      contentType: 'text',
      content: `Betriebskostenabrechnung für das Jahr ${year}\n\nImmobilie: ${propertyName}\nFällig: ${formatDate(dueDate)}`,
    },
    start: {
      dateTime: date.toISOString(),
      timeZone: timeZone,
    },
    end: {
      dateTime: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      timeZone: timeZone,
    },
    isAllDay: true,
  };
}

/**
 * Erstellt ein Event für eine Inspektion
 */
export function createOutlookInspectionEvent(
  propertyName: string,
  unitNumber: string,
  inspectionType: string,
  scheduledDate: string,
  duration: number = 60
): Omit<OutlookCalendarEvent, 'id'> {
  const start = new Date(scheduledDate);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    subject: `Inspektion: ${propertyName} - ${unitNumber}`,
    body: {
      contentType: 'text',
      content: `${inspectionType}\n\nImmobilie: ${propertyName}\nEinheit: ${unitNumber}\nDauer: ca. ${duration} Minuten`,
    },
    start: {
      dateTime: start.toISOString(),
      timeZone: timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: timeZone,
    },
    isAllDay: false,
  };
}

/**
 * Synchronisiert Events mit Outlook Calendar
 */
export async function syncWithOutlookCalendar(
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
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Prüfe ob Token erneuert werden muss
  if (connection.tokenExpiry && new Date(connection.tokenExpiry) < new Date()) {
    try {
      const newTokens = await refreshMicrosoftToken(connection.refreshToken!);
      accessToken = newTokens.accessToken;
    } catch (error) {
      return {
        success: false,
        provider: 'outlook',
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [{
          provider: 'outlook',
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
      const outlookEvent: Partial<OutlookCalendarEvent> = {
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
        // Update bestehendes Event
        await updateMicrosoftEvent(accessToken, connection.calendarId!, event.externalEventId, outlookEvent);
        eventsUpdated++;
      } else {
        // Neues Event erstellen
        const created = await createMicrosoftEvent(accessToken, connection.calendarId!, outlookEvent as Omit<OutlookCalendarEvent, 'id'>);
        event.externalEventId = created.id;
        eventsCreated++;
      }
    } catch (error: any) {
      errors.push({
        provider: 'outlook',
        error: error.message,
        timestamp: new Date().toISOString(),
        recoverable: error.message === 'TOKEN_EXPIRED',
      });
    }
  }

  return {
    success: errors.length === 0,
    provider: 'outlook',
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
 * Widerruft den Zugriff auf Microsoft Calendar
 */
export async function revokeMicrosoftAccess(accessToken: string): Promise<boolean> {
  try {
    // Microsoft doesn't have a direct revoke endpoint like Google
    // We need to use the logout endpoint
    const logoutUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/logout`;
    window.open(logoutUrl, '_blank');
    return true;
  } catch {
    return false;
  }
}

/**
 * Ruft die Benutzerinformationen ab
 */
export async function getMicrosoftUserInfo(accessToken: string): Promise<{
  email: string;
  displayName: string;
}> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();
  return {
    email: data.mail || data.userPrincipalName,
    displayName: data.displayName,
  };
}

export default {
  getMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  refreshMicrosoftToken,
  getMicrosoftCalendars,
  createMicrosoftEvent,
  updateMicrosoftEvent,
  deleteMicrosoftEvent,
  createOutlookRentPaymentEvent,
  createOutlookMaintenanceEvent,
  createOutlookContractExpiryEvent,
  createOutlookUtilitySettlementEvent,
  createOutlookInspectionEvent,
  syncWithOutlookCalendar,
  revokeMicrosoftAccess,
  getMicrosoftUserInfo,
};
