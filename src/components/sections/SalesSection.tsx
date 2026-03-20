'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { TrendingUp } from 'lucide-react';

function SalesSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  
  const salesAnalysis = useMemo(() => {
    return store.properties.map(p => {
      const appreciation = p.estimatedValue || p.marketValue - p.purchasePrice;
      const appreciationPercent = p.purchasePrice > 0 ? (appreciation / p.purchasePrice) * 100 : 0;
      const annualReturn = appreciationPercent / Math.max(1, (new Date().getFullYear() - new Date(p.purchaseDate || new Date()).getFullYear()));
      
      return {
        ...p,
        appreciation,
        appreciationPercent,
        annualReturn,
      };
    }).sort((a, b) => b.appreciationPercent - a.appreciationPercent);
  }, [store.properties]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Verkauf</h1>
      
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Verkaufs-Analyse
          </CardTitle>
          <CardDescription>Potenzielle Gewinne bei Verkauf</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Gesamtkaufpreis</p>
              <p className="text-xl font-bold">{formatCurrency(store.properties.reduce((sum, p) => sum + p.purchasePrice, 0))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Geschätzter Wert</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(store.properties.reduce((sum, p) => sum + (p.estimatedValue || p.marketValue), 0))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potenzieller Gewinn</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(store.properties.reduce((sum, p) => sum + ((p.estimatedValue || p.marketValue) - p.purchasePrice), 0))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Immobilien nach Wertsteigerung</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Immobilie</th>
                <th className="text-right p-4">Kaufpreis</th>
                <th className="text-right p-4">Schätzwert</th>
                <th className="text-right p-4">Steigerung</th>
                <th className="text-right p-4">%/Jahr</th>
              </tr>
            </thead>
            <tbody>
              {salesAnalysis.map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-right">{formatCurrency(p.purchasePrice)}</td>
                  <td className="p-4 text-right">{formatCurrency(p.estimatedValue || p.marketValue)}</td>
                  <td className={`p-4 text-right font-bold ${p.appreciation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(p.appreciation)}
                  </td>
                  <td className={`p-4 text-right ${p.annualReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {p.annualReturn.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default SalesSection;
