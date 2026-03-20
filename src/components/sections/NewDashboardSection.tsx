'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, DoorOpen, DollarSign, TrendingUp, TrendingDown, 
  CreditCard, PieChart, BarChart2, LineChart, Activity,
  Home, MapPin, Users, Wallet, PiggyBank, Percent, ArrowUpRight,
  ArrowDownRight, Minus, Zap, FileText, Calculator, Receipt,
  Landmark, Clock, Scale, Briefcase, Shield, AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart as RechartsLine, Line,
  Legend, AreaChart, Area, ComposedChart, ReferenceLine
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface DashboardSectionProps {
  stats: {
    totalRentIncome: number;
    totalExpenses: number;
    cashflow: number;
    totalEstimatedValue: number;
    totalRemainingDebt: number;
    coldRentIncome: number;
    totalMarketValue: number;
  };
}

export default function DashboardSection({ stats }: DashboardSectionProps) {
  const store = useStore();
  const { formatCurrency } = useI18n();

  // Calculate all metrics
  const metrics = useMemo(() => {
    const totalUnits = store.units.length;
    const rentedUnits = store.units.filter(u => u.status === 'rented').length;
    const coldRent = store.units.filter(u => u.status === 'rented').reduce((sum, u) => sum + u.baseRent, 0);
    const totalMarketValue = store.properties.reduce((sum, p) => sum + (p.estimatedValue || p.marketValue), 0);
    const totalDebt = store.financings.reduce((sum, f) => sum + f.remainingDebt, 0);
    const equity = totalMarketValue - totalDebt;
    const ltv = totalMarketValue > 0 ? (totalDebt / totalMarketValue) * 100 : 0;
    const income = stats.totalRentIncome || 0;
    const expenses = stats.totalExpenses || 0;
    const cashflow = income - expenses;
    
    // Average ROI
    const totalPurchase = store.properties.reduce((sum, p) => sum + p.purchasePrice, 0);
    const avgRoi = totalPurchase > 0 ? ((coldRent * 12) / totalPurchase) * 100 : 0;
    
    // Average energy rating
    const energyClasses = store.properties.map(p => p.energyClass).filter(e => e !== 'unknown');
    const energyMap: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8 };
    const avgEnergy = energyClasses.length > 0 
      ? energyClasses.reduce((sum, e) => sum + (energyMap[e] || 5), 0) / energyClasses.length 
      : 5;
    const avgEnergyLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][Math.round(avgEnergy) - 1] || 'E';

    return {
      totalUnits,
      rentedUnits,
      coldRent,
      totalMarketValue,
      totalDebt,
      equity,
      ltv,
      income,
      expenses,
      cashflow,
      avgRoi,
      avgEnergyLetter,
      avgEnergyValue: Math.round(avgEnergy * 10) / 10
    };
  }, [store.units, store.properties, store.financings, stats]);

  // Interest vs Principal
  const interestVsPrincipal = useMemo(() => {
    let totalInterest = 0;
    let totalPrincipal = 0;
    
    store.financings.forEach(f => {
      const interest = f.remainingDebt * (f.interestRate / 100) / 12;
      const principal = f.monthlyRate - interest;
      totalInterest += interest;
      totalPrincipal += Math.max(0, principal);
    });
    
    return [
      { name: 'Zins', value: totalInterest, color: '#ef4444' },
      { name: 'Tilgung', value: totalPrincipal, color: '#10b981' }
    ];
  }, [store.financings]);

  // Portfolio by City
  const portfolioByCity = useMemo(() => {
    const cityMap: Record<string, { value: number; count: number }> = {};
    store.properties.forEach(p => {
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
      color: COLORS[index % COLORS.length]
    }));
  }, [store.properties]);

  // Top ROI Properties
  const topRoiProperties = useMemo(() => {
    return store.properties.map(p => {
      const units = store.units.filter(u => u.propertyId === p.id);
      const coldRent = units.filter(u => u.status === 'rented').reduce((sum, u) => sum + u.baseRent, 0);
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

  // Value Appreciation
  const valueAppreciation = useMemo(() => {
    return store.properties.map(p => {
      const appreciation = p.estimatedValue > 0 ? p.estimatedValue - p.purchasePrice : p.marketValue - p.purchasePrice;
      const appreciationPercent = p.purchasePrice > 0 ? (appreciation / p.purchasePrice) * 100 : 0;
      return {
        name: p.name,
        purchasePrice: p.purchasePrice,
        currentValue: p.estimatedValue || p.marketValue,
        appreciation,
        appreciationPercent
      };
    }).sort((a, b) => b.appreciationPercent - a.appreciationPercent);
  }, [store.properties]);

  // Monthly Cashflow Data
  const monthlyCashflow = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthTransactions = store.transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      return { month, income, expenses, cashflow: income - expenses };
    });
  }, [store.transactions]);

  // Expense Breakdown
  const expenseBreakdown = useMemo(() => {
    const categories: Record<string, number> = {
      'Uml. Nebenkosten': 0,
      'Nicht uml. NK': 0,
      'Zins': 0,
      'Tilgung': 0
    };
    
    // Calculate from financings
    store.financings.forEach(f => {
      const interest = f.remainingDebt * (f.interestRate / 100) / 12;
      const principal = f.monthlyRate - interest;
      categories['Zins'] += interest;
      categories['Tilgung'] += Math.max(0, principal);
    });
    
    // Calculate from transactions
    store.transactions.filter(t => t.type === 'expense').forEach(t => {
      if (t.category === 'utilities') {
        categories['Uml. Nebenkosten'] += t.amount;
      } else if (t.category === 'management' || t.category === 'repairs') {
        categories['Nicht uml. NK'] += t.amount;
      }
    });
    
    return Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'][index]
    }));
  }, [store.financings, store.transactions]);

  // Banks & Loans
  const bankLoans = useMemo(() => {
    return store.financings.map(f => {
      const property = store.properties.find(p => p.id === f.propertyId);
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

  // Kautionen
  const deposits = useMemo(() => {
    return store.tenants.map(t => {
      const unit = store.units.find(u => u.id === t.unitId);
      const property = store.properties.find(p => p.id === unit?.propertyId);
      return {
        tenant: `${t.firstName} ${t.lastName}`,
        property: property?.name || 'Unbekannt',
        deposit: t.deposit || 0
      };
    }).filter(d => d.deposit > 0);
  }, [store.tenants, store.units, store.properties]);

  // Format helpers
  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* TOP METRICS - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Column 1: Wohneinheiten, Kaltmiete, Rendite */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <DoorOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Wohneinheiten</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{metrics.rentedUnits}/{metrics.totalUnits}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">vermietet</div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Kaltmiete</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(metrics.coldRent)}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">monatlich</div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Ø Rendite</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{metrics.avgRoi.toFixed(2)}%</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Brutto-Mietrendite</div>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Schätzwert, Restschuld, LTV */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Schätzwert</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(metrics.totalMarketValue)}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">aktuell</div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Restschuld</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalDebt)}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">offen</div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Percent className="h-4 w-4" />
                <span className="text-sm font-medium">LTV</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{metrics.ltv.toFixed(1)}%</div>
              <Progress value={metrics.ltv} className="h-2 mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Einnahmen, Ausgaben, Cashflow */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">Einnahmen</span>
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(metrics.income)}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">monatlich</div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-sm font-medium">Ausgaben</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.expenses)}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">monatlich</div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Cashflow</span>
              </div>
              <div className={`text-2xl font-bold ${metrics.cashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.cashflow)}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">monatlich</div>
            </div>
          </CardContent>
        </Card>

        {/* Column 4: Energiewert */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Ø Energiewert</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${
                metrics.avgEnergyLetter <= 'C' ? 'text-green-600' :
                metrics.avgEnergyLetter <= 'E' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.avgEnergyLetter}
              </div>
              <div className="flex-1">
                <div className="text-sm text-amber-700 dark:text-amber-300">Durchschnitt</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {store.properties.filter(p => p.energyClass !== 'unknown').length} von {store.properties.length} Immobilien
                </div>
                <div className="flex gap-1 mt-2">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
                    <div 
                      key={letter}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        letter === metrics.avgEnergyLetter 
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

      {/* CHARTS SECTION - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zins vs Tilgung */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Zins vs. Tilgung
            </CardTitle>
            <CardDescription>Monatliche Aufteilung</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={interestVsPrincipal}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {interestVsPrincipal.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio by City */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Portfolio nach Städten
            </CardTitle>
            <CardDescription>Verteilung nach Standort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={portfolioByCity}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {portfolioByCity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cashflow Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-purple-600" />
              Cashflow Übersicht
            </CardTitle>
            <CardDescription>Monatlicher Verlauf</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyCashflow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="income" fill="#10b981" name="Einnahmen" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Ausgaben" />
                  <Line type="monotone" dataKey="cashflow" stroke="#8b5cf6" strokeWidth={2} name="Cashflow" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-orange-600" />
              Ausgaben Aufteilung
            </CardTitle>
            <CardDescription>Monatliche Kostenstruktur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrencyShort(v)} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top ROI Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Beste Renditen
            </CardTitle>
            <CardDescription>Top 5 Immobilien nach Rendite</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topRoiProperties.map((p, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{p.roi.toFixed(2)}%</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(p.coldRent)}/Mo.</div>
                  </div>
                </div>
              ))}
              {topRoiProperties.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">Keine Immobilien vorhanden</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Value Appreciation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Wertsteigerung seit Kauf
            </CardTitle>
            <CardDescription>Größte Wertsteigerungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {valueAppreciation.slice(0, 5).map((p, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(p.purchasePrice)} → {formatCurrency(p.currentValue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${p.appreciation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {p.appreciation >= 0 ? '+' : ''}{formatCurrency(p.appreciation)}
                    </div>
                    <div className={`text-sm ${p.appreciationPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {p.appreciationPercent >= 0 ? '+' : ''}{p.appreciationPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
              {valueAppreciation.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">Keine Immobilien vorhanden</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Banks & Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-purple-600" />
              Banken & Kredite
            </CardTitle>
            <CardDescription>Übersicht aller Finanzierungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bankLoans.map((loan, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <div className="font-medium">{loan.bank}</div>
                    <div className="text-sm text-muted-foreground">{loan.property}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">{formatCurrency(loan.remaining)}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(loan.rate)}/Mo. @ {loan.interest}%</div>
                  </div>
                </div>
              ))}
              {bankLoans.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">Keine Kredite vorhanden</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deposits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Kautionen
            </CardTitle>
            <CardDescription>Hinterlegte Sicherheitsleistungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deposits.slice(0, 5).map((d, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <div className="font-medium">{d.tenant}</div>
                    <div className="text-sm text-muted-foreground">{d.property}</div>
                  </div>
                  <div className="font-bold text-amber-600">{formatCurrency(d.deposit)}</div>
                </div>
              ))}
              {deposits.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">Keine Kautionen hinterlegt</div>
              )}
              {deposits.length > 0 && (
                <div className="pt-2 border-t flex justify-between font-medium">
                  <span>Gesamt</span>
                  <span className="text-amber-600">{formatCurrency(deposits.reduce((sum, d) => sum + d.deposit, 0))}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Calculator className="h-5 w-5 mx-auto text-blue-600 mb-2" />
            <div className="text-sm text-muted-foreground">Abschreibungen</div>
            <div className="text-lg font-bold">{formatCurrency(store.depreciationItems.reduce((sum, i) => sum + i.monthlyDepreciation, 0))}</div>
            <div className="text-xs text-muted-foreground">monatlich</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Receipt className="h-5 w-5 mx-auto text-red-600 mb-2" />
            <div className="text-sm text-muted-foreground">Steuern</div>
            <div className="text-lg font-bold">{formatCurrency(store.transactions.filter(t => t.category === 'taxes').reduce((sum, t) => sum + t.amount, 0))}</div>
            <div className="text-xs text-muted-foreground">dieses Jahr</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Home className="h-5 w-5 mx-auto text-emerald-600 mb-2" />
            <div className="text-sm text-muted-foreground">Hausgelder</div>
            <div className="text-lg font-bold">{formatCurrency(store.transactions.filter(t => t.category === 'management').reduce((sum, t) => sum + t.amount, 0))}</div>
            <div className="text-xs text-muted-foreground">dieses Jahr</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Briefcase className="h-5 w-5 mx-auto text-purple-600 mb-2" />
            <div className="text-sm text-muted-foreground">Investitionen</div>
            <div className="text-lg font-bold">{formatCurrency(store.transactions.filter(t => t.category === 'repairs' && t.description?.toLowerCase().includes('invest')).reduce((sum, t) => sum + t.amount, 0))}</div>
            <div className="text-xs text-muted-foreground">dieses Jahr</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <PiggyBank className="h-5 w-5 mx-auto text-amber-600 mb-2" />
            <div className="text-sm text-muted-foreground">Rücklagen</div>
            <div className="text-lg font-bold">{formatCurrency(store.transactions.filter(t => t.category === 'reserves').reduce((sum, t) => sum + t.amount, 0))}</div>
            <div className="text-xs text-muted-foreground">angespart</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Scale className="h-5 w-5 mx-auto text-teal-600 mb-2" />
            <div className="text-sm text-muted-foreground">Eigenkapital</div>
            <div className="text-lg font-bold text-emerald-600">{formatCurrency(metrics.equity)}</div>
            <div className="text-xs text-muted-foreground">Nettovermögen</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Simple separator component
function Separator() {
  return <div className="border-t border-gray-200 dark:border-gray-700" />;
}
