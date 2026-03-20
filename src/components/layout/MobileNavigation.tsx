'use client';

/**
 * Mobile Navigation component for the Bucki application.
 * Provides bottom navigation bar and mobile menu overlay.
 * 
 * @module components/layout/MobileNavigation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, MoreHorizontal, X, LucideIcon } from 'lucide-react';

/**
 * Navigation item definition.
 */
export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Props for the MobileNavigation component.
 */
interface MobileNavigationProps {
  /** Navigation items to display */
  navItems: NavItem[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab is selected */
  setActiveTab: (tab: string) => void;
  /** Whether mobile menu is open */
  mobileMenuOpen: boolean;
  /** Callback to toggle mobile menu state */
  setMobileMenuOpen: (open: boolean) => void;
  /** Current theme */
  theme: string | undefined;
  /** Callback to set theme */
  setTheme: (theme: string) => void;
  /** Current language */
  language: 'de' | 'en';
  /** Callback to set language */
  setLanguage: (lang: 'de' | 'en') => void;
  /** Translations object */
  t: {
    settings: {
      theme: string;
      language: string;
    };
    nav: {
      more: string;
    };
  };
}

/**
 * Mobile Navigation component.
 * Includes bottom tab bar and full-screen menu overlay.
 * 
 * @example
 * ```tsx
 * <MobileNavigation
 *   navItems={navItems}
 *   activeTab={activeTab}
 *   setActiveTab={setActiveTab}
 *   mobileMenuOpen={mobileMenuOpen}
 *   setMobileMenuOpen={setMobileMenuOpen}
 *   theme={theme}
 *   setTheme={setTheme}
 *   language={language}
 *   setLanguage={setLanguage}
 *   t={translations}
 * />
 * ```
 */
export function MobileNavigation({
  navItems,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  theme,
  setTheme,
  language,
  setLanguage,
  t,
}: MobileNavigationProps) {
  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="absolute right-0 top-0 bottom-0 w-72 bg-card shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu header */}
            <div className="p-4 border-b flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-600">Bucki</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Menü schließen"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Navigation items */}
            <nav className="p-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors tap-target touch-active ${
                    activeTab === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            
            {/* Theme & Language Toggle in Mobile Menu */}
            <div className="p-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.theme}</span>
                <div className="flex gap-1">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTheme('light')}
                    aria-label="Light theme"
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTheme('dark')}
                    aria-label="Dark theme"
                  >
                    <Moon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.language}</span>
                <Select value={language} onValueChange={(v: 'de' | 'en') => setLanguage(v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Version info */}
            <div className="p-4 border-t text-xs text-muted-foreground">
              <p>Version 2.0.0 PWA</p>
              <p>© 2024 Bucki</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-bottom md:hidden">
        <div className="flex justify-around items-center h-16">
          {/* First 5 navigation items */}
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg tap-target touch-active transition-colors ${
                activeTab === item.id
                  ? 'text-emerald-600'
                  : 'text-muted-foreground'
              }`}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium line-clamp-1">{item.label}</span>
            </button>
          ))}
          
          {/* More button for additional items */}
          {navItems.length > 5 && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-2 px-3 rounded-lg tap-target touch-active text-muted-foreground"
              aria-label={t.nav.more}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{t.nav.more}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

export default MobileNavigation;
