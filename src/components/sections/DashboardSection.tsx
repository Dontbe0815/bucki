'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DoorOpen, DollarSign, TrendingUp, TrendingDown, Building2, CreditCard, Percent,
  ArrowUpRight, ArrowDownRight, Wallet, Zap, Target, PieChart, LineChart,
  BarChart3, Home, Landmark, PiggyBank, Receipt, Wrench, FileText, Shield,
  MapPin, Calendar, Euro, Users
} from 'lucide-react';
import { 
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Line,
  ComposedChart
} from 'recharts';
import type { Unit, Property, Financing } from '@/lib/types';

interface DashboardSectionProps {
  stats: any;
  isMobile?: boolean;
  setActiveTab: (tab: string) => void;
}

// Chart Colors
const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  lime: '#84cc16',
  orange: '#f97316',
  indigo: '#6366f1',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// LTV Gauge Component
function LTVGauge({ ltv }: { ltv: number }) {
  const getColor = (ltv: number) => {
    if (ltv <= 60) return COLORS.primary;
    if (ltv <= 75) return COLORS.warning;
    if (ltv <= 85) return COLORS.orange;
    return COLORS.danger;
  };

  const color = getColor(ltv);
  
  return (
    <div className="relative w-28 h-14 mx-auto">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
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
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <span className="text-lg font-bold" style={{ color }}>{ltv.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// Rendite Gauge Component
function RenditeGauge({ value, label }: { value: number; label: string }) {
  const getColor = (value: number) => {
    if (value >= 5) return COLORS.primary;
    if (value >= 3) return COLORS.secondary;
    if (value >= 2) return COLORS.warning;
    return COLORS.danger;
  };

  const color = getColor(value);
  const percentage = Math.min((value / 10) * 100, 100);
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r={radius} 
            fill="none" 
            stroke={color} 
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold" style={{ color }}>{value.toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function DashboardSection({ stats, isMobile, setActiveTab }: DashboardSectionProps) {
  const store = useStore();
  const { formatCurrency } = useI18n();

  // ============================================
  // KPI BERECHNUNGEN
  // ============================================
  
  const kpiData = useMemo(() => {
    // Wohneinheiten
    const totalUnits = store.units.length;
    const rentedUnits = store.units.filter((u: Unit) => u.status === 'rented').length;
    const vacantUnits = totalUnits - rentedUnits;
    
    // Kaltmiete
    const coldRent = store.units
      .filter((u: Unit) => u.status === 'rented')
      .reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
    
    // Schätzwert
    const estimatedValue = store.properties.reduce((sum: number, p: Property) => 
      sum + (p.estimatedValue || p.marketValue), 0);
    
    // Restschuld
    const remainingDebt = store.financings.reduce((sum: number, f: Financing) => 
      sum + f.remainingDebt, 0);
    
    // Einnahmen
    const income = store.units
      .filter((u: Unit) => u.status === 'rented')
      .reduce((sum: number, u: Unit) => sum + u.totalRent, 0);
    
    // Ausgaben
    const expenses = stats.totalExpenses || 0;
    
    // Cashflow
    const cashflow = income - expenses;
    
    // Durchschnittliche Rendite
    const totalPurchasePrice = store.properties.reduce((sum: number, p) => sum + p.purchasePrice, 0);
    const avgRoi = totalPurchasePrice > 0 ? ((coldRent * 12) / totalPurchasePrice) * 100 : 0;
    
    // LTV
    const ltv = estimatedValue > 0 ? (remainingDebt / estimatedValue) * 100 : 0;
    
    // Energie
    const energyMap: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8 };
    const propertiesWithEnergy = store.properties.filter((p: Property) => p.energyClass !== 'unknown');
    const avgEnergyValue = propertiesWithEnergy.length > 0
      ? propertiesWithEnergy.reduce((sum: number, p: Property) => sum + (energyMap[p.energyClass] || 5), 0) / propertiesWithEnergy.length
      : 0;
    const avgEnergyLetter = avgEnergyValue > 0 ? String.fromCharCode(64 + Math.round(avgEnergyValue)) : '-';
    
    // Eigenkapital
    const equity = estimatedValue - remainingDebt;
    
    return { 
      totalUnits, rentedUnits, vacantUnits, coldRent, estimatedValue, remainingDebt,
      income, expenses, cashflow, avgRoi, ltv, avgEnergyLetter, equity
    };
  }, [store.units, store.properties, store.financings, stats]);

  // ============================================
  // RENDITE KENNZAHLEN
  // ============================================
  
  const renditeData = useMemo(() => {
    const annualNetIncome = kpiData.cashflow * 12;
    const bruttoMietRendite = kpiData.avgRoi;
    const eigenkapitalRendite = kpiData.equity > 0 ? (annualNetIncome / kpiData.equity) * 100 : 0;
    const cashOnCash = kpiData.equity > 0 ? (annualNetIncome / kpiData.equity) * 100 : 0;
    
    return { bruttoMietRendite, eigenkapitalRendite, cashOnCash };
  }, [kpiData]);

  // ============================================
  // ZINS VS TILGUNG
  // ============================================
  
  const zinsTilgungData = useMemo(() => {
    let totalInterest = 0;
    let totalPrincipal = 0;
    
    store.financings.forEach((f: Financing) => {
      const interest = f.remainingDebt * (f.interestRate / 100) / 12;
      const principal = f.monthlyRate - interest;
      totalInterest += interest;
      totalPrincipal += Math.max(0, principal);
    });
    
    return [
      { name: 'Tilgung', value: totalPrincipal, color: COLORS.primary },
      { name: 'Zins', value: totalInterest, color: COLORS.danger }
    ];
  }, [store.financings]);

  const totalMonthlyRate = useMemo(() => 
    store.financings.reduce((sum: number, f: Financing) => sum + f.monthlyRate, 0),
    [store.financings]
  );

  // ============================================
  // SCHULDENENTWICKLUNG
  // ============================================
  
  const schuldenData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const data = [];
    let remainingDebt = kpiData.remainingDebt;
    const yearlyPrincipal = (zinsTilgungData[0].value || 0) * 12;
    
    for (let i = 0; i <= 10; i++) {
      const equity = kpiData.estimatedValue - remainingDebt;
      data.push({
        year: currentYear + i,
        schuld: Math.max(0, Math.round(remainingDebt)),
        eigenkapital: Math.max(0, Math.round(equity)),
      });
      remainingDebt -= yearlyPrincipal;
    }
    return data;
  }, [kpiData, zinsTilgungData]);

  // ============================================
  // PORTFOLIOVERTEILUNG NACH STÄDTEN
  // ============================================
  
  const portfolioByCity = useMemo(() => {
    const cityMap: Record<string, { value: number; count: number }> = {};
    
    store.properties.forEach((p: Property) => {
      if (!cityMap[p.city]) cityMap[p.city] = { value: 0, count: 0 };
      cityMap[p.city].value += p.estimatedValue || p.marketValue;
      cityMap[p.city].count++;
    });
    
    return Object.entries(cityMap).map(([city, data], index) => ({
      name: city,
      value: data.value,
      count: data.count,
      color: PIE_COLORS[index % PIE_COLORS.length]
    }));
  }, [store.properties]);

  // ============================================
  // BESTE RENDITEN TABELLE
  // ============================================
  
  const topRenditen = useMemo(() => {
    return store.properties.map((p: Property) => {
      const units = store.units.filter((u: Unit) => u.propertyId === p.id);
      const coldRent = units.filter((u: Unit) => u.status === 'rented').reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
      const roi = p.purchasePrice > 0 ? ((coldRent * 12) / p.purchasePrice) * 100 : 0;
      return { name: p.name, city: p.city, roi, coldRent, purchasePrice: p.purchasePrice };
    }).sort((a, b) => b.roi - a.roi).slice(0, 5);
  }, [store.properties, store.units]);

  // ============================================
  // WERTSTEIGERUNG
  // ============================================
  
  const wertsteigerungData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = 5; i >= 0; i--) {
      const year = currentYear - i;
      // Simulierte Wertsteigerung (in echt aus Historie)
      const totalValue = store.properties.reduce((sum, p) => {
        const appreciation = ((p.estimatedValue || p.marketValue) - p.purchasePrice) / 5 * (5 - i);
        return sum + (p.purchasePrice + appreciation);
      }, 0);
      years.push({ year, value: totalValue });
    }
    
    return years;
  }, [store.properties]);

  const topWertsteigerung = useMemo(() => {
    return store.properties.map((p: Property) => {
      const currentValue = p.estimatedValue || p.marketValue;
      const appreciation = currentValue - p.purchasePrice;
      const appreciationPercent = p.purchasePrice > 0 ? (appreciation / p.purchasePrice) * 100 : 0;
      return { name: p.name, purchasePrice: p.purchasePrice, currentValue, appreciation, appreciationPercent };
    }).sort((a, b) => b.appreciationPercent - a.appreciationPercent).slice(0, 5);
  }, [store.properties]);

  // ============================================
  // CASHFLOW DIAGRAMM
  // ============================================
  
  const cashflowData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthTransactions = store.transactions.filter((t: any) => {
        const date = new Date(t.date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const income = monthTransactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
      const expenses = monthTransactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
      
      return { month, einnahmen: income, ausgaben: expenses, cashflow: income - expenses };
    });
  }, [store.transactions]);

  // ============================================
  // AUSGABEN DIAGRAMM
  // ============================================
  
  const ausgabenData = useMemo(() => {
    const categories = {
      'Uml. Nebenkosten': 0,
      'Nicht uml. NK': 0,
      'Zins': 0,
      'Tilgung': 0,
    };
    
    // Aus Financings
    store.financings.forEach((f: Financing) => {
      const interest = f.remainingDebt * (f.interestRate / 100) / 12;
      const principal = f.monthlyRate - interest;
      categories['Zins'] += interest;
      categories['Tilgung'] += Math.max(0, principal);
    });
    
    // Aus Transaktionen
    store.transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      if (t.category === 'utilities') categories['Uml. Nebenkosten'] += t.amount;
      else if (t.category === 'non_recoverable') categories['Nicht uml. NK'] += t.amount;
    });
    
    return [
      { name: 'Uml. NK', value: categories['Uml. Nebenkosten'], color: COLORS.primary },
      { name: 'Nicht uml. NK', value: categories['Nicht uml. NK'], color: COLORS.secondary },
      { name: 'Zins', value: categories['Zins'], color: COLORS.danger },
      { name: 'Tilgung', value: categories['Tilgung'], color: COLORS.warning },
    ];
  }, [store.financings, store.transactions]);

  // ============================================
  // ABSCHREIBUNGEN
  // ============================================
  
  const abschreibungenData = useMemo(() => {
    const total = (store.depreciationItems || []).reduce((sum: number, item: any) => 
      sum + (item.annualDepreciation || 0), 0);
    
    const byCategory = [
      { name: 'Gebäude', value: total * 0.6 },
      { name: 'Einrichtung', value: total * 0.2 },
      { name: 'Außenanlage', value: total * 0.15 },
      { name: 'Sonstige', value: total * 0.05 },
    ];
    
    return { total, byCategory };
  }, [store.depreciationItems]);

  // ============================================
  // STEUERN
  // ============================================
  
  const steuernData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const total = store.transactions
      .filter((t: any) => t.category === 'taxes' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    return { total, year: currentYear };
  }, [store.transactions]);

  // ============================================
  // MIETVERGLEICH
  // ============================================
  
  const mietvergleichData = useMemo(() => {
    const rentedUnits = store.units.filter((u: Unit) => u.status === 'rented');
    if (rentedUnits.length === 0) return { avgRent: 0, localAvg: 8.50, difference: 0 };
    
    const totalRent = rentedUnits.reduce((sum: number, u: Unit) => sum + u.baseRent, 0);
    const totalArea = rentedUnits.reduce((sum: number, u: Unit) => sum + (u.area || 0), 0);
    const avgRent = totalArea > 0 ? totalRent / totalArea : 0;
    const localAvg = 8.50; // Durchschnittsmiete Region
    const difference = avgRent - localAvg;
    
    return { avgRent, localAvg, difference };
  }, [store.units]);

  // ============================================
  // HAUSGELDER
  // ============================================
  
  const hausgelderData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const management = store.transactions
      .filter((t: any) => t.category === 'management' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    const repairs = store.transactions
      .filter((t: any) => t.category === 'repairs' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    return { management, repairs, total: management + repairs };
  }, [store.transactions]);

  // ============================================
  // SONDERUMLAGEN
  // ============================================
  
  const sonderumlagenData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return store.transactions
      .filter((t: any) => t.category === 'special_assessment' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  }, [store.transactions]);

  // ============================================
  // NEBENKOSTEN
  // ============================================
  
  const nebenkostenData = useMemo(() => {
    const umlagefaehig = store.transactions
      .filter((t: any) => t.category === 'utilities')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    const nichtUmlagefaehig = store.transactions
      .filter((t: any) => t.category === 'non_recoverable')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const details = [
      { name: 'Wasser', value: umlagefaehig * 0.15 },
      { name: 'Heizung', value: umlagefaehig * 0.35 },
      { name: 'Straßenr.', value: umlagefaehig * 0.10 },
      { name: 'Müll', value: umlagefaehig * 0.10 },
      { name: 'Versich.', value: umlagefaehig * 0.15 },
      { name: 'Sonstige', value: umlagefaehig * 0.15 },
    ];
    
    return { umlagefaehig, nichtUmlagefaehig, details };
  }, [store.transactions]);

  // ============================================
  // INVESTITIONEN
  // ============================================
  
  const investitionenData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const items = store.transactions
      .filter((t: any) => t.category === 'repairs' && new Date(t.date).getFullYear() === currentYear)
      .map((t: any) => ({ description: t.description || 'Investition', amount: t.amount, date: t.date }));
    
    const total = items.reduce((sum: number, i: any) => sum + i.amount, 0);
    
    return { total, count: items.length, items: items.slice(0, 5) };
  }, [store.transactions]);

  // ============================================
  // KAUTIONEN
  // ============================================
  
  const kautionenData = useMemo(() => {
    const items = (store.tenants || []).map((t: any) => {
      const unit = store.units.find((u: Unit) => u.id === t.unitId);
      const property = store.properties.find((p: Property) => p.id === unit?.propertyId);
      return {
        tenant: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
        property: property?.name || 'Unbekannt',
        deposit: t.deposit || 0
      };
    }).filter((d: any) => d.deposit > 0);
    
    const total = items.reduce((sum: number, i: any) => sum + i.deposit, 0);
    
    return { total, count: items.length, items };
  }, [store.tenants, store.units, store.properties]);

  // ============================================
  // RÜCKLAGEN
  // ============================================
  
  const ruecklagenData = useMemo(() => {
    const total = store.transactions
      .filter((t: any) => t.category === 'reserves')
      .reduce((sum: number, t: any) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    
    const byCategory = [
      { name: 'Instandhaltung', value: Math.max(0, total * 0.4) },
      { name: 'Modernisierung', value: Math.max(0, total * 0.25) },
      { name: 'Mietausfall', value: Math.max(0, total * 0.20) },
      { name: 'Sonstige', value: Math.max(0, total * 0.15) },
    ];
    
    return { total, byCategory };
  }, [store.transactions]);

  // ============================================
  // GRUNDSTÜCKSWERTE
  // ============================================
  
  const grundstueckData = useMemo(() => {
    const total = store.properties.reduce((sum: number, p: Property) => {
      // Geschätzter Grundstückswert (ca. 30% vom Gesamtwert)
      return sum + ((p.estimatedValue || p.marketValue) * 0.3);
    }, 0);
    
    return { total, count: store.properties.length };
  }, [store.properties]);

  // ============================================
  // BANKEN & KREDITE
  // ============================================
  
  const bankenData = useMemo(() => {
    const uniqueBanks = new Set(store.financings.map((f: Financing) => f.bankName));
    
    const loans = store.financings.map((f: Financing) => {
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
    
    const totalDebt = store.financings.reduce((sum: number, f: Financing) => sum + f.remainingDebt, 0);
    const totalRate = store.financings.reduce((sum: number, f: Financing) => sum + f.monthlyRate, 0);
    
    return { 
      bankCount: uniqueBanks.size, 
      loanCount: store.financings.length,
      totalDebt,
      totalRate,
      loans 
    };
  }, [store.financings, store.properties]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Portfolio-Übersicht</p>
      </div>

      {/* ============================================ */}
      {/* KPI CARDS - 3x3 GRID */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reihe 1 */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <DoorOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Wohneinheiten</span>
            </div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {kpiData.rentedUnits}/{kpiData.totalUnits}
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">{kpiData.vacantUnits} leerstehend</p>
            <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${kpiData.totalUnits > 0 ? (kpiData.rentedUnits / kpiData.totalUnits) * 100 : 0}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">Schätzwert</span>
            </div>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(kpiData.estimatedValue)}
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{store.properties.length} Immobilien</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-medium">Einnahmen</span>
            </div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(kpiData.income)}
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">monatlich</p>
          </CardContent>
        </Card>

        {/* Reihe 2 */}
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Kaltmiete</span>
            </div>
            <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
              {formatCurrency(kpiData.coldRent)}
            </div>
            <p className="text-sm text-cyan-600 dark:text-cyan-400">monatlich</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Restschuld</span>
            </div>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(kpiData.remainingDebt)}
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{bankenData.loanCount} Kredite</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-sm font-medium">Ausgaben</span>
            </div>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(kpiData.expenses)}
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400">monatlich</p>
          </CardContent>
        </Card>

        {/* Reihe 3 */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Durchsch. Rendite</span>
            </div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {kpiData.avgRoi.toFixed(2)}%
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">Brutto p.a.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <Percent className="h-4 w-4" />
              <span className="text-sm font-medium">LTV</span>
            </div>
            <LTVGauge ltv={kpiData.ltv} />
            <p className="text-sm text-indigo-600 dark:text-indigo-400 text-center mt-1">Loan-to-Value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Cashflow</span>
            </div>
            <div className={`text-3xl font-bold ${kpiData.cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.cashflow >= 0 ? '+' : ''}{formatCurrency(kpiData.cashflow)}
            </div>
            <p className="text-sm text-pink-600 dark:text-pink-400">monatlich</p>
          </CardContent>
        </Card>
      </div>

      {/* E-Wert Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 max-w-xs">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">E-Wert (Ø Energie)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-4xl font-bold ${
              kpiData.avgEnergyLetter <= 'C' ? 'text-green-600' :
              kpiData.avgEnergyLetter <= 'E' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {kpiData.avgEnergyLetter}
            </div>
            <div className="flex gap-0.5">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
                <div 
                  key={letter}
                  className={`w-5 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                    letter === kpiData.avgEnergyLetter ? 'ring-2 ring-amber-500 scale-110' : ''
                  } ${letter <= 'C' ? 'bg-green-500 text-white' : letter <= 'E' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}`}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* DIAGRAMME - REIHE 1 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendite-Kennzahlen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-blue-500" />
              Rendite / Kennzahlen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around py-2">
              <RenditeGauge value={renditeData.bruttoMietRendite} label="Brutto-Mietrendite" />
              <RenditeGauge value={renditeData.eigenkapitalRendite} label="EK-Rendite" />
            </div>
            <div className="border-t pt-3 mt-2 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brutto-Mietrendite</span>
                <span className="font-medium">{renditeData.bruttoMietRendite.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eigenkapitalrendite</span>
                <span className="font-medium">{renditeData.eigenkapitalRendite.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash-on-Cash</span>
                <span className="font-medium">{renditeData.cashOnCash.toFixed(2)}%</span>
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
            <CardDescription>Monatliche Rate: {formatCurrency(totalMonthlyRate)}</CardDescription>
          </CardHeader>
          <CardContent>
            {totalMonthlyRate > 0 ? (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={zinsTilgungData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {zinsTilgungData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                    <span className="text-sm">Tilgung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.danger }} />
                    <span className="text-sm">Zins</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Keine Finanzierungen
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schuldendiagramm */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="h-5 w-5 text-emerald-500" />
              Schuldendiagram
            </CardTitle>
            <CardDescription>Prognose 10 Jahre</CardDescription>
          </CardHeader>
          <CardContent>
            {kpiData.remainingDebt > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={schuldenData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => `'${String(v).slice(-2)}`} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="schuld" stroke={COLORS.danger} fill={COLORS.danger} fillOpacity={0.2} name="Schuld" />
                    <Area type="monotone" dataKey="eigenkapital" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} name="Eigenkapital" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Keine Schulden
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* DIAGRAMME - REIHE 2 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolioverteilung nach Städten */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-blue-500" />
              Portfolioverteilung nach Städten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioByCity.length > 0 ? (
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
                    >
                      {portfolioByCity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Keine Immobilien
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabelle mit besten Renditen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Beste Renditen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topRenditen.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.city}</p>
                  </div>
                  <Badge variant={item.roi >= 5 ? 'default' : item.roi >= 3 ? 'secondary' : 'outline'}>
                    {item.roi.toFixed(2)}%
                  </Badge>
                </div>
              ))}
              {topRenditen.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Keine Daten</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* DIAGRAMME - REIHE 3 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wertsteigerung seit Kauf */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Wertsteigerung seit Kauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wertsteigerungData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="value" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} name="Portfoliowert" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabelle mit größter Wertsteigerung */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Größte Wertsteigerung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topWertsteigerung.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.purchasePrice)} → {formatCurrency(item.currentValue)}
                    </p>
                  </div>
                  <Badge variant={item.appreciationPercent > 0 ? 'default' : 'destructive'}>
                    {item.appreciationPercent > 0 ? '+' : ''}{item.appreciationPercent.toFixed(1)}%
                  </Badge>
                </div>
              ))}
              {topWertsteigerung.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Keine Daten</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* DIAGRAMME - REIHE 4 */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow Diagramm */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-cyan-500" />
              Cashflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="einnahmen" fill={COLORS.primary} name="Einnahmen" />
                  <Bar dataKey="ausgaben" fill={COLORS.danger} name="Ausgaben" />
                  <Line type="monotone" dataKey="cashflow" stroke={COLORS.purple} strokeWidth={2} name="Cashflow" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ausgaben Diagramm */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-5 w-5 text-orange-500" />
              Ausgaben / Kostenarten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={ausgabenData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {ausgabenData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* KPI GRID - WEITERE KENNZAHLEN */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Eigenkapitalrendite */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Eigenkapitalrendite</span>
            </div>
            <div className="text-2xl font-bold">{renditeData.eigenkapitalRendite.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">ROE auf Eigenkapital</p>
          </CardContent>
        </Card>

        {/* Abschreibungen */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Abschreibungen</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(abschreibungenData.total)}</div>
            <p className="text-xs text-muted-foreground">jährlich</p>
          </CardContent>
        </Card>

        {/* Steuern */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Receipt className="h-4 w-4" />
              <span className="text-sm font-medium">Steuern</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(steuernData.total)}</div>
            <p className="text-xs text-muted-foreground">Jahr {steuernData.year}</p>
          </CardContent>
        </Card>

        {/* Kaltmiete vs Vergleichsmieten */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Kaltmiete vs Ø</span>
            </div>
            <div className="text-2xl font-bold">{mietvergleichData.avgRent.toFixed(2)} €/m²</div>
            <p className="text-xs text-muted-foreground">
              Ø {mietvergleichData.localAvg.toFixed(2)} €/m² | 
              <span className={mietvergleichData.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                {mietvergleichData.difference >= 0 ? '+' : ''}{mietvergleichData.difference.toFixed(2)} €
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Hausgelder */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Home className="h-4 w-4" />
              <span className="text-sm font-medium">Hausgelder</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(hausgelderData.total)}</div>
            <p className="text-xs text-muted-foreground">Verwaltung: {formatCurrency(hausgelderData.management)}</p>
          </CardContent>
        </Card>

        {/* Sonderumlagen */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Receipt className="h-4 w-4" />
              <span className="text-sm font-medium">Sonderumlagen</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(sonderumlagenData)}</div>
            <p className="text-xs text-muted-foreground">dieses Jahr</p>
          </CardContent>
        </Card>

        {/* Nebenkosten */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Nebenkosten</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(nebenkostenData.umlagefaehig + nebenkostenData.nichtUmlagefaehig)}</div>
            <p className="text-xs text-muted-foreground">
              Uml: {formatCurrency(nebenkostenData.umlagefaehig)} | Nicht uml: {formatCurrency(nebenkostenData.nichtUmlagefaehig)}
            </p>
          </CardContent>
        </Card>

        {/* Investitionen */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wrench className="h-4 w-4" />
              <span className="text-sm font-medium">Investitionen</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(investitionenData.total)}</div>
            <p className="text-xs text-muted-foreground">{investitionenData.count} Positionen</p>
          </CardContent>
        </Card>

        {/* Kautionen */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Kautionen</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(kautionenData.total)}</div>
            <p className="text-xs text-muted-foreground">{kautionenData.count} Mieter</p>
          </CardContent>
        </Card>

        {/* Rücklagen */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <PiggyBank className="h-4 w-4" />
              <span className="text-sm font-medium">Rücklagen</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(ruecklagenData.total)}</div>
            <p className="text-xs text-muted-foreground">Rücklagenkonto</p>
          </CardContent>
        </Card>

        {/* Grundstückswerte */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Landmark className="h-4 w-4" />
              <span className="text-sm font-medium">Grundstückswerte</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(grundstueckData.total)}</div>
            <p className="text-xs text-muted-foreground">{grundstueckData.count} Grundstücke (ca. 30%)</p>
          </CardContent>
        </Card>

        {/* Banken */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Landmark className="h-4 w-4" />
              <span className="text-sm font-medium">Banken</span>
            </div>
            <div className="text-2xl font-bold">{bankenData.bankCount}</div>
            <p className="text-xs text-muted-foreground">{bankenData.loanCount} Kredite</p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* KREDITE TABELLE */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Kredite
          </CardTitle>
          <CardDescription>
            Gesamt: {formatCurrency(bankenData.totalDebt)} | Monatliche Rate: {formatCurrency(bankenData.totalRate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Bank</th>
                  <th className="text-left p-3 text-sm font-medium">Immobilie</th>
                  <th className="text-right p-3 text-sm font-medium">Kreditsumme</th>
                  <th className="text-right p-3 text-sm font-medium">Restschuld</th>
                  <th className="text-right p-3 text-sm font-medium">Rate</th>
                  <th className="text-right p-3 text-sm font-medium">Zins</th>
                </tr>
              </thead>
              <tbody>
                {bankenData.loans.map((loan, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm">{loan.bank}</td>
                    <td className="p-3 text-sm">{loan.property}</td>
                    <td className="p-3 text-sm text-right">{formatCurrency(loan.principal)}</td>
                    <td className="p-3 text-sm text-right font-medium">{formatCurrency(loan.remaining)}</td>
                    <td className="p-3 text-sm text-right">{formatCurrency(loan.rate)}/M</td>
                    <td className="p-3 text-sm text-right">{loan.interest.toFixed(2)}%</td>
                  </tr>
                ))}
                {bankenData.loans.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Keine Kredite vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
