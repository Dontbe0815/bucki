'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Package,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  User,
  MapPin,
  Phone,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/lib/store';
import {
  calculateAnlageVSummary,
  calculateAnlageVForProperty,
  type AnlageVProperty,
  type AnlageVSummary,
} from '@/lib/tax/anlageV';
import { AnlageVForm } from './AnlageVForm';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Steuerpflichtiger {
  name: string;
  vorname: string;
  strasse: string;
  plz: string;
  ort: string;
  steuerId: string;
}

export function TaxFormGenerator() {
  const { formatCurrency, t } = useI18n();
  const store = useStore();
  
  // State
  const [steuerjahr, setSteuerjahr] = useState(new Date().getFullYear() - 1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [showSteuerpflichtigerDialog, setShowSteuerpflichtigerDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Steuerpflichtiger Daten
  const [steuerpflichtiger, setSteuerpflichtiger] = useState<Steuerpflichtiger>({
    name: '',
    vorname: '',
    strasse: '',
    plz: '',
    ort: '',
    steuerId: '',
  });
  
  // Verfügbare Steuerjahre
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 1; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  }, []);
  
  // Berechne Anlage V Daten
  const anlageVData = useMemo(() => {
    if (store.properties.length === 0) return null;
    
    const summary = calculateAnlageVSummary(
      store.properties,
      store.transactions,
      store.depreciationItems,
      steuerjahr
    );
    
    return summary;
  }, [store.properties, store.transactions, store.depreciationItems, steuerjahr]);
  
  // Ausgewählte Immobilie
  const selectedPropertyData = useMemo(() => {
    if (!anlageVData || selectedPropertyId === 'all') return null;
    return anlageVData.properties.find(p => p.propertyId === selectedPropertyId);
  }, [anlageVData, selectedPropertyId]);
  
  // PDF Export Handler
  const handleExportPdf = useCallback(async (propertyData?: AnlageVProperty) => {
    // Prüfe ob Steuerpflichtiger-Daten vorhanden
    if (!steuerpflichtiger.name || !steuerpflichtiger.steuerId) {
      setShowSteuerpflichtigerDialog(true);
      return;
    }
    
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      const data = propertyData || selectedPropertyData || anlageVData?.properties[0];
      
      if (!data) {
        throw new Error('Keine Daten zum Exportieren');
      }
      
      const response = await fetch('/api/tax/anlage-v', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pdf',
          data: {
            propertyData: data,
            steuerjahr,
            steuerpflichtiger,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('PDF-Generierung fehlgeschlagen');
      }
      
      const result = await response.json();
      
      // PDF herunterladen
      const pdfBlob = await fetch(`data:application/pdf;base64,${result.pdf}`).then(r => r.blob());
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [steuerpflichtiger, selectedPropertyData, anlageVData, steuerjahr]);
  
  // Paket-Export Handler
  const handleExportPackage = useCallback(async () => {
    if (!steuerpflichtiger.name || !steuerpflichtiger.steuerId) {
      setShowSteuerpflichtigerDialog(true);
      return;
    }
    
    if (!anlageVData) return;
    
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/tax/anlage-v', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-package',
          data: {
            properties: store.properties,
            transactions: store.transactions,
            depreciationItems: store.depreciationItems,
            year: steuerjahr,
            steuerpflichtiger,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Paket-Generierung fehlgeschlagen');
      }
      
      const result = await response.json();
      
      // PDF herunterladen
      const pdfBlob = await fetch(`data:application/pdf;base64,${result.pdf}`).then(r => r.blob());
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Package export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [steuerpflichtiger, anlageVData, store, steuerjahr]);
  
  // Steuerpflichtiger validieren
  const isSteuerpflichtigerValid = useMemo(() => {
    return steuerpflichtiger.name && steuerpflichtiger.steuerId;
  }, [steuerpflichtiger]);
  
  // Wenn keine Immobilien vorhanden
  if (store.properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Immobilien vorhanden</h3>
            <p className="text-muted-foreground">
              Fügen Sie zuerst Immobilien hinzu, um Steuerformulare zu generieren.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header mit Steuerjahr-Auswahl */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Steuerformular-Generierung
              </CardTitle>
              <CardDescription>
                Erstellen Sie Anlage V Formulare für Ihre Immobilien
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={steuerjahr.toString()}
                  onValueChange={(value) => setSteuerjahr(parseInt(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        Steuerjahr {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Immobilie auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Immobilien</SelectItem>
                  {store.properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Steuerpflichtiger Info */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {steuerpflichtiger.name 
                    ? `${steuerpflichtiger.vorname} ${steuerpflichtiger.name}`
                    : 'Steuerpflichtiger nicht angegeben'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {steuerpflichtiger.steuerId 
                    ? `Steuernummer: ${steuerpflichtiger.steuerId}`
                    : 'Bitte geben Sie Ihre Daten ein'}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowSteuerpflichtigerDialog(true)}
            >
              {steuerpflichtiger.name ? 'Bearbeiten' : 'Angeben'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Zusammenfassung */}
      {anlageVData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zusammenfassung Steuerjahr {steuerjahr}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <SummaryCard
                label="Bruttoeinnahmen"
                value={anlageVData.gesamtBruttoeinnahmen}
                formatCurrency={formatCurrency}
                trend={anlageVData.veraenderung.einnahmen}
              />
              <SummaryCard
                label="Nettoeinnahmen"
                value={anlageVData.gesamtNettoeinnahmen}
                formatCurrency={formatCurrency}
              />
              <SummaryCard
                label="Werbungskosten"
                value={anlageVData.gesamtWerbungskosten}
                formatCurrency={formatCurrency}
                trend={anlageVData.veraenderung.ausgaben}
                isExpense
              />
              <SummaryCard
                label="Überschuss"
                value={anlageVData.gesamtUeberschuss}
                formatCurrency={formatCurrency}
                trend={anlageVData.veraenderung.ueberschuss}
                isHighlight
              />
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-muted-foreground text-xs">Immobilien</Label>
                <div className="text-2xl font-bold mt-1">{anlageVData.properties.length}</div>
              </div>
            </div>
            
            {/* Export Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                onClick={() => handleExportPdf()}
                disabled={isExporting || !isSteuerpflichtigerValid}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : exportSuccess ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {exportSuccess ? 'Exportiert!' : 'Einzelnes Formular'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportPackage}
                disabled={isExporting || !isSteuerpflichtigerValid || store.properties.length < 2}
              >
                <Package className="mr-2 h-4 w-4" />
                Alle als Paket exportieren
              </Button>
              
              {!isSteuerpflichtigerValid && (
                <Badge variant="secondary" className="self-center">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Bitte erst Steuerpflichtiger angeben
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Anlage V Formulare */}
      {selectedPropertyId === 'all' && anlageVData ? (
        <Tabs defaultValue={anlageVData.properties[0]?.propertyId}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {anlageVData.properties.map((p) => (
              <TabsTrigger key={p.propertyId} value={p.propertyId}>
                {p.propertyName}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {anlageVData.properties.map((propertyData) => (
            <TabsContent key={propertyData.propertyId} value={propertyData.propertyId}>
              <AnlageVForm
                propertyData={propertyData}
                onExportPdf={() => handleExportPdf(propertyData)}
                isExporting={isExporting}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : selectedPropertyData ? (
        <AnlageVForm
          propertyData={selectedPropertyData}
          onExportPdf={() => handleExportPdf(selectedPropertyData)}
          isExporting={isExporting}
        />
      ) : null}
      
      {/* Steuerpflichtiger Dialog */}
      <Dialog open={showSteuerpflichtigerDialog} onOpenChange={setShowSteuerpflichtigerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Angaben zum Steuerpflichtigen</DialogTitle>
            <DialogDescription>
              Diese Daten werden für die Anlage V Formulare benötigt.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vorname">Vorname</Label>
                <Input
                  id="vorname"
                  value={steuerpflichtiger.vorname}
                  onChange={(e) => setSteuerpflichtiger(prev => ({ ...prev, vorname: e.target.value }))}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nachname</Label>
                <Input
                  id="name"
                  value={steuerpflichtiger.name}
                  onChange={(e) => setSteuerpflichtiger(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mustermann"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strasse">Straße, Hausnummer</Label>
              <Input
                id="strasse"
                value={steuerpflichtiger.strasse}
                onChange={(e) => setSteuerpflichtiger(prev => ({ ...prev, strasse: e.target.value }))}
                placeholder="Musterstraße 123"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={steuerpflichtiger.plz}
                  onChange={(e) => setSteuerpflichtiger(prev => ({ ...prev, plz: e.target.value }))}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={steuerpflichtiger.ort}
                  onChange={(e) => setSteuerpflichtiger(prev => ({ ...prev, ort: e.target.value }))}
                  placeholder="Musterstadt"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="steuerId">Steuer-Identifikationsnummer</Label>
              <Input
                id="steuerId"
                value={steuerpflichtiger.steuerId}
                onChange={(e) => setSteuerpflichtiger(prev => ({ ...prev, steuerId: e.target.value }))}
                placeholder="12 345 678 901"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSteuerpflichtigerDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => setShowSteuerpflichtigerDialog(false)}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Hilfskomponenten
function SummaryCard({
  label,
  value,
  formatCurrency,
  trend,
  isExpense = false,
  isHighlight = false,
}: {
  label: string;
  value: number;
  formatCurrency: (amount: number) => string;
  trend?: number;
  isExpense?: boolean;
  isHighlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg ${isHighlight ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-muted'}`}>
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs">{label}</Label>
        {trend !== undefined && trend !== 0 && (
          <Badge
            variant="outline"
            className={`text-xs ${
              trend > 0
                ? isExpense
                  ? 'text-red-600 border-red-200'
                  : 'text-emerald-600 border-emerald-200'
                : isExpense
                  ? 'text-emerald-600 border-emerald-200'
                  : 'text-red-600 border-red-200'
            }`}
          >
            {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </Badge>
        )}
      </div>
      <div className={`text-xl font-bold mt-1 ${isHighlight ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

export default TaxFormGenerator;
