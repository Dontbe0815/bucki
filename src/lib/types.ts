// Immobilien-Verwaltungs-App "Bucki" - TypeScript Types

// Basis-Interface für alle Entitäten
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Immobilie
export interface Property extends BaseEntity {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  purchasePrice: number;
  purchaseDate: string;
  totalArea: number; // Wohnfläche in m²
  unitsCount: number;
  marketValue: number;
  estimatedValue: number; // ImmoScout24-ähnlicher Schätzwert
  estimatedValueDate: string; // Datum der Schätzung
  pricePerSqm: number; // Preis pro m² (für Berechnung)
  condition: 'excellent' | 'good' | 'fair' | 'needs_renovation'; // Zustand
  energyClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'unknown'; // Energieklasse
  propertyType: 'apartment' | 'house' | 'commercial' | 'mixed';
  yearBuilt: number;
  locationQuality: 'top' | 'good' | 'average' | 'below_average'; // Lagequalität
  notes: string;
  images: string[]; // Base64 encoded images
  reserves?: number; // Erhaltungsrücklage
  monthlyReserve?: number; // Monatliche Rücklagenzahlung
}

// Einheit (Wohnung/Einheit)
export interface Unit extends BaseEntity {
  propertyId: string;
  unitNumber: string;
  floor: number;
  area: number; // m²
  rooms: number;
  baseRent: number; // Kaltmiete
  additionalCosts: number; // Nebenkosten
  totalRent: number; // Warmmiete
  status: 'rented' | 'vacant' | 'renovation' | 'reserved';
  description: string;
}

// Mieter
export interface Tenant extends BaseEntity {
  unitId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  moveInDate: string;
  moveOutDate?: string;
  deposit: number;
  contractType: 'fixed' | 'indefinite';
  contractStartDate: string;
  contractEndDate?: string;
  notes: string;
}

// Einnahmen/Ausgaben
export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 
  | 'rent' 
  | 'utilities' 
  | 'repairs' 
  | 'insurance' 
  | 'mortgage' 
  | 'reserves' 
  | 'management' 
  | 'taxes' 
  | 'other';

export interface Transaction extends BaseEntity {
  propertyId?: string;
  unitId?: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  description: string;
  receipt?: string; // Base64 encoded receipt
  isRecurring: boolean;
  recurringInterval?: 'monthly' | 'quarterly' | 'yearly';
}

// Finanzierung
export interface Financing extends BaseEntity {
  propertyId: string;
  bankName: string;
  loanNumber: string;
  principalAmount: number;
  interestRate: number; // Prozent
  repaymentRate: number; // Tilgung in Prozent
  monthlyRate: number;
  remainingDebt: number;
  startDate: string;
  endDate: string;
  fixedInterestUntil?: string;
  notes: string;
}

// Dokument
export type DocumentType = 
  | 'rental_contract' 
  | 'purchase_contract' 
  | 'invoice' 
  | 'energy_certificate' 
  | 'insurance' 
  | 'mortgage' 
  | 'other';

export interface Document extends BaseEntity {
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  name: string;
  type: DocumentType;
  date: string;
  description: string;
  fileData: string; // Base64 encoded file
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // in bytes
}

// Aufgabe
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task extends BaseEntity {
  propertyId?: string;
  unitId?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: 'rent_check' | 'rent_increase' | 'maintenance' | 'deadline' | 'inspection' | 'other';
  assignedTo?: string;
  completedAt?: string;
}

// Abschreibungskategorie
export type DepreciationCategory = 
  | 'gebaeude' // Gebäude-AfA
  | 'moebel' // Möbel
  | 'kueche' // Küche
  | 'elektro' // Elektrogeräte
  | 'inventar' // Sonstiges Inventar
  | 'ausstattung' // Objektspezifische Ausstattung
  | 'sonstiges'; // Sonstige

// Einzelne Abschreibungsposition pro Objekt
export interface DepreciationItem extends BaseEntity {
  propertyId: string;
  unitId?: string;
  name: string; // Bezeichnung des Wirtschaftsguts
  category: DepreciationCategory;
  purchaseValue: number; // Anschaffungswert
  depreciationRate: number; // Abschreibungssatz in %
  depreciationYears: number; // Abschreibungsdauer in Jahren
  startDate: string; // Startdatum der Abschreibung
  annualDepreciation: number; // Jährlicher Abschreibungsbetrag
  monthlyDepreciation: number; // Monatlicher Abschreibungsbetrag
  accumulatedDepreciation: number; // Bisher abgeschrieben
  remainingValue: number; // Restwert
  notes: string;
}

// Legacy Abschreibung (für Rückwärtskompatibilität)
export interface Depreciation extends BaseEntity {
  propertyId: string;
  unitId?: string;
  name: string;
  purchasePrice: number; // Anschaffungskosten
  buildingShare: number; // Gebäudeanteil in Euro
  landShare: number; // Grund und Boden in Euro
  depreciationRate: number; // Abschreibungssatz (z.B. 2.5% für 40 Jahre)
  startDate: string; // Beginn der Abschreibung
  endDate: string; // Ende der Abschreibung
  annualDepreciation: number; // Jährliche Abschreibung
  monthlyDepreciation: number; // Monatliche Abschreibung
  accumulatedDepreciation: number; // Bisher abgeschrieben
  remainingValue: number; // Restbuchwert
  type: 'linear' | 'degressive';
  notes: string;
}

// Hausgeld
export interface HouseMoney extends BaseEntity {
  propertyId: string;
  unitId?: string;
  month: string; // z.B. "2026-01"
  totalAmount: number; // Gesamtes Hausgeld
  maintenanceReserve: number; // Instandhaltungsrücklage
  administrativeFee: number; // Verwaltungskostenbeitrag
  utilities: number; // Betriebskosten
  water: number; // Wasser
  heating: number; // Heizung
  garbage: number; // Müll
  insurance: number; // Versicherung
  other: number; // Sonstiges
  paymentStatus: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  notes: string;
}

// Zahlung (Mietzahlungstracking)
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'late' | 'waived';

export interface Payment extends BaseEntity {
  tenantId: string;
  unitId: string;
  propertyId: string;
  expectedAmount: number; // Erwarteter Betrag
  receivedAmount: number; // Tatsächlich erhalten
  expectedDate: string; // Fälligkeitsdatum
  receivedDate?: string; // Datum des Zahlungseingangs
  status: PaymentStatus;
  paymentType: 'rent' | 'deposit' | 'utility' | 'other';
  month: string; // z.B. "2026-01" für welchen Monat
  lateFee?: number; // Verspätungszuschlag
  discount?: number; // Rabatt
  notes: string;
  reminderSent: boolean;
  reminderDate?: string;
}

// Inspektion
export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type InspectionType = 'move_in' | 'move_out' | 'periodic' | 'maintenance' | 'special';

export interface InspectionItem {
  id: string;
  category: string; // z.B. "Küche", "Bad", "Wohnzimmer"
  name: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';
  notes: string;
  photos: string[]; // Base64 encoded photos
}

export interface Inspection extends BaseEntity {
  propertyId: string;
  unitId?: string;
  tenantId?: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate: string;
  completedDate?: string;
  inspector: string;
  items: InspectionItem[];
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
  recommendations: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  signature?: string; // Base64 signature
}

// App State
export interface AppState {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  transactions: Transaction[];
  financings: Financing[];
  documents: Document[];
  tasks: Task[];
  depreciations: Depreciation[];
  depreciationItems: DepreciationItem[]; // Neue detaillierte Abschreibungspositionen
  houseMoney: HouseMoney[];
  payments: Payment[];
  inspections: Inspection[];
  dunningLetters: DunningLetter[];
  utilitySettlements: UtilityCostSettlement[];
  
  // Bank state
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  bankImports: BankStatementImport[];
  categoryRules: CategoryRule[];
  
  // Actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;
  
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTenant: (id: string, tenant: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  addFinancing: (financing: Omit<Financing, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFinancing: (id: string, financing: Partial<Financing>) => void;
  deleteFinancing: (id: string) => void;
  
  addDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, document: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  addDepreciation: (depreciation: Omit<Depreciation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDepreciation: (id: string, depreciation: Partial<Depreciation>) => void;
  deleteDepreciation: (id: string) => void;
  
  addDepreciationItem: (item: Omit<DepreciationItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDepreciationItem: (id: string, item: Partial<DepreciationItem>) => void;
  deleteDepreciationItem: (id: string) => void;
  
  addHouseMoney: (houseMoney: Omit<HouseMoney, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHouseMoney: (id: string, houseMoney: Partial<HouseMoney>) => void;
  deleteHouseMoney: (id: string) => void;
  
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  
  addInspection: (inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInspection: (id: string, inspection: Partial<Inspection>) => void;
  deleteInspection: (id: string) => void;
  
  addDunningLetter: (dunningLetter: Omit<DunningLetter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDunningLetter: (id: string, dunningLetter: Partial<DunningLetter>) => void;
  deleteDunningLetter: (id: string) => void;
  generateDunningLetter: (paymentId: string, level: DunningLevel) => DunningLetter | null;
  
  addUtilitySettlement: (settlement: Omit<UtilityCostSettlement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUtilitySettlement: (id: string, settlement: Partial<UtilityCostSettlement>) => void;
  deleteUtilitySettlement: (id: string) => void;
  
  // Bank Account Actions
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBankAccount: (id: string, account: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  
  // Bank Transaction Actions
  addBankTransaction: (transaction: Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addBankTransactions: (transactions: Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateBankTransaction: (id: string, transaction: Partial<BankTransaction>) => void;
  deleteBankTransaction: (id: string) => void;
  
  // Bank Import Actions
  addBankImport: (importRecord: Omit<BankStatementImport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBankImport: (id: string, importRecord: Partial<BankStatementImport>) => void;
  
  // Category Rule Actions
  addCategoryRule: (rule: Omit<CategoryRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategoryRule: (id: string, rule: Partial<CategoryRule>) => void;
  deleteCategoryRule: (id: string) => void;
  
  // Bank Batch Operations
  categorizeTransaction: (transactionId: string, category: BankTransactionCategory, source?: 'manual' | 'rule') => void;
  matchTransaction: (transactionId: string, matchType: 'tenant' | 'property' | 'financing' | 'vendor', matchedId: string) => void;
  reconcileTransaction: (transactionId: string) => void;
  
  generateMonthlyPayments: (month: string) => void;
  
  // Import/Export
  importData: (data: ExportData) => void;
  exportData: () => ExportData;
  resetData: () => void;
}

// Export Data Format
export interface ExportData {
  version: string;
  exportDate: string;
  data: {
    properties: Property[];
    units: Unit[];
    tenants: Tenant[];
    transactions: Transaction[];
    financings: Financing[];
    documents: Document[];
    tasks: Task[];
    depreciations: Depreciation[];
    depreciationItems: DepreciationItem[];
    houseMoney: HouseMoney[];
    payments: Payment[];
    inspections: Inspection[];
    dunningLetters: DunningLetter[];
    utilitySettlements: UtilityCostSettlement[];
  };
}

// Dashboard Stats
export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  rentedUnits: number;
  vacantUnits: number;
  totalRentIncome: number;
  totalExpenses: number;
  cashflow: number;
  totalMarketValue: number;
  totalMortgageDebt: number;
  equity: number;
  openTasks: number;
  overdueTasks: number;
}

// Chart Data Types
export interface MonthlyCashflow {
  month: string;
  income: number;
  expenses: number;
  cashflow: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

// ============================================
// NEUE TYPES FÜR UPGRADE
// ============================================

// Favoriten
export interface Favorite {
  id: string;
  type: 'property' | 'unit';
  entityId: string;
  createdAt: string;
}

// App Einstellungen
export interface AppSettings {
  language: 'de' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  dueTasks: boolean;
  rentIncreases: boolean;
  contractExpirations: boolean;
}

export interface SecuritySettings {
  pinEnabled: boolean;
  pin?: string; // Hashed PIN
  biometricEnabled: boolean;
  autoLockMinutes: number; // 0 = never
  autoLockTime?: number; // Alias for autoLockMinutes (for compatibility)
}

// Kalender Event
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: 'task' | 'deadline' | 'reminder' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  propertyId?: string;
  unitId?: string;
  taskId?: string;
  description?: string;
  color?: string;
}

// Bulk Operation
export interface BulkOperation {
  type: 'delete' | 'status_change' | 'export';
  entityType: 'property' | 'unit' | 'tenant' | 'transaction' | 'task' | 'document';
  entityIds: string[];
  newStatus?: string;
}

// Suchergebnis
export interface SearchResult {
  type: 'property' | 'unit' | 'tenant' | 'document' | 'task';
  id: string;
  title: string;
  subtitle?: string;
  propertyId?: string;
}

// Dashboard Zeitraum-Filter
export type TimeFilterType = 'month' | 'quarter' | 'year' | 'custom';

export interface TimeFilter {
  type: TimeFilterType;
  startDate?: string;
  endDate?: string;
}

// Trend-Daten für Vorjahresvergleich
export interface TrendData {
  current: number;
  previous: number;
  change: number; // Prozent
  trend: 'up' | 'down' | 'same';
}

// Erweiterte KPI-Daten für Dashboard
export interface EnhancedKPIData {
  // Kernkennzahlen
  roe: number; // Eigenkapitalrendite
  ltv: number; // Loan-to-Value
  netWorth: number; // Nettovermögen
  tilgungsAnteil: number; // Tilgungsanteil in %
  zinsAnteil: number; // Zinsanteil in %
  bruttoMietrendite: number; // Bruttomietrendite in %
  nettoMietrendite: number; // Nettomietrendite in %
  
  // Performance & Risiko
  leerstandsquote: number; // Leerstandsquote in %
  kostenquote: number; // Kostenquote in %
  cashOnCashReturn: number; // Cash-on-Cash Return in %
  breakEvenMonate: number; // Break-even in Monaten
  
  // Trend-Daten
  cashflowTrend: TrendData;
  incomeTrend: TrendData;
  expenseTrend: TrendData;
  netWorthTrend: TrendData;
}

// Health Score für Portfolio
export interface HealthScore {
  overall: number; // 0-100
  categories: {
    financial: number;
    occupancy: number;
    maintenance: number;
    documentation: number;
  };
  recommendations: HealthRecommendation[];
}

export interface HealthRecommendation {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: string;
  propertyId?: string;
  unitId?: string;
  taskId?: string;
}

// Forecast-Daten für Projektionen
export interface ForecastData {
  years: number;
  assumptions: {
    propertyValueGrowth: number; // % pro Jahr
    rentIncrease: number; // % pro Jahr
    expenseInflation: number; // % pro Jahr
    interestRate: number; // % für Neufinanzierung
  };
  projections: ForecastYear[];
}

export interface ForecastYear {
  year: number;
  propertyValue: number;
  remainingDebt: number;
  equity: number;
  annualIncome: number;
  annualExpenses: number;
  annualCashflow: number;
  cumulativeCashflow: number;
}

// Kalender-Event (erweitert)
export interface CalendarEventType {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: 'task' | 'deadline' | 'reminder' | 'payment' | 'contract_expiry' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  propertyId?: string;
  unitId?: string;
  taskId?: string;
  description?: string;
  color?: string;
  completed?: boolean;
}

// Multi-Currency Support
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF';

export interface CurrencySettings {
  defaultCurrency: Currency;
  propertyCurrencies: Record<string, Currency>; // propertyId -> currency
  exchangeRates: Record<Currency, number>; // rate to default currency
}

// Push Notification Settings
export interface PushNotificationSettings {
  enabled: boolean;
  taskDue: boolean;
  taskDueDays: number; // Tage vor Fälligkeit
  contractExpiry: boolean;
  contractExpiryDays: number;
  rentPayment: boolean;
  rentPaymentDays: number;
}

// Security Settings
export interface SecuritySettingsExtended {
  pinEnabled: boolean;
  pin?: string; // Hashed PIN
  biometricEnabled: boolean;
  autoLockMinutes: number; // 0 = never
  lastActivity?: string;
  isLocked: boolean;
}

// Bulk Operation Result
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

// Dashboard Quick Action
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

// Erweiterte App State mit neuen Features
export interface ExtendedAppState extends AppState {
  // Favoriten
  favorites: Favorite[];
  addFavorite: (type: 'property' | 'unit', entityId: string) => void;
  removeFavorite: (entityId: string) => void;
  isFavorite: (entityId: string) => boolean;
  
  // Einstellungen
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Kalender Events
  calendarEvents: CalendarEvent[];
  
  // Bulk Operations
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Import/Export erweitert
  importFromCSV: (file: File, type: 'transactions' | 'tenants') => Promise<ImportResult>;
  exportToCSV: (type: 'transactions' | 'tenants' | 'units' | 'depreciations') => string;
  exportToExcel: (type: 'transactions' | 'tenants' | 'units' | 'depreciations') => Blob;
  exportToPDF: (type: 'report' | 'annual' | 'cashflow', data: any) => Blob;
}

// ============================================
// MAHNWESEN (DUNNING SYSTEM)
// ============================================

// Mahnstufen
export type DunningLevel = 'first' | 'second' | 'third' | 'final';

// Mahnungsstatus
export type DunningStatus = 'pending' | 'sent' | 'paid' | 'escalated';

// Mahnung (Dunning Letter)
export interface DunningLetter extends BaseEntity {
  paymentId: string;
  tenantId: string;
  level: DunningLevel;
  status: DunningStatus;
  issueDate: string;
  dueDate: string;
  originalAmount: number;
  lateFee: number;
  totalAmount: number;
  sentVia: 'email' | 'mail' | 'both';
  notes: string;
}

// ============================================
// NEBENKOSTENABRECHNUNG (UTILITY COST settlement)
// ============================================

// Nebenkostenabrechnung
export interface UtilityCostSettlement extends BaseEntity {
  propertyId: string;
  unitId?: string;
  tenantId: string;
  year: number;
  startDate: string;
  endDate: string;
  
  // Verbrauchsdaten
  heatingConsumption: number; // kWh
  heatingCosts: number;
  waterConsumption: number; // m³
  waterCosts: number;
  
  // Umlagen
  garbageCosts: number;
  insuranceCosts: number;
  maintenanceCosts: number;
  administrativeCosts: number;
  otherCosts: number;
  
  // Vorauszahlungen
  prepaymentsTotal: number;
  
  // Ergebnis
  totalCosts: number;
  tenantShare: number;
  balance: number; // positive = Nachzahlung, negative = Guthaben
  
  status: 'draft' | 'sent' | 'accepted' | 'disputed';
  sentDate?: string;
  notes: string;
}

// Import Ergebnis
export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

// ============================================
// DASHBOARD WIDGETS
// ============================================

// Widget Types
export type DashboardWidgetType = 
  | 'quickActions'
  | 'topKpis'
  | 'kpiRow'
  | 'cashflowChart'
  | 'categoryChart'
  | 'portfolioChart'
  | 'healthScore'
  | 'forecast'
  | 'recentTransactions'
  | 'upcomingTasks'
  | 'rentPerSqm'
  | 'mortgageSplit'
  | 'propertyValueTable'
  | 'appreciationTable'
  | 'cityDistribution'
  | 'taxOverview'
  | 'depositsOverview'
  | 'reservesOverview'
  | 'bankAccounts'
  | 'loansOverview'
  | 'comparativeRents'
  | 'investments'
  | 'specialAssessments'
  | 'landValues';

// Dashboard Widget Configuration
export interface DashboardWidget {
  id: DashboardWidgetType;
  visible: boolean;
  order: number;
}

// Widget Metadata for UI
export interface WidgetMetadata {
  id: DashboardWidgetType;
  name: string;
  description: string;
  icon: string;
}

// Default Dashboard Widgets
export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: 'quickActions', visible: true, order: 0 },
  { id: 'topKpis', visible: true, order: 1 },
  { id: 'kpiRow', visible: true, order: 2 },
  { id: 'cashflowChart', visible: true, order: 3 },
  { id: 'categoryChart', visible: true, order: 4 },
  { id: 'cityDistribution', visible: true, order: 5 },
  { id: 'propertyValueTable', visible: true, order: 6 },
  { id: 'appreciationTable', visible: true, order: 7 },
  { id: 'mortgageSplit', visible: true, order: 8 },
  { id: 'healthScore', visible: true, order: 9 },
  { id: 'forecast', visible: true, order: 10 },
  { id: 'taxOverview', visible: true, order: 11 },
  { id: 'depositsOverview', visible: true, order: 12 },
  { id: 'reservesOverview', visible: true, order: 13 },
  { id: 'loansOverview', visible: true, order: 14 },
  { id: 'comparativeRents', visible: true, order: 15 },
  { id: 'investments', visible: true, order: 16 },
  { id: 'specialAssessments', visible: true, order: 17 },
  { id: 'landValues', visible: true, order: 18 },
  { id: 'bankAccounts', visible: true, order: 19 },
];

// Widget Metadata for UI Display
export const WIDGET_METADATA: Record<DashboardWidgetType, { name: string; description: string }> = {
  quickActions: { name: 'Schnellaktionen', description: 'Buttons für häufige Aktionen' },
  topKpis: { name: 'Top-KPIs', description: 'Wichtigste Kennzahlen auf einen Blick' },
  kpiRow: { name: 'KPI-Zeile', description: 'Zusätzliche Kennzahlen' },
  cashflowChart: { name: 'Cashflow-Chart', description: 'Monatlicher Cashflow-Verlauf' },
  categoryChart: { name: 'Kategorien-Chart', description: 'Ausgaben nach Kategorien' },
  portfolioChart: { name: 'Portfolio-Chart', description: 'Immobilienverteilung' },
  healthScore: { name: 'Health Score', description: 'Portfolio-Gesundheit' },
  forecast: { name: 'Prognose', description: '10-Jahres-Vorschau' },
  recentTransactions: { name: 'Letzte Buchungen', description: 'Aktuelle Transaktionen' },
  upcomingTasks: { name: 'Anstehende Aufgaben', description: 'Offene Aufgaben' },
  rentPerSqm: { name: 'Miete pro m²', description: 'Durchschnittliche Miete' },
  mortgageSplit: { name: 'Darlehens-Aufteilung', description: 'Zins vs. Tilgung' },
  propertyValueTable: { name: 'Beste Renditen', description: 'Tabelle nach Rendite sortiert' },
  appreciationTable: { name: 'Wertsteigerung', description: 'Immobilien mit größter Steigerung' },
  cityDistribution: { name: 'Städte-Verteilung', description: 'Portfolio nach Städten' },
  taxOverview: { name: 'Steuern', description: 'Steuerliche Übersicht' },
  depositsOverview: { name: 'Kautionen', description: 'Mieterkautionen Übersicht' },
  reservesOverview: { name: 'Rücklagen', description: 'Erhaltungsrücklagen' },
  bankAccounts: { name: 'Bankkonten', description: 'Kontostände Übersicht' },
  loansOverview: { name: 'Kredite', description: 'Darlehen Übersicht' },
  comparativeRents: { name: 'Kaltmiete vs. Vergleich', description: 'Marktvergleich' },
  investments: { name: 'Investitionen', description: 'Getätigte Investitionen' },
  specialAssessments: { name: 'Sonderumlagen', description: 'Umlagen Übersicht' },
  landValues: { name: 'Grundstückswerte', description: 'Bodenwerte' },
};

// ============================================
// BANK INTEGRATION
// ============================================

// Bank Account
export interface BankAccount extends BaseEntity {
  name: string; // Display name
  bankName: string; // e.g., "Sparkasse", "Volksbank"
  iban: string;
  bic: string;
  accountNumber: string;
  blz: string; // Bankleitzahl
  accountType: 'checking' | 'savings' | 'loan';
  currency: Currency;
  currentBalance: number;
  lastSyncDate?: string;
  isActive: boolean;
  notes: string;
}

// Bank Transaction from Statement
export interface BankTransaction extends BaseEntity {
  bankAccountId: string;
  
  // Original bank data
  originalDate: string; // Buchungsdatum
  valueDate: string; // Wertstellungsdatum
  amount: number; // Can be negative for expenses
  currency: string;
  
  // Transaction details
  description: string; // Verwendungszweck
  counterpartyName: string; // Name des Zahlers/Empfängers
  counterpartyIban?: string;
  counterpartyBic?: string;
  transactionCode?: string; // Geschäftsfallcode
  gvc?: string; // Textschlüssel
  
  // Categorization
  category: BankTransactionCategory;
  categoryConfidence: number; // 0-100, ML confidence
  categorySource: 'manual' | 'auto' | 'rule' | 'ml';
  
  // Matching
  matchedType?: 'tenant' | 'property' | 'financing' | 'vendor' | 'other';
  matchedId?: string; // ID of matched entity
  matchConfidence?: number;
  matchStatus: 'unmatched' | 'matched' | 'ambiguous' | 'ignored';
  
  // Linking
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  paymentId?: string;
  transactionId?: string; // Link to internal Transaction
  
  // Import info
  importId: string; // Reference to import batch
  importSource: 'csv' | 'mt940' | 'camt' | 'manual';
  rawLine?: string; // Original line for debugging
  
  notes: string;
  isReconciled: boolean;
}

// Bank Transaction Categories (extended for German real estate)
export type BankTransactionCategory = 
  | 'rent_income' // Mieteinnahmen
  | 'utility_income' // Nebenkosteneinnahmen
  | 'deposit_income' // Kautionseinzug
  | 'other_income' // Sonstige Einnahmen
  | 'mortgage_payment' // Darlehensrate
  | 'interest_payment' // Zinszahlung
  | 'insurance_payment' // Versicherung
  | 'utilities_payment' // Betriebskosten
  | 'maintenance_payment' // Instandhaltung
  | 'management_fee' // Hausverwaltung
  | 'tax_payment' // Steuern
  | 'reserve_deposit' // Rücklageneinzahlung
  | 'reserve_withdrawal' // Rücklagenentnahme
  | 'salary_payment' // Gehälter
  | 'vendor_payment' // Lieferantenzahlung
  | 'transfer_in' // Umbuchung Eingang
  | 'transfer_out' // Umbuchung Ausgang
  | 'fee' // Bankgebühren
  | 'unknown' // Unkategorisiert
  | 'other'; // Sonstiges

// Bank Statement Import
export interface BankStatementImport extends BaseEntity {
  bankAccountId: string;
  fileName: string;
  fileType: 'csv' | 'mt940' | 'camt';
  fileSize: number;
  importDate: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  transactionsCount: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  warnings: string[];
  dateRange: {
    from: string;
    to: string;
  };
}

// Category Rule for auto-categorization
export interface CategoryRule extends BaseEntity {
  name: string;
  category: BankTransactionCategory;
  
  // Rule conditions
  keywords: string[]; // Keywords to match in description
  counterpartyPatterns: string[]; // Patterns for counterparty name
  ibanPatterns: string[]; // IBAN patterns
  amountMin?: number;
  amountMax?: number;
  amountSign?: 'positive' | 'negative' | 'any';
  
  // Match settings
  matchType: 'any' | 'all'; // Match any or all conditions
  priority: number; // Higher priority rules are checked first
  isActive: boolean;
  
  // Learning
  learnedFrom: 'manual' | 'imported';
  usageCount: number;
  lastUsed?: string;
}

// Transaction Match Suggestion
export interface TransactionMatchSuggestion {
  bankTransactionId: string;
  matchType: 'tenant' | 'property' | 'financing' | 'vendor';
  matchedId: string;
  matchedName: string;
  confidence: number; // 0-100
  matchReason: string;
  details?: {
    ibanMatch?: boolean;
    nameMatch?: boolean;
    amountMatch?: boolean;
    dateProximity?: number; // Days difference
  };
}

// Bank Reconciliation Summary
export interface BankReconciliationSummary {
  bankAccountId: string;
  statementBalance: number;
  calculatedBalance: number;
  difference: number;
  unmatchedTransactions: number;
  matchedTransactions: number;
  pendingPayments: number; // Expected payments not found
  dateRange: {
    from: string;
    to: string;
  };
}

// German Bank Format Configuration
export interface BankFormatConfig {
  name: string;
  bankIdentifier: string; // e.g., "SPK" for Sparkasse
  formatType: 'csv' | 'mt940' | 'camt';
  csvConfig?: {
    delimiter: string;
    encoding: string;
    dateFormat: string;
    hasHeader: boolean;
    skipLines: number;
    columnMapping: {
      date?: number;
      valueDate?: number;
      amount?: number;
      description?: number;
      counterpartyName?: number;
      counterpartyIban?: number;
      counterpartyBic?: number;
      transactionCode?: number;
    };
    amountFormat: 'decimal_comma' | 'decimal_point';
    negativeSign: 'prefix' | 'suffix' | 'separate_column';
  };
}

// Predefined German bank formats
export const GERMAN_BANK_FORMATS: BankFormatConfig[] = [
  {
    name: 'Sparkasse CSV',
    bankIdentifier: 'SPK',
    formatType: 'csv',
    csvConfig: {
      delimiter: ';',
      encoding: 'UTF-8',
      dateFormat: 'dd.MM.yyyy',
      hasHeader: true,
      skipLines: 0,
      columnMapping: {
        date: 0,
        valueDate: 1,
        amount: 8,
        description: 4,
        counterpartyName: 3,
        counterpartyIban: 6,
        counterpartyBic: 7,
        transactionCode: 2,
      },
      amountFormat: 'decimal_comma',
      negativeSign: 'prefix',
    },
  },
  {
    name: 'Volksbank CSV',
    bankIdentifier: 'VB',
    formatType: 'csv',
    csvConfig: {
      delimiter: ';',
      encoding: 'UTF-8',
      dateFormat: 'dd.MM.yyyy',
      hasHeader: true,
      skipLines: 0,
      columnMapping: {
        date: 1,
        valueDate: 2,
        amount: 7,
        description: 5,
        counterpartyName: 4,
        counterpartyIban: 8,
        counterpartyBic: 9,
      },
      amountFormat: 'decimal_comma',
      negativeSign: 'prefix',
    },
  },
  {
    name: 'Deutsche Bank CSV',
    bankIdentifier: 'DB',
    formatType: 'csv',
    csvConfig: {
      delimiter: ';',
      encoding: 'ISO-8859-1',
      dateFormat: 'dd.MM.yyyy',
      hasHeader: true,
      skipLines: 0,
      columnMapping: {
        date: 0,
        valueDate: 1,
        amount: 4,
        description: 3,
        counterpartyName: 2,
        counterpartyIban: 8,
      },
      amountFormat: 'decimal_comma',
      negativeSign: 'suffix',
    },
  },
  {
    name: 'Commerzbank CSV',
    bankIdentifier: 'CB',
    formatType: 'csv',
    csvConfig: {
      delimiter: ';',
      encoding: 'UTF-8',
      dateFormat: 'dd.MM.yyyy',
      hasHeader: true,
      skipLines: 0,
      columnMapping: {
        date: 0,
        valueDate: 1,
        amount: 5,
        description: 3,
        counterpartyName: 2,
        counterpartyIban: 8,
      },
      amountFormat: 'decimal_comma',
      negativeSign: 'prefix',
    },
  },
  {
    name: 'ING CSV',
    bankIdentifier: 'ING',
    formatType: 'csv',
    csvConfig: {
      delimiter: ';',
      encoding: 'UTF-8',
      dateFormat: 'dd.MM.yyyy',
      hasHeader: true,
      skipLines: 0,
      columnMapping: {
        date: 0,
        valueDate: 1,
        amount: 6,
        description: 4,
        counterpartyName: 3,
        counterpartyIban: 5,
      },
      amountFormat: 'decimal_comma',
      negativeSign: 'prefix',
    },
  },
  {
    name: 'Postbank CSV',
    bankIdentifier: 'PB',
    formatType: 'csv',
    csvConfig: {
      delimiter: ';',
      encoding: 'UTF-8',
      dateFormat: 'dd.MM.yyyy',
      hasHeader: true,
      skipLines: 0,
      columnMapping: {
        date: 0,
        valueDate: 1,
        amount: 7,
        description: 4,
        counterpartyName: 3,
        counterpartyIban: 8,
      },
      amountFormat: 'decimal_comma',
      negativeSign: 'prefix',
    },
  },
];

// Bank Transaction Category Labels (German)
export const BANK_TRANSACTION_CATEGORY_LABELS: Record<BankTransactionCategory, { de: string; en: string }> = {
  rent_income: { de: 'Mieteinnahmen', en: 'Rent Income' },
  utility_income: { de: 'Nebenkosteneinnahmen', en: 'Utility Income' },
  deposit_income: { de: 'Kautionseinzug', en: 'Deposit Received' },
  other_income: { de: 'Sonstige Einnahmen', en: 'Other Income' },
  mortgage_payment: { de: 'Darlehensrate', en: 'Mortgage Payment' },
  interest_payment: { de: 'Zinszahlung', en: 'Interest Payment' },
  insurance_payment: { de: 'Versicherung', en: 'Insurance Payment' },
  utilities_payment: { de: 'Betriebskosten', en: 'Utilities Payment' },
  maintenance_payment: { de: 'Instandhaltung', en: 'Maintenance' },
  management_fee: { de: 'Hausverwaltung', en: 'Management Fee' },
  tax_payment: { de: 'Steuern', en: 'Tax Payment' },
  reserve_deposit: { de: 'Rücklageneinzahlung', en: 'Reserve Deposit' },
  reserve_withdrawal: { de: 'Rücklagenentnahme', en: 'Reserve Withdrawal' },
  salary_payment: { de: 'Gehälter', en: 'Salary Payment' },
  vendor_payment: { de: 'Lieferantenzahlung', en: 'Vendor Payment' },
  transfer_in: { de: 'Umbuchung Eingang', en: 'Transfer In' },
  transfer_out: { de: 'Umbuchung Ausgang', en: 'Transfer Out' },
  fee: { de: 'Bankgebühren', en: 'Bank Fees' },
  unknown: { de: 'Unkategorisiert', en: 'Uncategorized' },
  other: { de: 'Sonstiges', en: 'Other' },
};

// Extended AppState with Bank data
export interface BankAppState {
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  bankImports: BankStatementImport[];
  categoryRules: CategoryRule[];
  
  // Bank Account Actions
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBankAccount: (id: string, account: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  
  // Bank Transaction Actions
  addBankTransaction: (transaction: Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addBankTransactions: (transactions: Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateBankTransaction: (id: string, transaction: Partial<BankTransaction>) => void;
  deleteBankTransaction: (id: string) => void;
  
  // Bank Import Actions
  addBankImport: (importRecord: Omit<BankStatementImport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBankImport: (id: string, importRecord: Partial<BankStatementImport>) => void;
  
  // Category Rule Actions
  addCategoryRule: (rule: Omit<CategoryRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategoryRule: (id: string, rule: Partial<CategoryRule>) => void;
  deleteCategoryRule: (id: string) => void;
  
  // Batch Operations
  categorizeTransaction: (transactionId: string, category: BankTransactionCategory, source?: 'manual' | 'rule') => void;
  matchTransaction: (transactionId: string, matchType: 'tenant' | 'property' | 'financing' | 'vendor', matchedId: string) => void;
  reconcileTransaction: (transactionId: string) => void;
}

// ============================================
// CALENDAR SYNC TYPES
// ============================================

// Calendar Provider Types
export type CalendarProvider = 'google' | 'outlook' | 'apple';

// Calendar Sync Status
export type CalendarSyncStatus = 'not_connected' | 'connected' | 'syncing' | 'error' | 'expired';

// Calendar Connection State
export interface CalendarConnection {
  provider: CalendarProvider;
  connected: boolean;
  email?: string;
  calendarId?: string;
  calendarName?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  lastSync?: string;
  status: CalendarSyncStatus;
  error?: string;
}

// Calendar Sync Settings
export interface CalendarSyncSettings {
  enabled: boolean;
  providers: CalendarProvider[];
  syncInterval: number; // minutes (0 = manual only)
  bidirectional: boolean;
  
  // Event type toggles
  syncRentPayments: boolean;
  syncMaintenanceTasks: boolean;
  syncContractExpirations: boolean;
  syncUtilitySettlements: boolean;
  syncDeadlines: boolean;
  syncInspections: boolean;
  
  // Reminder settings
  defaultReminderMinutes: number;
  addReminders: boolean;
  
  // Recurring events
  createRecurringPayments: boolean;
  paymentReminderDays: number;
}

// Synced Calendar Event
export interface SyncedCalendarEvent {
  id: string;
  externalEventId: string; // ID in external calendar
  provider: CalendarProvider;
  eventType: 'rent_payment' | 'maintenance' | 'contract_expiry' | 'utility_settlement' | 'deadline' | 'inspection' | 'custom';
  
  // References to app entities
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  taskId?: string;
  financingId?: string;
  paymentId?: string;
  
  // Event details
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  
  // Recurrence
  isRecurring: boolean;
  recurrenceRule?: string; // RRULE format
  
  // Sync metadata
  lastSynced: string;
  syncHash: string; // For detecting changes
  externalCalendarId: string;
}

// OAuth Callback State
export interface OAuthState {
  provider: CalendarProvider;
  redirectUrl: string;
  timestamp: number;
}

// Google Calendar API Types
export interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

// Microsoft Outlook Calendar Types
export interface OutlookCalendar {
  id: string;
  name: string;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
}

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  body?: {
    content: string;
    contentType: 'text' | 'html';
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay?: boolean;
  recurrence?: {
    pattern: {
      type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly';
      interval: number;
    };
    range: {
      type: 'endDate' | 'noEnd' | 'numbered';
      startDate: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };
}

// Calendar Sync Error
export interface CalendarSyncError {
  provider: CalendarProvider;
  error: string;
  code?: string;
  timestamp: string;
  recoverable: boolean;
}

// Calendar Sync Result
export interface CalendarSyncResult {
  success: boolean;
  provider: CalendarProvider;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: CalendarSyncError[];
  syncDuration: number; // milliseconds
}

// Default Calendar Sync Settings
export const DEFAULT_CALENDAR_SYNC_SETTINGS: CalendarSyncSettings = {
  enabled: false,
  providers: [],
  syncInterval: 60, // 1 hour
  bidirectional: false,
  syncRentPayments: true,
  syncMaintenanceTasks: true,
  syncContractExpirations: true,
  syncUtilitySettlements: true,
  syncDeadlines: true,
  syncInspections: true,
  defaultReminderMinutes: 60,
  addReminders: true,
  createRecurringPayments: true,
  paymentReminderDays: 3,
};
