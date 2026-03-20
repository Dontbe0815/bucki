'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  RefreshCw,
  Bell,
  Calendar,
  CalendarDays,
  Users,
  Wrench,
  FileText,
  Receipt,
  Building2,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react';
import { useCalendarSyncStore } from '@/lib/calendar/store';
import type { CalendarSyncSettings } from '@/lib/types';

interface CalendarSettingsProps {
  language?: 'de' | 'en';
}

// Translations
const translations = {
  de: {
    title: 'Kalender-Synchronisation',
    description: 'Konfigurieren Sie die Synchronisationseinstellungen',
    generalSettings: 'Allgemeine Einstellungen',
    enableSync: 'Synchronisation aktivieren',
    enableSyncDesc: 'Aktivieren Sie die automatische Kalender-Synchronisation',
    syncInterval: 'Synchronisationsintervall',
    syncIntervalDesc: 'Wie oft Termine synchronisiert werden sollen',
    manual: 'Manuell',
    every30Min: 'Alle 30 Minuten',
    everyHour: 'Stündlich',
    every6Hours: 'Alle 6 Stunden',
    everyDay: 'Täglich',
    bidirectional: 'Bidirektionale Synchronisation',
    bidirectionalDesc: 'Änderungen aus dem Kalender zurück in die App übernehmen',
    eventTypes: 'Termintypen',
    eventTypesDesc: 'Wählen Sie welche Termine synchronisiert werden sollen',
    rentPayments: 'Mietzahlungen',
    rentPaymentsDesc: 'Monatliche Mietzahlungen als wiederkehrende Termine',
    maintenanceTasks: 'Wartungstermine',
    maintenanceTasksDesc: 'Wartungs- und Reparaturaufgaben',
    contractExpirations: 'Vertragsabläufe',
    contractExpirationsDesc: 'Ende von Mietverträgen und Kündigungsfristen',
    utilitySettlements: 'Betriebskostenabrechnungen',
    utilitySettlementsDesc: 'Fälligkeiten für Nebenkostenabrechnungen',
    deadlines: 'Fristen',
    deadlinesDesc: 'Wichtige Deadlines und Termine',
    inspections: 'Inspektionen',
    inspectionsDesc: 'Begehungstermine und Wohnungsübergaben',
    reminderSettings: 'Erinnerungseinstellungen',
    addReminders: 'Erinnerungen hinzufügen',
    addRemindersDesc: 'Automatische Erinnerungen zu Terminen hinzufügen',
    reminderTime: 'Erinnerungszeit',
    reminderTimeDesc: 'Minuten vor dem Termin',
    recurringSettings: 'Wiederkehrende Termine',
    createRecurringPayments: 'Wiederkehrende Mietzahlungen',
    createRecurringPaymentsDesc: 'Mietzahlungen als monatliche wiederkehrende Termine erstellen',
    paymentReminderDays: 'Zahlungserinnerung',
    paymentReminderDaysDesc: 'Tage vor Fälligkeit erinnern',
    advancedSettings: 'Erweiterte Einstellungen',
    resetSettings: 'Einstellungen zurücksetzen',
    resetSettingsDesc: 'Alle Einstellungen auf Standardwerte zurücksetzen',
    minutes: 'Minuten',
    days: 'Tage',
  },
  en: {
    title: 'Calendar Synchronization',
    description: 'Configure synchronization settings',
    generalSettings: 'General Settings',
    enableSync: 'Enable Sync',
    enableSyncDesc: 'Enable automatic calendar synchronization',
    syncInterval: 'Sync Interval',
    syncIntervalDesc: 'How often to synchronize events',
    manual: 'Manual',
    every30Min: 'Every 30 minutes',
    everyHour: 'Every hour',
    every6Hours: 'Every 6 hours',
    everyDay: 'Every day',
    bidirectional: 'Bidirectional Sync',
    bidirectionalDesc: 'Import changes from calendar back to the app',
    eventTypes: 'Event Types',
    eventTypesDesc: 'Select which events to synchronize',
    rentPayments: 'Rent Payments',
    rentPaymentsDesc: 'Monthly rent payments as recurring events',
    maintenanceTasks: 'Maintenance Tasks',
    maintenanceTasksDesc: 'Maintenance and repair tasks',
    contractExpirations: 'Contract Expirations',
    contractExpirationsDesc: 'End of rental contracts and notice periods',
    utilitySettlements: 'Utility Settlements',
    utilitySettlementsDesc: 'Due dates for utility cost settlements',
    deadlines: 'Deadlines',
    deadlinesDesc: 'Important deadlines and dates',
    inspections: 'Inspections',
    inspectionsDesc: 'Inspection appointments and move-in/move-out',
    reminderSettings: 'Reminder Settings',
    addReminders: 'Add Reminders',
    addRemindersDesc: 'Add automatic reminders to events',
    reminderTime: 'Reminder Time',
    reminderTimeDesc: 'Minutes before the event',
    recurringSettings: 'Recurring Events',
    createRecurringPayments: 'Recurring Rent Payments',
    createRecurringPaymentsDesc: 'Create rent payments as monthly recurring events',
    paymentReminderDays: 'Payment Reminder',
    paymentReminderDaysDesc: 'Days before due date to remind',
    advancedSettings: 'Advanced Settings',
    resetSettings: 'Reset Settings',
    resetSettingsDesc: 'Reset all settings to default values',
    minutes: 'minutes',
    days: 'days',
  },
};

// Setting row component - defined outside to avoid React errors
interface SettingRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingRow({ icon: Icon, title, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">{title}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export default function CalendarSettings({ language = 'de' }: CalendarSettingsProps) {
  const t = translations[language];
  const { settings, updateSettings, resetSettings } = useCalendarSyncStore();

  // Toggle handler
  const handleToggle = (key: keyof CalendarSyncSettings) => (checked: boolean) => {
    updateSettings({ [key]: checked });
  };

  // Slider handler for reminder minutes
  const handleReminderMinutesChange = (value: number[]) => {
    updateSettings({ defaultReminderMinutes: value[0] });
  };

  // Slider handler for payment reminder days
  const handlePaymentReminderDaysChange = (value: number[]) => {
    updateSettings({ paymentReminderDays: value[0] });
  };

  // Sync interval change
  const handleSyncIntervalChange = (value: string) => {
    updateSettings({ syncInterval: parseInt(value, 10) });
  };

  // Get interval label
  const getIntervalLabel = (minutes: number) => {
    switch (minutes) {
      case 0: return t.manual;
      case 30: return t.every30Min;
      case 60: return t.everyHour;
      case 360: return t.every6Hours;
      case 1440: return t.everyDay;
      default: return `${minutes} min`;
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            {t.generalSettings}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            icon={RefreshCw}
            title={t.enableSync}
            description={t.enableSyncDesc}
            checked={settings.enabled}
            onCheckedChange={handleToggle('enabled')}
          />

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{t.syncInterval}</Label>
              <Badge variant="outline">{getIntervalLabel(settings.syncInterval)}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{t.syncIntervalDesc}</p>
            <Select
              value={settings.syncInterval.toString()}
              onValueChange={handleSyncIntervalChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t.manual}</SelectItem>
                <SelectItem value="30">{t.every30Min}</SelectItem>
                <SelectItem value="60">{t.everyHour}</SelectItem>
                <SelectItem value="360">{t.every6Hours}</SelectItem>
                <SelectItem value="1440">{t.everyDay}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <SettingRow
            icon={ArrowLeftRight}
            title={t.bidirectional}
            description={t.bidirectionalDesc}
            checked={settings.bidirectional}
            onCheckedChange={handleToggle('bidirectional')}
          />
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            {t.eventTypes}
          </CardTitle>
          <CardDescription>{t.eventTypesDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingRow
            icon={Users}
            title={t.rentPayments}
            description={t.rentPaymentsDesc}
            checked={settings.syncRentPayments}
            onCheckedChange={handleToggle('syncRentPayments')}
          />
          <Separator />
          <SettingRow
            icon={Wrench}
            title={t.maintenanceTasks}
            description={t.maintenanceTasksDesc}
            checked={settings.syncMaintenanceTasks}
            onCheckedChange={handleToggle('syncMaintenanceTasks')}
          />
          <Separator />
          <SettingRow
            icon={FileText}
            title={t.contractExpirations}
            description={t.contractExpirationsDesc}
            checked={settings.syncContractExpirations}
            onCheckedChange={handleToggle('syncContractExpirations')}
          />
          <Separator />
          <SettingRow
            icon={Receipt}
            title={t.utilitySettlements}
            description={t.utilitySettlementsDesc}
            checked={settings.syncUtilitySettlements}
            onCheckedChange={handleToggle('syncUtilitySettlements')}
          />
          <Separator />
          <SettingRow
            icon={Calendar}
            title={t.deadlines}
            description={t.deadlinesDesc}
            checked={settings.syncDeadlines}
            onCheckedChange={handleToggle('syncDeadlines')}
          />
          <Separator />
          <SettingRow
            icon={Building2}
            title={t.inspections}
            description={t.inspectionsDesc}
            checked={settings.syncInspections}
            onCheckedChange={handleToggle('syncInspections')}
          />
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            {t.reminderSettings}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            icon={Bell}
            title={t.addReminders}
            description={t.addRemindersDesc}
            checked={settings.addReminders}
            onCheckedChange={handleToggle('addReminders')}
          />

          {settings.addReminders && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t.reminderTime}</Label>
                  <Badge variant="secondary">{settings.defaultReminderMinutes} {t.minutes}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.reminderTimeDesc}</p>
                <Slider
                  value={[settings.defaultReminderMinutes]}
                  onValueChange={handleReminderMinutesChange}
                  min={5}
                  max={1440}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 min</span>
                  <span>24 h</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recurring Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-600" />
            {t.recurringSettings}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            icon={Calendar}
            title={t.createRecurringPayments}
            description={t.createRecurringPaymentsDesc}
            checked={settings.createRecurringPayments}
            onCheckedChange={handleToggle('createRecurringPayments')}
          />

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t.paymentReminderDays}</Label>
              <Badge variant="secondary">{settings.paymentReminderDays} {t.days}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{t.paymentReminderDaysDesc}</p>
            <Slider
              value={[settings.paymentReminderDays]}
              onValueChange={handlePaymentReminderDaysChange}
              min={1}
              max={14}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 {language === 'de' ? 'Tag' : 'day'}</span>
              <span>14 {language === 'de' ? 'Tage' : 'days'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">{t.advancedSettings}</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={resetSettings}
            className="text-sm text-red-600 hover:text-red-700 underline"
          >
            {t.resetSettings}
          </button>
          <p className="text-xs text-muted-foreground mt-1">{t.resetSettingsDesc}</p>
        </CardContent>
      </Card>
    </div>
  );
}
