'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { TaxFormGenerator } from '@/components/tax/TaxFormGenerator';
import {
  FileText,
  Calculator,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Building2,
  PieChart,
  BarChart3,
  Download,
} from 'lucide-react';
import {
  calculateAnlageVSummary,
  type AnlageVSummary,
} from '@/lib/tax/anlageV';

function TaxesSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Steuerjahr
  const steuerjahr = new Date().getFullYear() - 1;
  
  // Berechne Steuerdaten
  const taxSummary = useMemo(() => {
    const year = new Date().getFullYear();
    const yearTransactions = store.transactions.filter(tr => new Date(tr.date).getFullYear() === year);
    const lastYearTransactions = store.transactions.filter(tr => new Date(tr.date).getFullYear() === year - 1);
    
    const income = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const lastYearIncome = lastYearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const lastYearExpenses = lastYearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const depreciation = store.depreciationItems.reduce((sum, d) => sum + d.annualDepreciation, 0);
    const taxableIncome = income - expenses - depreciation;
    
    // Geschätzte Steuer (angenommen 25% Durchschnittssteuersatz)
    const estimatedTax = Math.max(0, taxableIncome * 0.25);
    
    // Veränderung zum Vorjahr
    const incomeChange = lastYearIncome > 0 ? ((income - lastYearIncome) / lastYearIncome) * 100 : 0;
    const expenseChange = lastYearExpenses > 0 ? ((expenses - lastYearExpenses) / lastYearExpenses) * 100 : 0;
    
    return { 
      income, 
      expenses, 
      depreciation, 
      taxableIncome, 
      estimatedTax,
      incomeChange,
      expenseChange,
    };
  }, [store.transactions, store.depreciationItems]);
  
  // Anlage V Daten
  const anlageVSummary = useMemo(() => {
    if (store.properties.length === 0) return null;
    
    return calculateAnlageVSummary(
      store.properties,
      store.transactions,
      store.depreciationItems,
      steuerjahr
    );
  }, [store.properties, store.transactions, store.depreciationItems, steuerjahr]);
  
  // Werbungskosten-Aufschlüsselung
  const expenseBreakdown = useMemo(() => {
    const categories: Record<string, { amount: number; label: string; color: string }> = {
      depreciation: { amount: taxSummary.depreciation, label: 'Abschreibungen', color: 'bg-blue-500' },
      repairs: { amount: 0, label: 'Reparaturen', color: 'bg-orange-500' },
      management: { amount: 0, label: 'Verwaltung', color: 'bg-purple-500' },
      insurance: { amount: 0, label: 'Versicherungen', color: 'bg-cyan-500' },
      taxes: { amount: 0, label: 'Steuern', color: 'bg-red-500' },
      mortgage: { amount: 0, label: 'Zinsen', color: 'bg-yellow-500' },
      other: { amount: 0, label: 'Sonstige', color: 'bg-gray-500' },
    };
    
    const yearTransactions = store.transactions.filter(
      t => t.type === 'expense' && new Date(t.date).getFullYear() === new Date().getFullYear()
    );
    
    for (const t of yearTransactions) {
      if (categories[t.category]) {
        categories[t.category].amount += t.amount;
      } else {
        categories.other.amount += t.amount;
      }
    }
    
    return Object.entries(categories)
      .filter(([_, data]) => data.amount > 0)
      .sort((a, b) => b[1].amount - a[1].amount);
  }, [store.transactions, taxSummary.depreciation]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Steuern</h1>
          <p className="text-muted-foreground">
            Steuerliche Übersicht und Anlage V Generierung
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="anlage-v">Anlage V</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
        </TabsList>
        
        {/* Übersicht Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Einnahmen (Jahr)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(taxSummary.income)}</div>
                {taxSummary.incomeChange !== 0 && (
                  <div className={`flex items-center text-sm mt-1 ${taxSummary.incomeChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {taxSummary.incomeChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(taxSummary.incomeChange).toFixed(1)}% vs. Vorjahr
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ausgaben (Jahr)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(taxSummary.expenses)}</div>
                {taxSummary.expenseChange !== 0 && (
                  <div className={`flex items-center text-sm mt-1 ${taxSummary.expenseChange < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {taxSummary.expenseChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(taxSummary.expenseChange).toFixed(1)}% vs. Vorjahr
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Abschreibungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(taxSummary.depreciation)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  AfA p.a.
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Steuerlast (geschätzt)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(taxSummary.estimatedTax)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  bei 25% Steuersatz
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Steuerliche Berechnung */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Steuerliche Berechnung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span>Bruttoeinnahmen</span>
                <span className="font-medium text-emerald-600">{formatCurrency(taxSummary.income)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>- Ausgaben</span>
                <span className="font-medium text-red-600">-{formatCurrency(taxSummary.expenses)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>- Abschreibungen</span>
                <span className="font-medium text-blue-600">-{formatCurrency(taxSummary.depreciation)}</span>
              </div>
              <div className="flex justify-between py-2 border-b font-bold text-lg">
                <span>Steuerpflichtiges Einkommen</span>
                <span className={taxSummary.taxableIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {formatCurrency(taxSummary.taxableIncome)}
                </span>
              </div>
              <div className="flex justify-between py-3 bg-muted rounded-lg px-4">
                <span className="font-bold">Geschätzte Steuerlast (25%)</span>
                <span className="font-bold text-red-600">{formatCurrency(taxSummary.estimatedTax)}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Werbungskosten-Aufschlüsselung */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Werbungskosten-Aufschlüsselung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseBreakdown.map(([key, data]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${data.color}`} />
                    <span className="flex-1">{data.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${data.color}`}
                          style={{ 
                            width: `${Math.min(100, (data.amount / (taxSummary.expenses + taxSummary.depreciation)) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="font-medium w-24 text-right">{formatCurrency(data.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Schnellaktionen */}
          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setActiveTab('anlage-v')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Anlage V erstellen
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('analysis')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Detaillierte Analyse
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Anlage V Tab */}
        <TabsContent value="anlage-v" className="mt-6">
          <TaxFormGenerator />
        </TabsContent>
        
        {/* Analyse Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          {/* Immobilien-Steuerübersicht */}
          {anlageVSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Steuerübersicht pro Immobilie
                </CardTitle>
                <CardDescription>
                  Steuerjahr {steuerjahr}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {anlageVSummary.properties.map((property) => (
                    <div 
                      key={property.propertyId}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{property.propertyName}</div>
                          <div className="text-sm text-muted-foreground">
                            {property.address}, {property.plz} {property.ort}
                          </div>
                        </div>
                        <Badge variant={property.ueberschuss >= 0 ? 'default' : 'destructive'}>
                          {property.ueberschuss >= 0 ? 'Überschuss' : 'Verlust'}
                        </Badge>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Einnahmen</div>
                          <div className="font-medium text-emerald-600">
                            {formatCurrency(property.nettoeinnahmen)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Werbungskosten</div>
                          <div className="font-medium text-red-600">
                            {formatCurrency(property.summeWerbungskosten)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Überschuss</div>
                          <div className={`font-medium ${property.ueberschuss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(property.ueberschuss)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Plausibilitätshinweise */}
                      {property.plausibilitaet.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {property.plausibilitaet.map((p, idx) => (
                            <Badge 
                              key={idx}
                              variant="outline"
                              className={
                                p.type === 'error' 
                                  ? 'border-red-300 text-red-600' 
                                  : p.type === 'warning'
                                  ? 'border-yellow-300 text-yellow-600'
                                  : 'border-blue-300 text-blue-600'
                              }
                            >
                              {p.type === 'warning' && '⚠️ '}
                              {p.message.substring(0, 50)}...
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Vorjahresvergleich */}
          {anlageVSummary?.vorjahr && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Vorjahresvergleich
                </CardTitle>
                <CardDescription>
                  Vergleich {anlageVSummary.steuerjahr - 1} vs {anlageVSummary.steuerjahr}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <ComparisonCard
                    label="Einnahmen"
                    current={anlageVSummary.gesamtBruttoeinnahmen}
                    previous={anlageVSummary.vorjahr?.gesamtBruttoeinnahmen || 0}
                    formatCurrency={formatCurrency}
                    positiveIsGood
                  />
                  <ComparisonCard
                    label="Werbungskosten"
                    current={anlageVSummary.gesamtWerbungskosten}
                    previous={anlageVSummary.vorjahr?.gesamtWerbungskosten || 0}
                    formatCurrency={formatCurrency}
                    positiveIsGood={false}
                  />
                  <ComparisonCard
                    label="Überschuss"
                    current={anlageVSummary.gesamtUeberschuss}
                    previous={anlageVSummary.vorjahr?.gesamtUeberschuss || 0}
                    formatCurrency={formatCurrency}
                    positiveIsGood
                    highlight
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Steuerhinweise */}
          <Card>
            <CardHeader>
              <CardTitle>Wichtige Steuerhinweise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="font-medium text-blue-700 dark:text-blue-300">Abschreibungen (AfA)</div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Die Gebäude-AfA beträgt in der Regel 2-3% pro Jahr bei einer Abschreibungsdauer von 33-50 Jahren.
                  Prüfen Sie, ob Sie den Gebäudeanteil korrekt vom Gesamtpreis abgegrenzt haben.
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="font-medium text-yellow-700 dark:text-yellow-300">Erhaltungsaufwand</div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  Reparaturen und Instandhaltungen sind sofort absetzbar, wenn sie weniger als 4.000€ pro Maßnahme 
                  kosten. Darüber hinaus kann eine Verteilung auf 2-5 Jahre möglich sein.
                </p>
              </div>
              
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <div className="font-medium text-emerald-700 dark:text-emerald-300">Verlustvortrag</div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  Bei negativen Einkünften aus Vermietung und Verpachtung können Verluste vorgetragen werden.
                  Diese mindern die Steuerlast in zukünftigen Jahren.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Hilfskomponenten
function ComparisonCard({
  label,
  current,
  previous,
  formatCurrency,
  positiveIsGood,
  highlight = false,
}: {
  label: string;
  current: number;
  previous: number;
  formatCurrency: (amount: number) => string;
  positiveIsGood: boolean;
  highlight?: boolean;
}) {
  const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
  const isPositive = change > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  
  return (
    <div className={`p-4 rounded-lg ${highlight ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-muted'}`}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold mt-1 ${highlight ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
        {formatCurrency(current)}
      </div>
      <div className="flex items-center gap-1 mt-2">
        {change !== 0 && (
          <>
            {isPositive ? (
              <TrendingUp className={`h-4 w-4 ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />
            ) : (
              <TrendingDown className={`h-4 w-4 ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />
            )}
            <span className={`text-sm ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
          </>
        )}
        {change === 0 && (
          <span className="text-sm text-muted-foreground">Keine Änderung</span>
        )}
      </div>
    </div>
  );
}

export default TaxesSection;
