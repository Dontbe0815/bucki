// PDF-Generator für Anlage V Steuerformular
// Erstellt ein amtliches Layout des deutschen Steuerformulars

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { AnlageVProperty, AnlageVSummary, AnlageVPdfData } from './anlageV';

// Farben für PDF
const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.2, 0.2, 0.2),
  gray: rgb(0.5, 0.5, 0.5),
  lightGray: rgb(0.9, 0.9, 0.9),
  white: rgb(1, 1, 1),
  blue: rgb(0, 0.3, 0.6),
  green: rgb(0, 0.5, 0.2),
  red: rgb(0.6, 0, 0),
};

// Formular-Maße (A4)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const LINE_HEIGHT = 16;
const FIELD_HEIGHT = 20;

// Hilfsfunktionen
function formatCurrency(amount: number): string {
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}

function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Erstellt das Anlage V PDF für eine einzelne Immobilie
 */
export async function generateAnlageVPdf(data: AnlageVPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Standardschriftarten einbetten
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Erste Seite
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  
  // === KOPFZEILE ===
  y = drawHeader(page, data, helvetica, helveticaBold, y);
  
  // === STEUERPFLICHTIGER ===
  y = drawSteuerpflichtiger(page, data, helvetica, helveticaBold, y);
  
  // === IMMOBILIEN-DATEN ===
  y = drawImmobilienDaten(page, data, helvetica, helveticaBold, y);
  
  // === EINNAHMEN ===
  y = drawEinnahmen(page, data.propertyData, helvetica, helveticaBold, y);
  
  // Neue Seite falls nötig
  if (y < 200) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }
  
  // === WERBUNGSKOSTEN ===
  y = drawWerbungskosten(page, data.propertyData, helvetica, helveticaBold, y);
  
  // Neue Seite falls nötig
  if (y < 200) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }
  
  // === ÜBERSCHUSS ===
  y = drawUeberschuss(page, data.propertyData, helvetica, helveticaBold, y);
  
  // === AfA-ANLAGE ===
  y = drawAfaAnlage(page, data.propertyData, helvetica, helveticaBold, y);
  
  // === FUßZEILE ===
  drawFooter(page, data, helvetica, y);
  
  return pdfDoc.save();
}

/**
 * Zeichnet die Kopfzeile
 */
function drawHeader(
  page: any,
  data: AnlageVPdfData,
  font: any,
  boldFont: any,
  startY: number
): number {
  let y = startY;
  
  // Titel
  page.drawText('Anlage V', {
    x: MARGIN,
    y: y,
    size: 24,
    font: boldFont,
    color: COLORS.black,
  });
  
  page.drawText('Einkünfte aus Vermietung und Verpachtung', {
    x: MARGIN,
    y: y - 22,
    size: 12,
    font: font,
    color: COLORS.darkGray,
  });
  
  // Steuerjahr rechts
  page.drawText(`Steuerjahr ${data.steuerjahr}`, {
    x: PAGE_WIDTH - MARGIN - 100,
    y: y,
    size: 14,
    font: boldFont,
    color: COLORS.black,
  });
  
  // Linie unter Kopfzeile
  page.drawLine({
    start: { x: MARGIN, y: y - 35 },
    end: { x: PAGE_WIDTH - MARGIN, y: y - 35 },
    thickness: 1,
    color: COLORS.lightGray,
  });
  
  return y - 55;
}

/**
 * Zeichnet die Steuerpflichtiger-Sektion
 */
function drawSteuerpflichtiger(
  page: any,
  data: AnlageVPdfData,
  font: any,
  boldFont: any,
  startY: number
): number {
  let y = startY;
  
  // Sektionstitel
  page.drawText('Angaben zum Steuerpflichtigen', {
    x: MARGIN,
    y: y,
    size: 11,
    font: boldFont,
    color: COLORS.blue,
  });
  
  y -= 20;
  
  // Name und Vorname
  const fullName = `${data.steuerpflichtiger.vorname} ${data.steuerpflichtiger.name}`;
  y = drawField(page, 'Name, Vorname:', fullName, font, boldFont, y);
  
  // Adresse
  const address = `${data.steuerpflichtiger.strasse}`;
  y = drawField(page, 'Straße, Hausnummer:', address, font, boldFont, y);
  
  const plzOrt = `${data.steuerpflichtiger.plz} ${data.steuerpflichtiger.ort}`;
  y = drawField(page, 'PLZ, Ort:', plzOrt, font, boldFont, y);
  
  // Steuer-ID
  y = drawField(page, 'Steuer-Identifikationsnummer:', data.steuerpflichtiger.steuerId, font, boldFont, y);
  
  // Trennlinie
  y -= 5;
  page.drawLine({
    start: { x: MARGIN, y: y },
    end: { x: PAGE_WIDTH - MARGIN, y: y },
    thickness: 0.5,
    color: COLORS.lightGray,
  });
  
  return y - 15;
}

/**
 * Zeichnet die Immobilien-Daten
 */
function drawImmobilienDaten(
  page: any,
  data: AnlageVPdfData,
  font: any,
  boldFont: any,
  startY: number
): number {
  let y = startY;
  
  // Sektionstitel
  page.drawText('Angaben zum Objekt', {
    x: MARGIN,
    y: y,
    size: 11,
    font: boldFont,
    color: COLORS.blue,
  });
  
  y -= 20;
  
  // Objektbezeichnung
  y = drawField(page, 'Bezeichnung:', data.propertyData.propertyName, font, boldFont, y);
  
  // Adresse
  y = drawField(page, 'Anschrift:', data.propertyData.address, font, boldFont, y);
  
  // PLZ und Ort
  const plzOrt = `${data.propertyData.plz} ${data.propertyData.ort}`;
  y = drawField(page, 'PLZ, Ort:', plzOrt, font, boldFont, y);
  
  // Trennlinie
  y -= 5;
  page.drawLine({
    start: { x: MARGIN, y: y },
    end: { x: PAGE_WIDTH - MARGIN, y: y },
    thickness: 0.5,
    color: COLORS.lightGray,
  });
  
  return y - 15;
}

/**
 * Zeichnet die Einnahmen-Sektion
 */
function drawEinnahmen(
  page: any,
  propertyData: AnlageVProperty,
  font: any,
  boldFont: any,
  startY: number
): number {
  let y = startY;
  
  // Sektionstitel
  page.drawText('Einnahmen (Zeile 7-9)', {
    x: MARGIN,
    y: y,
    size: 11,
    font: boldFont,
    color: COLORS.blue,
  });
  
  y -= 25;
  
  // Zeile 7: Bruttoeinnahmen
  y = drawNumberRow(page, '7', 'Bruttoeinnahmen (Mieteinnahmen)', propertyData.brutoeinnahmen, font, boldFont, y, true);
  
  // Zeile 8: Mietausfall
  y = drawNumberRow(page, '8', 'davon Mietausfall', propertyData.mietausfall, font, boldFont, y, true);
  
  // Zeile 9: Nettoeinnahmen
  y = drawNumberRow(page, '9', 'Nettoeinnahmen (Zeile 7 - 8)', propertyData.nettoeinnahmen, font, boldFont, y, true, true);
  
  // Trennlinie
  y -= 5;
  page.drawLine({
    start: { x: MARGIN, y: y },
    end: { x: PAGE_WIDTH - MARGIN, y: y },
    thickness: 0.5,
    color: COLORS.lightGray,
  });
  
  return y - 15;
}

/**
 * Zeichnet die Werbungskosten-Sektion
 */
function drawWerbungskosten(
  page: any,
  propertyData: AnlageVProperty,
  font: any,
  boldFont: any,
  startY: number
): number {
  let y = startY;
  const wk = propertyData.wohnungskosten;
  
  // Sektionstitel
  page.drawText('Werbungskosten (Zeile 10-38)', {
    x: MARGIN,
    y: y,
    size: 11,
    font: boldFont,
    color: COLORS.blue,
  });
  
  y -= 25;
  
  // Abschreibungen
  page.drawText('Abschreibungen (AfA)', {
    x: MARGIN,
    y: y,
    size: 10,
    font: boldFont,
    color: COLORS.darkGray,
  });
  y -= 18;
  
  y = drawNumberRow(page, '10', 'AfA für Gebäude', wk.afaGebaeude, font, boldFont, y, true);
  y = drawNumberRow(page, '11', 'AfA für Einrichtung', wk.afaEinrichtung, font, boldFont, y, true);
  
  y -= 5;
  
  // Erhaltungsaufwand
  page.drawText('Erhaltungsaufwand', {
    x: MARGIN,
    y: y,
    size: 10,
    font: boldFont,
    color: COLORS.darkGray,
  });
  y -= 18;
  
  y = drawNumberRow(page, '12', 'Erhaltungsaufwand', wk.erhaltungsaufwand, font, boldFont, y, true);
  y = drawNumberRow(page, '13', 'Reparaturen', wk.reparaturen, font, boldFont, y, true);
  
  y -= 5;
  
  // Betriebskosten
  page.drawText('Laufende Kosten', {
    x: MARGIN,
    y: y,
    size: 10,
    font: boldFont,
    color: COLORS.darkGray,
  });
  y -= 18;
  
  y = drawNumberRow(page, '14', 'Grundsteuer', wk.grundsteuer, font, boldFont, y, true);
  y = drawNumberRow(page, '15', 'Gebäudeversicherung', wk.gebaeudeversicherung, font, boldFont, y, true);
  y = drawNumberRow(page, '16', 'Hausverwaltung', wk.hausverwaltung, font, boldFont, y, true);
  y = drawNumberRow(page, '17', 'Wassergebühren', wk.wassergebuehren, font, boldFont, y, true);
  y = drawNumberRow(page, '18', 'Straßenreinigung', wk.strassenreinigung, font, boldFont, y, true);
  y = drawNumberRow(page, '19', 'Müllabfuhr', wk.muellabfuhr, font, boldFont, y, true);
  y = drawNumberRow(page, '20', 'Schornsteinfeger', wk.schornsteinfeger, font, boldFont, y, true);
  y = drawNumberRow(page, '21', 'Sonstige Betriebskosten', wk.sonstigeBetriebskosten, font, boldFont, y, true);
  
  y -= 5;
  
  // Finanzierung
  page.drawText('Finanzierung', {
    x: MARGIN,
    y: y,
    size: 10,
    font: boldFont,
    color: COLORS.darkGray,
  });
  y -= 18;
  
  y = drawNumberRow(page, '22', 'Kreditzinsen', wk.kreditzinsen, font, boldFont, y, true);
  
  y -= 5;
  
  // Sonstige
  y = drawNumberRow(page, '23', 'Sonstige Werbungskosten', wk.sonstige, font, boldFont, y, true);
  
  y -= 5;
  
  // Summe Werbungskosten
  y = drawNumberRow(page, '24', 'Summe Werbungskosten', propertyData.summeWerbungskosten, font, boldFont, y, true, true);
  
  // Trennlinie
  y -= 5;
  page.drawLine({
    start: { x: MARGIN, y: y },
    end: { x: PAGE_WIDTH - MARGIN, y: y },
    thickness: 0.5,
    color: COLORS.lightGray,
  });
  
  return y - 15;
}

/**
 * Zeichnet die Überschuss-Sektion
 */
function drawUeberschuss(
  page: any,
  propertyData: AnlageVProperty,
  font: any,
  boldFont: any,
  startY: number
): number {
  let y = startY;
  
  // Sektionstitel
  page.drawText('Überschussrechnung', {
    x: MARGIN,
    y: y,
    size: 11,
    font: boldFont,
    color: COLORS.blue,
  });
  
  y -= 25;
  
  // Einnahmen
  y = drawNumberRow(page, '', 'Nettoeinnahmen', propertyData.nettoeinnahmen, font, boldFont, y, false);
  
  // Werbungskosten
  y = drawNumberRow(page, '', '- Werbungskosten', propertyData.summeWerbungskosten, font, boldFont, y, false);
  
  // Überschuss
  const isNegative = propertyData.ueberschuss < 0;
  y = drawNumberRow(
    page,
    '39',
    isNegative ? 'Überschuss / (Verlust)' : 'Überschuss der Einkünfte',
    Math.abs(propertyData.ueberschuss),
    font,
    boldFont,
    y,
    true,
    true,
    isNegative
  );
  
  // Trennlinie
  y -= 5;
  page.drawLine({
    start: { x: MARGIN, y: y },
    end: { x: PAGE_WIDTH - MARGIN, y: y },
    thickness: 0.5,
    color: COLORS.lightGray,
  });
  
  return y - 15;
}

/**
 * Zeichnet die AfA-Anlage
 */
function drawAfaAnlage(
  page: any,
  propertyData: AnlageVProperty,
  font: any,
  boldFont: any,
  startY: number
): number {
  let y = startY;
  const afa = propertyData.afaDetails;
  
  // Sektionstitel
  page.drawText('AfA-Berechnung (Anlage zur Anlage V)', {
    x: MARGIN,
    y: y,
    size: 11,
    font: boldFont,
    color: COLORS.blue,
  });
  
  y -= 25;
  
  // Gebäude-AfA
  y = drawField(page, 'Gebäudeanschaffungskosten:', formatCurrency(afa.gebaeudeAnschaffungskosten), font, boldFont, y);
  y = drawField(page, 'Grund und Boden:', formatCurrency(afa.grundUndBoden), font, boldFont, y);
  y = drawField(page, 'Gebäudeanteil:', formatCurrency(afa.gebaeudeanteil), font, boldFont, y);
  y = drawField(page, 'AfA-Satz:', `${formatNumber(afa.afaSatz)}% pro Jahr`, font, boldFont, y);
  y = drawField(page, 'Jahres-AfA:', formatCurrency(afa.afaBetrag), font, boldFont, y);
  y = drawField(page, 'Restbuchwert:', formatCurrency(afa.restbuchwert), font, boldFont, y);
  y = drawField(page, 'AfA von:', new Date(afa.anfangsdatum).toLocaleDateString('de-DE'), font, boldFont, y);
  
  if (afa.einrichtungsAfaBetrag > 0) {
    y -= 10;
    y = drawField(page, 'Einrichtungs-AfA:', formatCurrency(afa.einrichtungsAfaBetrag), font, boldFont, y);
  }
  
  return y - 15;
}

/**
 * Zeichnet ein Eingabefeld mit Label
 */
function drawField(
  page: any,
  label: string,
  value: string,
  font: any,
  boldFont: any,
  y: number
): number {
  // Label
  page.drawText(label, {
    x: MARGIN,
    y: y,
    size: 9,
    font: font,
    color: COLORS.darkGray,
  });
  
  // Wert
  page.drawText(value, {
    x: MARGIN + 200,
    y: y,
    size: 9,
    font: boldFont,
    color: COLORS.black,
  });
  
  return y - LINE_HEIGHT;
}

/**
 * Zeichnet eine nummerierte Zeile
 */
function drawNumberRow(
  page: any,
  lineNumber: string,
  label: string,
  amount: number,
  font: any,
  boldFont: any,
  y: number,
  withBox: boolean = false,
  isBold: boolean = false,
  isNegative: boolean = false
): number {
  const x = MARGIN;
  const valueX = PAGE_WIDTH - MARGIN - 120;
  
  // Zeilennummer (kleines Kästchen)
  if (lineNumber) {
    page.drawText(lineNumber, {
      x: x,
      y: y,
      size: 8,
      font: font,
      color: COLORS.gray,
    });
  }
  
  // Label
  page.drawText(label, {
    x: x + (lineNumber ? 20 : 0),
    y: y,
    size: 9,
    font: isBold ? boldFont : font,
    color: COLORS.darkGray,
  });
  
  // Betrag
  const formattedAmount = (isNegative ? '- ' : '') + formatCurrency(amount);
  
  // Hintergrund für wichtigen Betrag
  if (withBox) {
    page.drawRectangle({
      x: valueX - 10,
      y: y - 4,
      width: 130,
      height: 14,
      color: COLORS.lightGray,
    });
  }
  
  page.drawText(formattedAmount, {
    x: valueX,
    y: y,
    size: 9,
    font: isBold ? boldFont : font,
    color: isNegative ? COLORS.red : COLORS.black,
  });
  
  return y - LINE_HEIGHT;
}

/**
 * Zeichnet die Fußzeile
 */
function drawFooter(
  page: any,
  data: AnlageVPdfData,
  font: any,
  y: number
): void {
  const footerY = 30;
  
  page.drawText(`Erstellt am: ${new Date(data.generatedAt).toLocaleString('de-DE')}`, {
    x: MARGIN,
    y: footerY,
    size: 8,
    font: font,
    color: COLORS.gray,
  });
  
  page.drawText('Bucki Immobilien-Verwaltung - Automatisch generiert', {
    x: PAGE_WIDTH - MARGIN - 230,
    y: footerY,
    size: 8,
    font: font,
    color: COLORS.gray,
  });
}

/**
 * Erstellt ein Paket-PDF mit allen Immobilien
 */
export async function generateAnlageVPackagePdf(
  summary: AnlageVSummary,
  steuerpflichtiger: AnlageVPdfData['steuerpflichtiger']
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // === ZUSAMMENFASSENDE ÜBERSICHT ===
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  
  // Titel
  page.drawText('Zusammenfassung Anlage V', {
    x: MARGIN,
    y: y,
    size: 20,
    font: helveticaBold,
    color: COLORS.black,
  });
  
  page.drawText(`Steuerjahr ${summary.steuerjahr}`, {
    x: PAGE_WIDTH - MARGIN - 100,
    y: y,
    size: 14,
    font: helveticaBold,
    color: COLORS.black,
  });
  
  y -= 40;
  
  // Steuerpflichtiger
  page.drawText(`${steuerpflichtiger.vorname} ${steuerpflichtiger.name}`, {
    x: MARGIN,
    y: y,
    size: 12,
    font: helvetica,
    color: COLORS.darkGray,
  });
  
  y -= 20;
  
  // Summen-Tabelle
  const tableData = [
    ['Bruttoeinnahmen', formatCurrency(summary.gesamtBruttoeinnahmen)],
    ['Mietausfall', formatCurrency(summary.gesamtMietausfall)],
    ['Nettoeinnahmen', formatCurrency(summary.gesamtNettoeinnahmen)],
    ['Werbungskosten', formatCurrency(summary.gesamtWerbungskosten)],
    ['Überschuss', formatCurrency(summary.gesamtUeberschuss)],
  ];
  
  for (const [label, value] of tableData) {
    page.drawText(label, {
      x: MARGIN,
      y: y,
      size: 10,
      font: helvetica,
      color: COLORS.darkGray,
    });
    
    page.drawText(value, {
      x: PAGE_WIDTH - MARGIN - 120,
      y: y,
      size: 10,
      font: helveticaBold,
      color: COLORS.black,
    });
    
    y -= 18;
  }
  
  // Vorjahresvergleich
  if (summary.vorjahr) {
    y -= 20;
    page.drawText('Veränderung zum Vorjahr', {
      x: MARGIN,
      y: y,
      size: 11,
      font: helveticaBold,
      color: COLORS.blue,
    });
    y -= 18;
    
    const changes = [
      ['Einnahmen', `${summary.veraenderung.einnahmen >= 0 ? '+' : ''}${summary.veraenderung.einnahmen.toFixed(1)}%`],
      ['Ausgaben', `${summary.veraenderung.ausgaben >= 0 ? '+' : ''}${summary.veraenderung.ausgaben.toFixed(1)}%`],
      ['Überschuss', `${summary.veraenderung.ueberschuss >= 0 ? '+' : ''}${summary.veraenderung.ueberschuss.toFixed(1)}%`],
    ];
    
    for (const [label, value] of changes) {
      page.drawText(label, {
        x: MARGIN,
        y: y,
        size: 9,
        font: helvetica,
        color: COLORS.darkGray,
      });
      
      const isNegative = value.startsWith('-');
      page.drawText(value, {
        x: PAGE_WIDTH - MARGIN - 120,
        y: y,
        size: 9,
        font: helveticaBold,
        color: isNegative ? COLORS.red : COLORS.green,
      });
      
      y -= 16;
    }
  }
  
  y -= 20;
  
  // Immobilien-Liste
  page.drawText('Enthaltene Immobilien:', {
    x: MARGIN,
    y: y,
    size: 11,
    font: helveticaBold,
    color: COLORS.blue,
  });
  y -= 16;
  
  for (const prop of summary.properties) {
    page.drawText(`• ${prop.propertyName} (${prop.address})`, {
      x: MARGIN + 10,
      y: y,
      size: 9,
      font: helvetica,
      color: COLORS.darkGray,
    });
    y -= 14;
  }
  
  // === EINZELNE ANLAGEN HINZUFÜGEN ===
  for (const propertyData of summary.properties) {
    const propertyPdf = await generateAnlageVPdf({
      steuerjahr: summary.steuerjahr,
      propertyData,
      generatedAt: new Date().toISOString(),
      steuerpflichtiger,
    });
    
    const propertyDoc = await PDFDocument.load(propertyPdf);
    const copiedPages = await pdfDoc.copyPages(propertyDoc, propertyDoc.getPageIndices());
    
    for (const copiedPage of copiedPages) {
      pdfDoc.addPage(copiedPage);
    }
  }
  
  return pdfDoc.save();
}

/**
 * Generiert eine Übersichtsseite für Vorjahresvergleich
 */
export async function generateYearComparisonPdf(
  currentYear: AnlageVSummary,
  previousYear: AnlageVSummary,
  steuerpflichtiger: AnlageVPdfData['steuerpflichtiger']
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  
  // Titel
  page.drawText('Vorjahresvergleich', {
    x: MARGIN,
    y: y,
    size: 20,
    font: helveticaBold,
    color: COLORS.black,
  });
  
  page.drawText(`${previousYear.steuerjahr} vs ${currentYear.steuerjahr}`, {
    x: PAGE_WIDTH - MARGIN - 150,
    y: y,
    size: 14,
    font: helveticaBold,
    color: COLORS.black,
  });
  
  y -= 50;
  
  // Vergleichstabelle
  const headers = ['Position', `${previousYear.steuerjahr}`, `${currentYear.steuerjahr}`, 'Änderung'];
  const colWidths = [200, 100, 100, 100];
  const startX = MARGIN;
  
  // Header
  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], {
      x: x,
      y: y,
      size: 10,
      font: helveticaBold,
      color: COLORS.darkGray,
    });
    x += colWidths[i];
  }
  
  y -= 20;
  
  // Datenzeilen
  const rows: [string, number, number][] = [
    ['Bruttoeinnahmen', previousYear.gesamtBruttoeinnahmen, currentYear.gesamtBruttoeinnahmen],
    ['Nettoeinnahmen', previousYear.gesamtNettoeinnahmen, currentYear.gesamtNettoeinnahmen],
    ['Werbungskosten', previousYear.gesamtWerbungskosten, currentYear.gesamtWerbungskosten],
    ['Überschuss', previousYear.gesamtUeberschuss, currentYear.gesamtUeberschuss],
  ];
  
  for (const [label, prev, curr] of rows) {
    x = startX;
    
    page.drawText(label, {
      x: x,
      y: y,
      size: 9,
      font: helvetica,
      color: COLORS.darkGray,
    });
    x += colWidths[0];
    
    page.drawText(formatCurrency(prev), {
      x: x,
      y: y,
      size: 9,
      font: helvetica,
      color: COLORS.black,
    });
    x += colWidths[1];
    
    page.drawText(formatCurrency(curr), {
      x: x,
      y: y,
      size: 9,
      font: helvetica,
      color: COLORS.black,
    });
    x += colWidths[2];
    
    const change = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
    const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    
    page.drawText(changeText, {
      x: x,
      y: y,
      size: 9,
      font: helveticaBold,
      color: change >= 0 ? COLORS.green : COLORS.red,
    });
    
    y -= 18;
  }
  
  // Fußzeile
  page.drawText(`Erstellt am: ${new Date().toLocaleString('de-DE')}`, {
    x: MARGIN,
    y: 30,
    size: 8,
    font: helvetica,
    color: COLORS.gray,
  });
  
  return pdfDoc.save();
}
