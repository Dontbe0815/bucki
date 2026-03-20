'use client';

/**
 * Sidebar navigation component for the Bucki application.
 * Desktop-only vertical navigation with collapsible functionality.
 * 
 * @module components/layout/Sidebar
 */

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Menu, X, Sun, Moon, LucideIcon } from 'lucide-react';

/**
 * Navigation item definition.
 */
export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  /** Navigation items to display */
  navItems: NavItem[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab is selected */
  setActiveTab: (tab: string) => void;
  /** Whether sidebar is expanded */
  sidebarOpen: boolean;
  /** Callback to toggle sidebar state */
  setSidebarOpen: (open: boolean) => void;
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
    nav: {
      settings: string;
    };
    settings: {
      theme: string;
      language: string;
    };
  };
}

/**
 * Desktop Sidebar component with collapsible functionality.
 * 
 * @example
 * ```tsx
 * <Sidebar
 *   navItems={navItems}
 *   activeTab={activeTab}
 *   setActiveTab={setActiveTab}
 *   sidebarOpen={sidebarOpen}
 *   setSidebarOpen={setSidebarOpen}
 *   theme={theme}
 *   setTheme={setTheme}
 *   language={language}
 *   setLanguage={setLanguage}
 *   t={translations}
 * />
 * ```
 */
export function Sidebar({
  navItems,
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  theme,
  setTheme,
  language,
  setLanguage,
  t,
}: SidebarProps) {
  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-16'
      } bg-card border-r transition-all duration-300 flex flex-col hidden md:flex`}
    >
      {/* Header with logo */}
      <div className="p-4 border-b flex items-center justify-between">
        {sidebarOpen && (
          <span className="text-xl font-bold text-emerald-600">Bucki</span>
        )}
        {!sidebarOpen && (
          <span className="text-lg font-bold text-emerald-600 mx-auto">B</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Sidebar schließen' : 'Sidebar öffnen'}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === item.id
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-medium'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Theme & Language settings (when expanded) */}
      {sidebarOpen && (
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
      )}

      {/* Footer with version info */}
      <div className="p-4 border-t">
        {sidebarOpen && (
          <div className="text-xs text-muted-foreground">
            <p>Version 2.0.0 PWA</p>
            <p>© 2024 Bucki</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
