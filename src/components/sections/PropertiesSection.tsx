'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus, Edit2, Trash2, MapPin, ExternalLink, Building2, Loader2, 
  Grid, Map, List, Eye, BedDouble, Ruler, Euro, Calendar,
  TrendingUp, Home, ChevronRight, Layers, Image
} from 'lucide-react';
import { geocodeAddressCached, getStreetViewUrl, getMapsUrl } from '@/lib/geocoding';

// Property Card Component - ImmoScout Style
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
  const [loadingStreetView, setLoadingStreetView] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const rentedUnits = units.filter(u => u.status === 'rented').length;
  const vacancyRate = units.length > 0 ? ((units.length - rentedUnits) / units.length * 100).toFixed(0) : '0';
  const totalRent = units.reduce((sum, u) => sum + (u.status === 'rented' ? u.totalRent : 0), 0);
  const rentPerSqm = property.totalArea > 0 ? (totalRent / property.totalArea).toFixed(2) : '0';
  
  // Load coordinates for OpenStreetMap
  useEffect(() => {
    let isMounted = true;
    const loadCoordinates = async () => {
      try {
        // Build full address string
        const fullAddress = [
          property.address,
          property.postalCode,
          property.city
        ].filter(Boolean).join(', ');
        
        if (!fullAddress) {
          if (isMounted) setMapError(true);
          return;
        }
        
        const result = await geocodeAddressCached(
          property.address || '',
          property.postalCode || '',
          property.city || ''
        );
        
        if (isMounted) {
          if (result) {
            setCoordinates({ lat: result.lat, lon: result.lon });
            setTimeout(() => setMapLoaded(true), 200);
          } else {
            setMapError(true);
          }
        }
      } catch (error) {
        console.error('Error loading coordinates:', error);
        if (isMounted) setMapError(true);
      }
    };
    loadCoordinates();
    return () => { isMounted = false; };
  }, [property.address, property.postalCode, property.city]);

  // Google Maps link
  const getGoogleMapsUrl = () => {
    const query = encodeURIComponent(`${property.address}, ${property.postalCode} ${property.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };
  
  // Energy class color mapping
  const getEnergyColor = (energyClass: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-500 text-white',
      'B': 'bg-green-400 text-white',
      'C': 'bg-yellow-400 text-black',
      'D': 'bg-yellow-500 text-black',
      'E': 'bg-orange-400 text-white',
      'F': 'bg-orange-500 text-white',
      'G': 'bg-red-500 text-white',
      'H': 'bg-red-600 text-white',
      'unknown': 'bg-gray-400 text-white',
    };
    return colors[energyClass] || colors['unknown'];
  };

  const handleOpenGoogleMaps = () => {
    window.open(getGoogleMapsUrl(), '_blank');
  };

  const handleOpenStreetView = async () => {
    setLoadingStreetView(true);
    try {
      if (coordinates) {
        window.open(getStreetViewUrl(coordinates.lat, coordinates.lon), '_blank');
      } else {
        window.open(getGoogleMapsUrl(), '_blank');
        toast.warning('Street View nicht verfügbar');
      }
    } catch (error) {
      toast.error('Fehler beim Öffnen von Street View');
    } finally {
      setLoadingStreetView(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
      {/* OpenStreetMap Preview */}
      <div 
        className="h-48 bg-gradient-to-br from-emerald-400 to-emerald-600 relative overflow-hidden"
        onClick={onViewDetails}
      >
        {coordinates && mapLoaded ? (
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lon - 0.003}%2C${coordinates.lat - 0.002}%2C${coordinates.lon + 0.003}%2C${coordinates.lat + 0.002}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`}
            className="w-full h-full border-0"
            loading="lazy"
            title={`Karte: ${property.name}`}
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500">
            <div className="text-center text-white">
              <MapPin className="h-12 w-12 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Karte wird geladen...</p>
            </div>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
          <Badge variant="outline" className="bg-white/90 text-gray-900 backdrop-blur-sm">
            {property.propertyType === 'apartment' && 'Wohnung'}
            {property.propertyType === 'house' && 'Haus'}
            {property.propertyType === 'commercial' && 'Gewerbe'}
            {property.propertyType === 'mixed' && 'Gemischt'}
          </Badge>
          {/* Energy Badge */}
          <Badge className={`${getEnergyColor(property.energyClass)} font-bold px-3 py-1`}>
            {property.energyClass === 'unknown' ? '?' : property.energyClass}
          </Badge>
        </div>
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">{property.name}</h3>
          <p className="text-white/90 text-sm flex items-center gap-1 drop-shadow">
            <MapPin className="h-3 w-3" />
            {property.address}, {property.postalCode} {property.city}
          </p>
        </div>

        {/* Quick Actions on Hover */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={(e) => { e.stopPropagation(); handleOpenStreetView(); }}
            disabled={loadingStreetView}
            title="Street View öffnen"
          >
            {loadingStreetView ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={(e) => { e.stopPropagation(); handleOpenGoogleMaps(); }}
            title="In Google Maps öffnen"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Bearbeiten"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {/* Quick Stats - ImmoScout style */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-muted rounded-lg">
            <Ruler className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Fläche</p>
            <p className="font-bold text-sm">{property.totalArea} m²</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <BedDouble className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Einheiten</p>
            <p className="font-bold text-sm">{rentedUnits}/{units.length}</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <Euro className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">m²-Miete</p>
            <p className="font-bold text-sm">{rentPerSqm}€</p>
          </div>
        </div>

        {/* Price Info */}
        <div className="flex justify-between items-center py-3 border-t border-b mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Kaufpreis</p>
            <p className="font-semibold">{formatCurrency(property.purchasePrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Marktwert</p>
            <p className="font-semibold text-emerald-600">{formatCurrency(property.marketValue)}</p>
          </div>
        </div>

        {/* Schätzwert Highlight */}
        <div className="bg-purple-50 dark:bg-purple-950/50 -mx-4 px-4 py-3 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-purple-700 dark:text-purple-300 font-medium">Schätzwert</span>
            <span className="font-bold text-purple-700 dark:text-purple-300 text-lg">
              {formatCurrency(property.estimatedValue || property.marketValue)}
            </span>
          </div>
          {(property.estimatedValue || property.marketValue) > property.purchasePrice && (
            <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
              <TrendingUp className="h-3 w-3" />
              +{(((property.estimatedValue || property.marketValue) - property.purchasePrice) / property.purchasePrice * 100).toFixed(1)}% seit Kauf
            </div>
          )}
        </div>

        {/* Vacancy Indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Leerstand</span>
          <Badge variant={parseInt(vacancyRate) > 0 ? 'destructive' : 'default'}>
            {vacancyRate}%
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onViewDetails}
          >
            <Eye className="h-4 w-4 mr-1" /> Details
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpenGoogleMaps}
            title="In Google Maps öffnen"
          >
            <MapPin className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Map View Component
function MapView({ properties }: { properties: Property[] }) {
  const [coordinates, setCoordinates] = useState<Record<string, { lat: number; lon: number }>>({});

  // Geocode all properties on mount
  useMemo(() => {
    properties.forEach(async (property) => {
      if (!coordinates[property.id]) {
        const result = await geocodeAddressCached(property.address, property.postalCode, property.city);
        if (result) {
          setCoordinates(prev => ({
            ...prev,
            [property.id]: { lat: result.lat, lon: result.lon }
          }));
        }
      }
    });
  }, [properties]);

  // Group by city
  const cityGroups = useMemo(() => {
    const groups: Record<string, Property[]> = {};
    properties.forEach(p => {
      if (!groups[p.city]) groups[p.city] = [];
      groups[p.city].push(p);
    });
    return groups;
  }, [properties]);

  return (
    <Card className="h-[600px] relative overflow-hidden">
      {/* Map Placeholder - Would integrate with actual map library */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-900">
        {/* City Markers */}
        {Object.entries(cityGroups).map(([city, props]) => (
          <div 
            key={city}
            className="absolute cursor-pointer"
            style={{ 
              left: `${Math.random() * 70 + 15}%`, 
              top: `${Math.random() * 60 + 20}%` 
            }}
          >
            <div className="relative group">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform">
                {props.length}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white dark:bg-gray-800 rounded shadow-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {city}
              </div>
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 p-3 rounded-lg shadow-lg">
          <h4 className="font-medium mb-2 text-sm">Legende</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
              <span>Immobilien-Standorte</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Anzahl = Immobilien pro Stadt</span>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <div className="absolute top-4 left-4 right-4 bg-white/90 dark:bg-gray-800/90 p-3 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="h-4 w-4 inline mr-1" />
            Klicken Sie auf einen Marker, um die Immobilien in dieser Stadt zu sehen.
            {properties.length === 0 && ' Fügen Sie Immobilien hinzu, um sie auf der Karte zu sehen.'}
          </p>
        </div>

        {/* Open in Google Maps Button */}
        <div className="absolute top-4 right-4">
          <Button 
            variant="secondary" 
            onClick={() => window.open('https://www.google.com/maps', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Maps
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Property Detail Dialog
function PropertyDetailDialog({ 
  property, 
  open, 
  onClose,
  onEdit 
}: { 
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { formatCurrency } = useI18n();
  const store = useStore();
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  
  // Load coordinates for map
  useEffect(() => {
    if (property && open) {
      const loadCoordinates = async () => {
        try {
          const result = await geocodeAddressCached(property.address, property.postalCode, property.city);
          if (result) {
            setCoordinates({ lat: result.lat, lon: result.lon });
          }
        } catch (error) {
          console.error('Error loading coordinates:', error);
        }
      };
      loadCoordinates();
    }
  }, [property, open]);
  
  if (!property) return null;
  
  const units = store.units.filter(u => u.propertyId === property.id);
  const rentedUnits = units.filter(u => u.status === 'rented').length;

  // Generate OpenStreetMap embed URL
  const getOsmEmbedUrl = () => {
    if (coordinates) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lon - 0.005}%2C${coordinates.lat - 0.003}%2C${coordinates.lon + 0.005}%2C${coordinates.lat + 0.003}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`;
    }
    const query = encodeURIComponent(`${property.address}, ${property.postalCode} ${property.city}`);
    return `https://www.openstreetmap.org/export/embed.html?query=${query}&layer=mapnik`;
  };

  // Google Maps link
  const getGoogleMapsUrl = () => {
    const query = encodeURIComponent(`${property.address}, ${property.postalCode} ${property.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const handleOpenGoogleMaps = () => {
    window.open(getGoogleMapsUrl(), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{property.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {property.address}, {property.postalCode} {property.city}
            <Button 
              variant="link" 
              size="sm" 
              className="ml-2 p-0 h-auto"
              onClick={handleOpenGoogleMaps}
            >
              <ExternalLink className="h-3 w-3 mr-1" /> In Google Maps öffnen
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OpenStreetMap Karte */}
          <div className="h-64 rounded-lg overflow-hidden border relative">
            <iframe
              src={getOsmEmbedUrl()}
              className="w-full h-full border-0"
              loading="lazy"
              title={`Karte: ${property.name}`}
            />
            {/* Google Maps Button Overlay */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2 bg-white/90 hover:bg-white"
              onClick={handleOpenGoogleMaps}
            >
              <ExternalLink className="h-4 w-4 mr-1" /> Google Maps
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-500">Kaufpreis</p>
                  <p className="text-xl font-bold">{formatCurrency(property.purchasePrice)}</p>
                  <p className="text-xs text-gray-400">{property.purchaseDate || 'Kein Datum'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-500">Marktwert</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(property.marketValue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-500">Schätzwert</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(property.estimatedValue || property.marketValue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-500">Wohnfläche</p>
                  <p className="text-xl font-bold">{property.totalArea} m²</p>
                  <p className="text-xs text-gray-400">{(property.pricePerSqm || 0).toLocaleString('de-DE')} €/m²</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">{property.propertyType === 'apartment' ? 'Wohnung' : property.propertyType === 'house' ? 'Haus' : 'Gewerbe'}</Badge>
              <Badge variant="outline">Baujahr {property.yearBuilt}</Badge>
              <Badge variant="outline">Energie {property.energyClass === 'unknown' ? '?' : property.energyClass}</Badge>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Vermietungsquote</span>
                <span className="font-bold">{rentedUnits}/{units.length} Einheiten ({units.length > 0 ? (rentedUnits/units.length*100).toFixed(0) : 0}%)</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all" 
                  style={{ width: `${units.length > 0 ? (rentedUnits/units.length*100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Units Table */}
        {units.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Einheiten ({units.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {units.map(unit => (
                <Card key={unit.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{unit.unitNumber}</p>
                      <p className="text-sm text-gray-500">{unit.area} m², {unit.rooms} Zimmer</p>
                    </div>
                    <Badge variant={unit.status === 'rented' ? 'default' : 'destructive'}>
                      {unit.status === 'rented' ? 'Vermietet' : 'Leer'}
                    </Badge>
                  </div>
                  {unit.status === 'rented' && (
                    <p className="text-emerald-600 font-semibold mt-2">
                      {formatCurrency(unit.totalRent)}/Monat
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {property.notes && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Notizen</h4>
            <p className="text-gray-600 dark:text-gray-300">{property.notes}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleOpenGoogleMaps}>
            <MapPin className="h-4 w-4 mr-2" /> Google Maps öffnen
          </Button>
          <Button variant="outline" onClick={onClose}>Schließen</Button>
          <Button onClick={onEdit} className="bg-emerald-600 hover:bg-emerald-700">
            <Edit2 className="h-4 w-4 mr-2" /> Bearbeiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Properties Section
function PropertiesSection() {
  const store = useStore();
  const { t, formatCurrency, language } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'map'>('cards');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterCity, setFilterCity] = useState<string>('all');
  
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

  // Filter properties
  const filteredProperties = useMemo(() => {
    let props = [...store.properties];
    if (filterCity !== 'all') {
      props = props.filter(p => p.city === filterCity);
    }
    return props.sort((a, b) => a.name.localeCompare(b.name));
  }, [store.properties, filterCity]);

  // Group properties by city (alphabetically), then by street
  const propertiesByCityAndStreet = useMemo(() => {
    const cityGroups: Record<string, Record<string, Property[]>> = {};
    
    filteredProperties.forEach(p => {
      // Extract street from address (e.g., "Hauptstraße 5" -> "Hauptstraße")
      const streetMatch = p.address.match(/^(.+?)\s+\d+/);
      const street = streetMatch ? streetMatch[1] : p.address;
      
      if (!cityGroups[p.city]) {
        cityGroups[p.city] = {};
      }
      if (!cityGroups[p.city][street]) {
        cityGroups[p.city][street] = [];
      }
      cityGroups[p.city][street].push(p);
    });
    
    // Sort cities alphabetically and streets within each city
    const sortedCityGroups: Record<string, Record<string, Property[]>> = {};
    Object.keys(cityGroups).sort((a, b) => a.localeCompare(b)).forEach(city => {
      sortedCityGroups[city] = {};
      Object.keys(cityGroups[city]).sort((a, b) => a.localeCompare(b)).forEach(street => {
        sortedCityGroups[city][street] = cityGroups[city][street];
      });
    });
    
    return sortedCityGroups;
  }, [filteredProperties]);

  // Simple city list for filter (sorted alphabetically)
  const cities = useMemo(() => {
    return Object.keys(propertiesByCityAndStreet).sort((a, b) => a.localeCompare(b));
  }, [propertiesByCityAndStreet]);

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

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-8 w-8 text-emerald-600" />
            Immobilien
          </h1>
          <p className="text-muted-foreground mt-1">
            {store.properties.length} Immobilien in {cities.length} {cities.length === 1 ? 'Stadt' : 'Städten'}
          </p>
        </div>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Immobilie
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-48">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Stadt filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Städte</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button 
            variant={viewMode === 'cards' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('cards')}
            className="rounded-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-none"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'map' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('map')}
            className="rounded-none"
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <MapView properties={filteredProperties} />
      )}

      {/* Cards View - Grouped by City (alphabetically), then by Street */}
      {viewMode === 'cards' && (
        <div className="space-y-8">
          {Object.entries(propertiesByCityAndStreet).map(([city, streets]) => (
            <div key={city}>
              {/* City Header */}
              <div className="flex items-center gap-2 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">{city}</h2>
                <Badge variant="secondary">
                  {Object.values(streets).flat().length} Immobilien
                </Badge>
              </div>
              
              {/* Streets within City */}
              <div className="space-y-6">
                {Object.entries(streets).map(([street, properties]) => (
                  <div key={street}>
                    {/* Street Header */}
                    <div className="flex items-center gap-2 mb-3 pl-2 border-l-4 border-emerald-500">
                      <h3 className="text-lg font-medium text-muted-foreground">{street}</h3>
                      <Badge variant="outline" className="text-xs">{properties.length}</Badge>
                    </div>
                    
                    {/* Property Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {properties.map((property) => {
                        const units = store.units.filter(u => u.propertyId === property.id);
                        return (
                          <PropertyCard
                            key={property.id}
                            property={property}
                            units={units}
                            onEdit={() => openEditDialog(property)}
                            onDelete={() => {
                              setDeletingId(property.id);
                              setDeleteDialogOpen(true);
                            }}
                            onViewDetails={() => handleViewDetails(property)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredProperties.map((property) => {
                const units = store.units.filter(u => u.propertyId === property.id);
                const rentedUnits = units.filter(u => u.status === 'rented').length;
                return (
                  <div 
                    key={property.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between"
                    onClick={() => handleViewDetails(property)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-sm text-gray-500">{property.address}, {property.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500">Einheiten</p>
                        <p className="font-medium">{rentedUnits}/{units.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Fläche</p>
                        <p className="font-medium">{property.totalArea} m²</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Wert</p>
                        <p className="font-medium text-emerald-600">{formatCurrency(property.marketValue)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {store.properties.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Immobilien</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihre erste Immobilie hinzu, um zu starten</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neue Immobilie
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Property Detail Dialog */}
      <PropertyDetailDialog
        property={selectedProperty}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onEdit={() => {
          setDetailDialogOpen(false);
          if (selectedProperty) openEditDialog(selectedProperty);
        }}
      />

      {/* Property Form Dialog */}
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
              <Label htmlFor="energyClass">Energieklasse</Label>
              <Select 
                value={formData.energyClass} 
                onValueChange={(value: Property['energyClass']) => setFormData({ ...formData, energyClass: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unbekannt</SelectItem>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div>
              <Label htmlFor="estimatedValue">Schätzwert (€)</Label>
              <Input 
                id="estimatedValue" 
                type="number" 
                value={formData.estimatedValue} 
                onChange={(e) => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) || 0 })}
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
