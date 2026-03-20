'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import type { Financing } from '@/lib/types';
import { Plus, Edit2, Trash2, CreditCard, TrendingDown, TrendingUp } from 'lucide-react';

function FinancingSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFinancing, setEditingFinancing] = useState<Financing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const totalDebt = store.financings.reduce((sum, f) => sum + f.remainingDebt, 0);
  const totalMonthlyPayment = store.financings.reduce((sum, f) => sum + f.monthlyRate, 0);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Finanzierungen</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Finanzierung
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Restschulden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monatliche Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyPayment)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Aktive Darlehen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.financings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Financings Grid */}
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
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
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

      {store.financings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Finanzierungen</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihre erste Finanzierung hinzu</p>
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
