'use client';

/**
 * Error Boundary component for graceful error handling.
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Supports section-specific error boundaries for better UX.
 * 
 * @module components/common/ErrorBoundary
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Building2, Users, DollarSign, FileText, Settings, CreditCard, TrendingDown, Receipt, PiggyBank, Wrench, TrendingUp, PlusCircle, Landmark } from 'lucide-react';

export type SectionType = 
  | 'dashboard' 
  | 'properties' 
  | 'units' 
  | 'tenants' 
  | 'finances' 
  | 'financing' 
  | 'depreciation' 
  | 'taxes' 
  | 'housemoney' 
  | 'utilitycosts' 
  | 'reserves' 
  | 'propertymanagement' 
  | 'sales' 
  | 'documents' 
  | 'newpurchase' 
  | 'bank'
  | 'settings'
  | 'generic';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  section?: SectionType;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Section-specific configurations
const sectionConfig: Record<SectionType, { 
  icon: React.ElementType; 
  title: string; 
  titleEn: string;
  description: string;
  descriptionEn: string;
}> = {
  dashboard: {
    icon: Home,
    title: 'Dashboard-Fehler',
    titleEn: 'Dashboard Error',
    description: 'Das Dashboard konnte nicht geladen werden.',
    descriptionEn: 'The dashboard could not be loaded.',
  },
  properties: {
    icon: Building2,
    title: 'Immobilien-Fehler',
    titleEn: 'Properties Error',
    description: 'Die Immobilien konnten nicht geladen werden.',
    descriptionEn: 'The properties could not be loaded.',
  },
  units: {
    icon: Building2,
    title: 'Einheiten-Fehler',
    titleEn: 'Units Error',
    description: 'Die Einheiten konnten nicht geladen werden.',
    descriptionEn: 'The units could not be loaded.',
  },
  tenants: {
    icon: Users,
    title: 'Mieter-Fehler',
    titleEn: 'Tenants Error',
    description: 'Die Mieter konnten nicht geladen werden.',
    descriptionEn: 'The tenants could not be loaded.',
  },
  finances: {
    icon: DollarSign,
    title: 'Finanzen-Fehler',
    titleEn: 'Finances Error',
    description: 'Die Finanzen konnten nicht geladen werden.',
    descriptionEn: 'The finances could not be loaded.',
  },
  financing: {
    icon: CreditCard,
    title: 'Finanzierungs-Fehler',
    titleEn: 'Financing Error',
    description: 'Die Finanzierungen konnten nicht geladen werden.',
    descriptionEn: 'The financing data could not be loaded.',
  },
  depreciation: {
    icon: TrendingDown,
    title: 'Abschreibungs-Fehler',
    titleEn: 'Depreciation Error',
    description: 'Die Abschreibungen konnten nicht geladen werden.',
    descriptionEn: 'The depreciation data could not be loaded.',
  },
  taxes: {
    icon: Receipt,
    title: 'Steuer-Fehler',
    titleEn: 'Tax Error',
    description: 'Die Steuerdaten konnten nicht geladen werden.',
    descriptionEn: 'The tax data could not be loaded.',
  },
  housemoney: {
    icon: FileText,
    title: 'Hausgelder-Fehler',
    titleEn: 'House Money Error',
    description: 'Die Hausgelder konnten nicht geladen werden.',
    descriptionEn: 'The house money data could not be loaded.',
  },
  utilitycosts: {
    icon: Receipt,
    title: 'Nebenkosten-Fehler',
    titleEn: 'Utility Costs Error',
    description: 'Die Nebenkosten konnten nicht geladen werden.',
    descriptionEn: 'The utility costs could not be loaded.',
  },
  reserves: {
    icon: PiggyBank,
    title: 'Rücklagen-Fehler',
    titleEn: 'Reserves Error',
    description: 'Die Rücklagen konnten nicht geladen werden.',
    descriptionEn: 'The reserves could not be loaded.',
  },
  propertymanagement: {
    icon: Wrench,
    title: 'Hausverwaltungs-Fehler',
    titleEn: 'Property Management Error',
    description: 'Die Hausverwaltungsdaten konnten nicht geladen werden.',
    descriptionEn: 'The property management data could not be loaded.',
  },
  sales: {
    icon: TrendingUp,
    title: 'Verkaufs-Fehler',
    titleEn: 'Sales Error',
    description: 'Die Verkaufsdaten konnten nicht geladen werden.',
    descriptionEn: 'The sales data could not be loaded.',
  },
  documents: {
    icon: FileText,
    title: 'Dokumenten-Fehler',
    titleEn: 'Documents Error',
    description: 'Die Dokumente konnten nicht geladen werden.',
    descriptionEn: 'The documents could not be loaded.',
  },
  newpurchase: {
    icon: PlusCircle,
    title: 'Neukauf-Fehler',
    titleEn: 'New Purchase Error',
    description: 'Der Neukauf-Bereich konnte nicht geladen werden.',
    descriptionEn: 'The new purchase section could not be loaded.',
  },
  bank: {
    icon: Landmark,
    title: 'Bank-Fehler',
    titleEn: 'Bank Error',
    description: 'Die Bankdaten konnten nicht geladen werden.',
    descriptionEn: 'The bank data could not be loaded.',
  },
  settings: {
    icon: Settings,
    title: 'Einstellungs-Fehler',
    titleEn: 'Settings Error',
    description: 'Die Einstellungen konnten nicht geladen werden.',
    descriptionEn: 'The settings could not be loaded.',
  },
  generic: {
    icon: AlertTriangle,
    title: 'Fehler aufgetreten',
    titleEn: 'Error Occurred',
    description: 'Ein unerwarteter Fehler ist aufgetreten.',
    descriptionEn: 'An unexpected error occurred.',
  },
};

/**
 * Error Boundary class component.
 * Wraps children and catches any errors that bubble up.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary section="properties">
 *   <PropertiesSection />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    
    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const section = this.props.section || 'generic';
      const config = sectionConfig[section];
      const IconComponent = config.icon;
      const isFullPage = !this.props.section || this.props.section === 'generic';

      const errorContent = (
        <Card className={`w-full ${isFullPage ? 'max-w-md' : ''}`}>
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 ${isFullPage ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center`}>
              <IconComponent className={`${isFullPage ? 'h-8 w-8' : 'h-6 w-6'} text-red-600 dark:text-red-400`} />
            </div>
            <CardTitle className={isFullPage ? '' : 'text-lg'}>
              {config.title}
            </CardTitle>
            <CardDescription>
              {config.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg overflow-auto max-h-40">
                <p className="text-sm font-mono text-red-800 dark:text-red-200 whitespace-pre-wrap">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className={`flex ${isFullPage ? 'gap-2' : 'gap-2 flex-col sm:flex-row'}`}>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Erneut versuchen
              </Button>
              <Button 
                className="flex-1"
                onClick={this.handleReload}
              >
                Seite neu laden
              </Button>
            </div>
          </CardContent>
        </Card>
      );

      if (isFullPage) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            {errorContent}
          </div>
        );
      }

      // Section-specific inline error
      return (
        <div className="flex items-center justify-center p-6 bg-background rounded-lg border border-red-200 dark:border-red-800">
          {errorContent}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary.
 * 
 * @param Component - The component to wrap
 * @param section - The section type for contextual error messages
 * @param fallback - Optional fallback UI to show on error
 * @returns Wrapped component with error boundary
 * 
 * @example
 * ```tsx
 * const SafePropertiesSection = withErrorBoundary(PropertiesSection, 'properties');
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  section?: SectionType,
  fallback?: React.ReactNode
): React.FC<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary section={section} fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Section Error Boundary - A wrapper component specifically for section-level errors.
 * Provides a compact error display that fits within the section layout.
 */
export function SectionErrorBoundary({ 
  children, 
  section,
  onReset 
}: { 
  children: React.ReactNode; 
  section: SectionType;
  onReset?: () => void;
}) {
  return (
    <ErrorBoundary section={section} onReset={onReset}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
