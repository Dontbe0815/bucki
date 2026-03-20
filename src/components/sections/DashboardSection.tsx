'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  DoorOpen, DollarSign, TrendingUp, TrendingDown, Building2, CreditCard, Percent,
  ArrowUpRight, ArrowDownRight, Wallet, Zap, Target, PieChart, LineChart
} from 'lucide-react';
import { 
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import type { Unit, Property, Financing } from '@/lib/types';

interface DashboardSectionProps {
  stats: any;
  isMobile?: boolean;
  setActiveTab: (tab: string) => void;
}

// Chart Colors
const CHART_COLORS = {
  interest: '#ef4444',
  principal: '#10b981',
  debt: '#3b82f6',
  equity: '#10b981',
  primary: '#10b981',
  secondary: '#3b82f6',
};

// LTV Gauge Component
function LTVGauge({ ltv }: { ltv: number }) {
  const getColor = (ltv: number) => {
    if (ltv <= 60) return '#10b981';
    if (ltv <= 75) return '#f59e0b';
    if (ltv <= 85) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(ltv);
  
  return (
    <div className="relative w-32 h-16 mx-auto">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${Math.min(ltv, 100) * 1.26} 126`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-xl font-bold" style={{ color }}>{ltv.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// Rendite Gauge Component (Circular)
function RenditeGauge({ value, label, maxValue = 10 }: { value: number; label: string; maxValue?: number }) {
  const getColor = (value: number) => {
    if (value >= 5) return '#10b981'; // green
    if (value >= 3) return '#3b82f6'; // blue
    if (value >= 2) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const color = getColor(value);
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{value.toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 max-w-[100px] mx-auto">{label}</p>
    </div>
  );
}

export default function DashboardSection({ stats, isMobile, setActiveTab }: DashboardSectionProps) {
  const store = useStore();
  const { formatCurrency } = useI18n();

  // ============================================
  // BERECHNUNGEN - SPALTE 1
  // ============================================
  
  const spalte1Data = useMemo(() => {
    const totalUnits = store.units.length;
    const rentedUnits = store.units.filter((u: Unit) => u.status === 'rented').length;
    const vacantUnits = totalUnits - rentedUnits;
    
    const coldRent = store.units
      .filter((u: Unit) => u.status === 'rented')
      .reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
    
    const totalPurchasePrice = store.properties.reduce((sum: number, p) => sum + p.purchasePrice, 0);
    const avgRoi = totalPurchasePrice > 0 ? ((coldRent * 12) / totalPurchasePrice) * 100 : 0;
    
    return { totalUnits, rentedUnits, vacantUnits, coldRent, avgRoi };
  }, [store.units, store.properties]);

  // ============================================
  // BERECHNUNGEN - SPALTE 2
  // ============================================
  
  const spalte2Data = useMemo(() => {
    const totalEstimatedValue = store.properties.reduce((sum: number, p: Property) => {
      return sum + (p.estimatedValue || p.marketValue);
    }, 0);
    
    const totalRemainingDebt = store.financings.reduce((sum: number, f: Financing) => {
      return sum + f.remainingDebt;
    }, 0);
    
    const totalLoans = store.financings.length;
    const ltv = totalEstimatedValue > 0 ? (totalRemainingDebt / totalEstimatedValue) * 100 : 0;
    const equity = totalEstimatedValue - totalRemainingDebt;
    
    const getLtvRating = (ltv: number) => {
      if (ltv <= 60) return { label: 'Sehr gut', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900' };
      if (ltv <= 75) return { label: 'Akzeptabel', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900' };
      if (ltv <= 85) return { label: 'Kritisch', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900' };
      return { label: 'Zu hoch', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900' };
    };
    
    return { totalEstimatedValue, totalRemainingDebt, totalLoans, ltv, equity, ltvRating: getLtvRating(ltv) };
  }, [store.properties, store.financings]);

  // ============================================
  // BERECHNUNGEN - SPALTE 3
  // ============================================
  
  const spalte3Data = useMemo(() => {
    const monthlyIncome = store.units
      .filter((u: Unit) => u.status === 'rented')
      .reduce((sum: number, u: Unit) => sum + u.totalRent, 0);
    
    const monthlyExpenses = stats.totalExpenses || 0;
    const cashflow = monthlyIncome - monthlyExpenses;
    
    return { monthlyIncome, monthlyExpenses, cashflow };
  }, [store.units, stats]);

  // ============================================
  // BERECHNUNGEN - SPALTE 4
  // ============================================
  
  const spalte4Data = useMemo(() => {
    const energyMap: Record<string, number> = { 
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8 
    };
    
    const propertiesWithEnergy = store.properties.filter((p: Property) => p.energyClass !== 'unknown');
    
    const avgEnergyValue = propertiesWithEnergy.length > 0
      ? propertiesWithEnergy.reduce((sum: number, p: Property) => sum + (energyMap[p.energyClass] || 5), 0) / propertiesWithEnergy.length
      : 0;
    
    const avgEnergyLetter = avgEnergyValue > 0 
      ? String.fromCharCode(64 + Math.round(avgEnergyValue)) 
      : '-';
    
    return { 
      avgEnergyValue, 
      avgEnergyLetter, 
      propertiesWithEnergyCount: propertiesWithEnergy.length,
      totalPropertiesCount: store.properties.length
    };
  }, [store.properties]);

  // ============================================
  // STEP 4a: RENDITE-KENNZAHLEN
  // ============================================
  
  const renditeKennzahlen = useMemo(() => {
    const totalPurchasePrice = store.properties.reduce((sum: number, p) => sum + p.purchasePrice, 0);
    const coldRent = store.units.filter((u: Unit) => u.status === 'rented').reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
    
    // Brutto-Mietrendite
    const bruttoMietRendite = totalPurchasePrice > 0 ? ((coldRent * 12) / totalPurchasePrice) * 100 : 0;
    
    // Eigenkapitalrendite (ROE) = Jahres-Netto-Einnahmen / Eigenkapital
    const annualNetIncome = (spalte3Data.cashflow * 12);
    const roe = spalte2Data.equity > 0 ? (annualNetIncome / spalte2Data.equity) * 100 : 0;
    
    // Cash-on-Cash Return = Jahres-Cashflow / Eigenkapital
    const annualCashflow = spalte3Data.cashflow * 12;
    const cashOnCash = spalte2Data.equity > 0 ? (annualCashflow / spalte2Data.equity) * 100 : 0;
    
    return { bruttoMietRendite, roe, cashOnCash };
  }, [store.properties, store.units, spalte2Data.equity, spalte3Data.cashflow]);

  // ============================================
  // STEP 4a: ZINS VS TILGUNG
  // ============================================
  
  const interestVsPrincipal = useMemo(() => {
    let totalInterest = 0;
    let totalPrincipal = 0;
    
    store.financings.forEach((f: Financing) => {
      // Monatlicher Zins = Restschuld * Zinssatz / 12
      const interest = f.remainingDebt * (f.interestRate / 100) / 12;
      // Tilgung = Monatsrate - Zins
      const principal = f.monthlyRate - interest;
      totalInterest += interest;
      totalPrincipal += Math.max(0, principal);
    });
    
    return [
      { name: 'Tilgung', value: totalPrincipal, color: CHART_COLORS.principal },
      { name: 'Zins', value: totalInterest, color: CHART_COLORS.interest }
    ];
  }, [store.financings]);

  const totalMonthlyRate = useMemo(() => {
    return store.financings.reduce((sum: number, f: Financing) => sum + f.monthlyRate, 0);
  }, [store.financings]);

  // ============================================
  // STEP 4a: SCHULDENENTWICKLUNG (10 Jahre)
  // ============================================
  
  const debtDevelopment = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const data = [];
    let remainingDebt = spalte2Data.totalRemainingDebt;
    
    // Jährliche Tilgung berechnen
    const yearlyPrincipal = interestVsPrincipal[0].value * 12;
    
    for (let i = 0; i <= 10; i++) {
      const equity = spalte2Data.totalEstimatedValue - remainingDebt;
      data.push({
        year: currentYear + i,
        schuld: Math.max(0, Math.round(remainingDebt)),
        eigenkapital: Math.max(0, Math.round(equity)),
      });
      remainingDebt -= yearlyPrincipal;
    }
    
    return data;
  }, [spalte2Data, interestVsPrincipal]);

  // ============================================
  // STEP 4b: PORTFOLIOVERTEILUNG
  // ============================================
  
  const portfolioByCity = useMemo(() => {
    const cityMap: Record<string, { value: number; count: number }> = {};
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    
    store.properties.forEach((p: Property) => {
      if (!cityMap[p.city]) {
        cityMap[p.city] = { value: 0, count: 0 };
      }
      cityMap[p.city].value += p.estimatedValue || p.marketValue;
      cityMap[p.city].count++;
    });
    
    return Object.entries(cityMap).map(([city, data], index) => ({
      name: city,
      value: data.value,
      count: data.count,
      color: colors[index % colors.length]
    }));
  }, [store.properties]);

  // ============================================
  // STEP 4b: BESTE RENDITEN
  // ============================================
  
  const topRoiProperties = useMemo(() => {
    return store.properties.map((p: Property) => {
      const units = store.units.filter((u: Unit) => u.propertyId === p.id);
      const coldRent = units.filter((u: Unit) => u.status === 'rented').reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
      const roi = p.purchasePrice > 0 ? ((coldRent * 12) / p.purchasePrice) * 100 : 0;
      return {
        name: p.name,
        city: p.city,
        roi,
        coldRent,
        purchasePrice: p.purchasePrice
      };
    }).sort((a, b) => b.roi - a.roi).slice(0, 5);
  }, [store.properties, store.units]);

  // ============================================
  // STEP 4b: WERTSTEIGERUNG
  // ============================================
  
  const valueAppreciation = useMemo(() => {
    return store.properties.map((p: Property) => {
      const currentValue = p.estimatedValue || p.marketValue;
      const appreciation = currentValue - p.purchasePrice;
      const appreciationPercent = p.purchasePrice > 0 ? (appreciation / p.purchasePrice) * 100 : 0;
      return {
        name: p.name,
        purchasePrice: p.purchasePrice,
        currentValue,
        appreciation,
        appreciationPercent
      };
    }).sort((a, b) => b.appreciationPercent - a.appreciationPercent);
  }, [store.properties]);

  // ============================================
  // STEP 4c: MONATLICHER CASHFLOW
  // ============================================
  
  const monthlyCashflow = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthTransactions = store.transactions.filter((t: any) => {
        const date = new Date(t.date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const income = monthTransactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
      const expenses = monthTransactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
      
      return { month, income, expenses, cashflow: income - expenses };
    });
  }, [store.transactions]);

  // ============================================
  // STEP 4c: AUSGABEN AUFTEILUNG
  // ============================================
  
  const expenseBreakdown = useMemo(() => {
    const categories: Record<string, { value: number; color: number }> = {
      'Uml. Nebenkosten': { value: 0, color: 0 },
      'Nicht uml. NK': { value: 0, color: 1 },
      'Zins': { value: 0, color: 2 },
      'Tilgung': { value: 0, color: 3 },
      'Verwaltung': { value: 0, color: 4 },
      'Instandhaltung': { value: 0, color: 5 }
    };
    
    const colors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
    
    // Calculate from financings
    store.financings.forEach((f: Financing) => {
      const interest = f.remainingDebt * (f.interestRate / 100) / 12;
      const principal = f.monthlyRate - interest;
      categories['Zins'].value += interest;
      categories['Tilgung'].value += Math.max(0, principal);
    });
    
    // Calculate from transactions
    store.transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      if (t.category === 'utilities') {
        categories['Uml. Nebenkosten'].value += t.amount;
      } else if (t.category === 'management') {
        categories['Verwaltung'].value += t.amount;
      } else if (t.category === 'repairs') {
        categories['Instandhaltung'].value += t.amount;
      } else if (t.category === 'non_recoverable') {
        categories['Nicht uml. NK'].value += t.amount;
      }
    });
    
    return Object.entries(categories).map(([name, data]) => ({
      name,
      value: data.value,
      color: colors[data.color]
    }));
  }, [store.financings, store.transactions]);

  // ============================================
  // STEP 4d: ABSCHREIBUNGEN, STEUERN, MIETVERGLEICH, HAUSGELDER
  // ============================================
  
  const abschreibungenTotal = useMemo(() => {
    return (store.depreciationItems || []).reduce((sum: number, item: any) => sum + (item.monthlyDepreciation || 0), 0);
  }, [store.depreciationItems]);

  const steuernTotal = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return store.transactions
      .filter((t: any) => t.category === 'taxes' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  }, [store.transactions]);

  const hausgelderTotal = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return store.transactions
      .filter((t: any) => 
        (t.category === 'management' || t.category === 'repairs') && 
        new Date(t.date).getFullYear() === currentYear
      )
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  }, [store.transactions]);

  const avgRentPerSqm = useMemo(() => {
    const rentedUnits = store.units.filter((u: Unit) => u.status === 'rented');
    if (rentedUnits.length === 0) return 0;
    
    const totalRent = rentedUnits.reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
    const totalArea = rentedUnits.reduce((sum: number, u: Unit) => sum + (u.area || 0), 0);
    
    return totalArea > 0 ? totalRent / totalArea : 0;
  }, [store.units]);

  const localAvgRent = useMemo(() => {
    // Durchschnittsmiete für die Region (vereinfacht)
    return 8.50; // €/qm - sollte durch echte Daten ersetzt werden
  }, []);

  // ============================================
  // STEP 4e: KAUTIONEN, RÜCKLAGEN, BANKEN, KREDITE, INVESTITIONEN, NEBENKOSTEN
  // ============================================
  
  const deposits = useMemo(() => {
    return (store.tenants || []).map((t: any) => {
      const unit = store.units.find((u: Unit) => u.id === t.unitId);
      const property = store.properties.find((p: Property) => p.id === unit?.propertyId);
      return {
        tenant: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
        property: property?.name || 'Unbekannt',
        deposit: t.deposit || 0
      };
    }).filter((d: any) => d.deposit > 0);
  }, [store.tenants, store.units, store.properties]);

  const ruecklagenTotal = useMemo(() => {
    return store.transactions
      .filter((t: any) => t.category === 'reserves')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  }, [store.transactions]);

  const ruecklagenByCategory = useMemo(() => {
    // Beispiel-Kategorien für Rücklagen
    return [
      { name: 'Instandhaltung', value: ruecklagenTotal * 0.4 },
      { name: 'Modernisierung', value: ruecklagenTotal * 0.3 },
      { name: 'Mietausfall', value: ruecklagenTotal * 0.2 },
      { name: 'Sonstige', value: ruecklagenTotal * 0.1 }
    ];
  }, [ruecklagenTotal]);

  const bankLoans = useMemo(() => {
    return store.financings.map((f: Financing) => {
      const property = store.properties.find((p: Property) => p.id === f.propertyId);
      return {
        bank: f.bankName,
        property: property?.name || 'Unbekannt',
        remaining: f.remainingDebt,
        principal: f.principalAmount,
        rate: f.monthlyRate,
        interest: f.interestRate
      };
    });
  }, [store.financings, store.properties]);

  const bankCount = useMemo(() => {
    const uniqueBanks = new Set(store.financings.map((f: Financing) => f.bankName));
    return uniqueBanks.size;
  }, [store.financings]);

  const investitionenTotal = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return store.transactions
      .filter((t: any) => 
        t.category === 'repairs' && 
        (t.description?.toLowerCase().includes('invest') || t.isInvestment) &&
        new Date(t.date).getFullYear() === currentYear
      )
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  }, [store.transactions]);

  const investitionenCount = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return store.transactions
      .filter((t: any) => 
        t.category === 'repairs' && 
        (t.description?.toLowerCase().includes('invest') || t.isInvestment) &&
        new Date(t.date).getFullYear() === currentYear
      ).length;
  }, [store.transactions]);

  const investitionenRecent = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return store.transactions
      .filter((t: any) => 
        t.category === 'repairs' && 
        (t.description?.toLowerCase().includes('invest') || t.isInvestment) &&
        new Date(t.date).getFullYear() === currentYear
      )
      .map((t: any) => ({
        description: t.description || 'Investition',
        amount: t.amount
      }))
      .slice(0, 3);
  }, [store.transactions]);

  const nebenkostenUml = useMemo(() => {
    return store.transactions
      .filter((t: any) => t.type === 'expense' && t.category === 'utilities')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  }, [store.transactions]);

  const nebenkostenNichtUml = useMemo(() => {
    return store.transactions
      .filter((t: any) => t.type === 'expense' && t.category === 'non_recoverable')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  }, [store.transactions]);

  const nebenkostenDetails = useMemo(() => {
    // Beispiel-Detaillierung der Nebenkosten
    return [
      { name: 'Wasser', value: nebenkostenUml * 0.15, umlagefaehig: true },
      { name: 'Heizung', value: nebenkostenUml * 0.35, umlagefaehig: true },
      { name: 'Straßenreinigung', value: nebenkostenUml * 0.10, umlagefaehig: true },
      { name: 'Müllabfuhr', value: nebenkostenUml * 0.10, umlagefaehig: true },
      { name: 'Verwaltung', value: nebenkostenNichtUml * 0.5, umlagefaehig: false },
      { name: 'Instandhaltung', value: nebenkostenNichtUml * 0.5, umlagefaehig: false }
    ];
  }, [nebenkostenUml, nebenkostenNichtUml]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Willkommen bei Bucki</p>
        </div>
      </div>

      {/* ============================================ */}
      {/* 4 SPALTEN - KPI CARDS */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* SPALTE 1 */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <DoorOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Wohneinheiten</span>
              </div>
              <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                {spalte1Data.rentedUnits}/{spalte1Data.totalUnits}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {spalte1Data.vacantUnits} leerstehend
              </div>
              <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${spalte1Data.totalUnits > 0 ? (spalte1Data.rentedUnits / spalte1Data.totalUnits) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="border-t border-blue-200 dark:border-blue-700" />

            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Kaltmiete</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(spalte1Data.coldRent)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">monatlich</div>
            </div>

            <div className="border-t border-blue-200 dark:border-blue-700" />

            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Ø Rendite</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {spalte1Data.avgRoi.toFixed(2)}%
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Brutto-Mietrendite p.a.</div>
            </div>
          </CardContent>
        </Card>

        {/* SPALTE 2 */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Schätzwert</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(spalte2Data.totalEstimatedValue)}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                {store.properties.length} Immobilien
              </div>
            </div>

            <div className="border-t border-emerald-200 dark:border-emerald-700" />

            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Restschuld</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(spalte2Data.totalRemainingDebt)}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                {spalte2Data.totalLoans} Kredite
              </div>
            </div>

            <div className="border-t border-emerald-200 dark:border-emerald-700" />

            <div>
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                <Percent className="h-4 w-4" />
                <span className="text-sm font-medium">LTV</span>
              </div>
              <LTVGauge ltv={spalte2Data.ltv} />
              <div className="text-center mt-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${spalte2Data.ltvRating.bg} ${spalte2Data.ltvRating.color}`}>
                  {spalte2Data.ltvRating.label}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SPALTE 3 */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">Einnahmen</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(spalte3Data.monthlyIncome)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">monatlich</div>
            </div>

            <div className="border-t border-purple-200 dark:border-purple-700" />

            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-sm font-medium">Ausgaben</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(spalte3Data.monthlyExpenses)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">monatlich</div>
            </div>

            <div className="border-t border-purple-200 dark:border-purple-700" />

            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Cashflow</span>
              </div>
              <div className={`text-2xl font-bold ${spalte3Data.cashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {spalte3Data.cashflow >= 0 ? '+' : ''}{formatCurrency(spalte3Data.cashflow)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">monatlich</div>
            </div>
          </CardContent>
        </Card>

        {/* SPALTE 4 */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Ø Energiewert</span>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-6xl font-bold ${
                spalte4Data.avgEnergyLetter <= 'C' ? 'text-green-600' :
                spalte4Data.avgEnergyLetter <= 'E' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {spalte4Data.avgEnergyLetter}
              </div>
              <div className="flex-1">
                <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Durchschnitt</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {spalte4Data.propertiesWithEnergyCount} von {spalte4Data.totalPropertiesCount} Immobilien
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
                <div 
                  key={letter}
                  className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold ${
                    letter === spalte4Data.avgEnergyLetter ? 'ring-2 ring-amber-500 ring-offset-1 scale-110' : ''
                  } ${
                    letter <= 'C' ? 'bg-green-500 text-white' :
                    letter <= 'E' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* STEP 4a: DIAGRAMME */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rendite-Kennzahlen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-blue-500" />
              Rendite-Kennzahlen
            </CardTitle>
            <CardDescription>Übersicht Ihrer wichtigsten Rendite-Metriken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around py-4">
              <RenditeGauge 
                value={renditeKennzahlen.bruttoMietRendite} 
                label="Brutto-Mietrendite" 
              />
              <RenditeGauge 
                value={renditeKennzahlen.roe} 
                label="Eigenkapitalrendite" 
              />
              <RenditeGauge 
                value={renditeKennzahlen.cashOnCash} 
                label="Cash-on-Cash" 
              />
            </div>
            
            <div className="border-t pt-3 mt-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Brutto-Mietrendite</span>
                <span className="font-medium">{renditeKennzahlen.bruttoMietRendite.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Eigenkapitalrendite</span>
                <span className="font-medium">{renditeKennzahlen.roe.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cash-on-Cash</span>
                <span className="font-medium">{renditeKennzahlen.cashOnCash.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zins vs Tilgung */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5 text-purple-500" />
              Zins vs Tilgung
            </CardTitle>
            <CardDescription>Monatliche Kreditrate: {formatCurrency(totalMonthlyRate)}</CardDescription>
          </CardHeader>
          <CardContent>
            {totalMonthlyRate > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={interestVsPrincipal}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {interestVsPrincipal.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.principal }} />
                    <span className="text-sm text-muted-foreground">Tilgung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.interest }} />
                    <span className="text-sm text-muted-foreground">Zins</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-600">
                      {formatCurrency(interestVsPrincipal[0].value)}
                    </div>
                    <div className="text-xs text-muted-foreground">Tilgung / Monat</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-500">
                      {formatCurrency(interestVsPrincipal[1].value)}
                    </div>
                    <div className="text-xs text-muted-foreground">Zins / Monat</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Finanzierungen vorhanden</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schuldendiagramm */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="h-5 w-5 text-emerald-500" />
              Schuldentwicklung
            </CardTitle>
            <CardDescription>Prognose für die nächsten 10 Jahre</CardDescription>
          </CardHeader>
          <CardContent>
            {spalte2Data.totalRemainingDebt > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={debtDevelopment}>
                      <defs>
                        <linearGradient id="colorSchuld" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.debt} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={CHART_COLORS.debt} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEigenkapital" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.equity} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={CHART_COLORS.equity} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 11 }} 
                        className="text-muted-foreground"
                        tickFormatter={(value) => `'${String(value).slice(-2)}`}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }} 
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="schuld" 
                        stroke={CHART_COLORS.debt} 
                        strokeWidth={2} 
                        fill="url(#colorSchuld)" 
                        name="Restschuld" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="eigenkapital" 
                        stroke={CHART_COLORS.equity} 
                        strokeWidth={2} 
                        fill="url(#colorEigenkapital)" 
                        name="Eigenkapital" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.debt }} />
                    <span className="text-sm text-muted-foreground">Restschuld</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.equity }} />
                    <span className="text-sm text-muted-foreground">Eigenkapital</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Schuldenfrei!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* STEP 4b: PORTFOLIOVERTEILUNG & TABELLEN */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Portfolioverteilung nach Stadt */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-emerald-500" />
              Portfolioverteilung
            </CardTitle>
            <CardDescription>Nach Standort</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolioByCity.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={portfolioByCity}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {portfolioByCity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 pt-3 border-t">
                  {portfolioByCity.slice(0, 4).map((city, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: city.color }} />
                        <span className="text-muted-foreground">{city.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(city.value)}</span>
                        <span className="text-xs text-muted-foreground">({city.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Immobilien vorhanden</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Beste Renditen Tabelle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Beste Renditen
            </CardTitle>
            <CardDescription>Top 5 Immobilien nach Rendite</CardDescription>
          </CardHeader>
          <CardContent>
            {topRoiProperties.length > 0 ? (
              <div className="space-y-2">
                {topRoiProperties.map((property, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{property.name}</div>
                        <div className="text-xs text-muted-foreground">{property.city}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">{property.roi.toFixed(2)}%</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(property.coldRent)}/Mo.</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Immobilien vorhanden</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wertsteigerung Tabelle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="h-5 w-5 text-blue-500" />
              Wertsteigerung
            </CardTitle>
            <CardDescription>Seit Kauf (sortiert nach %)</CardDescription>
          </CardHeader>
          <CardContent>
            {valueAppreciation.length > 0 ? (
              <div className="space-y-2">
                {valueAppreciation.slice(0, 5).map((property, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{property.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(property.purchasePrice)} → {formatCurrency(property.currentValue)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${property.appreciation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {property.appreciation >= 0 ? '+' : ''}{formatCurrency(property.appreciation)}
                      </div>
                      <div className={`text-xs ${property.appreciationPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {property.appreciationPercent >= 0 ? '+' : ''}{property.appreciationPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ArrowUpRight className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Immobilien vorhanden</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* STEP 4c: CASHFLOW, AUSGABEN, EIGENKAPITALRENDITE */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monatlicher Cashflow (12 Monate) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-purple-500" />
              Cashflow Übersicht
            </CardTitle>
            <CardDescription>Monatlicher Verlauf (letztes Jahr)</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyCashflow.length > 0 ? (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyCashflow}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 11 }} 
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }} 
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        fill="url(#colorIncome)" 
                        name="Einnahmen" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        fill="url(#colorExpenses)" 
                        name="Ausgaben" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cashflow" 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        fill="url(#colorCashflow)" 
                        name="Cashflow" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Einnahmen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-muted-foreground">Ausgaben</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm text-muted-foreground">Cashflow</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Daten vorhanden</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ausgaben Aufteilung */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
              Ausgaben Aufteilung
            </CardTitle>
            <CardDescription>Monatliche Kostenstruktur</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseBreakdown.length > 0 && expenseBreakdown.some(e => e.value > 0) ? (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={expenseBreakdown.filter(e => e.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseBreakdown.filter(e => e.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 pt-3 border-t">
                  {expenseBreakdown.filter(e => e.value > 0).map((expense, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: expense.color }} />
                        <span className="text-muted-foreground">{expense.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(expense.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ArrowDownRight className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Ausgaben</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* STEP 4d: ABSCHREIBUNGEN, STEUERN, MIETVERGLEICH, HAUSGELDER */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Abschreibungen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              Abschreibungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(abschreibungenTotal)}
            </div>
            <div className="text-sm text-muted-foreground">monatlich</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {store.depreciationItems?.length || 0} Positionen
            </div>
          </CardContent>
        </Card>

        {/* Steuern */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-red-500" />
              Steuern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(steuernTotal)}
            </div>
            <div className="text-sm text-muted-foreground">dieses Jahr</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Grundsteuer + Einkommensteuer
            </div>
          </CardContent>
        </Card>

        {/* Hausgelder */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-amber-500" />
              Hausgelder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(hausgelderTotal)}
            </div>
            <div className="text-sm text-muted-foreground">dieses Jahr</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Verwaltung & Instandhaltung
            </div>
          </CardContent>
        </Card>

        {/* Mietvergleich */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Ø Miete/qm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {avgRentPerSqm.toFixed(2)} €
            </div>
            <div className="text-sm text-muted-foreground">Kaltmiete</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Vergleich: Ø {localAvgRent.toFixed(2)} €/qm
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* STEP 4e: NEBENKOSTEN, INVESTITIONEN, KAUTIONEN, RÜCKLAGEN, BANKEN, KREDITE */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kautionen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-emerald-500" />
              Kautionen
            </CardTitle>
            <CardDescription>Hinterlegte Sicherheitsleistungen</CardDescription>
          </CardHeader>
          <CardContent>
            {deposits.length > 0 ? (
              <>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {deposits.slice(0, 5).map((d, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-sm">{d.tenant}</div>
                        <div className="text-xs text-muted-foreground">{d.property}</div>
                      </div>
                      <div className="font-bold text-emerald-600">{formatCurrency(d.deposit)}</div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 mt-2 border-t flex justify-between font-medium">
                  <span>Gesamt</span>
                  <span className="text-emerald-600">{formatCurrency(deposits.reduce((sum, d) => sum + d.deposit, 0))}</span>
                </div>
              </>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine Kautionen</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rücklagen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Rücklagen
            </CardTitle>
            <CardDescription>Angesparte Rückstellungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 mb-2">
              {formatCurrency(ruecklagenTotal)}
            </div>
            <div className="space-y-2">
              {ruecklagenByCategory.map((r, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{r.name}</span>
                  <span className="font-medium">{formatCurrency(r.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Banken & Kredite */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-purple-500" />
              Banken & Kredite
            </CardTitle>
            <CardDescription>Übersicht aller Finanzierungen</CardDescription>
          </CardHeader>
          <CardContent>
            {bankLoans.length > 0 ? (
              <>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {bankLoans.slice(0, 5).map((loan, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-sm">{loan.bank}</div>
                        <div className="text-xs text-muted-foreground">{loan.property}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{formatCurrency(loan.remaining)}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(loan.rate)}/Mo. @ {loan.interest}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 mt-2 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold">{bankCount}</div>
                    <div className="text-xs text-muted-foreground">Banken</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{store.financings.length}</div>
                    <div className="text-xs text-muted-foreground">Kredite</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine Kredite</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investitionen & Nebenkosten Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Investitionen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Investitionen
            </CardTitle>
            <CardDescription>Kapitalmaßnahmen dieses Jahr</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(investitionenTotal)}</div>
                <div className="text-sm text-muted-foreground">Gesamt</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{investitionenCount}</div>
                <div className="text-sm text-muted-foreground">Maßnahmen</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {investitionenRecent.slice(0, 3).map((inv, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">{inv.description}</span>
                  <span className="font-medium">{formatCurrency(inv.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nebenkosten Übersicht */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-blue-500" />
              Nebenkosten
            </CardTitle>
            <CardDescription>Umlagen & nicht umlagefähige Kosten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(nebenkostenUml)}</div>
                <div className="text-sm text-muted-foreground">Umlagefähig</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(nebenkostenNichtUml)}</div>
                <div className="text-sm text-muted-foreground">Nicht umlagef.</div>
              </div>
            </div>
            <div className="space-y-2">
              {nebenkostenDetails.slice(0, 4).map((nk, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{nk.name}</span>
                  <span className={nk.umlagefaehig ? 'text-emerald-600' : 'text-red-600'}>
                    {formatCurrency(nk.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
