'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Plus, Edit2, Trash2, MapPin, ExternalLink, Building2,
  Grid, Map, List, BedDouble, Ruler, Euro,
  TrendingUp, ChevronRight, Calendar, Home, Zap,
  Hash, FileText, CheckCircle, XCircle
} from 'lucide-react';
import { geocodeAddressCached } from '@/lib/geocoding';

// ============================================
// PROPERTY CARD - ImmoScout Style
// ============================================
function PropertyCard({ 
  property, 
  units, 
  onEdit, 
  onDelete, 
  onViewDetails 
}: { 
  property: Property; 
  units: any[];
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}) {
  const { formatCurrency } = useI18n();
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  
  const rentedUnits = units.filter(u => u.status === 'rented').length;
  const totalRent = units.reduce((sum, u) => sum + (u.status === 'rented' ? u.totalRent : 0), 0);
  const rentPerSqm = property.totalArea > 0 ? (totalRent / property.totalArea).toFixed(2) : '0';

  // Load coordinates
  useEffect(() => {
    const load = async () => {
      const result = await geocodeAddressCached(property.address || '', property.postalCode || '', property.city || '');
      if (result) setCoordinates({ lat: result.lat, lon: result.lon });
    };
    if (property.address || property.city) load();
  }, [property.address, property.postalCode, property.city]);

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${property.address}, ${property.postalCode} ${property.city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Generate OpenStreetMap static image URL
  const getOSMStaticMapUrl = () => {
    if (!coordinates) return null;
    // Use OpenStreetMap static map service
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${coordinates.lat},${coordinates.lon}&zoom=16&size=400x200&markers=${coordinates.lat},${coordinates.lon},red-pushpin`;
  };

  // Energy color
  const energyColors: Record<string, string> = {
    'A': 'bg-green-500', 'B': 'bg-green-400', 'C': 'bg-lime-400', 'D': 'bg-yellow-400',
    'E': 'bg-orange-400', 'F': 'bg-orange-500', 'G': 'bg-red-500', 'H': 'bg-red-600',
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Map Preview Area - OpenStreetMap */}
      <div 
        className="relative h-44 bg-slate-200 dark:bg-slate-700 cursor-pointer overflow-hidden"
        onClick={(e) => { e.stopPropagation(); openGoogleMaps(); }}
      >
        {/* OpenStreetMap Static Image */}
        {coordinates ? (
          <img 
            src={getOSMStaticMapUrl()!} 
            alt="Karte"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to colored background if image fails
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <div className="bg-white rounded-full p-3 shadow-xl">
              <MapPin className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        )}
        
        {/* Property Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/95 shadow-sm">
            {property.propertyType === 'apartment' ? 'Wohnung' : 
             property.propertyType === 'house' ? 'Haus' : 
             property.propertyType === 'commercial' ? 'Gewerbe' : 'Gemischt'}
          </Badge>
        </div>

        {/* Energy Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`${energyColors[property.energyClass] || 'bg-gray-400'} text-white font-bold shadow-sm`}>
            {property.energyClass === 'unknown' ? '?' : property.energyClass}
          </Badge>
        </div>

        {/* Click to open Google Maps hint */}
        <div className="absolute bottom-3 right-3">
          <Badge variant="secondary" className="bg-white/90 shadow-sm text-xs">
            <ExternalLink className="h-3 w-3 mr-1" /> Google Maps
          </Badge>
        </div>
        
        {/* Address Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-white text-sm font-medium truncate">{property.city}</p>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {/* Title & Address */}
        <h3 className="font-semibold text-lg mb-1 truncate">{property.name}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin className="h-3.5 w-3.5" />
          {property.address}, {property.postalCode} {property.city}
        </p>

        {/* Key Stats Row */}
        <div className="flex items-center gap-4 text-sm mb-3 pb-3 border-b">
          <div className="flex items-center gap-1.5">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{property.totalArea} m²</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{rentedUnits}/{units.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{rentPerSqm} €/m²</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Kaufpreis</p>
            <p className="font-semibold text-lg">{formatCurrency(property.purchasePrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Schätzwert</p>
            <p className="font-semibold text-emerald-600">{formatCurrency(property.estimatedValue || property.marketValue)}</p>
          </div>
        </div>

        {/* Value Change */}
        {(property.estimatedValue || property.marketValue) > property.purchasePrice && (
          <div className="flex items-center gap-1 text-sm text-emerald-600 mb-3">
            <TrendingUp className="h-4 w-4" />
            +{(((property.estimatedValue || property.marketValue) - property.purchasePrice) / property.purchasePrice * 100).toFixed(1)}% seit Kauf
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onViewDetails}>
            Details ansehen
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// PROPERTY DETAIL DIALOG - ImmoScout Style
// ============================================
function PropertyDetailDialog({ 
  property, open, onClose, onEdit 
}: { 
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { formatCurrency } = useI18n();
  const store = useStore();
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (property && open) {
      geocodeAddressCached(property.address || '', property.postalCode || '', property.city || '')
        .then(result => result && setCoordinates({ lat: result.lat, lon: result.lon }));
    }
  }, [property, open]);

  if (!property) return null;

  const units = store.units.filter(u => u.propertyId === property.id);
  const rentedUnits = units.filter(u => u.status === 'rented');
  const totalRent = rentedUnits.reduce((sum, u) => sum + u.totalRent, 0);
  const coldRent = rentedUnits.reduce((sum, u) => sum + u.baseRent, 0);

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${property.address}, ${property.postalCode} ${property.city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Generate OpenStreetMap static image URL for detail dialog
  const getOSMStaticMapUrl = () => {
    if (!coordinates) return null;
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${coordinates.lat},${coordinates.lon}&zoom=15&size=800x300&markers=${coordinates.lat},${coordinates.lon},red-pushpin`;
  };

  // Energy colors
  const energyColors: Record<string, string> = {
    'A': 'bg-green-500 text-white', 'B': 'bg-green-400 text-white', 
    'C': 'bg-lime-400 text-black', 'D': 'bg-yellow-400 text-black',
    'E': 'bg-orange-400 text-white', 'F': 'bg-orange-500 text-white', 
    'G': 'bg-red-500 text-white', 'H': 'bg-red-600 text-white',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header Map Area - OpenStreetMap */}
        <div 
          className="relative h-56 bg-slate-200 dark:bg-slate-700 cursor-pointer overflow-hidden"
          onClick={openGoogleMaps}
        >
          {/* OpenStreetMap Static Image */}
          {coordinates ? (
            <img 
              src={getOSMStaticMapUrl()!} 
              alt="Karte"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <Building2 className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400">Karte laden...</p>
              </div>
            </div>
          )}
          
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white mb-1">{property.name}</h2>
            <p className="text-white/90 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {property.address}, {property.postalCode} {property.city}
            </p>
          </div>

          {/* Property Type Badge */}
          <Badge variant="secondary" className="absolute top-4 left-4 bg-white/95">
            {property.propertyType === 'apartment' ? 'Wohnung' : 
             property.propertyType === 'house' ? 'Haus' : 
             property.propertyType === 'commercial' ? 'Gewerbe' : 'Gemischt'}
          </Badge>

          {/* Click to open Google Maps hint */}
          <Badge variant="secondary" className="absolute top-4 right-4 bg-white/95 cursor-pointer hover:bg-white">
            <ExternalLink className="h-3 w-3 mr-1" /> Auf Google Maps öffnen
          </Badge>
        </div>

        <div className="p-6 space-y-6">
          {/* Price Section - Prominent */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 -mx-6 px-6 py-4">
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Schätzwert</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(property.estimatedValue || property.marketValue)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Kaufpreis: {formatCurrency(property.purchasePrice)} ({property.purchaseDate || 'kein Datum'})
              </div>
            </div>
          </div>

          {/* Key Facts Grid - ImmoScout Style */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
              <Ruler className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{property.totalArea}</p>
              <p className="text-xs text-muted-foreground">m² Wohnfläche</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
              <Hash className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{units.length}</p>
              <p className="text-xs text-muted-foreground">Einheiten</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{property.yearBuilt}</p>
              <p className="text-xs text-muted-foreground">Baujahr</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
              <Zap className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <Badge className={`${energyColors[property.energyClass] || 'bg-gray-400 text-white'} text-lg px-3 py-1`}>
                {property.energyClass === 'unknown' ? '?' : property.energyClass}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Energie</p>
            </div>
          </div>

          {/* Financial Overview */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Euro className="h-5 w-5 text-emerald-600" />
              Finanzdaten
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Kaltmiete/Monat</p>
                <p className="text-lg font-semibold">{formatCurrency(coldRent)}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Warmmiete/Monat</p>
                <p className="text-lg font-semibold text-emerald-600">{formatCurrency(totalRent)}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Miete pro m²</p>
                <p className="text-lg font-semibold">{property.totalArea > 0 ? (coldRent / property.totalArea).toFixed(2) : '0'} €</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Marktwert</p>
                <p className="text-lg font-semibold">{formatCurrency(property.marketValue)}</p>
              </div>
            </div>
          </div>

          {/* Units Section */}
          {units.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Home className="h-5 w-5 text-emerald-600" />
                Einheiten ({units.length})
                <Badge variant="outline" className="ml-auto">
                  {rentedUnits.length} vermietet
                </Badge>
              </h3>
              <div className="space-y-2">
                {units.map(unit => (
                  <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      {unit.status === 'rented' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{unit.unitNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {unit.area} m² · {unit.rooms} Zimmer
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {unit.status === 'rented' ? (
                        <>
                          <p className="font-semibold text-emerald-600">{formatCurrency(unit.totalRent)}/Mo.</p>
                          <p className="text-xs text-muted-foreground">Kalt: {formatCurrency(unit.baseRent)}</p>
                        </>
                      ) : (
                        <Badge variant="destructive">Leerstand</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {property.notes && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Notizen
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                {property.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={openGoogleMaps} className="flex-1">
              <MapPin className="h-4 w-4 mr-2" /> Auf Google Maps öffnen
            </Button>
            <Button onClick={onEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Edit2 className="h-4 w-4 mr-2" /> Bearbeiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN PROPERTIES SECTION
// ============================================
function PropertiesSection() {
  const store = useStore();
  const { formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'map'>('cards');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterCity, setFilterCity] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', postalCode: '',
    purchasePrice: 0, purchaseDate: '', totalArea: 0, unitsCount: 0,
    marketValue: 0, estimatedValue: 0, estimatedValueDate: '', pricePerSqm: 0,
    condition: 'good' as Property['condition'],
    energyClass: 'unknown' as Property['energyClass'],
    locationQuality: 'average' as Property['locationQuality'],
    propertyType: 'apartment' as Property['propertyType'],
    yearBuilt: new Date().getFullYear(),
    notes: '', images: [] as string[],
  });

  const filteredProperties = useMemo(() => {
    let props = [...store.properties];
    if (filterCity !== 'all') props = props.filter(p => p.city === filterCity);
    return props.sort((a, b) => a.name.localeCompare(b.name));
  }, [store.properties, filterCity]);

  const cities = useMemo(() => {
    return [...new Set(store.properties.map(p => p.city))].sort((a, b) => a.localeCompare(b));
  }, [store.properties]);

  const openNewDialog = () => {
    setEditingProperty(null);
    setFormData({
      name: '', address: '', city: '', postalCode: '',
      purchasePrice: 0, purchaseDate: '', totalArea: 0, unitsCount: 0,
      marketValue: 0, estimatedValue: 0, estimatedValueDate: '', pricePerSqm: 0,
      condition: 'good', energyClass: 'unknown', locationQuality: 'average',
      propertyType: 'apartment', yearBuilt: new Date().getFullYear(),
      notes: '', images: [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name, address: property.address, city: property.city, postalCode: property.postalCode,
      purchasePrice: property.purchasePrice, purchaseDate: property.purchaseDate,
      totalArea: property.totalArea, unitsCount: property.unitsCount,
      marketValue: property.marketValue, estimatedValue: property.estimatedValue,
      estimatedValueDate: property.estimatedValueDate, pricePerSqm: property.pricePerSqm,
      condition: property.condition, energyClass: property.energyClass,
      locationQuality: property.locationQuality, propertyType: property.propertyType,
      yearBuilt: property.yearBuilt, notes: property.notes, images: property.images,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-emerald-600" />
            Immobilien
          </h1>
          <p className="text-muted-foreground">
            {store.properties.length} Immobilien in {cities.length} {cities.length === 1 ? 'Stadt' : 'Städten'}
          </p>
        </div>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Immobilie
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-48">
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Stadt filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Städte</SelectItem>
            {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} className="rounded-none">
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-none">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              units={store.units.filter(u => u.propertyId === property.id)}
              onEdit={() => openEditDialog(property)}
              onDelete={() => { setDeletingId(property.id); setDeleteDialogOpen(true); }}
              onViewDetails={() => { setSelectedProperty(property); setDetailDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0 divide-y">
            {filteredProperties.map(property => {
              const units = store.units.filter(u => u.propertyId === property.id);
              const rented = units.filter(u => u.status === 'rented').length;
              return (
                <div key={property.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between"
                  onClick={() => { setSelectedProperty(property); setDetailDialogOpen(true); }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center"><p className="text-muted-foreground">Einheiten</p><p className="font-medium">{rented}/{units.length}</p></div>
                    <div className="text-center"><p className="text-muted-foreground">Fläche</p><p className="font-medium">{property.totalArea} m²</p></div>
                    <div className="text-center"><p className="text-muted-foreground">Wert</p><p className="font-medium text-emerald-600">{formatCurrency(property.marketValue)}</p></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {store.properties.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Immobilien</h3>
            <p className="text-muted-foreground mb-4">Fügen Sie Ihre erste Immobilie hinzu</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neue Immobilie
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <PropertyDetailDialog
        property={selectedProperty}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onEdit={() => { setDetailDialogOpen(false); if (selectedProperty) openEditDialog(selectedProperty); }}
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Immobilie bearbeiten' : 'Neue Immobilie'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Adresse *</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div><Label>PLZ</Label><Input value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} /></div>
            <div><Label>Stadt *</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
            <div><Label>Typ</Label>
              <Select value={formData.propertyType} onValueChange={(v) => setFormData({ ...formData, propertyType: v as Property['propertyType'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Wohnung</SelectItem>
                  <SelectItem value="house">Haus</SelectItem>
                  <SelectItem value="commercial">Gewerbe</SelectItem>
                  <SelectItem value="mixed">Gemischt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Baujahr</Label><Input type="number" value={formData.yearBuilt} onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) || 0 })} /></div>
            <div><Label>Kaufpreis (€)</Label><Input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Kaufdatum</Label><Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} /></div>
            <div><Label>Wohnfläche (m²)</Label><Input type="number" value={formData.totalArea} onChange={(e) => setFormData({ ...formData, totalArea: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Marktwert (€)</Label><Input type="number" value={formData.marketValue} onChange={(e) => setFormData({ ...formData, marketValue: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Schätzwert (€)</Label><Input type="number" value={formData.estimatedValue} onChange={(e) => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Energieklasse</Label>
              <Select value={formData.energyClass} onValueChange={(v) => setFormData({ ...formData, energyClass: v as Property['energyClass'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unbekannt</SelectItem>
                  {['A','B','C','D','E','F','G','H'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Notizen</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Immobilie löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PropertiesSection;
