'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

// Available theme options
export const THEMES = [
  { id: 'light', label: 'Hell', description: 'Helles Design' },
  { id: 'dark', label: 'Dunkel', description: 'Dunkles Design' },
  { id: 'system', label: 'System', description: 'Systemeinstellung folgen' },
  { id: 'banking', label: 'Banking', description: 'Seriös, luxuriös (Dunkel)' },
  { id: 'fancy', label: 'Fancy', description: 'Modern, poppig (Hell)' },
] as const;

export type ThemeId = typeof THEMES[number]['id'];

// Map theme IDs to CSS classes
const themeClassMap: Record<string, string> = {
  light: 'light',
  dark: 'dark',
  banking: 'theme-banking',
  fancy: 'theme-fancy',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="bucki-theme"
      themes={['light', 'dark', 'system', 'banking', 'fancy']}
      value={{
        light: 'light',
        dark: 'dark',
        banking: 'theme-banking',
        fancy: 'theme-fancy',
        system: 'system',
      }}
    >
      {children}
    </NextThemesProvider>
  );
}
