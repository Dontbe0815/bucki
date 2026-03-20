'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import type { DashboardWidget, DashboardWidgetType, DepreciationCategory, Financing, Property, Unit, Task, Document, HealthRecommendation } from '@/lib/types';
import { DEFAULT_DASHBOARD_WIDGETS, WIDGET_METADATA } from '@/lib/types';
import { depreciationCategoryLabels, depreciationCategoryColors, COLORS } from './constants';
import { 
  Plus, UserPlus, ClipboardList, PlusCircle, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Minus, PiggyBank, Percent, Shield, 
  Settings2, X, Info, Lightbulb, AlertCircle, AlertTriangle, CheckCircle,
  RotateCcw, Gauge, Scale
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, ComposedChart
} from 'recharts';

// Trend Arrow Component
function TrendArrow({ value, invertColors = false }: { value: number; invertColors?: boolean }) {
  if (Math.abs(value) < 1) {
    return <Minus className="h-4 w-4 text-gray-400" />;
  }
  const isPositive = value > 0;
  const colorClass = invertColors 
    ? (isPositive ? 'text-red-500' : 'text-emerald-500')
    : (isPositive ? 'text-emerald-500' : 'text-red-500');
  return isPositive 
    ? <ArrowUpRight className={`h-4 w-4 ${colorClass}`} />
    : <ArrowDownRight className={`h-4 w-4 ${colorClass}`} />;
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
    <div className="relative w-32 h-16 mx-auto">
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

interface DashboardSectionProps {
  stats: any;
  isMobile?: boolean;
  setActiveTab: (tab: string) => void;
}

function DashboardSection({ stats, isMobile, setActiveTab }: DashboardSectionProps) {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'city' | 'size50' | 'size80' | 'size80plus'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [timeFilterType, setTimeFilterType] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [forecastYears, setForecastYears] = useState(10);
  
  // Widget Configuration State
  const [widgetConfig, setWidgetConfig] = useState<DashboardWidget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bucki-dashboard-config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_DASHBOARD_WIDGETS;
        }
      }
    }
    return DEFAULT_DASHBOARD_WIDGETS;
  });
  const [editMode, setEditMode] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  // Save widget config to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bucki-dashboard-config', JSON.stringify(widgetConfig));
    }
  }, [widgetConfig]);
  
  // Widget visibility helper
  const isWidgetVisible = useCallback((widgetId: DashboardWidgetType) => {
    const widget = widgetConfig.find(w => w.id === widgetId);
    return widget?.visible ?? true;
  }, [widgetConfig]);
  
  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: DashboardWidgetType) => {
    setWidgetConfig(prev => prev.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
  }, []);
  
  // Move widget up/down
  const moveWidget = useCallback((widgetId: DashboardWidgetType, direction: 'up' | 'down') => {
    setWidgetConfig(prev => {
      const index = prev.findIndex(w => w.id === widgetId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newConfig = [...prev];
      [newConfig[index], newConfig[newIndex]] = [newConfig[newIndex], newConfig[index]];
      return newConfig.map((w, i) => ({ ...w, order: i }));
    });
  }, []);
  
  // Reset to default
  const resetToDefault = useCallback(() => {
    setWidgetConfig(DEFAULT_DASHBOARD_WIDGETS);
    setConfigDialogOpen(false);
  }, []);
  
  // Enhanced KPI Calculations
  const enhancedKPIs = useMemo(() => {
    const totalMarketValue = stats.totalEstimatedValue || stats.totalMarketValue || 0;
    const totalDebt = stats.totalRemainingDebt || 0;
    const equity = totalMarketValue - totalDebt;
    const coldRentIncome = stats.coldRentIncome || 0;
    const cashflow = stats.cashflow || 0;
    
    // ROE (Eigenkapitalrendite) - annualized
    const roe = equity > 0 ? ((cashflow * 12) / equity) * 100 : 0;
    
    // LTV (Loan-to-Value)
    const ltv = totalMarketValue > 0 ? (totalDebt / totalMarketValue) * 100 : 0;
    
    // Tilgung vs. Zins
    const monthlyMortgagePayment = store.financings.reduce((sum: number, f: Financing) => {
      const interestAmount = f.remainingDebt * (f.interestRate / 100) / 12;
      const repayment = f.monthlyRate - interestAmount;
      return sum + Math.max(0, repayment);
    }, 0);
    
    const monthlyInterest = store.financings.reduce((sum: number, f: Financing) => {
      const interestAmount = f.remainingDebt * (f.interestRate / 100) / 12;
      return sum + interestAmount;
    }, 0);
    
    const totalMortgagePayment = monthlyMortgagePayment + monthlyInterest;
    const tilgungsAnteil = totalMortgagePayment > 0 ? (monthlyMortgagePayment / totalMortgagePayment) * 100 : 0;
    const zinsAnteil = totalMortgagePayment > 0 ? (monthlyInterest / totalMortgagePayment) * 100 : 0;
    
    // Mietrendite Brutto
    const totalPurchasePrice = store.properties.reduce((sum: number, p: Property) => sum + p.purchasePrice, 0);
    const bruttoMietrendite = totalPurchasePrice > 0 ? ((coldRentIncome * 12) / totalPurchasePrice) * 100 : 0;
    
    // Leerstandsquote
    const totalUnits = store.units.length;
    const vacantUnits = store.units.filter((u: Unit) => u.status === 'vacant').length;
    const leerstandsquote = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0;
    
    // Kostenquote
    const totalIncome = stats.totalRentIncome || 0;
    const monthlyExpenses = stats.totalExpenses || 0;
    const kostenquote = totalIncome > 0 ? (monthlyExpenses / totalIncome) * 100 : 0;
    
    // Cash-on-Cash Return
    const cashOnCashReturn = equity > 0 ? ((cashflow * 12) / equity) * 100 : 0;
    
    // Break-even in Monaten
    const breakEvenMonate = cashflow > 0 ? Math.ceil(totalPurchasePrice / (cashflow * 12)) : 0;
    
    return {
      roe,
      ltv,
      netWorth: equity,
      tilgungsAnteil,
      zinsAnteil,
      monthlyMortgagePayment,
      monthlyInterest,
      bruttoMietrendite,
      leerstandsquote,
      kostenquote,
      cashOnCashReturn,
      breakEvenMonate,
      vacantUnits,
      totalUnits,
      cashflow
    };
  }, [stats, store.properties, store.units, store.financings]);

  // Health Score Calculation
  const healthScore = useMemo((): { overall: number; categories: Record<string, number>; recommendations: HealthRecommendation[] } => {
    let financialScore = 100;
    let occupancyScore = 100;
    let maintenanceScore = 100;
    let documentationScore = 100;
    const recommendations: HealthRecommendation[] = [];
    
    // Financial Health
    if (enhancedKPIs.cashflow < 0) {
      financialScore -= 30;
      recommendations.push({
        id: 'neg-cashflow',
        type: 'critical',
        title: 'Negativer Cashflow',
        description: 'Ihre Ausgaben übersteigen die Einnahmen. Prüfen Sie die Kostenstruktur.',
      });
    }
    
    if (enhancedKPIs.ltv > 80) {
      financialScore -= 20;
      recommendations.push({
        id: 'high-ltv',
        type: 'warning',
        title: 'Hohe Verschuldung (LTV > 80%)',
        description: 'Die Loan-to-Value Ratio ist hoch. Erwägen Sie zusätzliche Tilgung.',
      });
    }
    
    // Occupancy Health
    if (enhancedKPIs.leerstandsquote > 20) {
      occupancyScore -= 40;
      recommendations.push({
        id: 'high-vacancy',
        type: 'critical',
        title: 'Hohe Leerstandsquote',
        description: `${enhancedKPIs.vacantUnits} von ${enhancedKPIs.totalUnits} Einheiten stehen leer.`,
      });
    }
    
    const overall = Math.round((financialScore + occupancyScore + maintenanceScore + documentationScore) / 4);
    
    return {
      overall,
      categories: {
        financial: financialScore,
        occupancy: occupancyScore,
        maintenance: maintenanceScore,
        documentation: documentationScore,
      },
      recommendations: recommendations.slice(0, 5),
    };
  }, [enhancedKPIs]);
  
  // Durchschnittsmiete pro m²
  const avgRentPerSqm = useMemo(() => {
    const rentedUnits = store.units.filter((u: Unit) => u.status === 'rented' && u.area > 0);
    if (rentedUnits.length === 0) return 0;
    const totalRent = rentedUnits.reduce((sum: number, u: Unit) => sum + u.totalRent, 0);
    const totalArea = rentedUnits.reduce((sum: number, u: Unit) => sum + u.area, 0);
    return totalArea > 0 ? totalRent / totalArea : 0;
  }, [store.units]);

  return (
    <div className="space-y-6">
      {/* Header with Time Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Willkommen bei Bucki</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={editMode ? "default" : "outline"} 
            size="sm" 
            onClick={() => setEditMode(!editMode)}
            className={editMode ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            <Settings2 className="h-4 w-4 mr-1" />
            {editMode ? 'Fertig' : 'Anpassen'}
          </Button>
          <Select value={timeFilterType} onValueChange={(v: any) => setTimeFilterType(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{t.dashboard.timeFilter.month}</SelectItem>
              <SelectItem value="quarter">{t.dashboard.timeFilter.quarter}</SelectItem>
              <SelectItem value="year">{t.dashboard.timeFilter.year}</SelectItem>
              <SelectItem value="all">Alle Zeit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Bearbeitungsmodus: Klicken Sie auf das X-Symbol, um Elemente auszublenden.
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setConfigDialogOpen(true)}>
                <Settings2 className="h-4 w-4 mr-1" />
                Alle Widgets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Widget */}
      {isWidgetVisible('quickActions') && (
        <div className={`relative ${editMode ? 'ring-2 ring-dashed ring-blue-300 rounded-lg p-2' : ''}`}>
          {editMode && (
            <div className="absolute -top-2 -right-2 z-10">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => toggleWidget('quickActions')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-2" onClick={() => setActiveTab('finances')}>
              <Plus className="h-5 w-5 text-emerald-600" />
              <span className="text-xs">{t.dashboard.newBooking}</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-2" onClick={() => setActiveTab('tenants')}>
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span className="text-xs">{t.dashboard.newTenant}</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-2" onClick={() => setActiveTab('tasks')}>
              <ClipboardList className="h-5 w-5 text-orange-600" />
              <span className="text-xs">{t.dashboard.newTask}</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-2" onClick={() => setActiveTab('properties')}>
              <PlusCircle className="h-5 w-5 text-purple-600" />
              <span className="text-xs">{t.dashboard.newProperty}</span>
            </Button>
          </div>
        </div>
      )}

      {/* TOP-KPIs Row Widget */}
      {isWidgetVisible('topKpis') && (
        <div className={`relative ${editMode ? 'ring-2 ring-dashed ring-blue-300 rounded-lg p-2' : ''}`}>
          {editMode && (
            <div className="absolute -top-2 -right-2 z-10">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => toggleWidget('topKpis')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Cashflow (monatlich)</CardTitle>
                  <TrendArrow value={stats.cashflowChange || 0} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.cashflow >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'}`}>
                  {formatCurrency(stats.cashflow)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Nettovermögen</CardTitle>
                <PiggyBank className="h-4 w-4 text-purple-500 absolute right-4 top-3" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(enhancedKPIs.netWorth)}</div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Marktwert - Schulden</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Eigenkapitalrendite</CardTitle>
                  <Percent className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{enhancedKPIs.roe.toFixed(2)}%</div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">ROE (annualisiert)</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Gesamtmiete (warm)</CardTitle>
                  <TrendArrow value={stats.incomeChange || 0} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(stats.totalRentIncome)}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* KPI Row Widget */}
      {isWidgetVisible('kpiRow') && (
        <div className={`relative ${editMode ? 'ring-2 ring-dashed ring-blue-300 rounded-lg p-2' : ''}`}>
          {editMode && (
            <div className="absolute -top-2 -right-2 z-10">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => toggleWidget('kpiRow')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Ausgaben gesamt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalExpenses)}</div>
                <p className="text-xs text-gray-500 mt-1">monatlich</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Restschulden</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalRemainingDebt)}</div>
                <p className="text-xs text-gray-500 mt-1">ausstehende Kreditsumme</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">LTV (Loan-to-Value)</CardTitle>
              </CardHeader>
              <CardContent>
                <LTVGauge ltv={enhancedKPIs.ltv} />
                <p className="text-xs text-gray-500 text-center mt-2">Verschuldungsgrad</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Leerstand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{enhancedKPIs.leerstandsquote.toFixed(1)}%</div>
                <div className="mt-2">
                  <Progress value={100 - enhancedKPIs.leerstandsquote} className="h-2" />
                </div>
                <div className="flex justify-between text-sm mt-2 text-gray-500">
                  <span>{enhancedKPIs.totalUnits - enhancedKPIs.vacantUnits} vermietet</span>
                  <span>{enhancedKPIs.vacantUnits} leer</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Health Score Widget */}
      {isWidgetVisible('healthScore') && (
        <div className={`relative ${editMode ? 'ring-2 ring-dashed ring-blue-300 rounded-lg p-2' : ''}`}>
          {editMode && (
            <div className="absolute -top-2 -right-2 z-10">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => toggleWidget('healthScore')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Rendite-Kennzahlen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bruttomietrendite</span>
                  <span className="font-bold text-emerald-600">{enhancedKPIs.bruttoMietrendite.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cash-on-Cash Return</span>
                  <span className="font-bold text-purple-600">{enhancedKPIs.cashOnCashReturn.toFixed(2)}%</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ø Miete/m²</span>
                  <span className="font-bold">{formatCurrency(avgRentPerSqm)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Zins vs. Tilgung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center">
                    <Badge className="bg-emerald-100 text-emerald-800">Tilgung</Badge>
                    <div className="text-sm font-bold mt-1">{formatCurrency(enhancedKPIs.monthlyMortgagePayment)}</div>
                    <div className="text-xs text-gray-500">{enhancedKPIs.tilgungsAnteil.toFixed(1)}%</div>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-amber-100 text-amber-800">Zins</Badge>
                    <div className="text-sm font-bold mt-1">{formatCurrency(enhancedKPIs.monthlyInterest)}</div>
                    <div className="text-xs text-gray-500">{enhancedKPIs.zinsAnteil.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className={`text-5xl font-bold ${
                    healthScore.overall >= 80 ? 'text-emerald-600' :
                    healthScore.overall >= 60 ? 'text-amber-600' :
                    healthScore.overall >= 40 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {healthScore.overall}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">von 100 Punkten</p>
                </div>
                <div className="space-y-2">
                  {Object.entries(healthScore.categories).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-24 capitalize">{key === 'financial' ? 'Finanzen' : key === 'occupancy' ? 'Belegung' : key === 'maintenance' ? 'Wartung' : 'Doku'}</span>
                      <Progress value={value} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-8">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Recommendations */}
          {healthScore.recommendations.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Handlungsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {healthScore.recommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`p-3 rounded-lg border ${
                        rec.type === 'critical' ? 'border-red-300 bg-red-50 dark:bg-red-950' :
                        rec.type === 'warning' ? 'border-amber-300 bg-amber-50 dark:bg-amber-950' :
                        'border-blue-300 bg-blue-50 dark:bg-blue-950'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {rec.type === 'critical' && <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                        {rec.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />}
                        {rec.type === 'info' && <Info className="h-4 w-4 text-blue-500 mt-0.5" />}
                        <div>
                          <p className="font-medium text-sm">{rec.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Widget Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dashboard anpassen</DialogTitle>
            <DialogDescription>Wählen Sie aus, welche Elemente auf dem Dashboard angezeigt werden sollen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {widgetConfig.sort((a, b) => a.order - b.order).map((widget) => {
                const meta = WIDGET_METADATA[widget.id];
                return (
                  <div key={widget.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1">
                      <p className="font-medium">{meta?.name || widget.id}</p>
                      <p className="text-xs text-muted-foreground">{meta?.description || ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveWidget(widget.id, 'up')}
                        disabled={widget.order === 0}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveWidget(widget.id, 'down')}
                        disabled={widget.order === widgetConfig.length - 1}
                      >
                        <TrendingDown className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={widget.visible}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={resetToDefault}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Standard
            </Button>
            <Button onClick={() => setConfigDialogOpen(false)}>Fertig</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DashboardSection;
