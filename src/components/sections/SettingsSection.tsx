'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useI18n } from '@/contexts/I18nContext';
import { 
  getSecuritySettings, 
  saveSecuritySettings, 
  setPin, 
  changePin,
  autoLockOptions 
} from '@/lib/security';
import {
  getNotificationSettings,
  saveNotificationSettings,
} from '@/lib/notifications';
import {
  getBackupSettings,
  saveBackupSettings,
  downloadBackup,
  uploadAndRestore,
  createAutoBackup,
  getAutoBackups,
  deleteAutoBackup,
  getStorageInfo,
  scheduleAutoBackup,
  type BackupSettings,
} from '@/lib/backup';
import { Shield, Bell, Globe, Palette, Lock, Key, Database, Download, Upload, Cloud, CloudOff, HardDrive, Trash2, Info, RefreshCw } from 'lucide-react';

function SettingsSection() {
  const { t, language, setLanguage, currency, setCurrency } = useI18n();
  const { theme, setTheme } = useTheme();
  
  // Security settings
  const securitySettings = getSecuritySettings();
  const [pinEnabled, setPinEnabled] = useState(securitySettings.pinEnabled);
  const [autoLockTime, setAutoLockTime] = useState(securitySettings.autoLockTime);
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Notification settings
  const notificationSettings = getNotificationSettings();
  const [taskNotifications, setTaskNotifications] = useState(notificationSettings.dueTasks);
  const [contractNotifications, setContractNotifications] = useState(notificationSettings.contractExpirations);
  
  // Backup settings
  const [backupSettings, setBackupSettings] = useState<BackupSettings>(getBackupSettings());
  const [autoBackups, setAutoBackups] = useState(getAutoBackups());
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePinToggle = async (enabled: boolean) => {
    setPinEnabled(enabled);
    saveSecuritySettings({ pinEnabled: enabled });
    toast.success(enabled ? 'PIN-Schutz aktiviert' : 'PIN-Schutz deaktiviert');
  };

  const handleAutoLockChange = (time: number) => {
    setAutoLockTime(time);
    saveSecuritySettings({ autoLockTime: time });
    toast.success('Automatische Sperre aktualisiert');
  };

  const handleChangePin = async () => {
    if (newPin.length < 4) {
      toast.error('PIN muss mindestens 4 Stellen haben');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs stimmen nicht überein');
      return;
    }
    const result = await setPin(newPin);
    if (result.success) {
      setNewPin('');
      setConfirmPin('');
      setShowChangePin(false);
      toast.success('PIN geändert');
    } else {
      toast.error(result.error || 'Fehler beim Ändern der PIN');
    }
  };

  const handleNotificationChange = (key: 'dueTasks' | 'contractExpirations', value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    saveNotificationSettings(newSettings);
    if (key === 'dueTasks') setTaskNotifications(value);
    if (key === 'contractExpirations') setContractNotifications(value);
    toast.success('Benachrichtigungseinstellungen aktualisiert');
  };

  // Backup handlers
  const handleAutoBackupToggle = (enabled: boolean) => {
    const newSettings = { ...backupSettings, autoBackupEnabled: enabled };
    setBackupSettings(newSettings);
    saveBackupSettings(newSettings);
    if (enabled) {
      scheduleAutoBackup();
      createAutoBackup();
      setAutoBackups(getAutoBackups());
      toast.success('Automatisches Backup aktiviert');
    } else {
      toast.success('Automatisches Backup deaktiviert');
    }
  };

  const handleBackupNow = () => {
    createAutoBackup();
    setAutoBackups(getAutoBackups());
    setStorageInfo(getStorageInfo());
    toast.success('Backup erstellt');
  };

  const handleDownloadBackup = () => {
    downloadBackup();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadAndRestore(file);
      if (result.success) {
        toast.success(result.message);
        // Reload page to apply restored data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(result.message);
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    deleteAutoBackup(backupId);
    setAutoBackups(getAutoBackups());
    setStorageInfo(getStorageInfo());
    toast.success('Backup gelöscht');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{t.nav.settings}</h1>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t.settings.appearance}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="font-medium mb-3">{t.settings.theme}</p>
            <p className="text-sm text-gray-500 mb-4">Wählen Sie Ihr bevorzugtes Design</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Button 
                variant={theme === 'light' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTheme('light')}
                className="flex flex-col items-center py-4 h-auto"
              >
                <span className="text-base mb-1">☀️</span>
                <span className="font-medium">Hell</span>
                <span className="text-xs text-muted-foreground">Light</span>
              </Button>
              <Button 
                variant={theme === 'dark' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex flex-col items-center py-4 h-auto"
              >
                <span className="text-base mb-1">🌙</span>
                <span className="font-medium">Dunkel</span>
                <span className="text-xs text-muted-foreground">Dark</span>
              </Button>
              <Button 
                variant={theme === 'system' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTheme('system')}
                className="flex flex-col items-center py-4 h-auto"
              >
                <span className="text-base mb-1">💻</span>
                <span className="font-medium">System</span>
                <span className="text-xs text-muted-foreground">Auto</span>
              </Button>
              <Button 
                variant={theme === 'banking' || theme === 'theme-banking' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTheme('banking')}
                className="flex flex-col items-center py-4 h-auto"
              >
                <span className="text-base mb-1">🏦</span>
                <span className="font-medium">Banking</span>
                <span className="text-xs text-muted-foreground">Luxuriös</span>
              </Button>
              <Button 
                variant={theme === 'fancy' || theme === 'theme-fancy' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTheme('fancy')}
                className="flex flex-col items-center py-4 h-auto"
              >
                <span className="text-base mb-1">✨</span>
                <span className="font-medium">Fancy</span>
                <span className="text-xs text-muted-foreground">Modern</span>
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t.settings.language}</p>
              <p className="text-sm text-gray-500">Sprache der Oberfläche</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={language === 'de' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setLanguage('de')}
              >
                Deutsch
              </Button>
              <Button 
                variant={language === 'en' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Währung</p>
              <p className="text-sm text-gray-500">Währung für alle Beträge</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={currency === 'EUR' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCurrency('EUR')}
              >
                EUR (€)
              </Button>
              <Button 
                variant={currency === 'USD' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCurrency('USD')}
              >
                USD ($)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sicherheit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">PIN-Schutz</p>
              <p className="text-sm text-gray-500">App mit PIN sperren</p>
            </div>
            <Switch 
              checked={pinEnabled} 
              onCheckedChange={handlePinToggle}
            />
          </div>
          
          {pinEnabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatische Sperre</p>
                  <p className="text-sm text-gray-500">App nach Inaktivität sperren</p>
                </div>
                <div className="flex gap-2">
                  {autoLockOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={autoLockTime === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAutoLockChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">PIN ändern</p>
                  <p className="text-sm text-gray-500">Neue PIN festlegen</p>
                </div>
                <Button variant="outline" onClick={() => setShowChangePin(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Ändern
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Benachrichtigungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Aufgaben-Erinnerungen</p>
              <p className="text-sm text-gray-500">Benachrichtigung bei fälligen Aufgaben</p>
            </div>
            <Switch 
              checked={taskNotifications} 
              onCheckedChange={(v) => handleNotificationChange('dueTasks', v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Vertrags-Ablauf</p>
              <p className="text-sm text-gray-500">Benachrichtigung bei Vertragsende</p>
            </div>
            <Switch 
              checked={contractNotifications} 
              onCheckedChange={(v) => handleNotificationChange('contractExpirations', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup & Daten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Daten
          </CardTitle>
          <CardDescription>
            Sichern und Wiederherstellen Ihrer Daten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Info */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Speicherplatz</span>
              <span className="text-sm text-muted-foreground">{storageInfo.used} / {storageInfo.available}</span>
            </div>
            <Progress value={storageInfo.percentUsed} className="h-2" />
          </div>

          {/* Auto Backup Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Automatisches Backup
              </p>
              <p className="text-sm text-gray-500">Täglich lokale Sicherung erstellen</p>
            </div>
            <Switch 
              checked={backupSettings.autoBackupEnabled} 
              onCheckedChange={handleAutoBackupToggle}
            />
          </div>

          {backupSettings.lastAutoBackup && (
            <div className="text-sm text-muted-foreground">
              Letztes Backup: {new Date(backupSettings.lastAutoBackup).toLocaleString('de-DE')}
            </div>
          )}

          <Separator />

          {/* Manual Backup Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleBackupNow} className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Jetzt sichern
            </Button>
            <Button variant="outline" onClick={handleDownloadBackup} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Backup herunterladen
            </Button>
          </div>

          {/* Restore from file */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Backup wiederherstellen
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Wählen Sie eine vorher exportierte JSON-Datei aus
            </p>
          </div>

          {/* Existing Auto-Backups */}
          {autoBackups.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="font-medium mb-3">Gespeicherte Backups</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {autoBackups.map((backup) => (
                    <div 
                      key={backup.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(backup.timestamp).toLocaleDateString('de-DE')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(backup.timestamp).toLocaleTimeString('de-DE')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Cloud Integration Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Cloud className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300">Google Drive</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Exportieren Sie ein Backup und laden Sie es manuell in Google Drive hoch
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <CloudOff className="h-8 w-8 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">iCloud</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Auf Apple-Geräten können Sie das Backup über die iCloud-Dateien sichern
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Change PIN Dialog */}
      {showChangePin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg">Neue PIN eingeben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Neue PIN</Label>
              <Input 
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4-6 Ziffern"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <div>
              <Label>PIN bestätigen</Label>
              <Input 
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="PIN wiederholen"
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowChangePin(false)}>Abbrechen</Button>
            <Button onClick={handleChangePin} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </CardFooter>
        </Card>
      )}

      {/* App Info */}
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Bucki - Immobilien-Verwaltung v2.0.0</p>
            <p className="mt-1">© 2024 Bucki. Alle Rechte vorbehalten.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsSection;
