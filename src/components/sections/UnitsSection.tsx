'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import type { Unit } from '@/lib/types';
import { unitStatusLabels, unitStatusColors } from './constants';
import { Plus, Edit2, Trash2 } from 'lucide-react';

function UnitsSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [formData, setFormData] = useState({
    propertyId: '',
    unitNumber: '',
    floor: 0,
    area: 0,
    rooms: 0,
    baseRent: 0,
    additionalCosts: 0,
    status: 'vacant' as Unit['status'],
    description: '',
  });

  const filteredUnits = filterProperty === 'all' 
    ? store.units 
    : store.units.filter(u => u.propertyId === filterProperty);

  const openNewDialog = () => {
    setEditingUnit(null);
    setFormData({
      propertyId: store.properties[0]?.id || '',
      unitNumber: '',
      floor: 0,
      area: 0,
      rooms: 0,
      baseRent: 0,
      additionalCosts: 0,
      status: 'vacant',
      description: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      area: unit.area,
      rooms: unit.rooms,
      baseRent: unit.baseRent,
      additionalCosts: unit.additionalCosts,
      status: unit.status,
      description: unit.description,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.propertyId || !formData.unitNumber) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    const totalRent = formData.baseRent + formData.additionalCosts;

    if (editingUnit) {
      store.updateUnit(editingUnit.id, { ...formData, totalRent });
      toast.success('Einheit aktualisiert');
    } else {
      store.addUnit({ ...formData, totalRent });
      toast.success('Einheit hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      store.deleteUnit(deletingId);
      toast.success('Einheit gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || 'Unbekannt';
  };

  const getTenant = (unitId: string) => {
    return store.tenants.find(t => t.unitId === unitId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Einheiten</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Einheit
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
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

      {/* Units Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Einheit</th>
                  <th className="text-left p-4 font-medium text-gray-600">Immobilie</th>
                  <th className="text-left p-4 font-medium text-gray-600">Fläche</th>
                  <th className="text-left p-4 font-medium text-gray-600">Zimmer</th>
                  <th className="text-left p-4 font-medium text-gray-600">Miete</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 font-medium text-gray-600">Mieter</th>
                  <th className="text-right p-4 font-medium text-gray-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((unit) => {
                  const tenant = getTenant(unit.id);
                  return (
                    <tr key={unit.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{unit.unitNumber}</td>
                      <td className="p-4">{getPropertyName(unit.propertyId)}</td>
                      <td className="p-4">{unit.area} m²</td>
                      <td className="p-4">{unit.rooms}</td>
                      <td className="p-4">{formatCurrency(unit.totalRent)}</td>
                      <td className="p-4">
                        <Badge className={unitStatusColors[unit.status]}>
                          {unitStatusLabels[unit.status]}
                        </Badge>
                      </td>
                      <td className="p-4">{tenant ? `${tenant.firstName} ${tenant.lastName}` : '-'}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(unit)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              setDeletingId(unit.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredUnits.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Keine Einheiten gefunden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Einheit bearbeiten' : 'Neue Einheit'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
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
              <Label>Wohnungsnummer *</Label>
              <Input 
                value={formData.unitNumber} 
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                placeholder="z.B. EG links"
              />
            </div>
            <div>
              <Label>Etage</Label>
              <Input 
                type="number" 
                value={formData.floor} 
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fläche (m²)</Label>
              <Input 
                type="number" 
                value={formData.area} 
                onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Zimmer</Label>
              <Input 
                type="number" 
                step="0.5"
                value={formData.rooms} 
                onChange={(e) => setFormData({ ...formData, rooms: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Kaltmiete (€)</Label>
              <Input 
                type="number" 
                value={formData.baseRent} 
                onChange={(e) => setFormData({ ...formData, baseRent: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Nebenkosten (€)</Label>
              <Input 
                type="number" 
                value={formData.additionalCosts} 
                onChange={(e) => setFormData({ ...formData, additionalCosts: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: Unit['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rented">Vermietet</SelectItem>
                  <SelectItem value="vacant">Leer</SelectItem>
                  <SelectItem value="renovation">Renovierung</SelectItem>
                  <SelectItem value="reserved">Reserviert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Beschreibung</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
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
            <AlertDialogTitle>Einheit löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Einheit wirklich löschen? Alle zugehörigen Mieter werden ebenfalls gelöscht.
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

export default UnitsSection;
