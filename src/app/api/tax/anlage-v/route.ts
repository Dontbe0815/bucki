import { NextRequest, NextResponse } from 'next/server';
import {
  calculateAnlageVForProperty,
  calculateAnlageVSummary,
  AnlageVSchema,
  type AnlageVPdfData,
} from '@/lib/tax/anlageV';
import {
  generateAnlageVPdf,
  generateAnlageVPackagePdf,
  generateYearComparisonPdf,
} from '@/lib/tax/pdfGenerator';
import type { Property, Transaction, DepreciationItem } from '@/lib/types';

// Validierung des Request Bodies
const RequestSchema = AnlageVSchema.extend({
  steuerpflichtiger: {
    name: '',
    vorname: '',
    strasse: '',
    plz: '',
    ort: '',
    steuerId: '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Request-Typ bestimmen
    const { action, data } = body;
    
    switch (action) {
      case 'calculate':
        return await handleCalculate(data);
      case 'generate-pdf':
        return await handleGeneratePdf(data);
      case 'generate-package':
        return await handleGeneratePackage(data);
      case 'year-comparison':
        return await handleYearComparison(data);
      default:
        return NextResponse.json(
          { error: 'Unbekannte Aktion' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Anlage V API Error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
}

/**
 * Berechnet Anlage V Daten für eine Immobilie
 */
async function handleCalculate(data: {
  property: Property;
  transactions: Transaction[];
  depreciationItems: DepreciationItem[];
  year: number;
  vorjahrData?: any;
}) {
  const { property, transactions, depreciationItems, year, vorjahrData } = data;
  
  // Berechnung durchführen
  const result = calculateAnlageVForProperty(
    property,
    transactions,
    depreciationItems,
    year,
    vorjahrData
  );
  
  return NextResponse.json({
    success: true,
    data: result,
  });
}

/**
 * Generiert ein einzelnes Anlage V PDF
 */
async function handleGeneratePdf(data: {
  propertyData: AnlageVPdfData['propertyData'];
  steuerjahr: number;
  steuerpflichtiger: AnlageVPdfData['steuerpflichtiger'];
}) {
  const { propertyData, steuerjahr, steuerpflichtiger } = data;
  
  // PDF generieren
  const pdfBytes = await generateAnlageVPdf({
    steuerjahr,
    propertyData,
    generatedAt: new Date().toISOString(),
    steuerpflichtiger,
  });
  
  // Als Base64 zurückgeben
  const base64Pdf = Buffer.from(pdfBytes).toString('base64');
  
  return NextResponse.json({
    success: true,
    pdf: base64Pdf,
    filename: `Anlage_V_${steuerjahr}_${propertyData.propertyName.replace(/\s+/g, '_')}.pdf`,
  });
}

/**
 * Generiert ein Paket-PDF mit allen Immobilien
 */
async function handleGeneratePackage(data: {
  properties: Property[];
  transactions: Transaction[];
  depreciationItems: DepreciationItem[];
  year: number;
  steuerpflichtiger: AnlageVPdfData['steuerpflichtiger'];
  vorjahrSummary?: any;
}) {
  const {
    properties,
    transactions,
    depreciationItems,
    year,
    steuerpflichtiger,
    vorjahrSummary,
  } = data;
  
  // Zusammenfassung berechnen
  const summary = calculateAnlageVSummary(
    properties,
    transactions,
    depreciationItems,
    year,
    vorjahrSummary
  );
  
  // Paket-PDF generieren
  const pdfBytes = await generateAnlageVPackagePdf(summary, steuerpflichtiger);
  
  // Als Base64 zurückgeben
  const base64Pdf = Buffer.from(pdfBytes).toString('base64');
  
  return NextResponse.json({
    success: true,
    pdf: base64Pdf,
    filename: `Anlage_V_Paket_${year}.pdf`,
    summary: {
      steuerjahr: summary.steuerjahr,
      gesamtUeberschuss: summary.gesamtUeberschuss,
      anzahlImmobilien: summary.properties.length,
    },
  });
}

/**
 * Generiert einen Vorjahresvergleich
 */
async function handleYearComparison(data: {
  currentYear: any;
  previousYear: any;
  steuerpflichtiger: AnlageVPdfData['steuerpflichtiger'];
}) {
  const { currentYear, previousYear, steuerpflichtiger } = data;
  
  // Vergleichs-PDF generieren
  const pdfBytes = await generateYearComparisonPdf(
    currentYear,
    previousYear,
    steuerpflichtiger
  );
  
  // Als Base64 zurückgeben
  const base64Pdf = Buffer.from(pdfBytes).toString('base64');
  
  return NextResponse.json({
    success: true,
    pdf: base64Pdf,
    filename: `Vorjahresvergleich_${previousYear.steuerjahr}_${currentYear.steuerjahr}.pdf`,
  });
}

// GET für verfügbare Steuerjahre
export async function GET() {
  const currentYear = new Date().getFullYear();
  const availableYears = [];
  
  for (let year = currentYear; year >= currentYear - 10; year--) {
    availableYears.push({
      year,
      label: `Steuerjahr ${year}`,
    });
  }
  
  return NextResponse.json({
    success: true,
    availableYears,
    currentYear,
  });
}
