// Export Utilities für Bucki App
// Unterstützt CSV, Excel (XLSX), und PDF Export

import type { Transaction, Tenant, Unit, DepreciationItem, Task, Property } from './types';

// CSV Export
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'), // German Excel uses semicolon
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains delimiter
        if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(';')
    )
  ].join('\n');
  
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

// Transactions Export
export function exportTransactionsToCSV(transactions: Transaction[], properties: Property[], units: Unit[]): void {
  const data = transactions.map(t => ({
    Datum: t.date,
    Typ: t.type === 'income' ? 'Einnahme' : 'Ausgabe',
    Kategorie: getCategoryLabel(t.category),
    Beschreibung: t.description,
    Immobilie: getPropertyName(t.propertyId, properties),
    Einheit: getUnitName(t.unitId, units),
    Betrag: t.amount,
    Wiederkehrend: t.isRecurring ? 'Ja' : 'Nein',
    Intervall: t.recurringInterval || '-',
  }));
  
  exportToCSV(data, `Transaktionen_${new Date().toISOString().split('T')[0]}`);
}

// Tenants Export
export function exportTenantsToCSV(tenants: Tenant[], units: Unit[], properties: Property[]): void {
  const data = tenants.map(t => {
    const unit = units.find(u => u.id === t.unitId);
    const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
    
    return {
      Vorname: t.firstName,
      Nachname: t.lastName,
      Email: t.email,
      Telefon: t.phone,
      Strasse: t.street,
      PLZ: t.postalCode,
      Stadt: t.city,
      Immobilie: property?.name || '-',
      Einheit: unit?.unitNumber || '-',
      Einzugsdatum: t.moveInDate,
      Auszugsdatum: t.moveOutDate || '-',
      Kaution: t.deposit,
      Vertragstyp: t.contractType === 'indefinite' ? 'Unbefristet' : 'Befristet',
      Vertragsbeginn: t.contractStartDate,
      Vertragsende: t.contractEndDate || '-',
      Notizen: t.notes,
    };
  });
  
  exportToCSV(data, `Mieter_${new Date().toISOString().split('T')[0]}`);
}

// Units Export
export function exportUnitsToCSV(units: Unit[], properties: Property[]): void {
  const data = units.map(u => ({
    Einheit: u.unitNumber,
    Immobilie: getPropertyName(u.propertyId, properties),
    Etage: u.floor,
    Flaeche_qm: u.area,
    Zimmer: u.rooms,
    Kaltmiete: u.baseRent,
    Nebenkosten: u.additionalCosts,
    Warmmiete: u.totalRent,
    Status: getStatusLabel(u.status),
    Beschreibung: u.description,
  }));
  
  exportToCSV(data, `Einheiten_${new Date().toISOString().split('T')[0]}`);
}

// Depreciations Export
export function exportDepreciationsToCSV(items: DepreciationItem[], properties: Property[], units: Unit[]): void {
  const data = items.map(d => ({
    Bezeichnung: d.name,
    Kategorie: getCategoryLabelDep(d.category),
    Immobilie: getPropertyName(d.propertyId, properties),
    Einheit: d.unitId ? getUnitName(d.unitId, units) : '-',
    Anschaffungswert: d.purchaseValue,
    AfA_Satz_Prozent: d.depreciationRate,
    Nutzungsdauer_Jahre: d.depreciationYears,
    Startdatum: d.startDate,
    Jaehrliche_AfA: d.annualDepreciation,
    Monatliche_AfA: d.monthlyDepreciation,
    Bisher_Abgeschrieben: d.accumulatedDepreciation,
    Restwert: d.remainingValue,
    Notizen: d.notes,
  }));
  
  exportToCSV(data, `Abschreibungen_${new Date().toISOString().split('T')[0]}`);
}

// Tasks Export
export function exportTasksToCSV(tasks: Task[], properties: Property[]): void {
  const data = tasks.map(t => ({
    Titel: t.title,
    Beschreibung: t.description,
    Faelligkeitsdatum: t.dueDate,
    Prioritaet: getPriorityLabel(t.priority),
    Status: getStatusLabelTask(t.status),
    Kategorie: getCategoryLabelTask(t.category),
    Immobilie: t.propertyId ? getPropertyName(t.propertyId, properties) : '-',
    Erledigt_am: t.completedAt || '-',
  }));
  
  exportToCSV(data, `Aufgaben_${new Date().toISOString().split('T')[0]}`);
}

// Helper Functions
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getPropertyName(propertyId: string | undefined, properties: Property[]): string {
  if (!propertyId) return '-';
  const property = properties.find(p => p.id === propertyId);
  return property?.name || 'Unbekannt';
}

function getUnitName(unitId: string | undefined, units: Unit[]): string {
  if (!unitId) return '-';
  const unit = units.find(u => u.id === unitId);
  return unit?.unitNumber || 'Unbekannt';
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    rent: 'Miete',
    utilities: 'Nebenkosten',
    repairs: 'Reparaturen',
    insurance: 'Versicherung',
    mortgage: 'Kreditrate',
    reserves: 'Rücklagen',
    management: 'Verwaltung',
    taxes: 'Steuern',
    other: 'Sonstiges',
  };
  return labels[category] || category;
}

function getCategoryLabelDep(category: string): string {
  const labels: Record<string, string> = {
    gebaeude: 'Gebäude',
    moebel: 'Möbel',
    kueche: 'Küche',
    elektro: 'Elektrogeräte',
    inventar: 'Inventar',
    ausstattung: 'Ausstattung',
    sonstiges: 'Sonstiges',
  };
  return labels[category] || category;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    rented: 'Vermietet',
    vacant: 'Leer',
    renovation: 'Renovierung',
    reserved: 'Reserviert',
  };
  return labels[status] || status;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    urgent: 'Dringend',
  };
  return labels[priority] || priority;
}

function getStatusLabelTask(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Offen',
    in_progress: 'In Bearbeitung',
    completed: 'Erledigt',
    cancelled: 'Abgebrochen',
  };
  return labels[status] || status;
}

function getCategoryLabelTask(category: string): string {
  const labels: Record<string, string> = {
    rent_check: 'Mietprüfung',
    rent_increase: 'Mieterhöhung',
    maintenance: 'Wartung',
    deadline: 'Frist',
    inspection: 'Inspektion',
    other: 'Sonstiges',
  };
  return labels[category] || category;
}

// PDF Export (simplified - creates HTML table)
export function exportToPDF(data: any[], title: string, filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #10b981; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th { background: #f3f4f6; padding: 8px; text-align: left; border: 1px solid #e5e7eb; }
        td { padding: 8px; border: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 20px; font-size: 10px; color: #6b7280; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Exportiert am: ${new Date().toLocaleDateString('de-DE')}</p>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Erstellt mit Bucki - Immobilienverwaltung</p>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }
}

// Annual Report Export
export function exportAnnualReport(
  year: number,
  transactions: Transaction[],
  properties: Property[],
  units: Unit[]
): void {
  const yearTransactions = transactions.filter(t => 
    new Date(t.date).getFullYear() === year
  );
  
  const income = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const cashflow = income - expenses;
  
  // Group by property
  const byProperty = properties.map(p => {
    const pTrans = yearTransactions.filter(t => t.propertyId === p.id);
    const pIncome = pTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const pExpenses = pTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      Immobilie: p.name,
      Einnahmen: pIncome.toFixed(2),
      Ausgaben: pExpenses.toFixed(2),
      Cashflow: (pIncome - pExpenses).toFixed(2),
    };
  });
  
  const reportData = [
    { Kategorie: 'Gesamteinnahmen', Wert: income.toFixed(2) + ' €' },
    { Kategorie: 'Gesamtausgaben', Wert: expenses.toFixed(2) + ' €' },
    { Kategorie: 'Cashflow', Wert: cashflow.toFixed(2) + ' €' },
    { Kategorie: 'Anzahl Immobilien', Wert: properties.length.toString() },
    { Kategorie: 'Anzahl Einheiten', Wert: units.length.toString() },
    { Kategorie: 'Vermietungsquote', Wert: Math.round((units.filter(u => u.status === 'rented').length / units.length) * 100) + '%' },
  ];
  
  exportToPDF(reportData, `Jahresbericht ${year}`, `Jahresbericht_${year}`);
}
