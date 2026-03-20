'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import type { Financing, Property } from '@/lib/types';
import { 
  Plus, Edit2, Trash2, CreditCard, TrendingDown, TrendingUp, Building2, 
  Landmark, Upload, Download, AlertTriangle, CheckCircle, Clock, Percent,
  Wallet, PieChart, LineChart
} from 'lucide-react';
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const CHART_COLORS = {
  interest: '#ef4444',
  principal: '#10b981',
  debt: '#3b82f6',
  equity: '#10b981',
};

// LTV Gauge Component
function LTVGauge({ ltv, size = 'lg' }: { ltv: number; size?: 'sm' | 'lg' }) {
  const getColor = (ltv: number) => {
    if (ltv <= 60) return '#10b981';
    if (ltv <= 75) return '#f59e0b';
    if (ltv <= 85) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(ltv);
  const dimensions = size === 'lg' ? { width: 'w-40', height: 'h-20', viewBox: '0 0 100 50' } : { width: 'w-24', height: 'h-12', viewBox: '0 0 100 50' };
  
  return (
    <div className={`relative ${dimensions.width} ${dimensions.height} mx-auto`}>
      <svg viewBox={dimensions.viewBox} className="w-full h-full">
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
        <span className={`${size === 'lg' ? 'text-2xl' : 'text-lg'} font-bold`} style={{ color }}>{ltv.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function FinancingSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFinancing, setEditingFinancing] = useState<Financing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    propertyId: '',
    bankName: '',
    loanNumber: '',
    principalAmount: 0,
    interestRate: 0,
    repaymentRate: 0,
    monthlyRate: 0,
    remainingDebt: 0,
    startDate: '',
    endDate: '',
    fixedInterestUntil: '',
    notes: '',
  });

  // ============================================
  // BERECHNUNGEN
  // ============================================
  
  const totalDebt = store.financings.reduce((sum, f) => sum + f.remainingDebt, 0);
  const totalMonthlyPayment = store.financings.reduce((sum, f) => sum + f.monthlyRate, 0);
  const totalPrincipal = store.financings.reduce((sum, f) => sum + f.principalAmount, 0);
  const totalPaid = totalPrincipal - totalDebt;
  
  // Eindeutige Banken
  const uniqueBanks = useMemo(() => {
    const banks = new Set(store.financings.map(f => f.bankName));
    return Array.from(banks);
  }, [store.financings]);
  
  // Gesamtportfolio Wert
  const totalPropertyValue = store.properties.reduce((sum, p: Property) => sum + (p.estimatedValue || p.marketValue), 0);
  const portfolioLTV = totalPropertyValue > 0 ? (totalDebt / totalPropertyValue) * 100 : 0;
  
  // Zins vs Tilgung
  const interestVsPrincipal = useMemo(() => {
    let totalInterest = 0;
    let totalPrincipal = 0;
    
    store.financings.forEach((f: Financing) => {
      const interest = f.remainingDebt * (f.interestRate / 100) / 12;
      const principal = f.monthlyRate - interest;
      totalInterest += interest;
      totalPrincipal += Math.max(0, principal);
    });
    
    return [
      { name: 'Tilgung', value: totalPrincipal, color: CHART_COLORS.principal },
      { name: 'Zins', value: totalInterest, color: CHART_COLORS.interest }
    ];
  }, [store.financings]);
  
  // Schuldentwicklung (10 Jahre Prognose)
  const debtDevelopment = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const data = [];
    let remainingDebt = totalDebt;
    const yearlyPrincipal = interestVsPrincipal[0].value * 12;
    
    for (let i = 0; i <= 10; i++) {
      const equity = totalPropertyValue - remainingDebt;
      data.push({
        year: currentYear + i,
        schuld: Math.max(0, Math.round(remainingDebt)),
        eigenkapital: Math.max(0, Math.round(equity)),
      });
      remainingDebt -= yearlyPrincipal;
    }
    
    return data;
  }, [totalDebt, interestVsPrincipal, totalPropertyValue]);
  
  // Banken mit Krediten
  const banksWithLoans = useMemo(() => {
    const bankMap: Record<string, { loans: Financing[]; totalDebt: number; totalMonthly: number }> = {};
    
    store.financings.forEach((f: Financing) => {
      if (!bankMap[f.bankName]) {
        bankMap[f.bankName] = { loans: [], totalDebt: 0, totalMonthly: 0 };
      }
      bankMap[f.bankName].loans.push(f);
      bankMap[f.bankName].totalDebt += f.remainingDebt;
      bankMap[f.bankName].totalMonthly += f.monthlyRate;
    });
    
    return Object.entries(bankMap).map(([bank, data]) => ({
      name: bank,
      ...data
    }));
  }, [store.financings]);
  
  // Immobilien mit Finanzierung
  const propertiesWithFinancing = useMemo(() => {
    return store.properties.map((p: Property) => {
      const loans = store.financings.filter((f: Financing) => f.propertyId === p.id);
      const propertyDebt = loans.reduce((sum: number, f: Financing) => sum + f.remainingDebt, 0);
      const propertyValue = p.estimatedValue || p.marketValue;
      const ltv = propertyValue > 0 ? (propertyDebt / propertyValue) * 100 : 0;
      
      return {
        property: p,
        loans,
        propertyDebt,
        propertyValue,
        ltv
      };
    }).filter(p => p.loans.length > 0);
  }, [store.properties, store.financings]);

  const openNewDialog = () => {
    setEditingFinancing(null);
    setFormData({
      propertyId: store.properties[0]?.id || '',
      bankName: '',
      loanNumber: '',
      principalAmount: 0,
      interestRate: 3.5,
      repaymentRate: 2.0,
      monthlyRate: 0,
      remainingDebt: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      fixedInterestUntil: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (financing: Financing) => {
    setEditingFinancing(financing);
    setFormData({
      propertyId: financing.propertyId,
      bankName: financing.bankName,
      loanNumber: financing.loanNumber,
      principalAmount: financing.principalAmount,
      interestRate: financing.interestRate,
      repaymentRate: financing.repaymentRate,
      monthlyRate: financing.monthlyRate,
      remainingDebt: financing.remainingDebt,
      startDate: financing.startDate,
      endDate: financing.endDate,
      fixedInterestUntil: financing.fixedInterestUntil || '',
      notes: financing.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.bankName || !formData.propertyId) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingFinancing) {
      store.updateFinancing(editingFinancing.id, formData);
      toast.success('Finanzierung aktualisiert');
    } else {
      store.addFinancing(formData);
      toast.success('Finanzierung hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      store.deleteFinancing(deletingId);
      toast.success('Finanzierung gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || 'Unbekannt';
  };

  // Mock Import Handler
  const handleImportKontoauszug = () => {
    toast.info('Kontoauszug-Import wird in Kürze verfügbar sein');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-emerald-600" />
            Finanzierungen
          </h1>
          <p className="text-muted-foreground mt-1">
            {uniqueBanks.length} Banken • {store.financings.length} Kredite
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportKontoauszug}>
            <Upload className="h-4 w-4 mr-2" /> Kontoauszug
          </Button>
          <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Neue Finanzierung
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Banken */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                  <Landmark className="h-4 w-4" />
                  <span className="text-sm font-medium">Banken</span>
                </div>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {uniqueBanks.length}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                <Landmark className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offene Kredite */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">Offene Kredite</span>
                </div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {store.financings.length}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restschuld */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">Restschuld</span>
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(totalDebt)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio LTV */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Percent className="h-4 w-4" />
                  <span className="text-sm font-medium">Portfolio LTV</span>
                </div>
                <LTVGauge ltv={portfolioLTV} size="sm" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="banks">Banken</TabsTrigger>
          <TabsTrigger value="properties">Immobilien</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Getilgt</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalPrincipal > 0 ? ((totalPaid / totalPrincipal) * 100).toFixed(1) : 0}% der Kreditsumme
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Monatliche Rate</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalMonthlyPayment)}</p>
                  <p className="text-xs text-muted-foreground mt-1">alle Kredite</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Ø Zinssatz</p>
                  <p className="text-2xl font-bold">
                    {store.financings.length > 0 
                      ? (store.financings.reduce((sum, f) => sum + f.interestRate, 0) / store.financings.length).toFixed(2)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">gewichtet</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.financings.map((financing) => {
              const progress = financing.principalAmount > 0 
                ? ((financing.principalAmount - financing.remainingDebt) / financing.principalAmount) * 100 
                : 0;
              
              return (
                <Card key={financing.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{financing.bankName}</CardTitle>
                        <CardDescription>{getPropertyName(financing.propertyId)}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {financing.loanNumber || 'Kredit'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Kreditsumme</span>
                        <span className="font-medium">{formatCurrency(financing.principalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Restschuld</span>
                        <span className="font-medium text-red-600">{formatCurrency(financing.remainingDebt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Zinssatz</span>
                        <span className="font-medium">{financing.interestRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Monatliche Rate</span>
                        <span className="font-medium">{formatCurrency(financing.monthlyRate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">{progress.toFixed(1)}% getilgt</p>
                      <Separator />
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openEditDialog(financing)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" /> Bearbeiten
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => {
                            setDeletingId(financing.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Banks Tab */}
        <TabsContent value="banks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banksWithLoans.map((bank, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Landmark className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bank.name}</CardTitle>
                      <CardDescription>{bank.loans.length} Kredit{bank.loans.length !== 1 ? 'e' : ''}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Restschuld</span>
                      <span className="font-medium text-red-600">{formatCurrency(bank.totalDebt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monatliche Rate</span>
                      <span className="font-medium">{formatCurrency(bank.totalMonthly)}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      {bank.loans.map((loan, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{getPropertyName(loan.propertyId)}</span>
                          <span className="font-medium">{formatCurrency(loan.remainingDebt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {banksWithLoans.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Landmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Banken</h3>
                <p className="text-muted-foreground">Fügen Sie eine Finanzierung hinzu</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {propertiesWithFinancing.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.property.name}</CardTitle>
                        <CardDescription>{item.property.address}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">LTV</p>
                      <LTVGauge ltv={item.ltv} size="sm" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Wert</p>
                      <p className="font-bold text-sm">{formatCurrency(item.propertyValue)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Schuld</p>
                      <p className="font-bold text-sm text-red-600">{formatCurrency(item.propertyDebt)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Eigenkapital</p>
                      <p className="font-bold text-sm text-emerald-600">{formatCurrency(item.propertyValue - item.propertyDebt)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Kredite ({item.loans.length})</p>
                    {item.loans.map((loan, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{loan.bankName}</span>
                          <span className="text-muted-foreground ml-2">@ {loan.interestRate}%</span>
                        </div>
                        <span className="font-medium">{formatCurrency(loan.remainingDebt)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {propertiesWithFinancing.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine finanzierten Immobilien</h3>
                <p className="text-muted-foreground">Verknüpfen Sie Immobilien mit Finanzierungen</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zins vs Tilgung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  Zins vs Tilgung
                </CardTitle>
                <CardDescription>Monatliche Aufteilung</CardDescription>
              </CardHeader>
              <CardContent>
                {totalMonthlyPayment > 0 ? (
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
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm text-muted-foreground">Tilgung</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm text-muted-foreground">Zins</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-600">{formatCurrency(interestVsPrincipal[0].value)}</div>
                        <div className="text-xs text-muted-foreground">Tilgung / Monat</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-500">{formatCurrency(interestVsPrincipal[1].value)}</div>
                        <div className="text-xs text-muted-foreground">Zins / Monat</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Keine Finanzierungen vorhanden</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schuldentwicklung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-emerald-500" />
                  Schuldentwicklung
                </CardTitle>
                <CardDescription>Prognose für 10 Jahre</CardDescription>
              </CardHeader>
              <CardContent>
                {totalDebt > 0 ? (
                  <>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={debtDevelopment}>
                          <defs>
                            <linearGradient id="colorSchuld" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.debt} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={CHART_COLORS.debt} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.equity} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={CHART_COLORS.equity} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="year" 
                            tick={{ fontSize: 11 }} 
                            tickFormatter={(value) => `'${String(value).slice(-2)}`}
                          />
                          <YAxis 
                            tick={{ fontSize: 11 }} 
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
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
                            fill="url(#colorEquity)" 
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
                    <p>Schuldenfrei!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {store.financings.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Finanzierungen</h3>
            <p className="text-muted-foreground mb-4">Fügen Sie Ihre erste Finanzierung hinzu</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neue Finanzierung
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Financing Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFinancing ? 'Finanzierung bearbeiten' : 'Neue Finanzierung'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Bankname *</Label>
              <Input 
                value={formData.bankName} 
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="z.B. Sparkasse"
              />
            </div>
            <div>
              <Label>Immobilie *</Label>
              <Select 
                value={formData.propertyId} 
                onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {store.properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kreditnummer</Label>
              <Input 
                value={formData.loanNumber} 
                onChange={(e) => setFormData({ ...formData, loanNumber: e.target.value })}
                placeholder="z.B. KD-12345"
              />
            </div>
            <div>
              <Label>Kreditsumme (€)</Label>
              <Input 
                type="number"
                value={formData.principalAmount} 
                onChange={(e) => setFormData({ ...formData, principalAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Restschuld (€)</Label>
              <Input 
                type="number"
                value={formData.remainingDebt} 
                onChange={(e) => setFormData({ ...formData, remainingDebt: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Zinssatz (%)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.interestRate} 
                onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Tilgungssatz (%)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.repaymentRate} 
                onChange={(e) => setFormData({ ...formData, repaymentRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Monatliche Rate (€)</Label>
              <Input 
                type="number"
                value={formData.monthlyRate} 
                onChange={(e) => setFormData({ ...formData, monthlyRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Startdatum</Label>
              <Input 
                type="date"
                value={formData.startDate} 
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Enddatum</Label>
              <Input 
                type="date"
                value={formData.endDate} 
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finanzierung löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Finanzierung wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default FinancingSection;
