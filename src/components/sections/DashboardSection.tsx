'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DoorOpen, DollarSign, TrendingUp, Building2, CreditCard, 
  Percent, ArrowUpRight, ArrowDownRight, Wallet, Zap 
} from 'lucide-react';
import type { Property, Unit, Financing } from '@/lib/types';

interface DashboardSectionProps {
  stats: any;
  isMobile?: boolean;
  setActiveTab: (tab: string) => void;
}

// LTV Gauge Component
function LTVGauge({ ltv }: { ltv: number }) {
  const getLTVColor = (ltv: number) => {
    if (ltv <= 60) return '#10b981';
    if (ltv <= 75) return '#f59e0b';
    if (ltv <= 85) return '#f97316';
    return '#ef4444';
  };
  
  return (
    <div className="relative w-28 h-14 mx-auto">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={getLTVColor(ltv)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${Math.min(ltv, 100) * 1.26} 126`}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-lg font-bold" style={{ color: getLTVColor(ltv) }}>
          {ltv.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function DashboardSection({ stats, isMobile, setActiveTab }: DashboardSectionProps) {
  const store = useStore();
  const { formatCurrency } = useI18n();

  // ============================================
  // BERECHNUNGEN
  // ============================================
  
  const calculations = useMemo(() => {
    // === Spalte 1 ===
    const totalUnits = store.units.length;
    const rentedUnits = store.units.filter((u: Unit) => u.status === 'rented').length;
    const vacantUnits = totalUnits - rentedUnits;
    const coldRent = store.units
      .filter((u: Unit) => u.status === 'rented')
      .reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
    const totalPurchasePrice = store.properties.reduce((sum: number, p: Property) => sum + p.purchasePrice, 0);
    const avgRoi = totalPurchasePrice > 0 ? ((coldRent * 12) / totalPurchasePrice) * 100 : 0;
    
    // === Spalte 2 ===
    const totalEstimatedValue = store.properties.reduce((sum: number, p: Property) => sum + (p.estimatedValue || p.marketValue), 0);
    const totalRemainingDebt = store.financings.reduce((sum: number, f: Financing) => sum + f.remainingDebt, 0);
    const ltv = totalEstimatedValue > 0 ? (totalRemainingDebt / totalEstimatedValue) * 100 : 0;
    const totalLoans = store.financings.length;
    
    // === Spalte 3 ===
    const warmRent = store.units
      .filter((u: Unit) => u.status === 'rented')
      .reduce((sum: number, u: Unit) => sum + u.totalRent, 0);
    const monthlyIncome = warmRent; // Für jetzt: Warmmiete als Haupteinnahme
    const monthlyExpenses = stats.totalExpenses || 0;
    const cashflow = monthlyIncome - monthlyExpenses;
    
    // === Spalte 4: Energiewert ===
    const energyMap: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8 };
    const propertiesWithEnergy = store.properties.filter((p: Property) => p.energyClass !== 'unknown');
    const avgEnergyValue = propertiesWithEnergy.length > 0
      ? propertiesWithEnergy.reduce((sum: number, p: Property) => sum + (energyMap[p.energyClass] || 5), 0) / propertiesWithEnergy.length
      : 0;
    const avgEnergyLetter = avgEnergyValue > 0 ? String.fromCharCode(64 + Math.round(avgEnergyValue)) : '-';
    
    return {
      // Spalte 1
      totalUnits,
      rentedUnits,
      vacantUnits,
      coldRent,
      avgRoi,
      // Spalte 2
      totalEstimatedValue,
      totalRemainingDebt,
      ltv,
      totalLoans,
      // Spalte 3
      monthlyIncome,
      monthlyExpenses,
      cashflow,
      // Spalte 4
      avgEnergyValue,
      avgEnergyLetter,
      propertiesWithEnergyCount: propertiesWithEnergy.length,
      totalPropertiesCount: store.properties.length
    };
  }, [store.units, store.properties, store.financings, stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Willkommen bei Bucki</p>
        </div>
      </div>

      {/* TOP METRICS - 4 Spalten */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* ========== STEP 1: Spalte 1 ========== */}
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
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4 space-y-4">
            {/* Aktueller Schätzwert */}
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Aktueller Schätzwert</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(calculations.totalEstimatedValue)}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                {store.properties.length} Immobilien
              </div>
            </div>
            
            <div className="border-t border-emerald-200 dark:border-emerald-700" />
            
            {/* Restschuld */}
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Restschuld</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(calculations.totalRemainingDebt)}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                {calculations.totalLoans} {calculations.totalLoans === 1 ? 'Kredit' : 'Kredite'}
              </div>
            </div>
            
            <div className="border-t border-emerald-200 dark:border-emerald-700" />
            
            {/* LTV */}
            <div>
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                <Percent className="h-4 w-4" />
                <span className="text-sm font-medium">LTV (Loan-to-Value)</span>
              </div>
              <LTVGauge ltv={calculations.ltv} />
              <div className="text-xs text-center text-emerald-600 dark:text-emerald-400 mt-2">
                Verschuldungsgrad
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========== STEP 3: Spalte 3 ========== */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4 space-y-4">
            {/* Einnahmen */}
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">Einnahmen</span>
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(calculations.monthlyIncome)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                monatlich
              </div>
            </div>
            
            <div className="border-t border-purple-200 dark:border-purple-700" />
            
            {/* Ausgaben */}
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-sm font-medium">Ausgaben</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(calculations.monthlyExpenses)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                monatlich
              </div>
            </div>
            
            <div className="border-t border-purple-200 dark:border-purple-700" />
            
            {/* Cashflow */}
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Cashflow</span>
              </div>
              <div className={`text-2xl font-bold ${calculations.cashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(calculations.cashflow)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Einnahmen - Ausgaben
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========== STEP 3: Spalte 4 ========== */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            {/* Energiewert */}
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Durchschnittlicher Energiewert</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${
                calculations.avgEnergyLetter <= 'C' ? 'text-green-600' :
                calculations.avgEnergyLetter <= 'E' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculations.avgEnergyLetter}
              </div>
              <div className="flex-1">
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  Ø {calculations.avgEnergyValue > 0 ? calculations.avgEnergyValue.toFixed(1) : '-'}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {calculations.propertiesWithEnergyCount} von {calculations.totalPropertiesCount} Immobilien
                </div>
                
                {/* Energy Scale */}
                <div className="flex gap-1 mt-2">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
                    <div 
                      key={letter} 
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        letter === calculations.avgEnergyLetter 
                          ? 'ring-2 ring-amber-500 ring-offset-1' 
                          : ''
                      } ${
                        letter <= 'C' ? 'bg-green-500 text-white' :
                        letter <= 'E' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                      }`}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>
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
