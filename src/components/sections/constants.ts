/**
 * Shared constants for section components.
 * Contains labels, colors, and mappings used across multiple sections.
 */

import type { 
  TransactionCategory, TaskPriority, TaskStatus, DocumentType,
  DepreciationCategory 
} from '@/lib/types';

// Color palette for charts
export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Category labels for transactions
export const categoryLabels: Record<TransactionCategory, string> = {
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

// Document type labels
export const documentTypeLabels: Record<DocumentType, string> = {
  rental_contract: 'Mietvertrag',
  purchase_contract: 'Kaufvertrag',
  invoice: 'Rechnung',
  energy_certificate: 'Energieausweis',
  insurance: 'Versicherung',
  mortgage: 'Kreditvertrag',
  other: 'Sonstiges',
};

// Task priority labels
export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  urgent: 'Dringend',
};

// Task status labels
export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: 'Offen',
  in_progress: 'In Bearbeitung',
  completed: 'Erledigt',
  cancelled: 'Abgebrochen',
};

// Priority colors
export const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

// Status colors
export const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

// Unit status labels
export const unitStatusLabels: Record<string, string> = {
  rented: 'Vermietet',
  vacant: 'Leer',
  renovation: 'Renovierung',
  reserved: 'Reserviert',
};

// Unit status colors
export const unitStatusColors: Record<string, string> = {
  rented: 'bg-green-100 text-green-800',
  vacant: 'bg-red-100 text-red-800',
  renovation: 'bg-yellow-100 text-yellow-800',
  reserved: 'bg-blue-100 text-blue-800',
};

// Depreciation category labels
export const depreciationCategoryLabels: Record<DepreciationCategory, string> = {
  gebaeude: 'Gebäude',
  moebel: 'Möbel',
  kueche: 'Küche',
  elektro: 'Elektrogeräte',
  inventar: 'Inventar',
  ausstattung: 'Ausstattung',
  sonstiges: 'Sonstiges',
};

// Depreciation category colors
export const depreciationCategoryColors: Record<DepreciationCategory, string> = {
  gebaeude: 'bg-blue-100 text-blue-800',
  moebel: 'bg-amber-100 text-amber-800',
  kueche: 'bg-orange-100 text-orange-800',
  elektro: 'bg-cyan-100 text-cyan-800',
  inventar: 'bg-purple-100 text-purple-800',
  ausstattung: 'bg-pink-100 text-pink-800',
  sonstiges: 'bg-gray-100 text-gray-800',
};
