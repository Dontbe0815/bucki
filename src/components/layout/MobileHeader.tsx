'use client';

/**
 * Mobile Header component for the Bucki application.
 * Provides mobile-only header with search and menu buttons.
 * 
 * @module components/layout/MobileHeader
 */

import { Button } from '@/components/ui/button';
import { Menu, Search } from 'lucide-react';

/**
 * Props for the MobileHeader component.
 */
interface MobileHeaderProps {
  /** Callback to open search dialog */
  onSearchOpen: () => void;
  /** Callback to toggle mobile menu */
  onMenuToggle: () => void;
}

/**
 * Mobile Header component.
 * Displays app logo, search button, and menu toggle.
 * Only visible on mobile devices.
 * 
 * @example
 * ```tsx
 * <MobileHeader
 *   onSearchOpen={() => setSearchOpen(true)}
 *   onMenuToggle={() => setMobileMenuOpen(true)}
 * />
 * ```
 */
export function MobileHeader({ onSearchOpen, onMenuToggle }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between safe-top md:hidden">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-emerald-600">Bucki</span>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onSearchOpen}
          className="tap-target"
          aria-label="Suche öffnen"
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuToggle}
          className="tap-target"
          aria-label="Menü öffnen"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
}

export default MobileHeader;
