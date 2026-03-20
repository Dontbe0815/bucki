// Import Utilities für Bucki App
// Unterstützt CSV Import mit Feld-Mapping

import type { Transaction, Tenant, Unit } from './types';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
  data?: any[];
}

export interface FieldMapping {
  csvField: string;
  systemField: string;
}

// Parse CSV content
export function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse rows
  const rows = lines.slice(1).map(line => parseCSVLine(line));
  
  return { headers, rows };
}

// Parse a single CSV line (handles quoted fields)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ';' || char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  result.push(current.trim());
  return result;
}

// Map CSV row to object
export function mapRowToObject(
  row: string[],
  headers: string[],
  mapping: FieldMapping[]
): Record<string, string> {
  const obj: Record<string, string> = {};
  
  mapping.forEach(map => {
    const csvIndex = headers.indexOf(map.csvField);
    if (csvIndex !== -1 && csvIndex < row.length) {
      obj[map.systemField] = row[csvIndex];
    }
  });
  
  return obj;
}

// Import Transactions from CSV
export function importTransactionsFromCSV(
  content: string,
  propertyMapping: Record<string, string>, // CSV name -> property ID
  unitMapping: Record<string, string> // CSV name -> unit ID
): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    warnings: [],
    data: [],
  };
  
  try {
    const { headers, rows } = parseCSV(content);
    
    if (rows.length === 0) {
      result.errors.push('Keine Daten in der CSV-Datei gefunden');
      return result;
    }
    
    const transactions: Partial<Transaction>[] = [];
    
    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 for header and 1-based index
      
      // Find relevant columns
      const dateCol = findColumn(headers, ['datum', 'date', 'buchungsdatum']);
      const typeCol = findColumn(headers, ['typ', 'type', 'art']);
      const categoryCol = findColumn(headers, ['kategorie', 'category']);
      const amountCol = findColumn(headers, ['betrag', 'amount', 'summe']);
      const descriptionCol = findColumn(headers, ['beschreibung', 'description', 'verwendungszweck']);
      const propertyCol = findColumn(headers, ['immobilie', 'property', 'objekt']);
      const unitCol = findColumn(headers, ['einheit', 'unit', 'wohnung']);
      
      // Parse values
      let amount = 0;
      if (amountCol !== -1) {
        amount = parseGermanNumber(row[amountCol]);
      }
      
      let type: 'income' | 'expense' = 'income';
      if (typeCol !== -1) {
        const typeVal = row[typeCol].toLowerCase();
        if (typeVal.includes('ausgabe') || typeVal.includes('expense') || typeVal.includes('-')) {
          type = 'expense';
        }
      }
      
      // Determine category
      let category: Transaction['category'] = 'other';
      if (categoryCol !== -1) {
        category = mapCategory(row[categoryCol]);
      }
      
      // Map property and unit
      let propertyId: string | undefined;
      let unitId: string | undefined;
      
      if (propertyCol !== -1 && row[propertyCol]) {
        propertyId = propertyMapping[row[propertyCol]];
        if (!propertyId) {
          result.warnings.push(`Zeile ${rowNum}: Immobilie "${row[propertyCol]}" nicht gefunden`);
        }
      }
      
      if (unitCol !== -1 && row[unitCol]) {
        unitId = unitMapping[row[unitCol]];
        if (!unitId) {
          result.warnings.push(`Zeile ${rowNum}: Einheit "${row[unitCol]}" nicht gefunden`);
        }
      }
      
      // Validate required fields
      if (amount === 0) {
        result.errors.push(`Zeile ${rowNum}: Betrag ist 0 oder ungültig`);
        return;
      }
      
      const transaction: Partial<Transaction> = {
        type,
        category,
        amount,
        date: dateCol !== -1 ? parseDate(row[dateCol]) : new Date().toISOString().split('T')[0],
        description: descriptionCol !== -1 ? row[descriptionCol] : '',
        propertyId,
        unitId,
        isRecurring: false,
      };
      
      transactions.push(transaction);
      result.imported++;
    });
    
    result.data = transactions;
    result.success = result.imported > 0;
    
  } catch (error) {
    result.errors.push(`Fehler beim Parsen: ${error}`);
  }
  
  return result;
}

// Import Tenants from CSV
export function importTenantsFromCSV(
  content: string,
  unitMapping: Record<string, string> // CSV name -> unit ID
): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    warnings: [],
    data: [],
  };
  
  try {
    const { headers, rows } = parseCSV(content);
    
    if (rows.length === 0) {
      result.errors.push('Keine Daten in der CSV-Datei gefunden');
      return result;
    }
    
    const tenants: Partial<Tenant>[] = [];
    
    rows.forEach((row, index) => {
      const rowNum = index + 2;
      
      // Find columns
      const firstNameCol = findColumn(headers, ['vorname', 'firstname', 'name']);
      const lastNameCol = findColumn(headers, ['nachname', 'lastname', 'surname']);
      const emailCol = findColumn(headers, ['email', 'e-mail', 'mail']);
      const phoneCol = findColumn(headers, ['telefon', 'phone', 'tel']);
      const streetCol = findColumn(headers, ['strasse', 'street', 'adresse']);
      const cityCol = findColumn(headers, ['stadt', 'city', 'ort']);
      const postalCol = findColumn(headers, ['plz', 'postal', 'postcode']);
      const unitCol = findColumn(headers, ['einheit', 'unit', 'wohnung']);
      const moveInCol = findColumn(headers, ['einzug', 'movein', 'einzugsdatum']);
      const depositCol = findColumn(headers, ['kaution', 'deposit']);
      
      // Validate required fields
      const firstName = firstNameCol !== -1 ? row[firstNameCol] : '';
      const lastName = lastNameCol !== -1 ? row[lastNameCol] : '';
      
      if (!firstName && !lastName) {
        result.warnings.push(`Zeile ${rowNum}: Kein Name angegeben`);
        return;
      }
      
      // Map unit
      let unitId: string | undefined;
      if (unitCol !== -1 && row[unitCol]) {
        unitId = unitMapping[row[unitCol]];
        if (!unitId) {
          result.warnings.push(`Zeile ${rowNum}: Einheit "${row[unitCol]}" nicht gefunden`);
        }
      }
      
      const tenant: Partial<Tenant> = {
        firstName,
        lastName,
        email: emailCol !== -1 ? row[emailCol] : '',
        phone: phoneCol !== -1 ? row[phoneCol] : '',
        street: streetCol !== -1 ? row[streetCol] : '',
        city: cityCol !== -1 ? row[cityCol] : '',
        postalCode: postalCol !== -1 ? row[postalCol] : '',
        unitId,
        moveInDate: moveInCol !== -1 ? parseDate(row[moveInCol]) : new Date().toISOString().split('T')[0],
        deposit: depositCol !== -1 ? parseGermanNumber(row[depositCol]) : 0,
        contractType: 'indefinite',
        notes: '',
      };
      
      tenants.push(tenant);
      result.imported++;
    });
    
    result.data = tenants;
    result.success = result.imported > 0;
    
  } catch (error) {
    result.errors.push(`Fehler beim Parsen: ${error}`);
  }
  
  return result;
}

// Helper: Find column index by possible names
function findColumn(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(name.toLowerCase());
    if (index !== -1) return index;
  }
  
  return -1;
}

// Helper: Parse German number format (1.234,56)
function parseGermanNumber(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[€$£\s]/g, '').trim();
  
  // Check if it's German format (comma as decimal separator)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  
  // Check if it's German format with thousands separator
  if (cleaned.includes('.') && cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  
  // Standard format
  return parseFloat(cleaned) || 0;
}

// Helper: Parse date from various formats
function parseDate(value: string): string {
  if (!value) return new Date().toISOString().split('T')[0];
  
  // Try German format (DD.MM.YYYY)
  const germanMatch = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (germanMatch) {
    const [, day, month, year] = germanMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try ISO format (YYYY-MM-DD)
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return value;
  }
  
  // Try US format (MM/DD/YYYY)
  const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Fallback to Date parsing
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Ignore parsing errors
  }
  
  return new Date().toISOString().split('T')[0];
}

// Helper: Map category string to TransactionCategory
function mapCategory(value: string): Transaction['category'] {
  const lower = value.toLowerCase();
  
  if (lower.includes('miete') || lower.includes('rent')) return 'rent';
  if (lower.includes('neben') || lower.includes('utility')) return 'utilities';
  if (lower.includes('reparatur') || lower.includes('repair') || lower.includes('wartung') || lower.includes('maintenance')) return 'repairs';
  if (lower.includes('versicher') || lower.includes('insurance')) return 'insurance';
  if (lower.includes('kredit') || lower.includes('mortgage') || lower.includes('tilgung')) return 'mortgage';
  if (lower.includes('rücklage') || lower.includes('reserve')) return 'reserves';
  if (lower.includes('verwalt') || lower.includes('management')) return 'management';
  if (lower.includes('steuer') || lower.includes('tax')) return 'taxes';
  
  return 'other';
}

// Read file as text
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Fehler beim Lesen der Datei'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}
