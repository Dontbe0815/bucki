'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Edit2, Trash2 } from 'lucide-react';

function FinancesSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Einnahmen & Ausgaben</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Transaktion
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Einnahmen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ausgaben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Datum</th>
                  <th className="text-left p-4 font-medium text-gray-600">Typ</th>
                  <th className="text-left p-4 font-medium text-gray-600">Kategorie</th>
                  <th className="text-left p-4 font-medium text-gray-600">Beschreibung</th>
                  <th className="text-left p-4 font-medium text-gray-600">Immobilie</th>
                  <th className="text-right p-4 font-medium text-gray-600">Betrag</th>
                  <th className="text-right p-4 font-medium text-gray-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
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
            <div className="py-12 text-center text-gray-500">
              Keine Transaktionen gefunden
            </div>
          )}
        </CardContent>
      </Card>

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
