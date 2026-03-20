const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, 
  PageNumber, PageBreak, TableOfContents
} = require('docx');
const fs = require('fs');

// Color scheme - Midnight Code palette for professional tech documentation
const colors = {
  primary: '020617',      // Midnight Black
  bodyText: '1E293B',     // Deep Slate Blue
  secondary: '64748B',    // Cool Blue-Gray
  accent: '94A3B8',       // Steady Silver
  tableBg: 'F8FAFC',      // Glacial Blue-White
  tableBorder: 'E2E8F0'   // Light gray border
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: colors.tableBorder };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { 
      document: { 
        run: { font: 'Calibri', size: 22 } 
      } 
    },
    paragraphStyles: [
      { 
        id: 'Title', 
        name: 'Title', 
        basedOn: 'Normal',
        run: { size: 56, bold: true, color: colors.primary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } 
      },
      { 
        id: 'Heading1', 
        name: 'Heading 1', 
        basedOn: 'Normal', 
        next: 'Normal', 
        quickFormat: true,
        run: { size: 36, bold: true, color: colors.primary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } 
      },
      { 
        id: 'Heading2', 
        name: 'Heading 2', 
        basedOn: 'Normal', 
        next: 'Normal', 
        quickFormat: true,
        run: { size: 28, bold: true, color: colors.bodyText, font: 'Times New Roman' },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } 
      },
      { 
        id: 'Heading3', 
        name: 'Heading 3', 
        basedOn: 'Normal', 
        next: 'Normal', 
        quickFormat: true,
        run: { size: 24, bold: true, color: colors.secondary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } 
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: 'bullet-list',
        levels: [{ 
          level: 0, 
          format: LevelFormat.BULLET, 
          text: '•', 
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } 
        }]
      },
      {
        reference: 'numbered-features',
        levels: [{ 
          level: 0, 
          format: LevelFormat.DECIMAL, 
          text: '%1.', 
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } 
        }]
      },
      {
        reference: 'numbered-tech',
        levels: [{ 
          level: 0, 
          format: LevelFormat.DECIMAL, 
          text: '%1.', 
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } 
        }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Bucki - Immobilienverwaltungs-App', font: 'Calibri', size: 18, color: colors.secondary })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Seite ', font: 'Calibri', size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 18 }),
            new TextRun({ text: ' von ', font: 'Calibri', size: 18 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 18 })
          ]
        })]
      })
    },
    children: [
      // Title Page
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'BUCKI', font: 'Times New Roman', size: 72, bold: true, color: colors.primary })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: 'Immobilienverwaltungs-App', font: 'Times New Roman', size: 36, color: colors.secondary })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: 'Technische Dokumentation', font: 'Calibri', size: 28, color: colors.bodyText })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
        children: [new TextRun({ text: 'Version 2.0.0 PWA', font: 'Calibri', size: 22, color: colors.accent })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [new TextRun({ text: 'Erstellt: ' + new Date().toLocaleDateString('de-DE'), font: 'Calibri', size: 20, color: colors.accent })]
      }),
      
      // Page Break after title
      new Paragraph({ children: [new PageBreak()] }),
      
      // Table of Contents
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('Inhaltsverzeichnis')]
      }),
      new TableOfContents('Inhaltsverzeichnis', { hyperlink: true, headingStyleRange: '1-3' }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: 'Hinweis: Bitte rechtsklicken und "Felder aktualisieren" wählen, um die Seitenzahlen anzuzeigen.', font: 'Calibri', size: 18, color: '999999', italics: true })]
      }),
      
      // Page Break after TOC
      new Paragraph({ children: [new PageBreak()] }),
      
      // 1. Overview
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('1. Übersicht')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Bucki ist eine umfassende Immobilienverwaltungs-App, die speziell für die Verwaltung von Mietobjekten entwickelt wurde. Die Anwendung ermöglicht die vollständige Verwaltung von Immobilien, Mietern, Finanzen und Dokumenten in einer modernen, benutzerfreundlichen Oberfläche. Mit Unterstützung für Desktop- und Mobile-Geräte bietet Bucki eine flexible Lösung für Immobilienbesitzer und Verwalter.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die App wurde mit modernsten Web-Technologien entwickelt und kann als Progressive Web App (PWA) auf verschiedenen Geräten installiert werden. Durch die Offline-Fähigkeit und lokale Datenspeicherung bleiben alle Daten auch ohne Internetverbindung verfügbar. Die intuitive Benutzeroberfläche in Kombination mit leistungsstarken Analyse-Tools macht Bucki zu einem unverzichtbaren Werkzeug für die Immobilienverwaltung.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 1.1 Hauptfunktionen
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('1.1 Hauptfunktionen')]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: 'Bucki bietet ein breites Spektrum an Funktionen für die professionelle Immobilienverwaltung:', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Dashboard mit umfassenden KPIs, Charts und Portfolio-Analysen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Verwaltung von Immobilien, Einheiten und Mietern', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Zahlungsverkehr mit automatischer Mieterzeugung und Mahnwesen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Finanzbuchhaltung mit Kategorisierung und Berichten', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Darlehensverwaltung mit Tilgungsplänen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Abschreibungsverwaltung für Steuererklärungen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Nebenkostenabrechnung mit Verbrauchserfassung', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Dokumentenverwaltung mit PDF-Support', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Aufgabenverwaltung und Kalenderintegration', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Inspektionen und Wartungsplanung', font: 'Calibri', size: 22 })]
      }),
      
      // 2. Technologie-Stack
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('2. Technologie-Stack')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Bucki basiert auf modernen Web-Technologien und folgt Best Practices für die Entwicklung von skalierbaren, wartbaren Anwendungen. Die gewählten Technologien garantieren hohe Performance, gute Entwicklererfahrung und langfristige Wartbarkeit des Projekts.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // Technology Table
      new Table({
        columnWidths: [3500, 5860],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ 
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Technologie', bold: true, font: 'Calibri', size: 22 })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ 
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Beschreibung', bold: true, font: 'Calibri', size: 22 })]
                })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Next.js 16', font: 'Calibri', size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'React-Framework mit App Router für Server Components', font: 'Calibri', size: 22 })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'TypeScript', font: 'Calibri', size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Typsichere Entwicklung mit strikter Typisierung', font: 'Calibri', size: 22 })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Tailwind CSS', font: 'Calibri', size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Utility-First CSS Framework für responsives Design', font: 'Calibri', size: 22 })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'shadcn/ui', font: 'Calibri', size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Wiederverwendbare UI-Komponenten basierend auf Radix UI', font: 'Calibri', size: 22 })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Zustand', font: 'Calibri', size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'State-Management mit Persistenz im localStorage', font: 'Calibri', size: 22 })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Recharts', font: 'Calibri', size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Diagramm-Bibliothek für Dashboards und Berichte', font: 'Calibri', size: 22 })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'date-fns', font: 'Calibri', size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Moderne Datumsbibliothek mit i18n-Unterstützung', font: 'Calibri', size: 22 })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Lucide React', font: 'Calibri', size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Umfangreiche Icon-Bibliothek für moderne UIs', font: 'Calibri', size: 22 })] })] })
            ]
          })
        ]
      }),
      new Paragraph({
        spacing: { before: 100, after: 200 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tabelle 1: Verwendete Technologien', font: 'Calibri', size: 18, italics: true, color: colors.secondary })]
      }),
      
      // 3. Module und Funktionen
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('3. Module und Funktionen')]
      }),
      
      // 3.1 Dashboard
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.1 Dashboard')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Das Dashboard ist das zentrale Steuerungszentrum der Anwendung und bietet einen umfassenden Überblick über alle wichtigen Kennzahlen des Immobilienportfolios. Es wurden verschiedene Visualisierungen implementiert, um dem Nutzer eine schnelle Einschätzung der aktuellen Situation zu ermöglichen. Die Dashboard-Karten sind interaktiv und ermöglichen die direkte Navigation zu den entsprechenden Modulen.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun('Kennzahlen (KPIs)')]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Gesamtimmobilien und Einheiten: Zeigt die Anzahl der verwalteten Objekte und Wohneinheiten an', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Belegungsquote: Verhältnis vermieteter zu leerstehenden Einheiten mit Trend-Indikator', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Mieteinnahmen: Warmmiete, Kaltmiete und Vorjahresvergleich mit Prozentänderung', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Ausgaben: Gesamtausgaben nach Kategorien mit Trend-Analyse', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Cashflow: Netto-Ergebnis aus Einnahmen und Ausgaben', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Marktwert und Eigenkapital: Aktuelle Bewertung mit Loan-to-Value (LTV) Anzeige', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Vermögenszuwachs: Monatliche Tilgung und Vermögensaufbau', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun('Charts und Visualisierungen')]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Monatlicher Cashflow-Chart mit Einnahmen/Ausgaben-Verlauf', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Kategorien-Pie-Chart für Ausgabenverteilung', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Portfolio-Verteilung nach Städten und Objektgrößen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'LTV-Gauge für Verschuldungsgrad-Visualisierung', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Jahresvergleich mit Trend-Pfeilen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun('Schnellaktionen')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Das Dashboard bietet vier Schnellaktion-Buttons für häufige Aufgaben: Neue Buchung erstellen, Neuen Mieter anlegen, Neue Aufgabe erstellen und Neue Immobilie hinzufügen. Diese Buttons navigieren direkt zu den entsprechenden Modulen und beschleunigen den Workflow erheblich.', font: 'Calibri', size: 22 })]
      }),
      
      // 3.2 Immobilienverwaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.2 Immobilienverwaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Immobilienverwaltung ermöglicht die vollständige Erfassung und Verwaltung aller Immobilienobjekte. Jede Immobilie wird mit detaillierten Informationen wie Adresse, Kaufpreis, Marktwert, Energieklasse und Baujahr erfasst. Die automatische Wertermittlung basierend auf Quadratmeterpreisen gibt einen aktuellen Schätzwert nach ImmoScout24-Modell.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun('Immobilien-Datenfelder')]
      }),
      // Property Fields Table
      new Table({
        columnWidths: [2800, 6560],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Feld', bold: true, font: 'Calibri', size: 22 })] })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Beschreibung', bold: true, font: 'Calibri', size: 22 })] })]
              })
            ]
          }),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Name', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Bezeichnung der Immobilie (z.B. Straßenname)', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Adresse', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Straße, Hausnummer, PLZ, Stadt', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Kaufpreis', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Anschaffungskosten zum Kaufzeitpunkt', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Marktwert', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Aktuelle Marktbewertung der Immobilie', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Schätzwert', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Automatisch berechneter Wert basierend auf m²-Preis', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Wohnfläche', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Gesamtwohnfläche in m²', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Energieklasse', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Energieeffizienzklasse (A-H oder unbekannt)', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Baujahr', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Jahr der Errichtung des Gebäudes', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Lagequalität', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Bewertung der Lage (Top, Gut, Durchschnitt, Unterdurchschnitt)', font: 'Calibri', size: 22 })] })] })
          ]})
        ]
      }),
      new Paragraph({
        spacing: { before: 100, after: 200 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tabelle 2: Immobilien-Datenfelder', font: 'Calibri', size: 18, italics: true, color: colors.secondary })]
      }),
      
      // 3.3 Einheitenverwaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.3 Einheitenverwaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Jede Immobilie kann mehrere Einheiten (Wohnungen) enthalten. Die Einheitenverwaltung erfasst alle relevanten Daten wie Wohnfläche, Zimmeranzahl, Mietpreise und Belegungsstatus. Der Status kann "Vermietet", "Leerstehend", "Renovierung" oder "Reserviert" sein. Die Verknüpfung mit Mietern erfolgt automatisch über die Einheiten-Zuordnung.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun('Mietpreise')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Für jede Einheit werden drei Mietpreise erfasst: Die Kaltmiete (Grundmiete ohne Nebenkosten), die Nebenkosten (Betriebskosten wie Wasser, Heizung, Müll) und die Warmmiete (Gesamtmiete). Diese Unterscheidung ist wichtig für die Nebenkostenabrechnung und die steuerliche Behandlung.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.4 Mieterverwaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.4 Mieterverwaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Mieterverwaltung speichert alle relevanten Informationen zu den Mietern, einschließlich Kontaktdaten, Einzugsdatum, Kaution und Vertragsdetails. Mieter werden automatisch mit ihrer Einheit verknüpft, sodass alle relevanten Informationen an einem Ort verfügbar sind. Die Vertragslaufzeit kann befristet oder unbefristet erfasst werden.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.5 Zahlungsverwaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.5 Zahlungsverwaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Das Zahlungsmodul ermöglicht das Tracking aller Mietzahlungen. Für jeden Mieter und jeden Monat wird erfasst, welcher Betrag erwartet wurde und wie viel tatsächlich eingegangen ist. Der Zahlungsstatus kann "Ausstehend", "Teilzahlung", "Bezahlt", "Verspätet" oder "Erlassen" sein. Die automatische Generierung von monatlichen Zahlungsdatensätzen vereinfacht die Nachverfolgung erheblich.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.6 Mahnwesen
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.6 Mahnwesen')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Das integrierte Mahnwesen automatisiert den Prozess der Zahlungserinnerungen. Bei verspäteten Zahlungen können Mahnungen in verschiedenen Stufen (erste Mahnung, zweite Mahnung, dritte Mahnung, letzte Mahnung) erstellt werden. Jede Mahnstufe kann mit individuellen Mahngebühren konfiguriert werden. Der Mahnstatus wird für jede offene Forderung nachverfolgt.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.7 Finanzbuchhaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.7 Finanzbuchhaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Finanzbuchhaltung erfasst alle Einnahmen und Ausgaben mit detaillierten Kategorien. Transaktionen können als wiederkehrend (monatlich, vierteljährlich, jährlich) markiert werden. Die Kategorisierung umfasst Miete, Nebenkosten, Reparaturen, Versicherung, Kreditraten, Rücklagen, Verwaltung, Steuern und Sonstiges.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.8 Darlehensverwaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.8 Darlehensverwaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Darlehensverwaltung ermöglicht die vollständige Nachverfolgung aller Immobilienfinanzierungen. Für jedes Darlehen werden Bank, Darlehensnummer, Kreditsumme, Zinssatz, Tilgungssatz, monatliche Rate und Restschuld erfasst. Das Ablaufdatum der Zinsbindung wird hervorgehoben, um rechtzeitig eine Anschlussfinanzierung zu planen.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.9 Abschreibungsverwaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.9 Abschreibungsverwaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Abschreibungsverwaltung unterstützt die steuerliche Abschreibung von Immobilien und Inventar. Es werden verschiedene Abschreibungskategorien unterstützt: Gebäude (AfA), Möbel, Küche, Elektrogeräte, Inventar, Ausstattung und Sonstiges. Die lineare Abschreibung wird automatisch berechnet mit jährlichem und monatlichem Abschreibungsbetrag, kumulierten Abschreibungen und Restwert.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.10 Nebenkostenabrechnung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.10 Nebenkostenabrechnung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Nebenkostenabrechnung ermöglicht die jährliche Abrechnung der Betriebskosten. Verbrauchsdaten für Heizung und Wasser werden erfasst, zusammen mit Umlagen für Müll, Versicherung, Wartung und Verwaltung. Die Vorauszahlungen werden automatisch mit den tatsächlichen Kosten verrechnet, um Nachzahlungen oder Guthaben zu ermitteln.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.11 Bank-Import
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.11 Bank-Import')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Der Bank-Import ermöglicht das Einlesen von Kontoauszügen im CSV-Format. Die importierten Transaktionen können automatisch mit bestehenden Einträgen verknüpft werden. Dies vereinfacht die Buchhaltung erheblich und reduziert manuelle Eingaben.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.12 Inspektionen
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.12 Inspektionen')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Das Inspektionsmodul verwaltet Wohnungsbesichtigungen und Zustandsprotokolle. Verschiedene Inspektionsarten werden unterstützt: Einzug, Auszug, Periodisch, Wartung und Sonderinspektionen. Jeder Raum kann einzeln bewertet werden mit Fotos und Notizen. Eine digitale Unterschrift des Mieters kann erfasst werden.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.13 Wartungsplanung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.13 Wartungsplanung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Wartungsplanung ermöglicht die regelmäßige Planung und Dokumentation von Wartungsarbeiten. Wartungsaufgaben können mit Intervallen konfiguriert und automatische Erinnerungen bei Fälligkeit erstellt werden. Dies gewährleistet die ordnungsgemäße Instandhaltung der Immobilien.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.14 Dokumentenverwaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.14 Dokumentenverwaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Dokumentenverwaltung speichert alle wichtigen Dokumente in der Anwendung. Unterstützte Dokumenttypen umfassen Mietverträge, Kaufverträge, Rechnungen, Energieausweise, Versicherungen und Kreditverträge. Die Dokumente werden als Base64-kodierte Dateien im lokalen Speicher abgelegt und können jederzeit abgerufen werden.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.15 Aufgabenverwaltung
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.15 Aufgabenverwaltung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Aufgabenverwaltung organisiert alle anstehenden Arbeiten und Fristen. Aufgaben können mit Priorität (Niedrig, Mittel, Hoch, Dringend) und Status (Offen, In Bearbeitung, Erledigt, Abgebrochen) versehen werden. Kategorien umfassen Mietprüfung, Mieterhöhung, Wartung, Fristen, Inspektion und Sonstiges.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.16 Kalender
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.16 Kalender')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Der Kalender zeigt alle wichtigen Termine und Fristen in einer übersichtlichen Monatsansicht. Aufgaben mit Fälligkeitsdatum werden automatisch im Kalender angezeigt. Die Kalenderansicht ermöglicht die schnelle Navigation zu den entsprechenden Einträgen.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.17 Berichte
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.17 Berichte')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Das Berichtsmodul generiert verschiedene Auswertungen für die Analyse und Steuererklärung. Verfügbare Berichte umfassen Jahresabschluss, Cashflow-Analyse, Mieteinnahmen, Ausgaben nach Kategorien, Abschreibungsübersicht und Steuerbericht. Berichte können als PDF exportiert werden.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 3.18 Einstellungen
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('3.18 Einstellungen')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Einstellungen ermöglichen die Anpassung der Anwendung an individuelle Bedürfnisse. Konfigurierbare Optionen umfassen Sprache (Deutsch/Englisch), Währung (EUR, USD, GBP, CHF), Theme (Hell/Dunkel), PIN-Schutz mit Biometrie-Unterstützung, Benachrichtigungseinstellungen, Auto-Lock Timer und Daten-Export/Import.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 4. Datenmodell
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('4. Datenmodell')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Bucki verwendet ein relationales Datenmodell, bei dem alle Entitäten eindeutige IDs besitzen und durch Referenzen miteinander verknüpft sind. Die Daten werden im localStorage des Browsers gespeichert und durch Zustand mit Persistenz-Plugin verwaltet. Dieses Modell gewährleistet Datenintegrität und Offline-Funktionalität.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('4.1 Hauptentitäten')]
      }),
      // Entities Table
      new Table({
        columnWidths: [2500, 2500, 4360],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Entität', bold: true, font: 'Calibri', size: 22 })] })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Verknüpfungen', bold: true, font: 'Calibri', size: 22 })] })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Beschreibung', bold: true, font: 'Calibri', size: 22 })] })]
              })
            ]
          }),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Property', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Units, Financing', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Immobilie mit Adresse und Werten', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Unit', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Property, Tenant', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Wohneinheit mit Miete und Status', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Tenant', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Unit', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Mieter mit Kontaktdaten', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Transaction', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Property, Unit', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Einnahmen oder Ausgaben', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Financing', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Property', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Darlehen mit Tilgungsplan', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Payment', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Tenant, Unit, Property', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Mietzahlungs-Tracking', font: 'Calibri', size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Inspection', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Property, Unit, Tenant', font: 'Calibri', size: 22 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Wohnungsinspektion', font: 'Calibri', size: 22 })] })] })
          ]})
        ]
      }),
      new Paragraph({
        spacing: { before: 100, after: 200 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tabelle 3: Hauptentitäten des Datenmodells', font: 'Calibri', size: 18, italics: true, color: colors.secondary })]
      }),
      
      // 5. Sicherheitsfunktionen
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('5. Sicherheitsfunktionen')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Bucki implementiert umfassende Sicherheitsfunktionen zum Schutz der sensiblen Immobilien- und Finanzdaten. Die Sicherheitsarchitektur umfasst mehrere Schichten von Zugriffskontrollen und Verschlüsselungsmechanismen.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('5.1 PIN-Schutz')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Anwendung kann mit einer 4-6-stelligen PIN gesichert werden. Die PIN wird als Hash im localStorage gespeichert. Bei aktiviertem PIN-Schutz muss die PIN bei jedem Start der Anwendung eingegeben werden. Der Standard-PIN bei erster Installation ist "1234" und sollte vom Nutzer geändert werden.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('5.2 Auto-Lock')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Auto-Lock-Funktion sperrt die Anwendung automatisch nach einer konfigurierbaren Zeit der Inaktivität. Verfügbare Optionen sind 1 Minute, 5 Minuten, 15 Minuten, 30 Minuten oder deaktiviert. Die Benutzeraktivität wird über Mausbewegungen, Tastatureingaben und Touch-Events erkannt.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('5.3 Session-Management')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Session wird im localStorage verwaltet. Bei erfolgreichem PIN-Login wird die Session als gültig markiert. Beim Schließen des Browsers oder nach Ablauf der Auto-Lock-Zeit wird die Session beendet und ein erneuter Login erforderlich.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 6. PWA-Funktionen
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('6. PWA-Funktionen')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Bucki ist als Progressive Web App (PWA) konzipiert und kann auf Desktop- und Mobilgeräten installiert werden. Die PWA-Funktionalität bietet zahlreiche Vorteile gegenüber traditionellen Webanwendungen.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('6.1 Installation')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die App kann über den Browser installiert werden: Chrome (Menü → App installieren), Safari (Teilen → Zum Home-Bildschirm), Edge (Menü → Apps → Diese Website als App installieren). Nach der Installation erscheint Bucki als eigenständige App im App-Launcher oder auf dem Home-Bildschirm.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('6.2 Offline-Fähigkeit')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Alle Daten werden im localStorage des Browsers gespeichert und sind offline verfügbar. Die Anwendung funktioniert vollständig ohne Internetverbindung. Bei Wiederherstellung der Verbindung werden keine Daten synchronisiert, da alle Daten lokal gespeichert sind.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('6.3 Responsive Design')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Benutzeroberfläche passt sich automatisch an verschiedene Bildschirmgrößen an. Auf Desktop-Geräten wird eine Seitenleiste angezeigt, auf Mobilgeräten eine untere Navigation. Pull-to-Refresh wird auf Mobilgeräten unterstützt.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 7. Mehrsprachigkeit
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('7. Mehrsprachigkeit')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Bucki unterstützt Deutsch und Englisch. Die Spracheinstellung wird in den Einstellungen geändert und wirkt sich auf alle Texte der Benutzeroberfläche aus. Datumsformate und Währungsformatierungen werden automatisch an die gewählte Sprache angepasst.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 8. Multi-Currency Support
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('8. Multi-Currency Support')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Anwendung unterstützt verschiedene Währungen: EUR (Euro), USD (US-Dollar), GBP (Britisches Pfund) und CHF (Schweizer Franken). Die Währungseinstellung wirkt sich auf alle Geldbeträge in der Anwendung aus. Wechselkurse können konfiguriert werden.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 9. Import/Export
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('9. Import/Export')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Bucki bietet umfassende Import- und Export-Funktionen für die Datensicherung und Migration.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('9.1 Vollständiger Export')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Alle Daten können als JSON-Datei exportiert werden. Der Export enthält alle Immobilien, Einheiten, Mieter, Transaktionen, Finanzierungen, Dokumente, Aufgaben, Abschreibungen, Zahlungen und Inspektionen. Diese Datei kann als Backup oder zur Migration auf ein anderes Gerät verwendet werden.',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('9.2 CSV-Import')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Transaktionen können aus CSV-Dateien importiert werden, ideal für den Import von Bankdaten. Das CSV-Format sollte folgende Spalten enthalten: Datum, Beschreibung, Betrag, Kategorie, Typ (Einnahme/Ausgabe).',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('9.3 Daten-Zurücksetzung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Anwendung bietet eine Funktion zum vollständigen Zurücksetzen aller Daten. Diese Funktion sollte mit Vorsicht verwendet werden, da alle Daten unwiderruflich gelöscht werden. Ein Export vor dem Zurücksetzen wird empfohlen.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 10. Demo-Daten
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('10. Demo-Daten')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Anwendung wird mit umfangreichen Demo-Daten basierend auf der Excel-Datei "2026 Haushaltsrechnung.xlsx" ausgeliefert. Diese Daten repräsentieren ein realistisches Immobilienportfolio mit 8 Immobilien und 11 Wohneinheiten in Dortmund, Datteln, Wuppertal und Bochum. Die Demo-Daten umfassen:',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: '8 Immobilien mit realistischen Kaufpreisen und Mietwerten', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: '11 Wohneinheiten mit verschiedenen Größen und Mieten', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: '10 Mieter mit Kontaktdaten und Vertragsinformationen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Monatliche Miettransaktionen und Ausgaben', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: '7 Finanzierungen mit verschiedenen Banken und Konditionen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: 'Abschreibungspositionen für steuerliche Zwecke', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Beispielaufgaben und Dokumente', font: 'Calibri', size: 22 })]
      }),
      
      // 11. Entwicklung und Deployment
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('11. Entwicklung und Deployment')]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('11.1 Entwicklungsumgebung')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Entwicklungsumgebung erfordert Node.js 18+ und npm oder bun als Paketmanager. Das Repository ist unter GitHub verfügbar. Die wichtigsten Entwicklungsbefehle sind: npm run dev (Entwicklungsserver), npm run build (Produktions-Build), npm run start (Produktionsserver) und npm run lint (Code-Analyse).',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('11.2 Projektstruktur')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Projektstruktur folgt den Next.js App Router Konventionen. Wichtige Verzeichnisse sind: /src/app (Seiten und Komponenten), /src/components/ui (shadcn/ui Komponenten), /src/lib (Zustand Store, Types, Utilities), /src/contexts (React Contexts für i18n), /public (statische Assets, Manifest).',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('11.3 Deployment')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Anwendung kann auf verschiedenen Plattformen deployt werden: Vercel (empfohlen für Next.js), Netlify, AWS Amplify oder eigene Server. Die PWA-Funktionalität erfordert HTTPS. Die Umgebungsvariablen sollten für verschiedene Umgebungen konfiguriert werden.',
          font: 'Calibri', size: 22 
        })]
      }),
      
      // 12. Zukünftige Erweiterungen
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('12. Zukünftige Erweiterungen')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Die Architektur von Bucki ermöglicht zahlreiche Erweiterungen für zukünftige Versionen:',
          font: 'Calibri', size: 22 
        })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered-features', level: 0 },
        children: [new TextRun({ text: 'Mieter-Portal: Online-Zugang für Mieter zur Einsicht von Abrechnungen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered-features', level: 0 },
        children: [new TextRun({ text: 'Multi-User-Unterstützung: Mehrere Benutzer mit Rollen und Berechtigungen', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered-features', level: 0 },
        children: [new TextRun({ text: 'Cloud-Sync: Synchronisation zwischen mehreren Geräten', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered-features', level: 0 },
        children: [new TextRun({ text: 'Automatisierte Bank-Anbindung: Echtzeit-Import über Banking-APIs', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered-features', level: 0 },
        children: [new TextRun({ text: 'Push-Benachrichtigungen: Erinnerungen für fällige Aufgaben', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered-features', level: 0 },
        children: [new TextRun({ text: 'KI-gestützte Analysen: Prognosen und Optimierungsvorschläge', font: 'Calibri', size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered-features', level: 0 },
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Integration mit Immobilienportalen: Automatische Inseraterstellung', font: 'Calibri', size: 22 })]
      }),
      
      // 13. Support und Kontakt
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('13. Support und Kontakt')]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: 'Der Quellcode der Anwendung ist auf GitHub verfügbar: https://github.com/Dontbe0815/bucki. Für Fehlerberichte und Feature-Wünsche können Issues erstellt werden. Die Anwendung wird aktiv weiterentwickelt und mit neuen Funktionen erweitert.',
          font: 'Calibri', size: 22 
        })]
      })
    ]
  }]
});

// Generate and save the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/z/my-project/download/Bucki_Dokumentation.docx', buffer);
  console.log('Documentation created successfully: /home/z/my-project/download/Bucki_Dokumentation.docx');
});
