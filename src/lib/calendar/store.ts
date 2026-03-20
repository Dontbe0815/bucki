/**
 * Calendar Sync Store - Zustand Store für Kalender-Synchronisation
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CalendarProvider,
  CalendarConnection,
  CalendarSyncSettings,
  SyncedCalendarEvent,
  CalendarSyncResult,
  DEFAULT_CALENDAR_SYNC_SETTINGS,
} from '@/lib/types';
import { DEFAULT_CALENDAR_SYNC_SETTINGS as defaultSettings } from '@/lib/types';

// Generate unique ID
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Calendar Sync State
export interface CalendarSyncState {
  // Connections
  connections: CalendarConnection[];
  
  // Settings
  settings: CalendarSyncSettings;
  
  // Synced Events
  syncedEvents: SyncedCalendarEvent[];
  
  // Sync State
  isSyncing: boolean;
  lastSyncResult: CalendarSyncResult | null;
  
  // Actions - Connections
  setConnection: (connection: CalendarConnection) => void;
  updateConnection: (provider: CalendarProvider, updates: Partial<CalendarConnection>) => void;
  removeConnection: (provider: CalendarProvider) => void;
  getConnection: (provider: CalendarProvider) => CalendarConnection | undefined;
  
  // Actions - Settings
  updateSettings: (settings: Partial<CalendarSyncSettings>) => void;
  resetSettings: () => void;
  
  // Actions - Synced Events
  addSyncedEvent: (event: Omit<SyncedCalendarEvent, 'id'>) => void;
  updateSyncedEvent: (id: string, updates: Partial<SyncedCalendarEvent>) => void;
  removeSyncedEvent: (id: string) => void;
  getSyncedEventsByProperty: (propertyId: string) => SyncedCalendarEvent[];
  getSyncedEventsByType: (eventType: SyncedCalendarEvent['eventType']) => SyncedCalendarEvent[];
  
  // Actions - Sync
  setIsSyncing: (isSyncing: boolean) => void;
  setLastSyncResult: (result: CalendarSyncResult | null) => void;
  
  // Utility
  clearAllData: () => void;
}

export const useCalendarSyncStore = create<CalendarSyncState>()(
  persist(
    (set, get) => ({
      // Initial State
      connections: [],
      settings: defaultSettings,
      syncedEvents: [],
      isSyncing: false,
      lastSyncResult: null,

      // Connection Actions
      setConnection: (connection) => set((state) => {
        const existingIndex = state.connections.findIndex(c => c.provider === connection.provider);
        if (existingIndex >= 0) {
          const newConnections = [...state.connections];
          newConnections[existingIndex] = connection;
          return { connections: newConnections };
        }
        return { connections: [...state.connections, connection] };
      }),

      updateConnection: (provider, updates) => set((state) => ({
        connections: state.connections.map(c =>
          c.provider === provider ? { ...c, ...updates } : c
        ),
      })),

      removeConnection: (provider) => set((state) => ({
        connections: state.connections.filter(c => c.provider !== provider),
        syncedEvents: state.syncedEvents.filter(e => e.provider !== provider),
      })),

      getConnection: (provider) => {
        return get().connections.find(c => c.provider === provider);
      },

      // Settings Actions
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      resetSettings: () => set({ settings: defaultSettings }),

      // Synced Events Actions
      addSyncedEvent: (event) => set((state) => ({
        syncedEvents: [...state.syncedEvents, { ...event, id: generateId() }],
      })),

      updateSyncedEvent: (id, updates) => set((state) => ({
        syncedEvents: state.syncedEvents.map(e =>
          e.id === id ? { ...e, ...updates, lastSynced: new Date().toISOString() } : e
        ),
      })),

      removeSyncedEvent: (id) => set((state) => ({
        syncedEvents: state.syncedEvents.filter(e => e.id !== id),
      })),

      getSyncedEventsByProperty: (propertyId) => {
        return get().syncedEvents.filter(e => e.propertyId === propertyId);
      },

      getSyncedEventsByType: (eventType) => {
        return get().syncedEvents.filter(e => e.eventType === eventType);
      },

      // Sync Actions
      setIsSyncing: (isSyncing) => set({ isSyncing }),

      setLastSyncResult: (result) => set({ lastSyncResult: result }),

      // Utility
      clearAllData: () => set({
        connections: [],
        settings: defaultSettings,
        syncedEvents: [],
        isSyncing: false,
        lastSyncResult: null,
      }),
    }),
    {
      name: 'bucki-calendar-sync',
      partialize: (state) => ({
        connections: state.connections,
        settings: state.settings,
        syncedEvents: state.syncedEvents,
      }),
    }
  )
);

// Helper Hooks
export function useCalendarConnections() {
  return useCalendarSyncStore((state) => state.connections);
}

export function useCalendarSettings() {
  return useCalendarSyncStore((state) => state.settings);
}

export function useIsCalendarSyncing() {
  return useCalendarSyncStore((state) => state.isSyncing);
}

export function useGoogleConnection() {
  return useCalendarSyncStore((state) => 
    state.connections.find(c => c.provider === 'google')
  );
}

export function useOutlookConnection() {
  return useCalendarSyncStore((state) => 
    state.connections.find(c => c.provider === 'outlook')
  );
}

export function useConnectedCalendars() {
  return useCalendarSyncStore((state) => 
    state.connections.filter(c => c.connected)
  );
}

// Event Generation Helpers
export function generateRentPaymentEvents(
  units: any[],
  tenants: any[],
  properties: any[],
  settings: CalendarSyncSettings
): Omit<SyncedCalendarEvent, 'id'>[] {
  const events: Omit<SyncedCalendarEvent, 'id'>[] = [];
  const now = new Date().toISOString();

  units.forEach(unit => {
    if (unit.status !== 'rented') return;
    
    const tenant = tenants.find(t => t.unitId === unit.id);
    if (!tenant) return;

    const property = properties.find(p => p.id === unit.propertyId);
    if (!property) return;

    // Generate event for current month
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), 3); // 3rd of month

    events.push({
      externalEventId: '',
      provider: 'google', // Will be set during sync
      eventType: 'rent_payment',
      propertyId: unit.propertyId,
      unitId: unit.id,
      tenantId: tenant.id,
      title: `Miete: ${tenant.firstName} ${tenant.lastName} - €${unit.totalRent.toFixed(2)}`,
      description: `Mietzahlung fällig\n\nMieter: ${tenant.firstName} ${tenant.lastName}\nImmobilie: ${property.name}\nEinheit: ${unit.unitNumber}\nBetrag: €${unit.totalRent.toFixed(2)}`,
      startDateTime: dueDate.toISOString().split('T')[0],
      endDateTime: new Date(dueDate.getTime() + 86400000).toISOString().split('T')[0],
      allDay: true,
      isRecurring: settings.createRecurringPayments,
      recurrenceRule: settings.createRecurringPayments ? 'RRULE:FREQ=MONTHLY;BYMONTHDAY=3' : undefined,
      lastSynced: now,
      syncHash: '',
      externalCalendarId: '',
    });
  });

  return events;
}

export function generateMaintenanceEvents(
  tasks: any[],
  properties: any[],
  units: any[]
): Omit<SyncedCalendarEvent, 'id'>[] {
  const events: Omit<SyncedCalendarEvent, 'id'>[] = [];
  const now = new Date().toISOString();

  tasks.forEach(task => {
    if (task.category !== 'maintenance' || task.status === 'completed') return;

    const property = task.propertyId ? properties.find(p => p.id === task.propertyId) : null;
    const unit = task.unitId ? units.find(u => u.id === task.unitId) : null;

    events.push({
      externalEventId: '',
      provider: 'google',
      eventType: 'maintenance',
      propertyId: task.propertyId,
      unitId: task.unitId,
      taskId: task.id,
      title: `Wartung: ${task.title}`,
      description: `${task.description}\n\n${property ? `Immobilie: ${property.name}` : ''}${unit ? `\nEinheit: ${unit.unitNumber}` : ''}`,
      startDateTime: task.dueDate,
      endDateTime: new Date(new Date(task.dueDate).getTime() + 3600000).toISOString(),
      allDay: false,
      isRecurring: false,
      lastSynced: now,
      syncHash: '',
      externalCalendarId: '',
    });
  });

  return events;
}

export function generateContractExpiryEvents(
  tenants: any[],
  properties: any[],
  units: any[],
  settings: CalendarSyncSettings
): Omit<SyncedCalendarEvent, 'id'>[] {
  const events: Omit<SyncedCalendarEvent, 'id'>[] = [];
  const now = new Date().toISOString();

  tenants.forEach(tenant => {
    if (!tenant.contractEndDate) return;

    const unit = units.find(u => u.id === tenant.unitId);
    if (!unit) return;

    const property = properties.find(p => p.id === unit.propertyId);
    if (!property) return;

    const expiryDate = new Date(tenant.contractEndDate);
    const noticeDate = new Date(expiryDate);
    noticeDate.setMonth(noticeDate.getMonth() - 3); // 3 Monate Kündigungsfrist

    events.push({
      externalEventId: '',
      provider: 'google',
      eventType: 'contract_expiry',
      propertyId: unit.propertyId,
      unitId: unit.id,
      tenantId: tenant.id,
      title: `Vertragsende: ${tenant.firstName} ${tenant.lastName}`,
      description: `Mietvertrag endet am ${expiryDate.toLocaleDateString('de-DE')}\n\nKündigungsfrist: 3 Monate\nKündigungsfrist endet: ${noticeDate.toLocaleDateString('de-DE')}\n\nImmobilie: ${property.name}\nEinheit: ${unit.unitNumber}`,
      startDateTime: tenant.contractEndDate,
      endDateTime: new Date(new Date(tenant.contractEndDate).getTime() + 86400000).toISOString(),
      allDay: true,
      isRecurring: false,
      lastSynced: now,
      syncHash: '',
      externalCalendarId: '',
    });
  });

  return events;
}

export function generateInspectionEvents(
  inspections: any[],
  properties: any[],
  units: any[]
): Omit<SyncedCalendarEvent, 'id'>[] {
  const events: Omit<SyncedCalendarEvent, 'id'>[] = [];
  const now = new Date().toISOString();

  inspections.forEach(inspection => {
    if (inspection.status === 'completed' || inspection.status === 'cancelled') return;

    const property = properties.find(p => p.id === inspection.propertyId);
    const unit = inspection.unitId ? units.find(u => u.id === inspection.unitId) : null;

    const inspectionTypeLabels: Record<string, string> = {
      move_in: 'Einzugsübergabe',
      move_out: 'Auszugsübergabe',
      periodic: 'Regelmäßige Kontrolle',
      maintenance: 'Wartungsinspektion',
      special: 'Besondere Inspektion',
    };

    events.push({
      externalEventId: '',
      provider: 'google',
      eventType: 'inspection',
      propertyId: inspection.propertyId,
      unitId: inspection.unitId,
      title: `Inspektion: ${property?.name || 'Unbekannt'}${unit ? ` - ${unit.unitNumber}` : ''}`,
      description: `${inspectionTypeLabels[inspection.type] || inspection.type}\n\nImmobilie: ${property?.name || 'Unbekannt'}${unit ? `\nEinheit: ${unit.unitNumber}` : ''}\nInspektor: ${inspection.inspector}`,
      startDateTime: inspection.scheduledDate,
      endDateTime: new Date(new Date(inspection.scheduledDate).getTime() + 3600000).toISOString(),
      allDay: false,
      isRecurring: false,
      lastSynced: now,
      syncHash: '',
      externalCalendarId: '',
    });
  });

  return events;
}

export default useCalendarSyncStore;
