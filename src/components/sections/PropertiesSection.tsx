'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { Property } from '@/lib/types';
import { Plus, Edit2, Trash2, MapPin, ExternalLink, Building2 } from 'lucide-react';

function PropertiesSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    purchasePrice: 0,
    purchaseDate: '',
    totalArea: 0,
    unitsCount: 0,
    marketValue: 0,
    estimatedValue: 0,
    estimatedValueDate: '',
    pricePerSqm: 0,
    condition: 'good' as Property['condition'],
    energyClass: 'unknown' as Property['energyClass'],
    locationQuality: 'average' as Property['locationQuality'],
    propertyType: 'apartment' as Property['propertyType'],
    yearBuilt: new Date().getFullYear(),
    notes: '',
    images: [] as string[],
  });

  const openNewDialog = () => {
    setEditingProperty(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      purchasePrice: 0,
      purchaseDate: '',
      totalArea: 0,
      unitsCount: 0,
      marketValue: 0,
      estimatedValue: 0,
      estimatedValueDate: '',
      pricePerSqm: 0,
      condition: 'good',
      energyClass: 'unknown',
      locationQuality: 'average',
      propertyType: 'apartment',
      yearBuilt: new Date().getFullYear(),
      notes: '',
      images: [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      postalCode: property.postalCode,
      purchasePrice: property.purchasePrice,
      purchaseDate: property.purchaseDate,
      totalArea: property.totalArea,
      unitsCount: property.unitsCount,
      marketValue: property.marketValue,
      estimatedValue: property.estimatedValue,
      estimatedValueDate: property.estimatedValueDate,
      pricePerSqm: property.pricePerSqm,
      condition: property.condition,
      energyClass: property.energyClass,
      locationQuality: property.locationQuality,
      propertyType: property.propertyType,
      yearBuilt: property.yearBuilt,
      notes: property.notes,
      images: property.images,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.address || !formData.city) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingProperty) {
      store.updateProperty(editingProperty.id, formData);
      toast.success('Immobilie aktualisiert');
    } else {
      store.addProperty(formData);
      toast.success('Immobilie hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      store.deleteProperty(deletingId);
      toast.success('Immobilie gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Immobilien</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Immobilie
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...store.properties].sort((a, b) => a.name.localeCompare(b.name)).map((property) => {
          const units = store.units.filter(u => u.propertyId === property.id);
          const rentedUnits = units.filter(u => u.status === 'rented').length;
          
          return (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{property.address}, {property.postalCode} {property.city}</span>
                      <div className="flex gap-1 ml-1">
                        {/* Street View Button */}
                        <a
                          href={`https://www.google.com/maps/@?api=1&map_action=pano&query=${encodeURIComponent(property.address + ', ' + property.postalCode + ' ' + property.city)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                          title="Street View öffnen"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {property.propertyType === 'apartment' && 'Wohnung'}
                    {property.propertyType === 'house' && 'Haus'}
                    {property.propertyType === 'commercial' && 'Gewerbe'}
                    {property.propertyType === 'mixed' && 'Gemischt'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Einheiten</span>
                    <span className="font-medium">{rentedUnits}/{units.length} vermietet</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Wohnfläche</span>
                    <span className="font-medium">{property.totalArea} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Kaufpreis</span>
                    <span className="font-medium">{formatCurrency(property.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Marktwert</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(property.marketValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm bg-purple-50 -mx-4 px-4 py-2 rounded-lg">
                    <span className="text-purple-700 font-medium">Aktueller Schätzwert</span>
                    <span className="font-bold text-purple-700">{formatCurrency(property.estimatedValue || property.marketValue)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span></span>
                    <span>~{(property.pricePerSqm || 0).toLocaleString('de-DE')} €/m²</span>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(property)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Bearbeiten
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDeletingId(property.id);
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

      {store.properties.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Immobilien</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihre erste Immobilie hinzu</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neue Immobilie
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Property Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Immobilie bearbeiten' : 'Neue Immobilie'}</DialogTitle>
            <DialogDescription>
              {editingProperty ? 'Aktualisieren Sie die Daten der Immobilie' : 'Erfassen Sie eine neue Immobilie'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Mehrfamilienhaus Berlin"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Straße und Hausnummer"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">PLZ</Label>
              <Input 
                id="postalCode" 
                value={formData.postalCode} 
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="city">Stadt *</Label>
              <Input 
                id="city" 
                value={formData.city} 
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="propertyType">Typ</Label>
              <Select 
                value={formData.propertyType} 
                onValueChange={(value: Property['propertyType']) => setFormData({ ...formData, propertyType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Wohnung</SelectItem>
                  <SelectItem value="house">Haus</SelectItem>
                  <SelectItem value="commercial">Gewerbe</SelectItem>
                  <SelectItem value="mixed">Gemischt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="yearBuilt">Baujahr</Label>
              <Input 
                id="yearBuilt" 
                type="number" 
                value={formData.yearBuilt} 
                onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="purchasePrice">Kaufpreis (€)</Label>
              <Input 
                id="purchasePrice" 
                type="number" 
                value={formData.purchasePrice} 
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="purchaseDate">Kaufdatum</Label>
              <Input 
                id="purchaseDate" 
                type="date" 
                value={formData.purchaseDate} 
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="totalArea">Wohnfläche (m²)</Label>
              <Input 
                id="totalArea" 
                type="number" 
                value={formData.totalArea} 
                onChange={(e) => setFormData({ ...formData, totalArea: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="unitsCount">Anzahl Einheiten</Label>
              <Input 
                id="unitsCount" 
                type="number" 
                value={formData.unitsCount} 
                onChange={(e) => setFormData({ ...formData, unitsCount: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="marketValue">Marktwert (€)</Label>
              <Input 
                id="marketValue" 
                type="number" 
                value={formData.marketValue} 
                onChange={(e) => setFormData({ ...formData, marketValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea 
                id="notes" 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
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
            <AlertDialogTitle>Immobilie löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Immobilie wirklich löschen? Alle zugehörigen Einheiten, Mieter und Transaktionen werden ebenfalls gelöscht.
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

export default PropertiesSection;
