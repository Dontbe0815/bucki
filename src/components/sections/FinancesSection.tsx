'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle 
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
import type { Transaction, TransactionType, TransactionCategory } from '@/lib/types';
import { categoryLabels } from './constants';
import { 
  Plus, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown, Wallet,
  PiggyBank, Receipt, FileSpreadsheet, ArrowUpRight, ArrowDownRight,
  Building2, Calendar, AlertTriangle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area,
  XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function FinancesSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
  const [activeTab, setActiveTab] = useState('transactions');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    type: 'income' as TransactionType,
    category: 'rent' as TransactionCategory,
    amount: 0,
    date: '',
    description: '',
    isRecurring: false,
    recurringInterval: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
  });

  // ============================================
  // BERECHNUNGEN
  // ============================================
  
  const filteredTransactions = store.transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterProperty !== 'all' && t.propertyId !== filterProperty) return false;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Hausgelder berechnen
  const houseMoneyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const managementCosts = store.transactions
      .filter(t => t.category === 'management' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0);
    const repairCosts = store.transactions
      .filter(t => t.category === 'repairs' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      managementCosts,
      repairCosts,
      total: managementCosts + repairCosts,
      byProperty: store.properties.map(p => {
        const propertyCosts = store.transactions
          .filter(t => t.propertyId === p.id && 
            (t.category === 'management' || t.category === 'repairs') &&
            new Date(t.date).getFullYear() === currentYear)
          .reduce((sum, t) => sum + t.amount, 0);
        return { property: p, costs: propertyCosts };
      }).filter(p => p.costs > 0)
    };
  }, [store.transactions, store.properties]);

  // Nebenkosten berechnen
  const utilityCostsData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const umlagefaehig = store.transactions
      .filter(t => t.category === 'utilities' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0);
    const nichtUmlagefaehig = store.transactions
      .filter(t => t.category === 'other' && t.type === 'expense' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Kategorien aufteilen
    const categories = [
      { name: 'Wasser', value: umlagefaehig * 0.15, color: COLORS[0] },
      { name: 'Heizung', value: umlagefaehig * 0.35, color: COLORS[1] },
      { name: 'Straßenreinigung', value: umlagefaehig * 0.10, color: COLORS[2] },
      { name: 'Müllabfuhr', value: umlagefaehig * 0.10, color: COLORS[3] },
      { name: 'Versicherung', value: umlagefaehig * 0.15, color: COLORS[4] },
      { name: 'Sonstige', value: umlagefaehig * 0.15, color: COLORS[5] },
    ];
    
    return { umlagefaehig, nichtUmlagefaehig, categories };
  }, [store.transactions]);

  // Rücklagen berechnen
  const reservesData = useMemo(() => {
    const reservesBalance = store.transactions
      .filter(t => t.category === 'reserves')
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    
    // Kategorien für Rücklagen
    const categories = [
      { name: 'Instandhaltung', value: reservesBalance * 0.4, target: reservesBalance * 0.4, color: COLORS[0] },
      { name: 'Modernisierung', value: reservesBalance * 0.25, target: reservesBalance * 0.25, color: COLORS[1] },
      { name: 'Mietausfall', value: reservesBalance * 0.20, target: reservesBalance * 0.20, color: COLORS[2] },
      { name: 'Sonstige', value: reservesBalance * 0.15, target: reservesBalance * 0.15, color: COLORS[3] },
    ];
    
    // Monatliche Sparquote
    const monthlySavings = store.transactions
      .filter(t => t.category === 'reserves' && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) / 12;
    
    return { reservesBalance, categories, monthlySavings };
  }, [store.transactions]);

  const openNewDialog = () => {
    setEditingTransaction(null);
    setFormData({
      propertyId: store.properties[0]?.id || '',
      unitId: '',
      type: 'income',
      category: 'rent',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      isRecurring: false,
      recurringInterval: 'monthly',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      propertyId: transaction.propertyId || '',
      unitId: transaction.unitId || '',
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
      isRecurring: transaction.isRecurring,
      recurringInterval: transaction.recurringInterval || 'monthly',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.amount || !formData.date) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingTransaction) {
      store.updateTransaction(editingTransaction.id, formData);
      toast.success('Transaktion aktualisiert');
    } else {
      store.addTransaction(formData);
      toast.success('Transaktion hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      store.deleteTransaction(deletingId);
      toast.success('Transaktion gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return '-';
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || 'Unbekannt';
  };

  const unitsForProperty = formData.propertyId 
    ? store.units.filter(u => u.propertyId === formData.propertyId)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-emerald-600" />
            Finanzen
          </h1>
          <p className="text-muted-foreground mt-1">
            Einnahmen, Ausgaben, Hausgelder, Nebenkosten & Rücklagen
          </p>
        </div>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Transaktion
        </Button>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Einnahmen</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalIncome)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Ausgaben</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalExpenses)}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Saldo</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                  {formatCurrency(totalIncome - totalExpenses)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Rücklagen</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(reservesData.reservesBalance)}</p>
              </div>
              <PiggyBank className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transaktionen</TabsTrigger>
          <TabsTrigger value="housemoney">Hausgelder</TabsTrigger>
          <TabsTrigger value="utilitycosts">Nebenkosten</TabsTrigger>
          <TabsTrigger value="reserves">Rücklagen</TabsTrigger>
        </TabsList>

        {/* Transaktionen Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="income">Einnahmen</SelectItem>
                <SelectItem value="expense">Ausgaben</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Immobilie filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Immobilien</SelectItem>
                {store.properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-muted-foreground">Datum</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Typ</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Kategorie</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Beschreibung</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Immobilie</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Betrag</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{formatDate(transaction.date)}</td>
                        <td className="p-4">
                          <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                            {transaction.type === 'income' ? 'Einnahme' : 'Ausgabe'}
                          </Badge>
                        </td>
                        <td className="p-4">{categoryLabels[transaction.category]}</td>
                        <td className="p-4">
                          {transaction.description}
                          {transaction.isRecurring && (
                            <Badge variant="outline" className="ml-2">Wiederkehrend</Badge>
                          )}
                        </td>
                        <td className="p-4">{getPropertyName(transaction.propertyId)}</td>
                        <td className={`p-4 text-right font-medium ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(transaction)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                setDeletingId(transaction.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTransactions.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  Keine Transaktionen gefunden
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hausgelder Tab */}
        <TabsContent value="housemoney" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verwaltung</p>
                    <p className="text-xl font-bold">{formatCurrency(houseMoneyData.managementCosts)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Instandhaltung</p>
                    <p className="text-xl font-bold">{formatCurrency(houseMoneyData.repairCosts)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamt</p>
                    <p className="text-xl font-bold">{formatCurrency(houseMoneyData.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nach Immobilie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hausgelder nach Immobilie</CardTitle>
              <CardDescription>Aufteilung der Kosten dieses Jahr</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {houseMoneyData.byProperty.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{item.property.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{formatCurrency(item.costs)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({houseMoneyData.total > 0 ? ((item.costs / houseMoneyData.total) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
                {houseMoneyData.byProperty.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Hausgelder erfasst
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nebenkosten Tab */}
        <TabsContent value="utilitycosts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Umlagefähig</p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(utilityCostsData.umlagefaehig)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">auf Mieter umlegbar</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">Nicht umlagefähig</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(utilityCostsData.nichtUmlagefaehig)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Eigentümer trägt Kosten</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kategorien Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kostenverteilung</CardTitle>
              <CardDescription>Nebenkosten nach Kategorien</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={utilityCostsData.categories.filter(c => c.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {utilityCostsData.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {utilityCostsData.categories.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span>{cat.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rücklagen Tab */}
        <TabsContent value="reserves" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">Rücklagenkonto</p>
                    <p className="text-4xl font-bold text-amber-700 dark:text-amber-300">
                      {formatCurrency(reservesData.reservesBalance)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ø {formatCurrency(reservesData.monthlySavings)}/Monat
                    </p>
                  </div>
                  <PiggyBank className="h-16 w-16 text-amber-300" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">Kategorien</p>
                <div className="space-y-3">
                  {reservesData.categories.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Empfehlung */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Empfehlung</h3>
                  <p className="text-sm text-muted-foreground">
                    Als Faustregel sollten Sie ca. 1-2% der Immobilienwerte jährlich für Instandhaltungsrücklagen einplanen. 
                    Bei einem Gesamtportfolio von {formatCurrency(store.properties.reduce((sum, p) => sum + (p.estimatedValue || p.marketValue), 0))} 
                    entspricht das {formatCurrency(store.properties.reduce((sum, p) => sum + (p.estimatedValue || p.marketValue), 0) * 0.015)} pro Jahr 
                    bzw. {formatCurrency(store.properties.reduce((sum, p) => sum + (p.estimatedValue || p.marketValue), 0) * 0.015 / 12)} monatlich.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Transaktion bearbeiten' : 'Neue Transaktion'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Typ</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: TransactionType) => setFormData({ ...formData, type: value, category: value === 'income' ? 'rent' : 'repairs' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Einnahme</SelectItem>
                  <SelectItem value="expense">Ausgabe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kategorie</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: TransactionCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Betrag (€)</Label>
              <Input 
                type="number"
                value={formData.amount} 
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Datum</Label>
              <Input 
                type="date"
                value={formData.date} 
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Immobilie</Label>
              <Select 
                value={formData.propertyId} 
                onValueChange={(value) => setFormData({ ...formData, propertyId: value, unitId: '' })}
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
              <Label>Einheit</Label>
              <Select 
                value={formData.unitId || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, unitId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  {unitsForProperty.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Beschreibung</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.isRecurring} 
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                />
                <Label>Wiederkehrend</Label>
              </div>
              {formData.isRecurring && (
                <Select 
                  value={formData.recurringInterval} 
                  onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setFormData({ ...formData, recurringInterval: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="quarterly">Quartalsweise</SelectItem>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              )}
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
            <AlertDialogTitle>Transaktion löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Transaktion wirklich löschen?
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

export default FinancesSection;
