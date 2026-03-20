'use client';

/**
 * Lock Screen component for the Bucki application.
 * Provides PIN-based authentication with visual feedback.
 * 
 * @module components/common/LockScreen
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LockKeyhole, Unlock, AlertTriangle } from 'lucide-react';
import { verifyPin, forgotPinReset, unlockSession, resetPinOnly } from '@/lib/security';

/**
 * Props for the LockScreen component.
 */
interface LockScreenProps {
  /** Callback when unlock is successful */
  onUnlock: () => void;
  /** Translation function */
  t: {
    auth: {
      locked: string;
      enterPin: string;
      wrongPin: string;
      unlock: string;
      forgotPin: string;
      resetPinConfirm: string;
      resetPinOnly?: string;
      resetPinOnlyDesc?: string;
      resetAllData?: string;
      resetAllDataDesc?: string;
    };
    common: {
      cancel: string;
      confirm: string;
    };
  };
}

/**
 * Lock Screen component that requires PIN entry to unlock.
 * Features visual PIN indicator dots and forgot PIN functionality.
 * 
 * @example
 * ```tsx
 * <LockScreen 
 *   onUnlock={() => setIsLocked(false)} 
 *   t={translations} 
 * />
 * ```
 */
export function LockScreen({ onUnlock, t }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [showResetOptions, setShowResetOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Handles PIN input changes.
   * Only allows numeric input up to 6 digits.
   */
  const handlePinChange = (value: string): void => {
    if (/^\d*$/.test(value) && value.length <= 6) {
      setPin(value);
      setError('');
    }
  };

  /**
   * Handles PIN submission.
   * Verifies the PIN and unlocks on success.
   */
  const handleSubmit = async (): Promise<void> => {
    const isValid = await verifyPin(pin);
    if (isValid) {
      unlockSession();
      onUnlock();
    } else {
      setError(t.auth.wrongPin);
      setPin('');
    }
  };

  /**
   * Shows the reset options dialog.
   */
  const handleForgotPin = (): void => {
    setShowResetOptions(true);
  };

  /**
   * Resets only the PIN, keeping all data.
   */
  const handleResetPinOnly = (): void => {
    resetPinOnly();
    setShowResetOptions(false);
    window.location.reload();
  };

  /**
   * Confirms PIN reset and reloads the application.
   * This clears all data.
   */
  const handleConfirmForgot = (): void => {
    forgotPinReset();
    setShowForgotConfirm(false);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center z-50">
      <Card className="w-full max-w-sm mx-4 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <LockKeyhole className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">{t.auth.locked}</CardTitle>
          <CardDescription>{t.auth.enterPin}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PIN indicator dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < pin.length ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          {/* PIN input */}
          <Input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="text-center text-2xl tracking-widest"
            placeholder="••••"
            maxLength={6}
            aria-label="PIN eingeben"
          />
          
          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          
          {/* Unlock button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={pin.length < 4}
          >
            <Unlock className="h-4 w-4 mr-2" />
            {t.auth.unlock}
          </Button>
        </CardContent>
        
        <CardFooter className="justify-center">
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground"
            onClick={handleForgotPin}
          >
            {t.auth.forgotPin}
          </Button>
        </CardFooter>
      </Card>

      {/* Reset options dialog */}
      <AlertDialog open={showResetOptions} onOpenChange={setShowResetOptions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t.auth.forgotPin}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Wählen Sie eine Option zum Zurücksetzen:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <Button 
              onClick={handleResetPinOnly}
              variant="outline" 
              className="w-full justify-start h-auto py-3"
            >
              <div className="text-left">
                <div className="font-medium text-emerald-600">Nur PIN zurücksetzen</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Behält alle Ihre Daten, entfernt nur den PIN-Schutz
                </div>
              </div>
            </Button>
            <Button 
              onClick={() => {
                setShowResetOptions(false);
                setShowForgotConfirm(true);
              }}
              variant="outline" 
              className="w-full justify-start h-auto py-3 border-red-200 hover:bg-red-50"
            >
              <div className="text-left">
                <div className="font-medium text-red-600">Alle Daten löschen</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Setzt die App komplett zurück (alle Daten gehen verloren)
                </div>
              </div>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full reset confirmation dialog */}
      <AlertDialog open={showForgotConfirm} onOpenChange={setShowForgotConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Daten wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {t.auth.resetPinConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmForgot} className="bg-red-600 hover:bg-red-700">
              {t.common.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default LockScreen;
