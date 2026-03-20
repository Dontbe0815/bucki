'use client';

import { useState, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import type { AnlageVProperty, PlausibilitaetsErgebnis } from '@/lib/tax/anlageV';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AnlageVFormProps {
  propertyData: AnlageVProperty;
  onExportPdf?: () => void;
  isExporting?: boolean;
}

export function AnlageVForm({
  propertyData,
  onExportPdf,
  isExporting = false,
}: AnlageVFormProps) {
  const { formatCurrency } = useI18n();
  const [showDetails, setShowDetails] = useState(false);
  const [showAfaDetails, setShowAfaDetails] = useState(false);

  // Plausibilitätsprüfung-Statistik
  const plausibilitaetStats = useMemo(() => {
    const errors = propertyData.plausibilitaet.filter(p => p.type === 'error');
    const warnings = propertyData.plausibilitaet.filter(p => p.type === 'warning');
    const infos = propertyData.plausibilitaet.filter(p => p.type === 'info');
    return { errors, warnings, infos };
  }, [propertyData.plausibilitaet]);

  // Vorjahresvergleich berechnen
  const vorjahrComparison = useMemo(() => {
    if (!propertyData.vorjahr) return null;
    
    const einnahmenChange = propertyData.vorjahr.brutoeinnahmen > 0
      ? ((propertyData.brutoeinnahmen - propertyData.vorjahr.brutoeinnahmen) / propertyData.vorjahr.brutoeinnahmen) * 100
      : 0;
    
    const werbungskostenChange = propertyData.vorjahr.summeWerbungskosten > 0
      ? ((propertyData.summeWerbungskosten - propertyData.vorjahr.summeWerbungskosten) / propertyData.vorjahr.summeWerbungskosten) * 100
      : 0;
    
    const ueberschussChange = propertyData.vorjahr.ueberschuss !== 0
      ? ((propertyData.ueberschuss - propertyData.vorjahr.ueberschuss) / Math.abs(propertyData.vorjahr.ueberschuss)) * 100
      : 0;
    
    return {
      einnahmenChange,
      werbungskostenChange,
      ueberschussChange,
    };
  }, [propertyData]);

  // Trend-Icon rendern
  const renderTrendIcon = (change: number) => {
    if (Math.abs(change) < 2) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anlage V - {propertyData.propertyName}
            </CardTitle>
            <CardDescription>
              Steuerjahr {propertyData.steuerjahr} • {propertyData.address}, {propertyData.plz} {propertyData.ort}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Weniger' : 'Details'}
              {showDetails ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
            <Button
              onClick={onExportPdf}
              disabled={isExporting}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Plausibilitätsprüfung */}
        {propertyData.plausibilitaet.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              Plausibilitätsprüfung
            </div>
            <div className="flex flex-wrap gap-2">
              {plausibilitaetStats.errors.length > 0 && (
                <Badge variant="destructive">
                  {plausibilitaetStats.errors.length} Fehler
                </Badge>
              )}
              {plausibilitaetStats.warnings.length > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {plausibilitaetStats.warnings.length} Warnungen
                </Badge>
              )}
              {plausibilitaetStats.infos.length > 0 && (
                <Badge variant="outline">
                  {plausibilitaetStats.infos.length} Hinweise
                </Badge>
              )}
            </div>
            
            {showDetails && (
              <div className="mt-3 space-y-2">
                {propertyData.plausibilitaet.map((p, index) => (
                  <PlausibilitaetItem key={index} item={p} formatCurrency={formatCurrency} />
                ))}
              </div>
            )}
          </div>
        )}
        
        <Separator />
        
        {/* Einnahmen */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Einnahmen
            {vorjahrComparison && (
              <Badge variant="outline" className="font-normal">
                {vorjahrComparison.einnahmenChange >= 0 ? '+' : ''}
                {vorjahrComparison.einnahmenChange.toFixed(1)}% vs. Vorjahr
                {renderTrendIcon(vorjahrComparison.einnahmenChange)}
              </Badge>
            )}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">Zeile 7: Bruttoeinnahmen</Label>
              <div className="text-xl font-semibold text-emerald-600">
                {formatCurrency(propertyData.brutoeinnahmen)}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">Zeile 8: Mietausfall</Label>
              <div className="text-xl font-semibold text-red-600">
                -{formatCurrency(propertyData.mietausfall)}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">Zeile 9: Nettoeinnahmen</Label>
              <div className="text-xl font-semibold">
                {formatCurrency(propertyData.nettoeinnahmen)}
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Werbungskosten */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Werbungskosten
            {vorjahrComparison && (
              <Badge variant="outline" className="font-normal">
                {vorjahrComparison.werbungskostenChange >= 0 ? '+' : ''}
                {vorjahrComparison.werbungskostenChange.toFixed(1)}% vs. Vorjahr
                {renderTrendIcon(vorjahrComparison.werbungskostenChange)}
              </Badge>
            )}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <WerbungskostenCard
              label="AfA Gebäude"
              amount={propertyData.wohnungskosten.afaGebaeude}
              formatCurrency={formatCurrency}
            />
            <WerbungskostenCard
              label="AfA Einrichtung"
              amount={propertyData.wohnungskosten.afaEinrichtung}
              formatCurrency={formatCurrency}
            />
            <WerbungskostenCard
              label="Grundsteuer"
              amount={propertyData.wohnungskosten.grundsteuer}
              formatCurrency={formatCurrency}
            />
            <WerbungskostenCard
              label="Versicherung"
              amount={propertyData.wohnungskosten.gebaeudeversicherung}
              formatCurrency={formatCurrency}
            />
            <WerbungskostenCard
              label="Hausverwaltung"
              amount={propertyData.wohnungskosten.hausverwaltung}
              formatCurrency={formatCurrency}
            />
            <WerbungskostenCard
              label="Reparaturen"
              amount={propertyData.wohnungskosten.reparaturen}
              formatCurrency={formatCurrency}
            />
            <WerbungskostenCard
              label="Kreditzinsen"
              amount={propertyData.wohnungskosten.kreditzinsen}
              formatCurrency={formatCurrency}
            />
            <WerbungskostenCard
              label="Sonstige"
              amount={propertyData.wohnungskosten.sonstige + propertyData.wohnungskosten.sonstigeBetriebskosten}
              formatCurrency={formatCurrency}
            />
          </div>
          
          {showDetails && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(propertyData.wohnungskosten).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="capitalize">{formatLabel(key)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(value)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>Summe Werbungskosten</TableCell>
                    <TableCell className="text-right">{formatCurrency(propertyData.summeWerbungskosten)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Überschuss */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Überschussrechnung
            {vorjahrComparison && (
              <Badge variant="outline" className="font-normal">
                {vorjahrComparison.ueberschussChange >= 0 ? '+' : ''}
                {vorjahrComparison.ueberschussChange.toFixed(1)}% vs. Vorjahr
                {renderTrendIcon(vorjahrComparison.ueberschussChange)}
              </Badge>
            )}
          </h3>
          
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Nettoeinnahmen</span>
              <span className="font-medium">{formatCurrency(propertyData.nettoeinnahmen)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">- Werbungskosten</span>
              <span className="font-medium text-red-600">-{formatCurrency(propertyData.summeWerbungskosten)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Zeile 39: Überschuss der Einkünfte</span>
              <span className={`text-xl font-bold ${propertyData.ueberschuss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(propertyData.ueberschuss)}
              </span>
            </div>
          </div>
        </div>
        
        {/* AfA-Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">AfA-Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAfaDetails(!showAfaDetails)}
            >
              {showAfaDetails ? 'Ausblenden' : 'Anzeigen'}
            </Button>
          </div>
          
          {showAfaDetails && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Anschaffungskosten</Label>
                <div className="font-medium">{formatCurrency(propertyData.afaDetails.gebaeudeAnschaffungskosten)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Grund und Boden</Label>
                <div className="font-medium">{formatCurrency(propertyData.afaDetails.grundUndBoden)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Gebäudeanteil</Label>
                <div className="font-medium">{formatCurrency(propertyData.afaDetails.gebaeudeanteil)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">AfA-Satz</Label>
                <div className="font-medium">{propertyData.afaDetails.afaSatz}% p.a.</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Jahres-AfA</Label>
                <div className="font-medium text-blue-600">{formatCurrency(propertyData.afaDetails.afaBetrag)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Restbuchwert</Label>
                <div className="font-medium">{formatCurrency(propertyData.afaDetails.restbuchwert)}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hilfskomponenten
function WerbungskostenCard({
  label,
  amount,
  formatCurrency,
}: {
  label: string;
  amount: number;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="font-semibold mt-1">{formatCurrency(amount)}</div>
    </div>
  );
}

function PlausibilitaetItem({
  item,
  formatCurrency,
}: {
  item: PlausibilitaetsErgebnis;
  formatCurrency: (amount: number) => string;
}) {
  const icons = {
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };
  
  const bgColors = {
    error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  };
  
  return (
    <div className={`flex items-start gap-2 p-2 rounded border ${bgColors[item.type]}`}>
      {icons[item.type]}
      <div className="flex-1">
        <p className="text-sm">{item.message}</p>
        {item.vorjahrValue !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Vorjahr: {formatCurrency(item.vorjahrValue)} → Aktuell: {formatCurrency(item.currentValue)}
          </p>
        )}
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    erhaltungsaufwand: 'Erhaltungsaufwand',
    afaGebaeude: 'AfA Gebäude',
    afaEinrichtung: 'AfA Einrichtung',
    grundsteuer: 'Grundsteuer',
    gebaeudeversicherung: 'Gebäudeversicherung',
    hausverwaltung: 'Hausverwaltung',
    wassergebuehren: 'Wassergebühren',
    strassenreinigung: 'Straßenreinigung',
    muellabfuhr: 'Müllabfuhr',
    schornsteinfeger: 'Schornsteinfeger',
    sonstigeBetriebskosten: 'Sonstige Betriebskosten',
    reparaturen: 'Reparaturen',
    kreditzinsen: 'Kreditzinsen',
    sonstige: 'Sonstige',
  };
  
  return labels[key] || key;
}

export default AnlageVForm;
