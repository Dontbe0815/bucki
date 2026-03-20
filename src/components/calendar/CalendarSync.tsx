'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  CalendarCheck,
  CalendarSync as CalendarSyncIcon,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  FileText,
  Wrench,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useCalendarSyncStore } from '@/lib/calendar/store';
import { getGoogleAuthUrl } from '@/lib/calendar/google';
import { getMicrosoftAuthUrl } from '@/lib/calendar/outlook';
import type { CalendarProvider, CalendarConnection, CalendarSyncSettings } from '@/lib/types';

interface CalendarSyncProps {
  properties: any[];
  units: any[];
  tenants: any[];
  tasks: any[];
  inspections: any[];
  language?: 'de' | 'en';
}

// Translations
const translations = {
  de: {
    title: 'Kalender-Synchronisation',
    description: 'Synchronisieren Sie Ihre Termine mit Google Calendar oder Microsoft Outlook',
    connectProvider: 'Mit {provider} verbinden',
    disconnect: 'Verbindung trennen',
    connected: 'Verbunden',
    notConnected: 'Nicht verbunden',
    lastSync: 'Letzte Synchronisation',
    never: 'Nie',
    syncNow: 'Jetzt synchronisieren',
    syncing: 'Synchronisiere...',
    syncComplete: 'Synchronisation abgeschlossen',
    syncError: 'Synchronisation fehlgeschlagen',
    eventsCreated: 'Termine erstellt',
    eventsUpdated: 'Termine aktualisiert',
    eventsDeleted: 'Termine gelöscht',
    configureFirst: 'Bitte konfigurieren Sie zuerst die Synchronisation in den Einstellungen',
    googleCalendar: 'Google Calendar',
    outlook: 'Microsoft Outlook',
    rentPayments: 'Mietzahlungen',
    maintenanceTasks: 'Wartungstermine',
    contractExpirations: 'Vertragsabläufe',
    utilitySettlements: 'Betriebskostenabrechnungen',
    inspections: 'Inspektionen',
    autoSync: 'Automatische Synchronisation',
    manual: 'Manuell',
    everyHour: 'Stündlich',
    every6Hours: 'Alle 6 Stunden',
    everyDay: 'Täglich',
    bidirectional: 'Bidirektionale Synchronisation',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    selectCalendar: 'Kalender auswählen',
    syncSettings: 'Synchronisationseinstellungen',
    upcomingEvents: 'Anstehende Termine',
    noUpcomingEvents: 'Keine anstehenden Termine',
    configureOAuth: 'OAuth konfigurieren',
    oauthHint: 'Hinweis: Sie müssen OAuth-Client-ID und Secret in Ihrer .env.local Datei konfigurieren',
    viewInCalendar: 'Im Kalender anzeigen',
    syncStatus: 'Sync-Status',
    error: 'Fehler',
    retry: 'Erneut versuchen',
  },
  en: {
    title: 'Calendar Synchronization',
    description: 'Sync your events with Google Calendar or Microsoft Outlook',
    connectProvider: 'Connect with {provider}',
    disconnect: 'Disconnect',
    connected: 'Connected',
    notConnected: 'Not connected',
    lastSync: 'Last sync',
    never: 'Never',
    syncNow: 'Sync now',
    syncing: 'Syncing...',
    syncComplete: 'Sync complete',
    syncError: 'Sync failed',
    eventsCreated: 'Events created',
    eventsUpdated: 'Events updated',
    eventsDeleted: 'Events deleted',
    configureFirst: 'Please configure synchronization in settings first',
    googleCalendar: 'Google Calendar',
    outlook: 'Microsoft Outlook',
    rentPayments: 'Rent payments',
    maintenanceTasks: 'Maintenance tasks',
    contractExpirations: 'Contract expirations',
    utilitySettlements: 'Utility settlements',
    inspections: 'Inspections',
    autoSync: 'Auto sync',
    manual: 'Manual',
    everyHour: 'Every hour',
    every6Hours: 'Every 6 hours',
    everyDay: 'Every day',
    bidirectional: 'Bidirectional sync',
    enabled: 'Enabled',
    disabled: 'Disabled',
    selectCalendar: 'Select calendar',
    syncSettings: 'Sync settings',
    upcomingEvents: 'Upcoming events',
    noUpcomingEvents: 'No upcoming events',
    configureOAuth: 'Configure OAuth',
    oauthHint: 'Note: You need to configure OAuth Client ID and Secret in your .env.local file',
    viewInCalendar: 'View in calendar',
    syncStatus: 'Sync status',
    error: 'Error',
    retry: 'Retry',
  },
};

export default function CalendarSync({
  properties,
  units,
  tenants,
  tasks,
  inspections,
  language = 'de',
}: CalendarSyncProps) {
  const t = translations[language];
  
  const {
    connections,
    settings,
    syncedEvents,
    isSyncing,
    lastSyncResult,
    setConnection,
    removeConnection,
    setIsSyncing,
    setLastSyncResult,
    addSyncedEvent,
  } = useCalendarSyncStore();

  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [providerToDisconnect, setProviderToDisconnect] = useState<CalendarProvider | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const googleConnection = connections.find(c => c.provider === 'google');
  const outlookConnection = connections.find(c => c.provider === 'outlook');

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Google callback
    if (urlParams.get('google_connected') === 'true') {
      const connection: CalendarConnection = {
        provider: 'google',
        connected: true,
        email: urlParams.get('google_email') || undefined,
        calendarId: urlParams.get('google_calendar_id') || 'primary',
        calendarName: urlParams.get('google_calendar_name') || 'Primary',
        accessToken: urlParams.get('google_access_token') || undefined,
        refreshToken: urlParams.get('google_refresh_token') || undefined,
        tokenExpiry: urlParams.get('google_expires_at') || undefined,
        lastSync: new Date().toISOString(),
        status: 'connected',
      };
      setConnection(connection);
      toast.success(t.connected + ': Google Calendar');
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Outlook callback
    if (urlParams.get('outlook_connected') === 'true') {
      const connection: CalendarConnection = {
        provider: 'outlook',
        connected: true,
        email: urlParams.get('outlook_email') || undefined,
        calendarId: urlParams.get('outlook_calendar_id') || '',
        calendarName: urlParams.get('outlook_calendar_name') || 'Default',
        accessToken: urlParams.get('outlook_access_token') || undefined,
        refreshToken: urlParams.get('outlook_refresh_token') || undefined,
        tokenExpiry: urlParams.get('outlook_expires_at') || undefined,
        lastSync: new Date().toISOString(),
        status: 'connected',
      };
      setConnection(connection);
      toast.success(t.connected + ': Microsoft Outlook');
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Error callback
    const error = urlParams.get('calendar_error');
    if (error) {
      toast.error(`${t.error}: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setConnection, t.connected, t.error]);

  // Connect to Google
  const handleConnectGoogle = useCallback(() => {
    const state = JSON.stringify({
      provider: 'google',
      timestamp: Date.now(),
    });
    const authUrl = getGoogleAuthUrl(state);
    window.location.href = authUrl;
  }, []);

  // Connect to Outlook
  const handleConnectOutlook = useCallback(() => {
    const state = JSON.stringify({
      provider: 'outlook',
      timestamp: Date.now(),
    });
    const authUrl = getMicrosoftAuthUrl(state);
    window.location.href = authUrl;
  }, []);

  // Disconnect provider
  const handleDisconnect = useCallback((provider: CalendarProvider) => {
    setProviderToDisconnect(provider);
    setShowDisconnectDialog(true);
  }, []);

  const confirmDisconnect = useCallback(() => {
    if (providerToDisconnect) {
      removeConnection(providerToDisconnect);
      toast.success(language === 'de' ? 'Verbindung getrennt' : 'Disconnected');
    }
    setShowDisconnectDialog(false);
    setProviderToDisconnect(null);
  }, [providerToDisconnect, removeConnection, language]);

  // Sync now
  const handleSyncNow = useCallback(async (provider: CalendarProvider) => {
    const connection = connections.find(c => c.provider === provider);
    if (!connection || !connection.accessToken || !connection.calendarId) {
      toast.error(t.configureFirst);
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Generate events based on settings
      const eventsToSync: any[] = [];

      if (settings.syncRentPayments) {
        units.forEach(unit => {
          if (unit.status !== 'rented') return;
          const tenant = tenants.find(t => t.unitId === unit.id);
          const property = properties.find(p => p.id === unit.propertyId);
          if (tenant && property) {
            const today = new Date();
            const dueDate = new Date(today.getFullYear(), today.getMonth(), 3);
            eventsToSync.push({
              title: `Miete: ${tenant.firstName} ${tenant.lastName} - €${unit.totalRent.toFixed(2)}`,
              description: `Mietzahlung fällig\n\nMieter: ${tenant.firstName} ${tenant.lastName}\nImmobilie: ${property.name}\nEinheit: ${unit.unitNumber}\nBetrag: €${unit.totalRent.toFixed(2)}`,
              startDateTime: dueDate.toISOString().split('T')[0],
              endDateTime: new Date(dueDate.getTime() + 86400000).toISOString().split('T')[0],
              allDay: true,
              isRecurring: settings.createRecurringPayments,
              recurrenceRule: 'RRULE:FREQ=MONTHLY;BYMONTHDAY=3',
            });
          }
        });
      }

      if (settings.syncMaintenanceTasks) {
        tasks.forEach(task => {
          if (task.category !== 'maintenance' || task.status === 'completed') return;
          const property = task.propertyId ? properties.find(p => p.id === task.propertyId) : null;
          const unit = task.unitId ? units.find(u => u.id === task.unitId) : null;
          eventsToSync.push({
            title: `Wartung: ${task.title}`,
            description: `${task.description}\n\n${property ? `Immobilie: ${property.name}` : ''}${unit ? `\nEinheit: ${unit.unitNumber}` : ''}`,
            startDateTime: task.dueDate,
            endDateTime: new Date(new Date(task.dueDate).getTime() + 3600000).toISOString(),
            allDay: false,
            isRecurring: false,
          });
        });
      }

      if (settings.syncContractExpirations) {
        tenants.forEach(tenant => {
          if (!tenant.contractEndDate) return;
          const unit = units.find(u => u.id === tenant.unitId);
          const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
          if (unit && property) {
            eventsToSync.push({
              title: `Vertragsende: ${tenant.firstName} ${tenant.lastName}`,
              description: `Mietvertrag endet am ${new Date(tenant.contractEndDate).toLocaleDateString('de-DE')}\n\nImmobilie: ${property.name}\nEinheit: ${unit.unitNumber}`,
              startDateTime: tenant.contractEndDate,
              endDateTime: new Date(new Date(tenant.contractEndDate).getTime() + 86400000).toISOString(),
              allDay: true,
              isRecurring: false,
            });
          }
        });
      }

      if (settings.syncInspections) {
        inspections.forEach(inspection => {
          if (inspection.status === 'completed' || inspection.status === 'cancelled') return;
          const property = properties.find(p => p.id === inspection.propertyId);
          const unit = inspection.unitId ? units.find(u => u.id === inspection.unitId) : null;
          eventsToSync.push({
            title: `Inspektion: ${property?.name || 'Unbekannt'}${unit ? ` - ${unit.unitNumber}` : ''}`,
            description: `${inspection.type}\n\nImmobilie: ${property?.name || 'Unbekannt'}${unit ? `\nEinheit: ${unit.unitNumber}` : ''}`,
            startDateTime: inspection.scheduledDate,
            endDateTime: new Date(new Date(inspection.scheduledDate).getTime() + 3600000).toISOString(),
            allDay: false,
            isRecurring: false,
          });
        });
      }

      // Simulate sync progress
      const totalEvents = eventsToSync.length;
      for (let i = 0; i < totalEvents; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setSyncProgress(Math.round(((i + 1) / totalEvents) * 100));
      }

      // Call sync API
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          accessToken: connection.accessToken,
          calendarId: connection.calendarId,
          events: eventsToSync,
          settings,
        }),
      });

      const result = await response.json();
      setLastSyncResult(result);

      if (result.success) {
        // Update connection with last sync time
        setConnection({
          ...connection,
          lastSync: new Date().toISOString(),
        });
        toast.success(`${t.syncComplete}: ${result.eventsCreated} ${t.eventsCreated}, ${result.eventsUpdated} ${t.eventsUpdated}`);
      } else {
        toast.error(t.syncError);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`${t.syncError}: ${error.message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [connections, settings, units, tenants, properties, tasks, inspections, setIsSyncing, setLastSyncResult, setConnection, t]);

  // Get sync interval label
  const getSyncIntervalLabel = (minutes: number) => {
    if (minutes === 0) return t.manual;
    if (minutes === 60) return t.everyHour;
    if (minutes === 360) return t.every6Hours;
    if (minutes === 1440) return t.everyDay;
    return `${minutes} min`;
  };

  // Provider Card Component
  const ProviderCard = ({ 
    provider, 
    connection, 
    icon: Icon, 
    name,
    onConnect,
    onDisconnect,
    onSync,
  }: {
    provider: CalendarProvider;
    connection?: CalendarConnection;
    icon: any;
    name: string;
    onConnect: () => void;
    onDisconnect: () => void;
    onSync: () => void;
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${connection?.connected ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Icon className={`h-5 w-5 ${connection?.connected ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>
                {connection?.email || t.notConnected}
              </CardDescription>
            </div>
          </div>
          {connection?.connected && (
            <Badge variant="default" className="bg-emerald-600">
              <Check className="h-3 w-3 mr-1" />
              {t.connected}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection?.connected ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.lastSync}:</span>
              <span>{connection.lastSync ? format(new Date(connection.lastSync), 'dd.MM.yyyy HH:mm', { locale: de }) : t.never}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.selectCalendar}:</span>
              <span>{connection.calendarName || 'Primary'}</span>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.syncing}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t.syncNow}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={onDisconnect}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={onConnect} className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t.connectProvider.replace('{provider}', name)}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarSyncIcon className="h-6 w-6 text-emerald-600" />
          {t.title}
        </h2>
        <p className="text-muted-foreground mt-1">{t.description}</p>
      </div>

      {/* Sync Progress */}
      {isSyncing && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t.syncing}</p>
                <Progress value={syncProgress} className="h-2 mt-1" />
              </div>
              <span className="text-sm text-muted-foreground">{syncProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProviderCard
          provider="google"
          connection={googleConnection}
          icon={Calendar}
          name={t.googleCalendar}
          onConnect={handleConnectGoogle}
          onDisconnect={() => handleDisconnect('google')}
          onSync={() => handleSyncNow('google')}
        />
        <ProviderCard
          provider="outlook"
          connection={outlookConnection}
          icon={CalendarCheck}
          name={t.outlook}
          onConnect={handleConnectOutlook}
          onDisconnect={() => handleDisconnect('outlook')}
          onSync={() => handleSyncNow('outlook')}
        />
      </div>

      {/* Sync Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t.syncSettings}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {settings.syncRentPayments ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
              <span>{t.rentPayments}</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.syncMaintenanceTasks ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
              <span>{t.maintenanceTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.syncContractExpirations ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
              <span>{t.contractExpirations}</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.syncUtilitySettlements ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
              <span>{t.utilitySettlements}</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.syncInspections ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
              <span>{t.inspections}</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.bidirectional ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
              <span>{t.bidirectional}</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.autoSync}:</span>
            <Badge variant="outline">{getSyncIntervalLabel(settings.syncInterval)}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.upcomingEvents}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {syncedEvents.length > 0 ? (
              <div className="space-y-2">
                {syncedEvents.slice(0, 10).map((event, index) => (
                  <div
                    key={event.id || index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${
                        event.eventType === 'rent_payment' ? 'bg-green-100 text-green-600' :
                        event.eventType === 'maintenance' ? 'bg-blue-100 text-blue-600' :
                        event.eventType === 'contract_expiry' ? 'bg-orange-100 text-orange-600' :
                        event.eventType === 'inspection' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {event.eventType === 'rent_payment' ? <Users className="h-4 w-4" /> :
                         event.eventType === 'maintenance' ? <Wrench className="h-4 w-4" /> :
                         event.eventType === 'contract_expiry' ? <FileText className="h-4 w-4" /> :
                         event.eventType === 'inspection' ? <Building2 className="h-4 w-4" /> :
                         <Calendar className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.startDateTime), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {event.provider}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2 opacity-50" />
                <p>{t.noUpcomingEvents}</p>
                <p className="text-xs mt-1">{t.configureFirst}</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* OAuth Configuration Hint */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">{t.configureOAuth}</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{t.oauthHint}</p>
              <pre className="mt-2 p-2 bg-amber-100 dark:bg-amber-900 rounded text-xs overflow-x-auto">
{`GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.disconnect}</DialogTitle>
            <DialogDescription>
              {language === 'de'
                ? 'Möchten Sie die Verbindung wirklich trennen? Alle synchronisierten Termine bleiben im externen Kalender erhalten.'
                : 'Are you sure you want to disconnect? All synced events will remain in the external calendar.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              {language === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={confirmDisconnect}>
              {t.disconnect}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
