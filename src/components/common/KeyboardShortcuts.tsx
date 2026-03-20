'use client';

/**
 * Keyboard Shortcuts Component
 * Global keyboard shortcuts and help dialog
 * 
 * @module components/common/KeyboardShortcuts
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Keyboard, Home, Building2, DollarSign, Settings, FileText, Users,
  Search, Plus, HelpCircle, Command, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  descriptionEn: string;
  category: 'navigation' | 'actions' | 'general';
  icon?: React.ReactNode;
  action?: () => void;
}

interface KeyboardShortcutsProps {
  onNavigate?: (tab: string) => void;
  onNew?: () => void;
  onSearch?: () => void;
  onCloseDialog?: () => void;
  language?: 'de' | 'en';
}

// Default shortcuts configuration
export const defaultShortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    key: 'd',
    description: 'Zum Dashboard',
    descriptionEn: 'Go to Dashboard',
    category: 'navigation',
    icon: <Home className="h-4 w-4" />,
  },
  {
    key: 'p',
    description: 'Zu den Immobilien',
    descriptionEn: 'Go to Properties',
    category: 'navigation',
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    key: 't',
    description: 'Zu den Aufgaben',
    descriptionEn: 'Go to Tasks',
    category: 'navigation',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    key: 'f',
    description: 'Zu den Finanzen',
    descriptionEn: 'Go to Finances',
    category: 'navigation',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    key: 's',
    description: 'Zu den Einstellungen',
    descriptionEn: 'Go to Settings',
    category: 'navigation',
    icon: <Settings className="h-4 w-4" />,
  },
  // Actions
  {
    key: 'n',
    description: 'Neues Element (kontextabhängig)',
    descriptionEn: 'New item (context-aware)',
    category: 'actions',
    icon: <Plus className="h-4 w-4" />,
  },
  {
    key: 'k',
    modifiers: ['ctrl'],
    description: 'Globale Suche öffnen',
    descriptionEn: 'Open global search',
    category: 'actions',
    icon: <Search className="h-4 w-4" />,
  },
  // General
  {
    key: '?',
    description: 'Tastaturkürzel anzeigen',
    descriptionEn: 'Show keyboard shortcuts',
    category: 'general',
    icon: <HelpCircle className="h-4 w-4" />,
  },
  {
    key: 'Escape',
    description: 'Dialog schließen',
    descriptionEn: 'Close dialog',
    category: 'general',
    icon: <Keyboard className="h-4 w-4" />,
  },
];

export default function KeyboardShortcuts({
  onNavigate,
  onNew,
  onSearch,
  onCloseDialog,
  language = 'de',
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const isGerman = language === 'de';
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape even in input fields
      if (e.key === 'Escape') {
        target.blur();
        onCloseDialog?.();
        return;
      }
      return;
    }
    
    // Handle shortcuts
    switch (e.key.toLowerCase()) {
      case '?':
        e.preventDefault();
        setShowHelp(true);
        break;
        
      case 'd':
        e.preventDefault();
        onNavigate?.('dashboard');
        break;
        
      case 'p':
        e.preventDefault();
        onNavigate?.('properties');
        break;
        
      case 't':
        e.preventDefault();
        onNavigate?.('tasks');
        break;
        
      case 'f':
        e.preventDefault();
        onNavigate?.('finances');
        break;
        
      case 's':
        e.preventDefault();
        onNavigate?.('settings');
        break;
        
      case 'n':
        e.preventDefault();
        onNew?.();
        break;
        
      case 'k':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          onSearch?.();
        }
        break;
        
      case 'escape':
        setShowHelp(false);
        onCloseDialog?.();
        break;
    }
  }, [onNavigate, onNew, onSearch, onCloseDialog]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const navigationShortcuts = defaultShortcuts.filter(s => s.category === 'navigation');
  const actionShortcuts = defaultShortcuts.filter(s => s.category === 'actions');
  const generalShortcuts = defaultShortcuts.filter(s => s.category === 'general');
  
  const renderShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.modifiers?.includes('ctrl') || shortcut.modifiers?.includes('meta')) {
      keys.push(
        <kbd key="ctrl" className="px-2 py-1 bg-muted rounded text-xs font-mono">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
        </kbd>
      );
    }
    if (shortcut.modifiers?.includes('shift')) {
      keys.push(
        <kbd key="shift" className="px-2 py-1 bg-muted rounded text-xs font-mono">
          ⇧
        </kbd>
      );
    }
    keys.push(
      <kbd key="key" className="px-2 py-1 bg-muted rounded text-xs font-mono">
        {shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase()}
      </kbd>
    );
    
    return (
      <div
        key={shortcut.key + (shortcut.modifiers?.join('') || '')}
        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          {shortcut.icon && (
            <span className="text-muted-foreground">{shortcut.icon}</span>
          )}
          <span className="text-sm">
            {isGerman ? shortcut.description : shortcut.descriptionEn}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {keys}
        </div>
      </div>
    );
  };
  
  return (
    <>
      {/* Help trigger button - can be placed anywhere */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowHelp(true)}
        className="gap-1 text-muted-foreground"
        title={isGerman ? 'Tastaturkürzel (?)' : 'Keyboard shortcuts (?)'}
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">?</span>
      </Button>
      
      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              {isGerman ? 'Tastaturkürzel' : 'Keyboard Shortcuts'}
            </DialogTitle>
            <DialogDescription>
              {isGerman 
                ? 'Nutzen Sie diese Kürzel für schnelleres Arbeiten'
                : 'Use these shortcuts to work faster'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Navigation */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                {isGerman ? 'Navigation' : 'Navigation'}
              </h4>
              <Card className="p-2">
                {navigationShortcuts.map(renderShortcut)}
              </Card>
            </div>
            
            {/* Actions */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                {isGerman ? 'Aktionen' : 'Actions'}
              </h4>
              <Card className="p-2">
                {actionShortcuts.map(renderShortcut)}
              </Card>
            </div>
            
            {/* General */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                {isGerman ? 'Allgemein' : 'General'}
              </h4>
              <Card className="p-2">
                {generalShortcuts.map(renderShortcut)}
              </Card>
            </div>
          </div>
          
          <div className="text-xs text-center text-muted-foreground mt-4">
            {isGerman 
              ? 'Drücken Sie ? um diese Hilfe zu öffnen'
              : 'Press ? to open this help'}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Standalone hook for keyboard shortcuts without UI
export function useKeyboardShortcuts(
  callbacks: {
    onNavigate?: (tab: string) => void;
    onNew?: () => void;
    onSearch?: () => void;
    onCloseDialog?: () => void;
    onShowHelp?: () => void;
  }
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
          callbacks.onCloseDialog?.();
        }
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case '?':
          e.preventDefault();
          callbacks.onShowHelp?.();
          break;
        case 'd':
          e.preventDefault();
          callbacks.onNavigate?.('dashboard');
          break;
        case 'p':
          e.preventDefault();
          callbacks.onNavigate?.('properties');
          break;
        case 't':
          e.preventDefault();
          callbacks.onNavigate?.('tasks');
          break;
        case 'f':
          e.preventDefault();
          callbacks.onNavigate?.('finances');
          break;
        case 's':
          e.preventDefault();
          callbacks.onNavigate?.('settings');
          break;
        case 'n':
          e.preventDefault();
          callbacks.onNew?.();
          break;
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            callbacks.onSearch?.();
          }
          break;
        case 'escape':
          callbacks.onCloseDialog?.();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}
