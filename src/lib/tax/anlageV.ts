// Anlage V - Einkünfte aus Vermietung und Verpachtung
// Berechnungslogik für das deutsche Steuerformular

import type { Property, Unit, Transaction, DepreciationItem, Tenant } from '@/lib/types';
import { z } from 'zod';

// ============================================
// TYPEN & INTERFACES
// ============================================

// Steuerjahr-Daten
export interface TaxYear {
  year: number;
  startDate: Date;
  endDate: Date;
}

// Werbungskosten-Kategorien
export interface Werbungskosten {
  // Erhaltungsaufwand
  erhaltungsaufwand: number;
  // AfA (Absetzung für Abnutzung)
  afaGebaeude: number;
  afaEinrichtung: number;
  // Grundsteuer
  grundsteuer: number;
  // Gebäudeversicherung
  gebaeudeversicherung: number;
  // Hausverwaltung
  hausverwaltung: number;
  // Wassergebühren (Grundbesitzeranteil)
  wassergebuehren: number;
  // Straßenreinigung
  strassenreinigung: number;
  // Müllabfuhr (Grundbesitzeranteil)
  muellabfuhr: number;
  // Schornsteinfeger
  schornsteinfeger: number;
  // Sonstige Betriebskosten
  sonstigeBetriebskosten: number;
  // Reparaturen
  reparaturen: number;
  // Kreditzinsen
  kreditzinsen: number;
  // Sonstige Werbungskosten
  sonstige: number;
}

// Anlage V Daten pro Immobilie
export interface AnlageVProperty {
  propertyId: string;
  propertyName: string;
  address: string;
  plz: string;
  ort: string;
  
  // Zeitraum
  steuerjahr: number;
  
  // Einnahmen
  brutoeinnahmen: number; // Zeile 7
  mietausfall: number; // Zeile 8
  nettoeinnahmen: number; // Zeile 9
  
  // Werbungskosten (Zeile 10-38)
  wohnungskosten: Werbungskosten;
  summeWerbungskosten: number;
  
  // Überschuss
  ueberschuss: number; // Zeile 39
  
  // AfA-Details
  afaDetails: AfADetails;
  
  // Steuerpflichtiger Überschuss
  steuerpflichtigerUeberschuss: number;
  
  // Vorjahresdaten für Vergleich
  vorjahr?: AnlageVProperty;
  
  // Plausibilitätsprüfung
  plausibilitaet: PlausibilitaetsErgebnis[];
}

// AfA-Details
export interface AfADetails {
  gebaeudeAnschaffungskosten: number;
  grundUndBoden: number;
  gebaeudeanteil: number;
  afaSatz: number; // in %
  afaBetrag: number;
  restbuchwert: number;
  anfangsdatum: string;
  enddatum: string;
  
  // Einrichtungs-AfA
  einrichtungsKosten: number;
  einrichtungsAfaBetrag: number;
}

// Plausibilitätsprüfung
export interface PlausibilitaetsErgebnis {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  currentValue: number;
  expectedRange?: { min: number; max: number };
  vorjahrValue?: number;
}

// Zusammenfassende Übersicht für alle Immobilien
export interface AnlageVSummary {
  steuerjahr: number;
  properties: AnlageVProperty[];
  
  // Summen
  gesamtBruttoeinnahmen: number;
  gesamtMietausfall: number;
  gesamtNettoeinnahmen: number;
  gesamtWerbungskosten: number;
  gesamtUeberschuss: number;
  
  // Vorjahresvergleich
  vorjahr?: AnlageVSummary;
  veraenderung: {
    einnahmen: number; // in %
    ausgaben: number; // in %
    ueberschuss: number; // in %
  };
}

// ============================================
// VALIDIERUNG MIT ZOD
// ============================================

export const AnlageVSchema = z.object({
  propertyId: z.string().min(1, 'Immobilie muss ausgewählt werden'),
  steuerjahr: z.number().min(2020).max(2100),
  brutoeinnahmen: z.number().min(0),
  mietausfall: z.number().min(0),
  nettoeinnahmen: z.number(),
  wohnungskosten: z.object({
    erhaltungsaufwand: z.number().min(0),
    afaGebaeude: z.number().min(0),
    afaEinrichtung: z.number().min(0),
    grundsteuer: z.number().min(0),
    gebaeudeversicherung: z.number().min(0),
    hausverwaltung: z.number().min(0),
    wassergebuehren: z.number().min(0),
    strassenreinigung: z.number().min(0),
    muellabfuhr: z.number().min(0),
    schornsteinfeger: z.number().min(0),
    sonstigeBetriebskosten: z.number().min(0),
    reparaturen: z.number().min(0),
    kreditzinsen: z.number().min(0),
    sonstige: z.number().min(0),
  }),
});

export type AnlageVInput = z.infer<typeof AnlageVSchema>;

// ============================================
// BERECHNUNGSFUNKTIONEN
// ============================================

/**
 * Berechnet die Bruttoeinnahmen für eine Immobilie
 */
export function calculateBruttoeinnahmen(
  transactions: Transaction[],
  propertyId: string,
  year: number
): number {
  return transactions
    .filter(t => 
      t.propertyId === propertyId &&
      t.type === 'income' &&
      new Date(t.date).getFullYear() === year
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Berechnet die Werbungskosten pro Kategorie
 */
export function calculateWerbungskosten(
  transactions: Transaction[],
  propertyId: string,
  year: number
): Werbungskosten {
  const yearTransactions = transactions.filter(t =>
    t.propertyId === propertyId &&
    t.type === 'expense' &&
    new Date(t.date).getFullYear() === year
  );
  
  const wohnungskosten: Werbungskosten = {
    erhaltungsaufwand: 0,
    afaGebaeude: 0,
    afaEinrichtung: 0,
    grundsteuer: 0,
    gebaeudeversicherung: 0,
    hausverwaltung: 0,
    wassergebuehren: 0,
    strassenreinigung: 0,
    muellabfuhr: 0,
    schornsteinfeger: 0,
    sonstigeBetriebskosten: 0,
    reparaturen: 0,
    kreditzinsen: 0,
    sonstige: 0,
  };
  
  for (const t of yearTransactions) {
    switch (t.category) {
      case 'taxes':
        wohnungskosten.grundsteuer += t.amount;
        break;
      case 'insurance':
        wohnungskosten.gebaeudeversicherung += t.amount;
        break;
      case 'management':
        wohnungskosten.hausverwaltung += t.amount;
        break;
      case 'mortgage':
        wohnungskosten.kreditzinsen += t.amount;
        break;
      case 'repairs':
        wohnungskosten.reparaturen += t.amount;
        break;
      case 'utilities':
        wohnungskosten.sonstigeBetriebskosten += t.amount;
        break;
      case 'other':
        wohnungskosten.sonstige += t.amount;
        break;
      default:
        wohnungskosten.sonstige += t.amount;
    }
  }
  
  return wohnungskosten;
}

/**
 * Berechnet die AfA für eine Immobilie
 */
export function calculateAfa(
  depreciationItems: DepreciationItem[],
  propertyId: string,
  year: number
): { gebaeudeAfa: number; einrichtungsAfa: number; details: AfADetails[] } {
  const propertyItems = depreciationItems.filter(
    d => d.propertyId === propertyId
  );
  
  let gebaeudeAfa = 0;
  let einrichtungsAfa = 0;
  const details: AfADetails[] = [];
  
  for (const item of propertyItems) {
    const startYear = new Date(item.startDate).getFullYear();
    const currentDepreciation = startYear <= year ? item.annualDepreciation : 0;
    
    // Gebäude-AfA
    if (item.category === 'gebaeude') {
      gebaeudeAfa += currentDepreciation;
      details.push({
        gebaeudeAnschaffungskosten: item.purchaseValue,
        grundUndBoden: 0,
        gebaeudeanteil: item.purchaseValue,
        afaSatz: item.depreciationRate,
        afaBetrag: item.annualDepreciation,
        restbuchwert: item.remainingValue,
        anfangsdatum: item.startDate,
        enddatum: new Date(
          new Date(item.startDate).setFullYear(
            new Date(item.startDate).getFullYear() + item.depreciationYears
          )
        ).toISOString(),
        einrichtungsKosten: 0,
        einrichtungsAfaBetrag: 0,
      });
    } 
    // Einrichtungs-AfA
    else if (['moebel', 'kueche', 'elektro', 'inventar', 'ausstattung'].includes(item.category)) {
      einrichtungsAfa += currentDepreciation;
    }
  }
  
  return { gebaeudeAfa, einrichtungsAfa, details };
}

/**
 * Berechnet die Anlage V Daten für eine einzelne Immobilie
 */
export function calculateAnlageVForProperty(
  property: Property,
  transactions: Transaction[],
  depreciationItems: DepreciationItem[],
  year: number,
  vorjahr?: AnlageVProperty
): AnlageVProperty {
  // Einnahmen berechnen
  const brutoeinnahmen = calculateBruttoeinnahmen(transactions, property.id, year);
  
  // Mietausfall (aus Transaktionen mit negativen Beträgen oder spezieller Kategorie)
  const mietausfall = transactions
    .filter(t =>
      t.propertyId === property.id &&
      t.type === 'income' &&
      new Date(t.date).getFullYear() === year &&
      t.description.toLowerCase().includes('mietausfall')
    )
    .reduce((sum, t) => sum + t.amount, 0);
  
  const nettoeinnahmen = brutoeinnahmen - mietausfall;
  
  // Werbungskosten berechnen
  const wohnungskosten = calculateWerbungskosten(transactions, property.id, year);
  
  // AfA berechnen
  const { gebaeudeAfa, einrichtungsAfa, details } = calculateAfa(
    depreciationItems,
    property.id,
    year
  );
  
  wohnungskosten.afaGebaeude = gebaeudeAfa;
  wohnungskosten.afaEinrichtung = einrichtungsAfa;
  
  // Summe Werbungskosten
  const summeWerbungskosten = Object.values(wohnungskosten).reduce((sum, val) => sum + val, 0);
  
  // Überschuss berechnen
  const ueberschuss = nettoeinnahmen - summeWerbungskosten;
  
  // AfA-Details
  const afaDetails: AfADetails = details.length > 0 ? details[0] : {
    gebaeudeAnschaffungskosten: property.purchasePrice,
    grundUndBoden: property.purchasePrice * 0.2, // Annahme: 20% Grund und Boden
    gebaeudeanteil: property.purchasePrice * 0.8,
    afaSatz: 2.5, // Standard: 2,5% für 40 Jahre
    afaBetrag: gebaeudeAfa,
    restbuchwert: property.purchasePrice * 0.8 - gebaeudeAfa * 5, // Grobe Schätzung
    anfangsdatum: property.purchaseDate,
    enddatum: new Date(
      new Date(property.purchaseDate).setFullYear(
        new Date(property.purchaseDate).getFullYear() + 40
      )
    ).toISOString(),
    einrichtungsKosten: 0,
    einrichtungsAfaBetrag: einrichtungsAfa,
  };
  
  // Plausibilitätsprüfung
  const plausibilitaet = performPlausibilitaetspruefung(
    { brutoeinnahmen, nettoeinnahmen, wohnungskosten, summeWerbungskosten, ueberschuss },
    vorjahr
  );
  
  return {
    propertyId: property.id,
    propertyName: property.name,
    address: property.address,
    plz: property.postalCode,
    ort: property.city,
    steuerjahr: year,
    brutoeinnahmen,
    mietausfall,
    nettoeinnahmen,
    wohnungskosten,
    summeWerbungskosten,
    ueberschuss,
    afaDetails,
    steuerpflichtigerUeberschuss: ueberschuss,
    vorjahr,
    plausibilitaet,
  };
}

/**
 * Führt eine Plausibilitätsprüfung durch
 */
export function performPlausibilitaetspruefung(
  currentData: {
    brutoeinnahmen: number;
    nettoeinnahmen: number;
    wohnungskosten: Werbungskosten;
    summeWerbungskosten: number;
    ueberschuss: number;
  },
  vorjahr?: AnlageVProperty
): PlausibilitaetsErgebnis[] {
  const results: PlausibilitaetsErgebnis[] = [];
  
  // Prüfung: Werbungskosten vs. Einnahmen (sollte typischerweise 20-60% betragen)
  const werbungskostenQuote = currentData.brutoeinnahmen > 0
    ? (currentData.summeWerbungskosten / currentData.brutoeinnahmen) * 100
    : 0;
  
  if (werbungskostenQuote > 80) {
    results.push({
      type: 'warning',
      field: 'werbungskosten',
      message: `Werbungskostenquote ungewöhnlich hoch (${werbungskostenQuote.toFixed(1)}%). Bitte prüfen.`,
      currentValue: currentData.summeWerbungskosten,
    });
  }
  
  // Prüfung: Negativer Überschuss
  if (currentData.ueberschuss < 0) {
    results.push({
      type: 'info',
      field: 'ueberschuss',
      message: 'Negativer Überschuss - Verlustvortrag möglich.',
      currentValue: currentData.ueberschuss,
    });
  }
  
  // Vorjahresvergleich
  if (vorjahr) {
    const einnahmenChange = vorjahr.brutoeinnahmen > 0
      ? ((currentData.brutoeinnahmen - vorjahr.brutoeinnahmen) / vorjahr.brutoeinnahmen) * 100
      : 0;
    
    // Starke Änderung bei Einnahmen
    if (Math.abs(einnahmenChange) > 20) {
      results.push({
        type: 'warning',
        field: 'brutoeinnahmen',
        message: `Einnahmen haben sich um ${einnahmenChange.toFixed(1)}% zum Vorjahr geändert.`,
        currentValue: currentData.brutoeinnahmen,
        vorjahrValue: vorjahr.brutoeinnahmen,
      });
    }
    
    // Starke Änderung bei Werbungskosten
    const werbungskostenChange = vorjahr.summeWerbungskosten > 0
      ? ((currentData.summeWerbungskosten - vorjahr.summeWerbungskosten) / vorjahr.summeWerbungskosten) * 100
      : 0;
    
    if (Math.abs(werbungskostenChange) > 30) {
      results.push({
        type: 'warning',
        field: 'werbungskosten',
        message: `Werbungskosten haben sich um ${werbungskostenChange.toFixed(1)}% zum Vorjahr geändert.`,
        currentValue: currentData.summeWerbungskosten,
        vorjahrValue: vorjahr.summeWerbungskosten,
      });
    }
  }
  
  return results;
}

/**
 * Berechnet die zusammenfassende Übersicht für alle Immobilien
 */
export function calculateAnlageVSummary(
  properties: Property[],
  transactions: Transaction[],
  depreciationItems: DepreciationItem[],
  year: number,
  vorjahrSummary?: AnlageVSummary
): AnlageVSummary {
  const propertyResults: AnlageVProperty[] = [];
  
  for (const property of properties) {
    const vorjahrProperty = vorjahrSummary?.properties.find(
      p => p.propertyId === property.id
    );
    
    const result = calculateAnlageVForProperty(
      property,
      transactions,
      depreciationItems,
      year,
      vorjahrProperty
    );
    
    propertyResults.push(result);
  }
  
  // Summen berechnen
  const gesamtBruttoeinnahmen = propertyResults.reduce((sum, p) => sum + p.brutoeinnahmen, 0);
  const gesamtMietausfall = propertyResults.reduce((sum, p) => sum + p.mietausfall, 0);
  const gesamtNettoeinnahmen = propertyResults.reduce((sum, p) => sum + p.nettoeinnahmen, 0);
  const gesamtWerbungskosten = propertyResults.reduce((sum, p) => sum + p.summeWerbungskosten, 0);
  const gesamtUeberschuss = propertyResults.reduce((sum, p) => sum + p.ueberschuss, 0);
  
  // Veränderung zum Vorjahr
  let veraenderung = {
    einnahmen: 0,
    ausgaben: 0,
    ueberschuss: 0,
  };
  
  if (vorjahrSummary) {
    veraenderung = {
      einnahmen: vorjahrSummary.gesamtBruttoeinnahmen > 0
        ? ((gesamtBruttoeinnahmen - vorjahrSummary.gesamtBruttoeinnahmen) / vorjahrSummary.gesamtBruttoeinnahmen) * 100
        : 0,
      ausgaben: vorjahrSummary.gesamtWerbungskosten > 0
        ? ((gesamtWerbungskosten - vorjahrSummary.gesamtWerbungskosten) / vorjahrSummary.gesamtWerbungskosten) * 100
        : 0,
      ueberschuss: vorjahrSummary.gesamtUeberschuss !== 0
        ? ((gesamtUeberschuss - vorjahrSummary.gesamtUeberschuss) / Math.abs(vorjahrSummary.gesamtUeberschuss)) * 100
        : 0,
    };
  }
  
  return {
    steuerjahr: year,
    properties: propertyResults,
    gesamtBruttoeinnahmen,
    gesamtMietausfall,
    gesamtNettoeinnahmen,
    gesamtWerbungskosten,
    gesamtUeberschuss,
    vorjahr: vorjahrSummary,
    veraenderung,
  };
}

/**
 * Formatiert einen Geldbetrag für das Formular
 */
export function formatCurrencyForForm(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

/**
 * Berechnet die monatliche Miete pro m²
 */
export function calculateRentPerSqm(
  units: Unit[],
  propertyId: string
): { totalArea: number; totalRent: number; rentPerSqm: number } {
  const propertyUnits = units.filter(u => u.propertyId === propertyId);
  const totalArea = propertyUnits.reduce((sum, u) => sum + u.area, 0);
  const totalRent = propertyUnits.reduce((sum, u) => sum + u.baseRent, 0);
  const rentPerSqm = totalArea > 0 ? totalRent / totalArea : 0;
  
  return { totalArea, totalRent, rentPerSqm };
}

/**
 * Berechnet die Leerstandsquote
 */
export function calculateVacancyRate(
  units: Unit[],
  propertyId: string
): { totalUnits: number; vacantUnits: number; vacancyRate: number } {
  const propertyUnits = units.filter(u => u.propertyId === propertyId);
  const totalUnits = propertyUnits.length;
  const vacantUnits = propertyUnits.filter(u => u.status === 'vacant').length;
  const vacancyRate = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0;
  
  return { totalUnits, vacantUnits, vacancyRate };
}

// Export-Helper für PDF
export interface AnlageVPdfData {
  steuerjahr: number;
  propertyData: AnlageVProperty;
  generatedAt: string;
  steuerpflichtiger: {
    name: string;
    vorname: string;
    strasse: string;
    plz: string;
    ort: string;
    steuerId: string;
  };
}
