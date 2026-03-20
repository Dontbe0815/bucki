/**
 * Backup and Restore Utilities for Bucki App
 * Handles local backup to localStorage, manual backup/restore via JSON files
 */

import { toast } from 'sonner';

const BACKUP_KEY = 'bucki-backup';
const AUTO_BACKUP_KEY = 'bucki-auto-backup';
const BACKUP_SETTINGS_KEY = 'bucki-backup-settings';

export interface BackupSettings {
  autoBackupEnabled: boolean;
  autoBackupInterval: number; // hours
  lastAutoBackup: string | null;
  maxBackups: number;
}

export interface BackupData {
  version: string;
  exportDate: string;
  appVersion: string;
  data: {
    properties: any[];
    units: any[];
    tenants: any[];
    transactions: any[];
    financings: any[];
    documents: any[];
    tasks: any[];
    depreciations: any[];
    depreciationItems: any[];
    houseMoney: any[];
    payments: any[];
    inspections: any[];
    dunningLetters: any[];
    utilitySettlements: any[];
    bankAccounts: any[];
    bankTransactions: any[];
    bankImports: any[];
    categoryRules: any[];
  };
}

const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  autoBackupEnabled: false,
  autoBackupInterval: 24, // hours
  lastAutoBackup: null,
  maxBackups: 10,
};

/**
 * Get current backup settings
 */
export function getBackupSettings(): BackupSettings {
  if (typeof window === 'undefined') return DEFAULT_BACKUP_SETTINGS;
  
  const stored = localStorage.getItem(BACKUP_SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_BACKUP_SETTINGS;
    }
  }
  return DEFAULT_BACKUP_SETTINGS;
}

/**
 * Save backup settings
 */
export function saveBackupSettings(settings: Partial<BackupSettings>): void {
  const current = getBackupSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(updated));
}

/**
 * Create a backup from the current app state
 */
export function createBackup(): string {
  // Get the main storage data
  const storageData = localStorage.getItem('bucki-storage');
  
  if (!storageData) {
    throw new Error('Keine Daten zum Sichern gefunden');
  }
  
  const parsedData = JSON.parse(storageData);
  
  const backup: BackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    appVersion: '2.0.0',
    data: {
      properties: parsedData.state?.properties || [],
      units: parsedData.state?.units || [],
      tenants: parsedData.state?.tenants || [],
      transactions: parsedData.state?.transactions || [],
      financings: parsedData.state?.financings || [],
      documents: parsedData.state?.documents || [],
      tasks: parsedData.state?.tasks || [],
      depreciations: parsedData.state?.depreciations || [],
      depreciationItems: parsedData.state?.depreciationItems || [],
      houseMoney: parsedData.state?.houseMoney || [],
      payments: parsedData.state?.payments || [],
      inspections: parsedData.state?.inspections || [],
      dunningLetters: parsedData.state?.dunningLetters || [],
      utilitySettlements: parsedData.state?.utilitySettlements || [],
      bankAccounts: parsedData.state?.bankAccounts || [],
      bankTransactions: parsedData.state?.bankTransactions || [],
      bankImports: parsedData.state?.bankImports || [],
      categoryRules: parsedData.state?.categoryRules || [],
    },
  };
  
  return JSON.stringify(backup, null, 2);
}

/**
 * Create an auto-backup to localStorage
 */
export function createAutoBackup(): boolean {
  try {
    const backupJson = createBackup();
    const backup = JSON.parse(backupJson);
    
    // Get existing auto-backups
    const existingBackups = getAutoBackups();
    
    // Add new backup
    const newBackup = {
      id: `backup-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: backup,
    };
    
    // Keep only maxBackups
    const settings = getBackupSettings();
    const updatedBackups = [newBackup, ...existingBackups]
      .slice(0, settings.maxBackups);
    
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(updatedBackups));
    
    // Update last auto backup time
    saveBackupSettings({ lastAutoBackup: new Date().toISOString() });
    
    return true;
  } catch (error) {
    console.error('Auto-backup failed:', error);
    return false;
  }
}

/**
 * Get all auto-backups
 */
export function getAutoBackups(): Array<{
  id: string;
  timestamp: string;
  data: BackupData;
}> {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(AUTO_BACKUP_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Restore from a backup JSON string
 */
export function restoreBackup(jsonData: string): { success: boolean; message: string } {
  try {
    const backup: BackupData = JSON.parse(jsonData);
    
    // Validate backup structure
    if (!backup.version || !backup.data) {
      return { success: false, message: 'Ungültiges Backup-Format' };
    }
    
    // Create the storage format
    const storageData = {
      state: backup.data,
      version: 0,
    };
    
    // Save to localStorage
    localStorage.setItem('bucki-storage', JSON.stringify(storageData));
    
    return { 
      success: true, 
      message: `Backup erfolgreich wiederhergestellt (${backup.exportDate})` 
    };
  } catch (error) {
    console.error('Restore failed:', error);
    return { 
      success: false, 
      message: 'Fehler beim Wiederherstellen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler') 
    };
  }
}

/**
 * Restore from an auto-backup by ID
 */
export function restoreAutoBackup(backupId: string): { success: boolean; message: string } {
  const backups = getAutoBackups();
  const backup = backups.find(b => b.id === backupId);
  
  if (!backup) {
    return { success: false, message: 'Backup nicht gefunden' };
  }
  
  return restoreBackup(JSON.stringify(backup.data));
}

/**
 * Delete an auto-backup
 */
export function deleteAutoBackup(backupId: string): void {
  const backups = getAutoBackups();
  const filtered = backups.filter(b => b.id !== backupId);
  localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(filtered));
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(): void {
  try {
    const backupJson = createBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `bucki-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Backup heruntergeladen');
  } catch (error) {
    toast.error('Fehler beim Erstellen des Backups');
    console.error('Download failed:', error);
  }
}

/**
 * Upload and restore backup from file
 */
export function uploadAndRestore(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = restoreBackup(content);
      resolve(result);
    };
    
    reader.onerror = () => {
      resolve({ success: false, message: 'Fehler beim Lesen der Datei' });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Schedule auto-backup interval
 * Call this on app startup
 */
let backupIntervalId: NodeJS.Timeout | null = null;

export function scheduleAutoBackup(intervalHours?: number): void {
  // Clear existing interval
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
  }
  
  const settings = getBackupSettings();
  const interval = intervalHours || settings.autoBackupInterval;
  
  if (settings.autoBackupEnabled) {
    // Create backup immediately if last backup is old
    const lastBackup = settings.lastAutoBackup 
      ? new Date(settings.lastAutoBackup) 
      : null;
    
    const now = new Date();
    const hoursSinceLastBackup = lastBackup 
      ? (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60) 
      : Infinity;
    
    if (hoursSinceLastBackup >= interval) {
      createAutoBackup();
    }
    
    // Schedule recurring backups
    backupIntervalId = setInterval(() => {
      const currentSettings = getBackupSettings();
      if (currentSettings.autoBackupEnabled) {
        createAutoBackup();
        toast.info('Automatisches Backup erstellt');
      }
    }, interval * 60 * 60 * 1000);
  }
}

/**
 * Stop auto-backup scheduling
 */
export function stopAutoBackup(): void {
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
    backupIntervalId = null;
  }
}

/**
 * Get backup size in MB
 */
export function getBackupSize(): string {
  const storageData = localStorage.getItem('bucki-storage');
  if (!storageData) return '0 MB';
  
  const bytes = new Blob([storageData]).size;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): {
  used: string;
  available: string;
  percentUsed: number;
} {
  // Estimate localStorage usage
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
  }
  
  // localStorage typically has 5-10MB limit
  const limitMB = 5;
  const usedMB = totalSize / (1024 * 1024);
  const percentUsed = (usedMB / limitMB) * 100;
  
  return {
    used: `${usedMB.toFixed(2)} MB`,
    available: `${limitMB} MB`,
    percentUsed: Math.min(percentUsed, 100),
  };
}
