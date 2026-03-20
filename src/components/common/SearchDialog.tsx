'use client';

/**
 * Global Search Dialog component for the Bucki application.
 * Provides search functionality across all data types.
 * 
 * @module components/common/SearchDialog
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Building2, Users, ClipboardList, FileText } from 'lucide-react';
import { useStore } from '@/lib/store';

/**
 * Search result item structure.
 */
interface SearchResult {
  type: 'property' | 'tenant' | 'task' | 'document';
  id: string;
  title: string;
  subtitle?: string;
}

/**
 * Props for the SearchDialog component.
 */
interface SearchDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to control dialog open state */
  onOpenChange: (open: boolean) => void;
  /** Callback when a result is selected */
  onNavigate: (type: string, id: string) => void;
  /** Translation object */
  t: {
    search: {
      placeholder: string;
      noResults: string;
    };
  };
}

/**
 * Get icon component for search result type.
 */
function getResultIcon(type: string): React.ReactNode {
  switch (type) {
    case 'property':
      return <Building2 className="h-4 w-4" />;
    case 'tenant':
      return <Users className="h-4 w-4" />;
    case 'task':
      return <ClipboardList className="h-4 w-4" />;
    case 'document':
      return <FileText className="h-4 w-4" />;
    default:
      return null;
  }
}

/**
 * Global Search Dialog component.
 * Searches across properties, tenants, tasks, and documents.
 * 
 * @example
 * ```tsx
 * <SearchDialog
 *   open={searchOpen}
 *   onOpenChange={setSearchOpen}
 *   onNavigate={(type, id) => {
 *     if (type === 'property') setActiveTab('properties');
 *   }}
 *   t={translations}
 * />
 * ```
 */
export function SearchDialog({ open, onOpenChange, onNavigate, t }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const store = useStore();
  const prevOpenRef = useRef(open);
  
  // Reset query when dialog opens using a ref to track previous state
  // This avoids calling setState directly in useEffect
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen && !prevOpenRef.current) {
      // Dialog is opening, reset query
      setQuery('');
    }
    prevOpenRef.current = newOpen;
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Calculate search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];
    
    // Search properties
    store.properties.forEach((p) => {
      if (
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.address.toLowerCase().includes(normalizedQuery) ||
        p.city.toLowerCase().includes(normalizedQuery)
      ) {
        searchResults.push({
          type: 'property',
          id: p.id,
          title: p.name,
          subtitle: `${p.address}, ${p.city}`,
        });
      }
    });
    
    // Search tenants
    store.tenants.forEach((tenant) => {
      const fullName = `${tenant.firstName} ${tenant.lastName}`;
      if (
        fullName.toLowerCase().includes(normalizedQuery) ||
        tenant.email.toLowerCase().includes(normalizedQuery)
      ) {
        searchResults.push({
          type: 'tenant',
          id: tenant.id,
          title: fullName,
          subtitle: tenant.email,
        });
      }
    });
    
    // Search tasks
    store.tasks.forEach((task) => {
      if (
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description && task.description.toLowerCase().includes(normalizedQuery))
      ) {
        searchResults.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: task.description,
        });
      }
    });
    
    // Search documents
    store.documents.forEach((doc) => {
      if (
        doc.name.toLowerCase().includes(normalizedQuery) ||
        (doc.description && doc.description.toLowerCase().includes(normalizedQuery))
      ) {
        searchResults.push({
          type: 'document',
          id: doc.id,
          title: doc.name,
          subtitle: doc.description,
        });
      }
    });
    
    return searchResults.slice(0, 15);
  }, [query, store.properties, store.tenants, store.tasks, store.documents]);

  /**
   * Handles selection of a search result.
   */
  const handleSelect = (result: SearchResult): void => {
    onNavigate(result.type, result.id);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <Input
            placeholder={t.search.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 px-0"
            autoFocus
          />
        </div>
        
        <ScrollArea className="max-h-80">
          {results.length === 0 && query && (
            <p className="text-center text-muted-foreground py-8">
              {t.search.noResults}
            </p>
          )}
          
          <div className="py-2">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-start gap-3"
                onClick={() => handleSelect(result)}
              >
                <div className="text-muted-foreground mt-0.5">
                  {getResultIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-sm text-muted-foreground truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default SearchDialog;
