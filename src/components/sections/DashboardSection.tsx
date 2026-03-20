'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, DollarSign, TrendingUp, Users } from 'lucide-react';
import type { Property, Unit, Financing } from '@/lib/types';

interface DashboardSectionProps {
  stats: any;
  isMobile?: boolean;
  setActiveTab: (tab: string) => void;
}

export default function DashboardSection({ stats, isMobile, setActiveTab }: DashboardSectionProps) {
  const store = useStore();
  const { formatCurrency } = useI18n();

  // ============================================
  // BERECHNUNGEN
  // ============================================
  
  const calculations = useMemo(() => {
    // Wohneinheiten
    const totalUnits = store.units.length;
    const rentedUnits = store.units.filter((u: Unit) => u.status === 'rented').length;
    const vacantUnits = totalUnits - rentedUnits;
    
    // Kaltmiete (monatlich)
    const coldRent = store.units
      .filter((u: Unit) => u.status === 'rented')
      .reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
    
    // Durchschnittliche Rendite
    const totalPurchasePrice = store.properties.reduce((sum: number, p: Property) => sum + p.purchasePrice, 0);
    const avgRoi = totalPurchasePrice > 0 ? ((coldRent * 12) / totalPurchasePrice) * 100 : 0;
    
    return {
      totalUnits,
      rentedUnits,
      vacantUnits,
      coldRent,
      avgRoi
    };
  }, [store.units, store.properties]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Willkommen bei Bucki</p>
        </div>
      </div>

      {/* TOP METRICS - 4 Spalten (Step 1-3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* ========== STEP 1: Spalte 1 ========== */}
        {/* Wohneinheiten, Kaltmiete, Durchschnittliche Rendite */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 space-y-4">
            {/* Wohneinheiten */}
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <DoorOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Wohneinheiten</span>
              </div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {calculations.rentedUnits}/{calculations.totalUnits}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {calculations.vacantUnits} leerstehend
              </div>
            </div>
            
            <div className="border-t border-blue-200 dark:border-blue-700" />
            
            {/* Kaltmiete */}
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Kaltmiete</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(calculations.coldRent)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                monatlich
              </div>
            </div>
            
            <div className="border-t border-blue-200 dark:border-blue-700" />
            
            {/* Durchschnittliche Rendite */}
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Durchschnittliche Rendite</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {calculations.avgRoi.toFixed(2)}%
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Brutto-Mietrendite p.a.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========== STEP 2: Spalte 2 ========== */}
        {/* Schätzwert, Restschuld, LTV */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4 space-y-4">
            <div className="text-center text-emerald-600 dark:text-emerald-400">
              <p className="text-sm">Step 2 kommt hier</p>
              <p className="text-xs mt-1">Schätzwert, Restschuld, LTV</p>
            </div>
          </CardContent>
        </Card>

        {/* ========== STEP 3: Spalte 3 ========== */}
        {/* Einnahmen, Ausgaben, Cashflow */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4 space-y-4">
            <div className="text-center text-purple-600 dark:text-purple-400">
              <p className="text-sm">Step 3 kommt hier</p>
              <p className="text-xs mt-1">Einnahmen, Ausgaben, Cashflow</p>
            </div>
          </CardContent>
        </Card>

        {/* ========== STEP 3: Spalte 4 ========== */}
        {/* Energiewert */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4 space-y-4">
            <div className="text-center text-amber-600 dark:text-amber-400">
              <p className="text-sm">Energiewert</p>
              <p className="text-xs mt-1">kommt in Step 3</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DIAGRAMME UND TABELLEN - Step 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagramme & Tabellen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <p>Step 4: Diagramme und Tabellen kommen hier</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weitere Kennzahlen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <p>Zins vs Tilgung, Portfolio, etc.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
