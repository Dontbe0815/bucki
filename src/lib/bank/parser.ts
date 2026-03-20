// Bank Statement Parser for German Bank Formats
// Supports CSV (Sparkasse, Volksbank, etc.), MT940, and CAMT.052/053

import type { 
  BankFormatConfig, 
  BankTransaction, 
  BankStatementImport,
  GERMAN_BANK_FORMATS 
} from '@/lib/types';
import { GERMAN_BANK_FORMATS as BANK_FORMATS } from '@/lib/types';

// Parsed transaction result (before ID generation)
export interface ParsedTransaction {
  originalDate: string;
  valueDate: string;
  amount: number;
  currency: string;
  description: string;
  counterpartyName: string;
  counterpartyIban?: string;
  counterpartyBic?: string;
  transactionCode?: string;
  gvc?: string;
  rawLine: string;
}

// Parse result
export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  warnings: string[];
  detectedFormat?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

// Detect file type from content
export function detectFileType(content: string, fileName: string): 'csv' | 'mt940' | 'camt' | 'unknown' {
  const lowerFileName = fileName.toLowerCase();
  
  // Check file extension
  if (lowerFileName.endsWith('.sta') || lowerFileName.endsWith('.mt940')) {
    return 'mt940';
  }
  
  if (lowerFileName.endsWith('.xml') || lowerFileName.includes('camt')) {
    return 'camt';
  }
  
  // Check content
  const trimmedContent = content.trim();
  
  // MT940 starts with { or :
  if (trimmedContent.startsWith('{') || trimmedContent.startsWith(':')) {
    if (trimmedContent.includes(':20:') || trimmedContent.includes(':25:') || trimmedContent.includes(':60F:')) {
      return 'mt940';
    }
  }
  
  // CAMT is XML
  if (trimmedContent.startsWith('<?xml') || trimmedContent.startsWith('<Document')) {
    if (trimmedContent.includes('camt') || trimmedContent.includes('BankToCustomerStatement')) {
      return 'camt';
    }
  }
  
  // Default to CSV
  if (trimmedContent.includes(';') || trimmedContent.includes(',') || trimmedContent.includes('\t')) {
    return 'csv';
  }
  
  return 'unknown';
}

// Detect CSV format from content
export function detectCsvFormat(content: string): BankFormatConfig | null {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;
  
  const headerLine = lines[0].toLowerCase();
  const dataLine = lines[1];
  
  // Try to detect by column headers
  for (const format of BANK_FORMATS) {
    if (format.formatType !== 'csv' || !format.csvConfig) continue;
    
    // Check for typical German bank indicators
    if (headerLine.includes('buchungstag') || headerLine.includes('valuta') || 
        headerLine.includes('betrag') || headerLine.includes('verwendungszweck')) {
      return format;
    }
    
    // Check for bank-specific patterns
    if (dataLine.includes('SPK') || dataLine.includes('Sparkasse')) {
      return BANK_FORMATS.find(f => f.bankIdentifier === 'SPK') || format;
    }
    
    if (dataLine.includes('Volksbank') || dataLine.includes('VR-Bank')) {
      return BANK_FORMATS.find(f => f.bankIdentifier === 'VB') || format;
    }
  }
  
  // Try to auto-detect column positions
  return autoDetectCsvColumns(content);
}

// Auto-detect CSV columns when format is unknown
function autoDetectCsvColumns(content: string): BankFormatConfig {
  const lines = content.split('\n').filter(l => l.trim());
  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map(h => h.toLowerCase().trim().replace(/"/g, ''));
  const dataRow = lines[1]?.split(delimiter) || [];
  
  const columnMapping: NonNullable<BankFormatConfig['csvConfig']>['columnMapping'] = {};
  
  // Find date column
  const datePatterns = ['buchungstag', 'buchungsdatum', 'datum', 'date', 'valuta', 'wertstellung'];
  for (const pattern of datePatterns) {
    const idx = headers.findIndex(h => h.includes(pattern));
    if (idx >= 0) {
      if (pattern === 'valuta' || pattern === 'wertstellung') {
        columnMapping.valueDate = idx;
      } else {
        columnMapping.date = idx;
      }
    }
  }
  
  // Find amount column
  const amountPatterns = ['betrag', 'amount', 'umsatz', 'wert'];
  for (const pattern of amountPatterns) {
    const idx = headers.findIndex(h => h.includes(pattern));
    if (idx >= 0) {
      columnMapping.amount = idx;
      break;
    }
  }
  
  // Find description column
  const descPatterns = ['verwendungszweck', 'zweck', 'description', 'buchungstext', 'vorgang'];
  for (const pattern of descPatterns) {
    const idx = headers.findIndex(h => h.includes(pattern));
    if (idx >= 0) {
      columnMapping.description = idx;
      break;
    }
  }
  
  // Find counterparty name
  const namePatterns = ['beguenstigter', 'auftraggeber', 'empfaenger', 'name', 'partner'];
  for (const pattern of namePatterns) {
    const idx = headers.findIndex(h => h.includes(pattern));
    if (idx >= 0) {
      columnMapping.counterpartyName = idx;
      break;
    }
  }
  
  // Find IBAN
  const idx = headers.findIndex(h => h.includes('iban') || h.includes('kontonummer'));
  if (idx >= 0) {
    columnMapping.counterpartyIban = idx;
  }
  
  // Detect amount format
  const amountValue = dataRow[columnMapping.amount || 0] || '';
  const amountFormat = amountValue.includes(',') ? 'decimal_comma' : 'decimal_point';
  
  // Detect negative sign
  let negativeSign: 'prefix' | 'suffix' | 'separate_column' = 'prefix';
  if (amountValue.includes('-') || amountValue.includes('S')) {
    negativeSign = amountValue.includes('-') ? 'prefix' : 'suffix';
  }
  
  return {
    name: 'Auto-detected CSV',
    bankIdentifier: 'AUTO',
    formatType: 'csv',
    csvConfig: {
      delimiter,
      encoding: 'UTF-8',
      dateFormat: 'dd.MM.yyyy',
      hasHeader: true,
      skipLines: 0,
      columnMapping,
      amountFormat,
      negativeSign,
    },
  };
}

// Detect CSV delimiter
function detectDelimiter(line: string): string {
  const delimiters = [';', ',', '\t', '|'];
  let maxCount = 0;
  let detected = ';';
  
  for (const delim of delimiters) {
    const count = (line.match(new RegExp(delim === '\t' ? '\t' : delim, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = delim;
    }
  }
  
  return detected;
}

// Parse German date format
function parseGermanDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Clean up the date string
  const clean = dateStr.trim().replace(/"/g, '');
  
  // Try dd.MM.yyyy format
  const germanMatch = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (germanMatch) {
    const day = germanMatch[1].padStart(2, '0');
    const month = germanMatch[2].padStart(2, '0');
    const year = germanMatch[3].length === 2 ? `20${germanMatch[3]}` : germanMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // Try yyyy-MM-dd format
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return clean;
  }
  
  // Try MM/dd/yyyy format (US)
  const usMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (usMatch) {
    const month = usMatch[1].padStart(2, '0');
    const day = usMatch[2].padStart(2, '0');
    const year = usMatch[3].length === 2 ? `20${usMatch[3]}` : usMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  return clean;
}

// Parse German amount format
function parseGermanAmount(
  amountStr: string, 
  format: 'decimal_comma' | 'decimal_point', 
  negativeSign: 'prefix' | 'suffix' | 'separate_column'
): number {
  if (!amountStr) return 0;
  
  let clean = amountStr.trim().replace(/"/g, '').replace(/\s/g, '');
  let isNegative = false;
  
  // Handle negative sign based on format
  if (negativeSign === 'separate_column') {
    // Amount is always positive when sign is in separate column
    // (Negative indicator comes from another column)
  } else if (negativeSign === 'suffix') {
    // Check for suffix negative indicator (e.g., "100,00-" or "100.00 S")
    if (clean.endsWith('-') || clean.endsWith('S')) {
      isNegative = true;
      clean = clean.slice(0, -1);
    } else if (clean.endsWith('+') || clean.endsWith('H')) {
      isNegative = false;
      clean = clean.slice(0, -1);
    }
  } else {
    // Prefix negative sign
    if (clean.startsWith('-')) {
      isNegative = true;
      clean = clean.slice(1);
    }
  }
  
  // Remove currency symbols
  clean = clean.replace(/[€$£CHF]/g, '');
  
  // Parse based on format
  let value: number;
  if (format === 'decimal_comma') {
    // German format: 1.000,00 -> 1000.00
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
    // US/UK format: 1,000.00 -> 1000.00
    clean = clean.replace(/,/g, '');
  }
  
  value = parseFloat(clean) || 0;
  
  return isNegative ? -value : value;
}

// Parse CSV file
export function parseCsv(content: string, format?: BankFormatConfig): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  
  try {
    const detectedFormat = format || detectCsvFormat(content);
    if (!detectedFormat || !detectedFormat.csvConfig) {
      return {
        success: false,
        transactions: [],
        errors: ['Could not detect CSV format'],
        warnings: [],
      };
    }
    
    const config = detectedFormat.csvConfig;
    const lines = content.split('\n').filter(l => l.trim());
    
    // Skip header and initial lines
    const startIndex = config.hasHeader ? 1 + config.skipLines : config.skipLines;
    
    let minDate: string | null = null;
    let maxDate: string | null = null;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const columns = line.split(config.delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
        
        const mapping = config.columnMapping;
        
        const originalDate = parseGermanDate(columns[mapping.date ?? 0] || '');
        const valueDate = parseGermanDate(columns[mapping.valueDate ?? (mapping.date ?? 0)] || '');
        const amount = parseGermanAmount(
          columns[mapping.amount ?? 0] || '0',
          config.amountFormat,
          config.negativeSign
        );
        
        // Combine multiple description columns if needed
        let description = columns[mapping.description ?? 0] || '';
        // Some banks have multiple purpose columns
        for (let j = (mapping.description ?? 0) + 1; j < columns.length - 3; j++) {
          const extraDesc = columns[j]?.trim();
          if (extraDesc && !columns[j]?.match(/^\d/) && extraDesc.length > 3) {
            description += ' ' + extraDesc;
          }
        }
        
        const transaction: ParsedTransaction = {
          originalDate,
          valueDate: valueDate || originalDate,
          amount,
          currency: 'EUR', // Default for German banks
          description: description.trim(),
          counterpartyName: columns[mapping.counterpartyName ?? 0] || '',
          counterpartyIban: columns[mapping.counterpartyIban ?? 0]?.replace(/\s/g, ''),
          counterpartyBic: columns[mapping.counterpartyBic ?? 0]?.replace(/\s/g, ''),
          transactionCode: columns[mapping.transactionCode ?? 0],
          rawLine: line,
        };
        
        // Skip if no valid date or amount is 0
        if (transaction.originalDate && transaction.amount !== 0) {
          transactions.push(transaction);
          
          // Track date range
          if (!minDate || transaction.originalDate < minDate) minDate = transaction.originalDate;
          if (!maxDate || transaction.originalDate > maxDate) maxDate = transaction.originalDate;
        }
      } catch (err) {
        warnings.push(`Error parsing line ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    return {
      success: true,
      transactions,
      errors,
      warnings,
      detectedFormat: detectedFormat.name,
      dateRange: minDate && maxDate ? { from: minDate, to: maxDate } : undefined,
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      errors: [`CSV parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`],
      warnings,
    };
  }
}

// MT940 Transaction
interface Mt940Transaction {
  date: string;
  valuta: string;
  amount: number;
  isCredit: boolean;
  currency: string;
  gvc: string; // Geschäftsfallcode
  description: string;
  counterpartyName: string;
  counterpartyAccount: string;
  counterpartyBic: string;
  reference: string;
}

// Parse MT940 file
export function parseMt940(content: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  
  try {
    // Normalize line endings
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split into statement blocks
    const statementBlocks = normalized.split(/(?=^:20:)/m).filter(b => b.trim());
    
    let minDate: string | null = null;
    let maxDate: string | null = null;
    
    for (const block of statementBlocks) {
      // Parse statement header
      const accountMatch = block.match(/:25:([^\n]+)/);
      const iban = accountMatch ? accountMatch[1].trim() : '';
      
      // Parse opening balance to get currency
      const openingMatch = block.match(/:60[FM]:(C|D)(\d{6})([A-Z]{3})([\d,]+)/);
      const currency = openingMatch ? openingMatch[3] : 'EUR';
      
      // Parse transactions (tag :61:)
      const transactionRegex = /:61:(\d{6})(\d{4})?(C|D|R)([A-Z])?([\d,]+)([A-Z]{3})?/g;
      let transMatch;
      
      while ((transMatch = transactionRegex.exec(block)) !== null) {
        const dateRaw = transMatch[1]; // YYMMDD
        const valutaRaw = transMatch[2] || dateRaw;
        const isCredit = transMatch[3] === 'C' || transMatch[3] === 'RC';
        const amountStr = transMatch[5];
        
        // Parse amount (comma as decimal separator)
        const amount = parseFloat(amountStr.replace(',', '.')) * (isCredit ? 1 : -1);
        
        // Parse dates (YYMMDD format)
        const year = parseInt(dateRaw.substring(0, 2));
        const month = dateRaw.substring(2, 4);
        const day = dateRaw.substring(4, 6);
        const fullYear = year > 50 ? 1900 + year : 2000 + year;
        const date = `${fullYear}-${month}-${day}`;
        
        const valutaYear = parseInt(valutaRaw.substring(0, 2));
        const valutaMonth = valutaRaw.substring(2, 4);
        const valutaDay = valutaRaw.substring(4, 6);
        const valutaFullYear = valutaYear > 50 ? 1900 + valutaYear : 2000 + valutaYear;
        const valueDate = `${valutaFullYear}-${valutaMonth}-${valutaDay}`;
        
        // Find the corresponding :86: tag for details
        const blockAfter61 = block.substring(transMatch.index!);
        const lineEnd = blockAfter61.indexOf('\n');
        const gvcLine = blockAfter61.substring(0, lineEnd);
        
        // Extract GVC (Geschäftsfallcode)
        const gvcMatch = gvcLine.match(/(?:C|D|R)[A-Z]?[\d,]+[A-Z]{3}?\s*(\d{3})/);
        const gvc = gvcMatch ? gvcMatch[1] : '';
        
        // Parse :86: multiline field
        const field86Match = blockAfter61.match(/:86:([\s\S]*?)(?=:61:|:62[FM]:|$)/);
        let description = '';
        let counterpartyName = '';
        let counterpartyIban = '';
        let counterpartyBic = '';
        
        if (field86Match) {
          const fieldContent = field86Match[1]
            .replace(/\n\s?/g, '') // Join continuation lines
            .trim();
          
          // Parse structured field (SEPA)
          if (fieldContent.includes('?')) {
            const fields = fieldContent.split('?').filter(f => f.length > 2);
            for (const field of fields) {
              const code = field.substring(0, 2);
              const value = field.substring(2).trim();
              
              switch (code) {
                case '00': // Buchungstext
                  description = value;
                  break;
                case '10': // Primanota
                  break;
                case '20': // Zusatzinformation 1
                case '21': // Zusatzinformation 2
                case '22': // Zusatzinformation 3
                case '23': // Zusatzinformation 4
                case '24': // Zusatzinformation 5
                case '25': // Zusatzinformation 6
                case '26': // Zusatzinformation 7
                case '27': // Zusatzinformation 8
                case '28': // Zusatzinformation 9
                case '29': // Zusatzinformation 10
                  description += ' ' + value;
                  break;
                case '30': // BIC Empfänger
                  counterpartyBic = value;
                  break;
                case '31': // Konto/IBAN Empfänger
                  counterpartyIban = value;
                  break;
                case '32': // Name Empfänger 1
                case '33': // Name Empfänger 2
                  counterpartyName += value;
                  break;
                case '34': // Name Empfänger 3
                  counterpartyName += ' ' + value;
                  break;
              }
            }
          } else {
            // Unstructured field
            description = fieldContent;
          }
        }
        
        const transaction: ParsedTransaction = {
          originalDate: date,
          valueDate,
          amount,
          currency,
          description: description.trim(),
          counterpartyName: counterpartyName.trim(),
          counterpartyIban: counterpartyIban.replace(/\s/g, ''),
          counterpartyBic: counterpartyBic.replace(/\s/g, ''),
          transactionCode: gvc,
          gvc,
          rawLine: gvcLine,
        };
        
        transactions.push(transaction);
        
        if (!minDate || transaction.originalDate < minDate) minDate = transaction.originalDate;
        if (!maxDate || transaction.originalDate > maxDate) maxDate = transaction.originalDate;
      }
    }
    
    return {
      success: true,
      transactions,
      errors,
      warnings,
      detectedFormat: 'MT940',
      dateRange: minDate && maxDate ? { from: minDate, to: maxDate } : undefined,
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      errors: [`MT940 parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`],
      warnings,
    };
  }
}

// Parse CAMT.052/053 XML file
export function parseCamt(content: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];
  
  try {
    // Simple XML parsing without external library
    // In production, consider using fast-xml-parser or similar
    
    // Remove namespaces for simpler parsing
    const cleanXml = content
      .replace(/xmlns[^"]*"[^"]*"/g, '')
      .replace(/<[^/>]+:/g, '<')
      .replace(/<\/[^>]+:/g, '</');
    
    let minDate: string | null = null;
    let maxDate: string | null = null;
    
    // Extract transactions
    const entryRegex = /<Ntry>([\s\S]*?)<\/Ntry>/g;
    let entryMatch;
    
    while ((entryMatch = entryRegex.exec(cleanXml)) !== null) {
      const entry = entryMatch[1];
      
      // Extract date
      const dateMatch = entry.match(/<BookgDt>[\s\S]*?<Dt>([\d-]+)<\/Dt>/);
      const date = dateMatch ? dateMatch[1] : '';
      
      const valueDateMatch = entry.match(/<ValDt>[\s\S]*?<Dt>([\d-]+)<\/Dt>/);
      const valueDate = valueDateMatch ? valueDateMatch[1] : date;
      
      // Extract amount
      const amountMatch = entry.match(/<Amt Ccy="([A-Z]+)">([\d.]+)<\/Amt>/);
      const currency = amountMatch ? amountMatch[1] : 'EUR';
      const amountStr = amountMatch ? amountMatch[2] : '0';
      
      // Extract credit/debit indicator
      const cdtDbtMatch = entry.match(/<CdtDbtInd>(CRDT|DBIT)<\/CdtDbtInd>/);
      const isCredit = cdtDbtMatch ? cdtDbtMatch[1] === 'CRDT' : true;
      const amount = parseFloat(amountStr) * (isCredit ? 1 : -1);
      
      // Extract transaction details
      const txDtlsMatch = entry.match(/<TxDtls>([\s\S]*?)<\/TxDtls>/);
      let description = '';
      let counterpartyName = '';
      let counterpartyIban = '';
      let counterpartyBic = '';
      let transactionCode = '';
      
      if (txDtlsMatch) {
        const details = txDtlsMatch[1];
        
        // Description
        const rmtInfMatch = details.match(/<RmtInf>[\s\S]*?<Ustrd>([^<]*)<\/Ustrd>/);
        if (rmtInfMatch) {
          description = rmtInfMatch[1];
        }
        
        // Additional transaction info
        const addtlTxInfMatch = details.match(/<AddtlTxInf>([^<]*)<\/AddtlTxInf>/);
        if (addtlTxInfMatch) {
          description += ' ' + addtlTxInfMatch[1];
        }
        
        // Counterparty
        const rltdPtiesMatch = details.match(/<RltdPties>([\s\S]*?)<\/RltdPties>/);
        if (rltdPtiesMatch) {
          const nameMatch = rltdPtiesMatch[1].match(/<Nm>([^<]*)<\/Nm>/);
          if (nameMatch) counterpartyName = nameMatch[1];
          
          const ibanMatch = rltdPtiesMatch[1].match(/<IBAN>([^<]*)<\/IBAN>/);
          if (ibanMatch) counterpartyIban = ibanMatch[1];
        }
        
        // Counterparty BIC
        const rltdAgtsMatch = details.match(/<RltdAgts>[\s\S]*?<BIC>([^<]*)<\/BIC>/);
        if (rltdAgtsMatch) {
          counterpartyBic = rltdAgtsMatch[1];
        }
        
        // Transaction code
        const svcLvlMatch = details.match(/<Cd>([^<]*)<\/Cd>/);
        if (svcLvlMatch) {
          transactionCode = svcLvlMatch[1];
        }
      }
      
      const transaction: ParsedTransaction = {
        originalDate: date,
        valueDate,
        amount,
        currency,
        description: description.trim(),
        counterpartyName: counterpartyName.trim(),
        counterpartyIban: counterpartyIban.replace(/\s/g, ''),
        counterpartyBic: counterpartyBic.replace(/\s/g, ''),
        transactionCode,
        rawLine: entry.substring(0, 200),
      };
      
      if (transaction.originalDate) {
        transactions.push(transaction);
        
        if (!minDate || transaction.originalDate < minDate) minDate = transaction.originalDate;
        if (!maxDate || transaction.originalDate > maxDate) maxDate = transaction.originalDate;
      }
    }
    
    return {
      success: true,
      transactions,
      errors,
      warnings,
      detectedFormat: 'CAMT',
      dateRange: minDate && maxDate ? { from: minDate, to: maxDate } : undefined,
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      errors: [`CAMT parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`],
      warnings,
    };
  }
}

// Main parser function
export function parseBankFile(content: string, fileName: string, format?: BankFormatConfig): ParseResult {
  const fileType = detectFileType(content, fileName);
  
  switch (fileType) {
    case 'csv':
      return parseCsv(content, format);
    case 'mt940':
      return parseMt940(content);
    case 'camt':
      return parseCamt(content);
    default:
      // Try CSV as fallback
      return parseCsv(content, format);
  }
}

// Generate import ID
export function generateImportId(): string {
  return `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Convert parsed transaction to BankTransaction
export function createBankTransaction(
  parsed: ParsedTransaction,
  bankAccountId: string,
  importId: string,
  importSource: 'csv' | 'mt940' | 'camt'
): Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    bankAccountId,
    originalDate: parsed.originalDate,
    valueDate: parsed.valueDate,
    amount: parsed.amount,
    currency: parsed.currency,
    description: parsed.description,
    counterpartyName: parsed.counterpartyName,
    counterpartyIban: parsed.counterpartyIban,
    counterpartyBic: parsed.counterpartyBic,
    transactionCode: parsed.transactionCode,
    gvc: parsed.gvc,
    category: 'unknown',
    categoryConfidence: 0,
    categorySource: 'auto',
    matchStatus: 'unmatched',
    importId,
    importSource,
    rawLine: parsed.rawLine,
    notes: '',
    isReconciled: false,
  };
}
