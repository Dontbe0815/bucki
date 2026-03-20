/**
 * Zod validation schemas for all form inputs in the Bucki application.
 * Provides runtime type validation and type inference.
 * 
 * @module lib/validation/schemas
 */

import { z } from 'zod';

/**
 * Schema for property validation.
 * Validates all required and optional property fields.
 */
export const propertySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  address: z.string().min(1, 'Adresse ist erforderlich').max(200),
  city: z.string().min(1, 'Stadt ist erforderlich').max(100),
  postalCode: z.string().regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben'),
  purchasePrice: z.number().min(0, 'Kaufpreis muss positiv sein'),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  totalArea: z.number().min(0, 'Fläche muss positiv sein'),
  unitsCount: z.number().int().min(0, 'Anzahl Einheiten muss positiv sein'),
  marketValue: z.number().min(0, 'Marktwert muss positiv sein'),
  estimatedValue: z.number().min(0).optional(),
  estimatedValueDate: z.string().optional(),
  pricePerSqm: z.number().min(0).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'needs_renovation']).optional(),
  energyClass: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'unknown']).optional(),
  propertyType: z.enum(['apartment', 'house', 'commercial', 'mixed']),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()),
  locationQuality: z.enum(['top', 'good', 'average', 'below_average']).optional(),
  notes: z.string().max(2000).optional(),
  images: z.array(z.string()).optional(),
  reserves: z.number().min(0).optional(),
  monthlyReserve: z.number().min(0).optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

/**
 * Schema for unit validation.
 */
export const unitSchema = z.object({
  propertyId: z.string().min(1, 'Immobilie ist erforderlich'),
  unitNumber: z.string().min(1, 'Einheitennummer ist erforderlich').max(20),
  floor: z.number().int().min(-5, 'Ungültige Etage').max(100),
  area: z.number().min(0, 'Fläche muss positiv sein'),
  rooms: z.number().min(0, 'Zimmeranzahl muss positiv sein').max(20),
  baseRent: z.number().min(0, 'Kaltmiete muss positiv sein'),
  additionalCosts: z.number().min(0, 'Nebenkosten müssen positiv sein'),
  totalRent: z.number().min(0, 'Warmmiete muss positiv sein'),
  status: z.enum(['rented', 'vacant', 'renovation', 'reserved']),
  description: z.string().max(1000).optional(),
});

export type UnitFormData = z.infer<typeof unitSchema>;

/**
 * Schema for tenant validation.
 */
export const tenantSchema = z.object({
  unitId: z.string().min(1, 'Einheit ist erforderlich'),
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(50),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(50),
  email: z.string().email('Ungültige E-Mail-Adresse').max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  street: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(10).optional().or(z.literal('')),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  moveOutDate: z.string().optional().or(z.literal('')),
  deposit: z.number().min(0, 'Kaution muss positiv sein'),
  contractType: z.enum(['fixed', 'indefinite']),
  contractStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  contractEndDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type TenantFormData = z.infer<typeof tenantSchema>;

/**
 * Schema for transaction validation.
 */
export const transactionSchema = z.object({
  propertyId: z.string().optional().or(z.literal('')),
  unitId: z.string().optional().or(z.literal('')),
  type: z.enum(['income', 'expense']),
  category: z.enum(['rent', 'utilities', 'repairs', 'insurance', 'mortgage', 'reserves', 'management', 'taxes', 'other']),
  amount: z.number().min(0, 'Betrag muss positiv sein'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(500),
  receipt: z.string().optional(),
  isRecurring: z.boolean(),
  recurringInterval: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

/**
 * Schema for financing validation.
 */
export const financingSchema = z.object({
  propertyId: z.string().min(1, 'Immobilie ist erforderlich'),
  bankName: z.string().min(1, 'Bankname ist erforderlich').max(100),
  loanNumber: z.string().max(50).optional().or(z.literal('')),
  principalAmount: z.number().min(0, 'Kreditsumme muss positiv sein'),
  interestRate: z.number().min(0).max(100, 'Zinssatz muss zwischen 0 und 100 liegen'),
  repaymentRate: z.number().min(0).max(100, 'Tilgungssatz muss zwischen 0 und 100 liegen'),
  monthlyRate: z.number().min(0, 'Monatliche Rate muss positiv sein'),
  remainingDebt: z.number().min(0, 'Restschuld muss positiv sein'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  fixedInterestUntil: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type FinancingFormData = z.infer<typeof financingSchema>;

/**
 * Schema for payment validation.
 */
export const paymentSchema = z.object({
  tenantId: z.string().min(1, 'Mieter ist erforderlich'),
  unitId: z.string().min(1, 'Einheit ist erforderlich'),
  propertyId: z.string().min(1, 'Immobilie ist erforderlich'),
  expectedAmount: z.number().min(0, 'Erwarteter Betrag muss positiv sein'),
  receivedAmount: z.number().min(0, 'Erhaltener Betrag muss positiv sein'),
  expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  receivedDate: z.string().optional().or(z.literal('')),
  status: z.enum(['pending', 'partial', 'paid', 'late', 'waived']),
  paymentType: z.enum(['rent', 'deposit', 'utility', 'other']),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Ungültiger Monat'),
  lateFee: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
  reminderSent: z.boolean(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

/**
 * Schema for inspection validation.
 */
export const inspectionSchema = z.object({
  propertyId: z.string().min(1, 'Immobilie ist erforderlich'),
  unitId: z.string().optional().or(z.literal('')),
  tenantId: z.string().optional().or(z.literal('')),
  type: z.enum(['move_in', 'move_out', 'periodic', 'maintenance', 'special']),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  inspector: z.string().min(1, 'Inspektor ist erforderlich').max(100),
  overallCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  summary: z.string().max(5000).optional().or(z.literal('')),
  recommendations: z.array(z.string()).optional(),
  followUpRequired: z.boolean(),
  followUpDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  items: z.array(z.any()).optional(),
});

export type InspectionFormData = z.infer<typeof inspectionSchema>;

/**
 * Schema for document validation.
 */
export const documentSchema = z.object({
  propertyId: z.string().optional().or(z.literal('')),
  unitId: z.string().optional().or(z.literal('')),
  tenantId: z.string().optional().or(z.literal('')),
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  type: z.enum(['rental_contract', 'purchase_contract', 'invoice', 'energy_certificate', 'insurance', 'mortgage', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  description: z.string().max(1000).optional().or(z.literal('')),
  fileData: z.string().optional(),
  fileName: z.string().max(255).optional().or(z.literal('')),
  fileType: z.string().max(100).optional().or(z.literal('')),
  fileSize: z.number().min(0).max(10 * 1024 * 1024, 'Datei zu groß (max 10MB)').optional(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;

/**
 * Schema for task validation.
 */
export const taskSchema = z.object({
  propertyId: z.string().optional().or(z.literal('')),
  unitId: z.string().optional().or(z.literal('')),
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  category: z.enum(['rent_check', 'rent_increase', 'maintenance', 'deadline', 'inspection', 'other']),
  assignedTo: z.string().max(100).optional().or(z.literal('')),
});

export type TaskFormData = z.infer<typeof taskSchema>;

// ============================================
// BANK INTEGRATION SCHEMAS
// ============================================

/**
 * German IBAN validation
 * Format: DE + 2 check digits + 8 digit bank code + 10 digit account number
 */
export const germanIbanSchema = z.string()
  .regex(/^DE\d{20}$/, 'Ungültige deutsche IBAN')
  .transform(v => v.toUpperCase());

/**
 * IBAN validation (international)
 */
export const ibanSchema = z.string()
  .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, 'Ungültige IBAN')
  .transform(v => v.toUpperCase())
  .optional()
  .or(z.literal(''));

/**
 * BIC validation
 */
export const bicSchema = z.string()
  .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Ungültige BIC')
  .transform(v => v.toUpperCase())
  .optional()
  .or(z.literal(''));

/**
 * Bank Transaction Category enum
 */
export const bankTransactionCategorySchema = z.enum([
  'rent_income',
  'utility_income',
  'deposit_income',
  'other_income',
  'mortgage_payment',
  'interest_payment',
  'insurance_payment',
  'utilities_payment',
  'maintenance_payment',
  'management_fee',
  'tax_payment',
  'reserve_deposit',
  'reserve_withdrawal',
  'salary_payment',
  'vendor_payment',
  'transfer_in',
  'transfer_out',
  'fee',
  'unknown',
  'other',
]);

/**
 * Schema for bank account validation.
 */
export const bankAccountSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  bankName: z.string().min(1, 'Bankname ist erforderlich').max(100),
  iban: germanIbanSchema,
  bic: z.string().regex(/^[A-Z]{8}([A-Z0-9]{3})?$/, 'Ungültige BIC'),
  accountNumber: z.string().max(20).optional().or(z.literal('')),
  blz: z.string().regex(/^\d{8}$/, 'Ungültige Bankleitzahl').optional().or(z.literal('')),
  accountType: z.enum(['checking', 'savings', 'loan']),
  currency: z.enum(['EUR', 'USD', 'GBP', 'CHF']),
  currentBalance: z.number(),
  lastSyncDate: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

/**
 * Schema for bank transaction validation.
 */
export const bankTransactionSchema = z.object({
  bankAccountId: z.string().min(1, 'Bankkonto ist erforderlich'),
  originalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Buchungsdatum'),
  valueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Wertstellungsdatum'),
  amount: z.number(),
  currency: z.string().length(3, 'Ungültige Währung'),
  description: z.string().max(2000),
  counterpartyName: z.string().max(200).optional().or(z.literal('')),
  counterpartyIban: ibanSchema,
  counterpartyBic: bicSchema,
  transactionCode: z.string().max(20).optional().or(z.literal('')),
  gvc: z.string().max(10).optional().or(z.literal('')),
  category: bankTransactionCategorySchema,
  categoryConfidence: z.number().min(0).max(100),
  categorySource: z.enum(['manual', 'auto', 'rule', 'ml']),
  matchedType: z.enum(['tenant', 'property', 'financing', 'vendor', 'other']).optional(),
  matchedId: z.string().optional(),
  matchConfidence: z.number().min(0).max(100).optional(),
  matchStatus: z.enum(['unmatched', 'matched', 'ambiguous', 'ignored']),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  paymentId: z.string().optional(),
  transactionId: z.string().optional(),
  importId: z.string().min(1, 'Import-ID ist erforderlich'),
  importSource: z.enum(['csv', 'mt940', 'camt', 'manual']),
  rawLine: z.string().optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
  isReconciled: z.boolean(),
});

export type BankTransactionFormData = z.infer<typeof bankTransactionSchema>;

/**
 * Schema for bank statement import validation.
 */
export const bankStatementImportSchema = z.object({
  bankAccountId: z.string().min(1, 'Bankkonto ist erforderlich'),
  fileName: z.string().min(1, 'Dateiname ist erforderlich').max(255),
  fileType: z.enum(['csv', 'mt940', 'camt']),
  fileSize: z.number().min(0).max(50 * 1024 * 1024, 'Datei zu groß (max 50MB)'),
  importDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Ungültiges Importdatum'),
  status: z.enum(['pending', 'processing', 'completed', 'error']),
  transactionsCount: z.number().int().min(0),
  importedCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  dateRange: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

export type BankStatementImportFormData = z.infer<typeof bankStatementImportSchema>;

/**
 * Schema for category rule validation.
 */
export const categoryRuleSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  category: bankTransactionCategorySchema,
  keywords: z.array(z.string().max(50)).min(0).max(20),
  counterpartyPatterns: z.array(z.string().max(100)).min(0).max(10),
  ibanPatterns: z.array(z.string().max(34)).min(0).max(10),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  amountSign: z.enum(['positive', 'negative', 'any']).optional(),
  matchType: z.enum(['any', 'all']),
  priority: z.number().int().min(0).max(1000),
  isActive: z.boolean(),
  learnedFrom: z.enum(['manual', 'imported']),
  usageCount: z.number().int().min(0),
  lastUsed: z.string().optional().or(z.literal('')),
});

export type CategoryRuleFormData = z.infer<typeof categoryRuleSchema>;

/**
 * Schema for bank import request validation.
 */
export const bankImportRequestSchema = z.object({
  bankAccountId: z.string().min(1, 'Bankkonto ist erforderlich'),
  fileType: z.enum(['csv', 'mt940', 'camt', 'auto']),
  encoding: z.string().max(20).optional().default('UTF-8'),
  delimiter: z.string().max(5).optional(),
  skipDuplicates: z.boolean().optional().default(true),
  autoCategorize: z.boolean().optional().default(true),
  autoMatch: z.boolean().optional().default(true),
});

export type BankImportRequestData = z.infer<typeof bankImportRequestSchema>;

/**
 * Schema for transaction categorization request.
 */
export const categorizeRequestSchema = z.object({
  transactionId: z.string().min(1, 'Transaktions-ID ist erforderlich'),
  category: bankTransactionCategorySchema,
  createRule: z.boolean().optional().default(false),
});

export type CategorizeRequestData = z.infer<typeof categorizeRequestSchema>;

/**
 * Schema for transaction match request.
 */
export const matchRequestSchema = z.object({
  transactionId: z.string().min(1, 'Transaktions-ID ist erforderlich'),
  matchType: z.enum(['tenant', 'property', 'financing', 'vendor', 'other']),
  matchedId: z.string().min(1, 'Match-ID ist erforderlich'),
});

export type MatchRequestData = z.infer<typeof matchRequestSchema>;

/**
 * Validates form data against a schema and returns either the validated data or error messages.
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Object with success status, validated data, and errors
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: boolean; data?: z.infer<T>; errors?: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  const errorList = result.error.issues;
  for (const error of errorList) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  }
  
  return { success: false, errors };
}
