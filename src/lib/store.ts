import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { 
  AppState, 
  DunningLevel,
  ExportData,
  BankAccount,
  BankTransaction,
  BankStatementImport,
  CategoryRule,
  BankTransactionCategory
} from './types';

// Import demo data from separate file
import {
  demoProperties,
  demoUnits,
  demoTenants,
  demoTransactions,
  demoFinancings,
  demoDocuments,
  demoTasks,
  demoDepreciations,
  demoDepreciationItems,
  demoHouseMoney,
  demoPayments,
  demoInspections,
  demoDunningLetters,
  demoUtilitySettlements,
  demoBankAccounts,
  demoBankTransactions
} from '@/data/demo/seedData';

// Local demo data for bank imports and category rules
const demoBankImports: import('./types').BankStatementImport[] = [];
const demoCategoryRules: import('./types').CategoryRule[] = [
  {
    id: 'rule-1',
    name: 'Mieteinnahmen',
    category: 'rent_income',
    keywords: ['miete', 'mieter', 'kaltmiete', 'warmmiete'],
    counterpartyPatterns: [],
    ibanPatterns: [],
    matchType: 'any',
    priority: 100,
    isActive: true,
    learnedFrom: 'manual',
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-2',
    name: 'Versicherungen',
    category: 'insurance_payment',
    keywords: ['versicherung', 'allianz', 'axa', 'huk'],
    counterpartyPatterns: ['versicherung', 'allianz', 'axa'],
    ibanPatterns: [],
    matchType: 'any',
    priority: 90,
    isActive: true,
    learnedFrom: 'manual',
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-3',
    name: 'Stadtwerke',
    category: 'utilities_payment',
    keywords: ['stadtwerke', 'strom', 'gas', 'wasser', 'energie'],
    counterpartyPatterns: ['stadtwerke', 'energie'],
    ibanPatterns: [],
    matchType: 'any',
    priority: 80,
    isActive: true,
    learnedFrom: 'manual',
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-4',
    name: 'Finanzamt',
    category: 'tax_payment',
    keywords: ['finanzamt', 'steuer', 'grundsteuer'],
    counterpartyPatterns: ['finanzamt'],
    ibanPatterns: [],
    matchType: 'any',
    priority: 95,
    isActive: true,
    learnedFrom: 'manual',
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * Generates a unique identifier for database entities.
 * Combines timestamp with random string for uniqueness.
 * @returns A unique string identifier
 */
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Gets the current timestamp in ISO format.
 * Used for createdAt and updatedAt fields.
 * @returns ISO formatted timestamp string
 */
const getTimestamp = (): string => new Date().toISOString();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      properties: demoProperties,
      units: demoUnits,
      tenants: demoTenants,
      transactions: demoTransactions,
      financings: demoFinancings,
      documents: demoDocuments,
      tasks: demoTasks,
      depreciations: demoDepreciations,
      depreciationItems: demoDepreciationItems,
      houseMoney: demoHouseMoney,
      payments: demoPayments,
      inspections: demoInspections,
      dunningLetters: demoDunningLetters,
      utilitySettlements: demoUtilitySettlements,
      
      // Bank state
      bankAccounts: demoBankAccounts,
      bankTransactions: demoBankTransactions,
      bankImports: demoBankImports,
      categoryRules: demoCategoryRules,

      // Property actions
      addProperty: (property) => set((state) => ({
        properties: [...state.properties, {
          ...property,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateProperty: (id, property) => set((state) => ({
        properties: state.properties.map((p) =>
          p.id === id ? { ...p, ...property, updatedAt: getTimestamp() } : p
        ),
      })),

      deleteProperty: (id) => set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        units: state.units.filter((u) => u.propertyId !== id),
        transactions: state.transactions.filter((t) => t.propertyId !== id),
        financings: state.financings.filter((f) => f.propertyId !== id),
        documents: state.documents.filter((d) => d.propertyId !== id),
        tasks: state.tasks.filter((t) => t.propertyId !== id),
      })),

      // Unit actions
      addUnit: (unit) => set((state) => ({
        units: [...state.units, {
          ...unit,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateUnit: (id, unit) => set((state) => ({
        units: state.units.map((u) =>
          u.id === id ? { ...u, ...unit, updatedAt: getTimestamp() } : u
        ),
      })),

      deleteUnit: (id) => set((state) => ({
        units: state.units.filter((u) => u.id !== id),
        tenants: state.tenants.filter((t) => t.unitId !== id),
        transactions: state.transactions.filter((t) => t.unitId !== id),
        documents: state.documents.filter((d) => d.unitId !== id),
        tasks: state.tasks.filter((t) => t.unitId !== id),
      })),

      // Tenant actions
      addTenant: (tenant) => set((state) => ({
        tenants: [...state.tenants, {
          ...tenant,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateTenant: (id, tenant) => set((state) => ({
        tenants: state.tenants.map((t) =>
          t.id === id ? { ...t, ...tenant, updatedAt: getTimestamp() } : t
        ),
      })),

      deleteTenant: (id) => set((state) => ({
        tenants: state.tenants.filter((t) => t.id !== id),
        documents: state.documents.filter((d) => d.tenantId !== id),
      })),

      // Transaction actions
      addTransaction: (transaction) => set((state) => ({
        transactions: [...state.transactions, {
          ...transaction,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateTransaction: (id, transaction) => set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...transaction, updatedAt: getTimestamp() } : t
        ),
      })),

      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      })),

      // Financing actions
      addFinancing: (financing) => set((state) => ({
        financings: [...state.financings, {
          ...financing,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateFinancing: (id, financing) => set((state) => ({
        financings: state.financings.map((f) =>
          f.id === id ? { ...f, ...financing, updatedAt: getTimestamp() } : f
        ),
      })),

      deleteFinancing: (id) => set((state) => ({
        financings: state.financings.filter((f) => f.id !== id),
      })),

      // Document actions
      addDocument: (document) => set((state) => ({
        documents: [...state.documents, {
          ...document,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateDocument: (id, document) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, ...document, updatedAt: getTimestamp() } : d
        ),
      })),

      deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      })),

      // Task actions
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
          ...task,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateTask: (id, task) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...task, updatedAt: getTimestamp() } : t
        ),
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),

      // Depreciation actions
      addDepreciation: (depreciation) => set((state) => ({
        depreciations: [...state.depreciations, {
          ...depreciation,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateDepreciation: (id, depreciation) => set((state) => ({
        depreciations: state.depreciations.map((d) =>
          d.id === id ? { ...d, ...depreciation, updatedAt: getTimestamp() } : d
        ),
      })),

      deleteDepreciation: (id) => set((state) => ({
        depreciations: state.depreciations.filter((d) => d.id !== id),
      })),

      // DepreciationItem actions (neues System)
      addDepreciationItem: (item) => set((state) => ({
        depreciationItems: [...state.depreciationItems, {
          ...item,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateDepreciationItem: (id, item) => set((state) => ({
        depreciationItems: state.depreciationItems.map((d) =>
          d.id === id ? { ...d, ...item, updatedAt: getTimestamp() } : d
        ),
      })),

      deleteDepreciationItem: (id) => set((state) => ({
        depreciationItems: state.depreciationItems.filter((d) => d.id !== id),
      })),

      // HouseMoney actions
      addHouseMoney: (houseMoney) => set((state) => ({
        houseMoney: [...state.houseMoney, {
          ...houseMoney,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateHouseMoney: (id, houseMoney) => set((state) => ({
        houseMoney: state.houseMoney.map((h) =>
          h.id === id ? { ...h, ...houseMoney, updatedAt: getTimestamp() } : h
        ),
      })),

      deleteHouseMoney: (id) => set((state) => ({
        houseMoney: state.houseMoney.filter((h) => h.id !== id),
      })),

      // Payment actions
      addPayment: (payment) => set((state) => ({
        payments: [...state.payments, {
          ...payment,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updatePayment: (id, payment) => set((state) => ({
        payments: state.payments.map((p) =>
          p.id === id ? { ...p, ...payment, updatedAt: getTimestamp() } : p
        ),
      })),

      deletePayment: (id) => set((state) => ({
        payments: state.payments.filter((p) => p.id !== id),
      })),

      // Inspection actions
      addInspection: (inspection) => set((state) => ({
        inspections: [...state.inspections, {
          ...inspection,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateInspection: (id, inspection) => set((state) => ({
        inspections: state.inspections.map((i) =>
          i.id === id ? { ...i, ...inspection, updatedAt: getTimestamp() } : i
        ),
      })),

      deleteInspection: (id) => set((state) => ({
        inspections: state.inspections.filter((i) => i.id !== id),
      })),

      // Dunning Letter actions
      addDunningLetter: (dunningLetter) => set((state) => ({
        dunningLetters: [...state.dunningLetters, {
          ...dunningLetter,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateDunningLetter: (id, dunningLetter) => set((state) => ({
        dunningLetters: state.dunningLetters.map((d) =>
          d.id === id ? { ...d, ...dunningLetter, updatedAt: getTimestamp() } : d
        ),
      })),

      deleteDunningLetter: (id) => set((state) => ({
        dunningLetters: state.dunningLetters.filter((d) => d.id !== id),
      })),

      generateDunningLetter: (paymentId, level) => {
        const state = get();
        const payment = state.payments.find(p => p.id === paymentId);
        if (!payment) return null;

        const tenant = state.tenants.find(t => t.id === payment.tenantId);
        if (!tenant) return null;

        const lateFeeRates: Record<DunningLevel, number> = {
          first: 0.015,
          second: 0.03,
          third: 0.05,
          final: 0.07,
        };

        const lateFee = payment.expectedAmount * lateFeeRates[level];
        const totalAmount = payment.expectedAmount + lateFee;

        const dueDays: Record<DunningLevel, number> = {
          first: 14,
          second: 10,
          third: 7,
          final: 5,
        };

        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + dueDays[level]);

        const newDunningLetter = {
          id: generateId(),
          paymentId,
          tenantId: payment.tenantId,
          level,
          status: 'pending' as const,
          issueDate: today.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          originalAmount: payment.expectedAmount,
          lateFee,
          totalAmount,
          sentVia: 'email' as const,
          notes: '',
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        };

        set((state) => ({
          dunningLetters: [...state.dunningLetters, newDunningLetter],
        }));

        return newDunningLetter;
      },

      // Utility Cost Settlement actions
      addUtilitySettlement: (settlement) => set((state) => ({
        utilitySettlements: [...state.utilitySettlements, {
          ...settlement,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateUtilitySettlement: (id, settlement) => set((state) => ({
        utilitySettlements: state.utilitySettlements.map((s) =>
          s.id === id ? { ...s, ...settlement, updatedAt: getTimestamp() } : s
        ),
      })),

      deleteUtilitySettlement: (id) => set((state) => ({
        utilitySettlements: state.utilitySettlements.filter((s) => s.id !== id),
      })),

      // Bank Account actions
      addBankAccount: (account) => set((state) => ({
        bankAccounts: [...state.bankAccounts, {
          ...account,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateBankAccount: (id, account) => set((state) => ({
        bankAccounts: state.bankAccounts.map((a) =>
          a.id === id ? { ...a, ...account, updatedAt: getTimestamp() } : a
        ),
      })),

      deleteBankAccount: (id) => set((state) => ({
        bankAccounts: state.bankAccounts.filter((a) => a.id !== id),
        bankTransactions: state.bankTransactions.filter((t) => t.bankAccountId !== id),
        bankImports: state.bankImports.filter((i) => i.bankAccountId !== id),
      })),

      // Bank Transaction actions
      addBankTransaction: (transaction) => set((state) => ({
        bankTransactions: [...state.bankTransactions, {
          ...transaction,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      addBankTransactions: (transactions) => set((state) => {
        const newTransactions = transactions.map((t) => ({
          ...t,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }));
        return {
          bankTransactions: [...state.bankTransactions, ...newTransactions],
        };
      }),

      updateBankTransaction: (id, transaction) => set((state) => ({
        bankTransactions: state.bankTransactions.map((t) =>
          t.id === id ? { ...t, ...transaction, updatedAt: getTimestamp() } : t
        ),
      })),

      deleteBankTransaction: (id) => set((state) => ({
        bankTransactions: state.bankTransactions.filter((t) => t.id !== id),
      })),

      // Bank Import actions
      addBankImport: (importRecord) => set((state) => ({
        bankImports: [...state.bankImports, {
          ...importRecord,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateBankImport: (id, importRecord) => set((state) => ({
        bankImports: state.bankImports.map((i) =>
          i.id === id ? { ...i, ...importRecord, updatedAt: getTimestamp() } : i
        ),
      })),

      // Category Rule actions
      addCategoryRule: (rule) => set((state) => ({
        categoryRules: [...state.categoryRules, {
          ...rule,
          id: generateId(),
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }],
      })),

      updateCategoryRule: (id, rule) => set((state) => ({
        categoryRules: state.categoryRules.map((r) =>
          r.id === id ? { ...r, ...rule, updatedAt: getTimestamp() } : r
        ),
      })),

      deleteCategoryRule: (id) => set((state) => ({
        categoryRules: state.categoryRules.filter((r) => r.id !== id),
      })),

      // Batch Operations for Bank
      categorizeTransaction: (transactionId, category, source = 'manual') => set((state) => ({
        bankTransactions: state.bankTransactions.map((t) =>
          t.id === transactionId 
            ? { 
                ...t, 
                category, 
                categoryConfidence: source === 'manual' ? 100 : 80,
                categorySource: source,
                updatedAt: getTimestamp() 
              } 
            : t
        ),
      })),

      matchTransaction: (transactionId, matchType, matchedId) => set((state) => ({
        bankTransactions: state.bankTransactions.map((t) =>
          t.id === transactionId 
            ? { 
                ...t, 
                matchedType: matchType,
                matchedId,
                matchConfidence: 100,
                matchStatus: 'matched',
                updatedAt: getTimestamp() 
              } 
            : t
        ),
      })),

      reconcileTransaction: (transactionId) => set((state) => ({
        bankTransactions: state.bankTransactions.map((t) =>
          t.id === transactionId 
            ? { 
                ...t, 
                isReconciled: true,
                updatedAt: getTimestamp() 
              } 
            : t
        ),
      })),

      // Generate monthly payments for all rented units
      generateMonthlyPayments: (month) => {
        const state = get();
        const rentedUnits = state.units.filter(u => u.status === 'rented');
        const newPayments: typeof state.payments = [];

        rentedUnits.forEach((unit) => {
          const tenant = state.tenants.find((t) => t.unitId === unit.id);
          if (!tenant) return;

          const existingPayment = state.payments.find(
            (p) => p.unitId === unit.id && p.month === month && p.paymentType === 'rent'
          );

          if (!existingPayment) {
            newPayments.push({
              id: generateId(),
              tenantId: tenant.id,
              unitId: unit.id,
              propertyId: unit.propertyId,
              expectedAmount: unit.totalRent,
              receivedAmount: 0,
              expectedDate: `${month}-03`,
              status: 'pending',
              paymentType: 'rent',
              month,
              notes: '',
              reminderSent: false,
              createdAt: getTimestamp(),
              updatedAt: getTimestamp(),
            });
          }
        });

        if (newPayments.length > 0) {
          set((state) => ({
            payments: [...state.payments, ...newPayments],
          }));
          toast.success(`${newPayments.length} Zahlungen erstellt für ${month}`);
        }
      },

      // Import/Export
      importData: (data) => set({
        properties: data.data.properties || [],
        units: data.data.units || [],
        tenants: data.data.tenants || [],
        transactions: data.data.transactions || [],
        financings: data.data.financings || [],
        documents: data.data.documents || [],
        tasks: data.data.tasks || [],
        depreciations: data.data.depreciations || [],
        depreciationItems: data.data.depreciationItems || [],
        houseMoney: data.data.houseMoney || [],
        payments: data.data.payments || [],
        inspections: data.data.inspections || [],
        dunningLetters: data.data.dunningLetters || [],
        utilitySettlements: data.data.utilitySettlements || [],
        bankAccounts: (data.data as any).bankAccounts || [],
        bankTransactions: (data.data as any).bankTransactions || [],
        bankImports: (data.data as any).bankImports || [],
        categoryRules: (data.data as any).categoryRules || [],
      }),

      exportData: () => {
        const state = get();
        return {
          version: '1.0.0',
          exportDate: getTimestamp(),
          data: {
            properties: state.properties,
            units: state.units,
            tenants: state.tenants,
            transactions: state.transactions,
            financings: state.financings,
            documents: state.documents,
            tasks: state.tasks,
            depreciations: state.depreciations,
            depreciationItems: state.depreciationItems,
            houseMoney: state.houseMoney,
            payments: state.payments,
            inspections: state.inspections,
            dunningLetters: state.dunningLetters,
            utilitySettlements: state.utilitySettlements,
            bankAccounts: state.bankAccounts,
            bankTransactions: state.bankTransactions,
            bankImports: state.bankImports,
            categoryRules: state.categoryRules,
          },
        };
      },

      resetData: () => set({
        properties: demoProperties,
        units: demoUnits,
        tenants: demoTenants,
        transactions: demoTransactions,
        financings: demoFinancings,
        documents: demoDocuments,
        tasks: demoTasks,
        depreciations: demoDepreciations,
        depreciationItems: demoDepreciationItems,
        houseMoney: demoHouseMoney,
        payments: demoPayments,
        inspections: demoInspections,
        dunningLetters: demoDunningLetters,
        utilitySettlements: demoUtilitySettlements,
        bankAccounts: demoBankAccounts,
        bankTransactions: demoBankTransactions,
        bankImports: demoBankImports,
        categoryRules: demoCategoryRules,
      }),
    }),
    {
      name: 'bucki-storage',
    }
  )
);
