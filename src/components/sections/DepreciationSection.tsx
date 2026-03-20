'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import type { DepreciationItem, DepreciationCategory } from '@/lib/types';
import { depreciationCategoryLabels, depreciationCategoryColors } from './constants';
import { Plus, Edit2, Trash2, TrendingDown } from 'lucide-react';

function DepreciationSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalMonthlyDepreciation = store.depreciationItems.reduce((sum, d) => sum + d.monthlyDepreciation, 0);
  const totalAnnualDepreciation = store.depreciationItems.reduce((sum, d) => sum + d.annualDepreciation, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Abschreibungen</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Abschreibung
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Monatliche AfA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalMonthlyDepreciation)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Jährliche AfA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAnnualDepreciation)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Positionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.depreciationItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Depreciation Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Bezeichnung</th>
                  <th className="text-left p-4 font-medium text-gray-600">Kategorie</th>
                  <th className="text-right p-4 font-medium text-gray-600">Anschaffungswert</th>
                  <th className="text-right p-4 font-medium text-gray-600">Nutzungsdauer</th>
                  <th className="text-right p-4 font-medium text-gray-600">Monatlich</th>
                  <th className="text-right p-4 font-medium text-gray-600">Jährlich</th>
                </tr>
              </thead>
              <tbody>
                {store.depreciationItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">
                      <Badge className={depreciationCategoryColors[item.category]}>
                        {depreciationCategoryLabels[item.category]}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">{formatCurrency(item.purchaseValue)}</td>
                    <td className="p-4 text-right">{item.depreciationYears} Jahre</td>
                    <td className="p-4 text-right">{formatCurrency(item.monthlyDepreciation)}</td>
                    <td className="p-4 text-right">{formatCurrency(item.annualDepreciation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {store.depreciationItems.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Keine Abschreibungen vorhanden
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Abschreibung</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DepreciationSection;
