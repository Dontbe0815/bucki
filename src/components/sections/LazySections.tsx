'use client';

import dynamic from 'next/dynamic';
import { memo, ComponentType } from 'react';
import { SectionLoadingFallback } from '@/components/common/LazySection';

/**
 * Loading component for sections
 */
function SectionLoading() {
  return <SectionLoadingFallback />;
}

/**
 * Creates a lazy-loaded section component with next/dynamic
 * This provides better SSR support and automatic code splitting
 */
function createLazySection<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  name: string
) {
  const LazySection = dynamic(importFn, {
    loading: SectionLoading,
    ssr: false, // Don't render on server for faster initial load
  });

  LazySection.displayName = `Lazy${name}`;
  
  return memo(LazySection);
}

// ============================================
// Lazy-loaded Section Components
// ============================================

// Dashboard Section (largest - 1456 lines)
const LazyDashboardSection = createLazySection<{ stats: any; isMobile?: boolean; setActiveTab: (tab: string) => void }>(
  () => import('@/components/sections/DashboardSection').then(mod => ({ default: mod.default })),
  'DashboardSection'
);

// Properties Section
const LazyPropertiesSection = createLazySection<{}>(
  () => import('@/components/sections/PropertiesSection').then(mod => ({ default: mod.default })),
  'PropertiesSection'
);

// Units Section
const LazyUnitsSection = createLazySection<{}>(
  () => import('@/components/sections/UnitsSection').then(mod => ({ default: mod.default })),
  'UnitsSection'
);

// Tenants Section
const LazyTenantsSection = createLazySection<{}>(
  () => import('@/components/sections/TenantsSection').then(mod => ({ default: mod.default })),
  'TenantsSection'
);

// Finances Section
const LazyFinancesSection = createLazySection<{}>(
  () => import('@/components/sections/FinancesSection').then(mod => ({ default: mod.default })),
  'FinancesSection'
);

// Financing Section
const LazyFinancingSection = createLazySection<{}>(
  () => import('@/components/sections/FinancingSection').then(mod => ({ default: mod.default })),
  'FinancingSection'
);

// Documents Section
const LazyDocumentsSection = createLazySection<{}>(
  () => import('@/components/sections/DocumentsSection').then(mod => ({ default: mod.default })),
  'DocumentsSection'
);

// Tasks Section
const LazyTasksSection = createLazySection<{}>(
  () => import('@/components/sections/TasksSection').then(mod => ({ default: mod.default })),
  'TasksSection'
);

// Depreciation Section
const LazyDepreciationSection = createLazySection<{}>(
  () => import('@/components/sections/DepreciationSection').then(mod => ({ default: mod.default })),
  'DepreciationSection'
);

// HouseMoney Section
const LazyHouseMoneySection = createLazySection<{}>(
  () => import('@/components/sections/HouseMoneySection').then(mod => ({ default: mod.default })),
  'HouseMoneySection'
);

// UtilityCosts Section
const LazyUtilityCostsSection = createLazySection<{}>(
  () => import('@/components/sections/UtilityCostsSection').then(mod => ({ default: mod.default })),
  'UtilityCostsSection'
);

// Reserves Section
const LazyReservesSection = createLazySection<{}>(
  () => import('@/components/sections/ReservesSection').then(mod => ({ default: mod.default })),
  'ReservesSection'
);

// PropertyManagement Section
const LazyPropertyManagementSection = createLazySection<{}>(
  () => import('@/components/sections/PropertyManagementSection').then(mod => ({ default: mod.default })),
  'PropertyManagementSection'
);

// Taxes Section
const LazyTaxesSection = createLazySection<{}>(
  () => import('@/components/sections/TaxesSection').then(mod => ({ default: mod.default })),
  'TaxesSection'
);

// Sales Section
const LazySalesSection = createLazySection<{}>(
  () => import('@/components/sections/SalesSection').then(mod => ({ default: mod.default })),
  'SalesSection'
);

// NewPurchase Section
const LazyNewPurchaseSection = createLazySection<{}>(
  () => import('@/components/sections/NewPurchaseSection').then(mod => ({ default: mod.default })),
  'NewPurchaseSection'
);

// Settings Section (second largest - 955 lines)
const LazySettingsSection = createLazySection<{}>(
  () => import('@/components/sections/SettingsSection').then(mod => ({ default: mod.default })),
  'SettingsSection'
);

// ============================================
// Export all lazy sections
// ============================================

export {
  LazyDashboardSection,
  LazyPropertiesSection,
  LazyUnitsSection,
  LazyTenantsSection,
  LazyFinancesSection,
  LazyFinancingSection,
  LazyDocumentsSection,
  LazyTasksSection,
  LazyDepreciationSection,
  LazyHouseMoneySection,
  LazyUtilityCostsSection,
  LazyReservesSection,
  LazyPropertyManagementSection,
  LazyTaxesSection,
  LazySalesSection,
  LazyNewPurchaseSection,
  LazySettingsSection,
};

// Map of section IDs to lazy components for dynamic rendering
export const lazySectionsMap: Record<string, ComponentType<any>> = {
  dashboard: LazyDashboardSection,
  properties: LazyPropertiesSection,
  units: LazyUnitsSection,
  tenants: LazyTenantsSection,
  finances: LazyFinancesSection,
  financing: LazyFinancingSection,
  documents: LazyDocumentsSection,
  tasks: LazyTasksSection,
  depreciation: LazyDepreciationSection,
  housemoney: LazyHouseMoneySection,
  utilitycosts: LazyUtilityCostsSection,
  reserves: LazyReservesSection,
  propertymanagement: LazyPropertyManagementSection,
  taxes: LazyTaxesSection,
  sales: LazySalesSection,
  newpurchase: LazyNewPurchaseSection,
  settings: LazySettingsSection,
};

/**
 * Preload a section component when hovering over nav item
 */
export function preloadSection(sectionId: string): void {
  const sectionImporters: Record<string, () => Promise<any>> = {
    dashboard: () => import('@/components/sections/DashboardSection'),
    properties: () => import('@/components/sections/PropertiesSection'),
    units: () => import('@/components/sections/UnitsSection'),
    tenants: () => import('@/components/sections/TenantsSection'),
    finances: () => import('@/components/sections/FinancesSection'),
    financing: () => import('@/components/sections/FinancingSection'),
    documents: () => import('@/components/sections/DocumentsSection'),
    tasks: () => import('@/components/sections/TasksSection'),
    depreciation: () => import('@/components/sections/DepreciationSection'),
    housemoney: () => import('@/components/sections/HouseMoneySection'),
    utilitycosts: () => import('@/components/sections/UtilityCostsSection'),
    reserves: () => import('@/components/sections/ReservesSection'),
    propertymanagement: () => import('@/components/sections/PropertyManagementSection'),
    taxes: () => import('@/components/sections/TaxesSection'),
    sales: () => import('@/components/sections/SalesSection'),
    newpurchase: () => import('@/components/sections/NewPurchaseSection'),
    settings: () => import('@/components/sections/SettingsSection'),
  };

  const importer = sectionImporters[sectionId];
  if (importer) {
    importer();
  }
}
