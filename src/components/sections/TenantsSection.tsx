'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { Tenant } from '@/lib/types';
import { Plus, Edit2, Trash2, Mail, Phone, Calendar, Euro, Users } from 'lucide-react';

function TenantsSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    unitId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    moveInDate: '',
    moveOutDate: '',
    deposit: 0,
    contractType: 'indefinite' as Tenant['contractType'],
    contractStartDate: '',
    contractEndDate: '',
    notes: '',
  });

  const openNewDialog = () => {
    setEditingTenant(null);
    setFormData({
      unitId: store.units.filter(u => u.status === 'vacant')[0]?.id || '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      moveInDate: '',
      moveOutDate: '',
      deposit: 0,
      contractType: 'indefinite',
      contractStartDate: '',
      contractEndDate: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      unitId: tenant.unitId,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
      street: tenant.street,
      city: tenant.postalCode,
      postalCode: tenant.postalCode,
      moveInDate: tenant.moveInDate,
      moveOutDate: tenant.moveOutDate || '',
      deposit: tenant.deposit,
      contractType: tenant.contractType,
      contractStartDate: tenant.contractStartDate,
      contractEndDate: tenant.contractEndDate || '',
      notes: tenant.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.unitId) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingTenant) {
      store.updateTenant(editingTenant.id, formData);
      toast.success('Mieter aktualisiert');
    } else {
      store.addTenant(formData);
      // Update unit status to rented
      store.updateUnit(formData.unitId, { status: 'rented' });
      toast.success('Mieter hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      const tenant = store.tenants.find(t => t.id === deletingId);
      if (tenant) {
        store.updateUnit(tenant.unitId, { status: 'vacant' });
      }
      store.deleteTenant(deletingId);
      toast.success('Mieter gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const getUnitInfo = (unitId: string) => {
    const unit = store.units.find(u => u.id === unitId);
    const property = unit ? store.properties.find(p => p.id === unit.propertyId) : null;
    return { unit, property };
  };

  const vacantUnits = store.units.filter(u => u.status === 'vacant');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mieter</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neuer Mieter
        </Button>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {store.tenants.map((tenant) => {
          const { unit, property } = getUnitInfo(tenant.unitId);
          return (
            <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{tenant.firstName} {tenant.lastName}</CardTitle>
                    <CardDescription className="mt-1">
                      {property?.name} - {unit?.unitNumber}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{tenant.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{tenant.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Einzug: {formatDate(tenant.moveInDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Euro className="h-4 w-4" />
                    <span>Kaution: {formatCurrency(tenant.deposit)}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(tenant)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Bearbeiten
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => {
                        setDeletingId(tenant.id);
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

      {store.tenants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Mieter</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihren ersten Mieter hinzu</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neuer Mieter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tenant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTenant ? 'Mieter bearbeiten' : 'Neuer Mieter'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Einheit *</Label>
              <Select 
                value={formData.unitId} 
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {(editingTenant ? store.units : vacantUnits).map(u => {
                    const property = store.properties.find(p => p.id === u.propertyId);
                    return (
                      <SelectItem key={u.id} value={u.id}>
                        {property?.name} - {u.unitNumber}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div></div>
            <div>
              <Label>Vorname *</Label>
              <Input 
                value={formData.firstName} 
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label>Nachname *</Label>
              <Input 
                value={formData.lastName} 
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label>E-Mail</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Straße</Label>
              <Input 
                value={formData.street} 
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>
            <div>
              <Label>PLZ</Label>
              <Input 
                value={formData.postalCode} 
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
            <div>
              <Label>Stadt</Label>
              <Input 
                value={formData.city} 
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label>Einzugsdatum</Label>
              <Input 
                type="date"
                value={formData.moveInDate} 
                onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Auszugsdatum</Label>
              <Input 
                type="date"
                value={formData.moveOutDate} 
                onChange={(e) => setFormData({ ...formData, moveOutDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Kaution (€)</Label>
              <Input 
                type="number"
                value={formData.deposit} 
                onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Vertragstyp</Label>
              <Select 
                value={formData.contractType} 
                onValueChange={(value: Tenant['contractType']) => setFormData({ ...formData, contractType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinite">Unbefristet</SelectItem>
                  <SelectItem value="fixed">Befristet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vertragsbeginn</Label>
              <Input 
                type="date"
                value={formData.contractStartDate} 
                onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Vertragsende</Label>
              <Input 
                type="date"
                value={formData.contractEndDate} 
                onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notizen</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            <AlertDialogTitle>Mieter löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Mieter wirklich löschen?
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

export default TenantsSection;
