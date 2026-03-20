'use client';

import { Suspense, lazy, ComponentType, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback component for lazy-loaded sections
 */
function SectionLoadingFallback() {
  return (
    <Card className="min-h-[400px]">
      <CardContent className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground text-sm">Wird geladen...</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Error fallback component for failed section loads
 */
function SectionErrorFallback() {
  return (
    <Card className="min-h-[400px]">
      <CardContent className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-500">Fehler beim Laden des Abschnitts</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-emerald-600 hover:underline"
          >
            Seite neu laden
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Higher-order component for lazy loading sections with Suspense
 */
export function withLazyLoading<P extends object>(
  LazyComponent: ComponentType<P>,
  Fallback: ComponentType = SectionLoadingFallback
) {
  const LazyWrapper = memo((props: P) => (
    <Suspense fallback={<Fallback />}>
      <LazyComponent {...props} />
    </Suspense>
  ));
  
  LazyWrapper.displayName = `LazySection(${LazyComponent.displayName || 'Component'})`;
  
  return LazyWrapper;
}

/**
 * Creates a lazy-loaded section component
 */
export function createLazySection<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  const LazyComponent = lazy(importFn);
  return withLazyLoading(LazyComponent);
}

/**
 * Props for the LazySection wrapper
 */
interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for lazy-loaded content with Suspense
 */
export function LazySection({ children, fallback }: LazySectionProps) {
  return (
    <Suspense fallback={fallback || <SectionLoadingFallback />}>
      {children}
    </Suspense>
  );
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): void {
  importFn();
}

// Export components
export { SectionLoadingFallback, SectionErrorFallback };
