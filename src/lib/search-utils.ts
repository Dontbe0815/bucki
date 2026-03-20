// Search Utilities für Bucki App
// Globale Suche über alle Bereiche

import type { Property, Unit, Tenant, Document, Task, Transaction } from './types';

export interface SearchResult {
  type: 'property' | 'unit' | 'tenant' | 'document' | 'task' | 'transaction';
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  propertyId?: string;
  unitId?: string;
  score: number; // Relevance score
}

export interface SearchOptions {
  includeProperties?: boolean;
  includeUnits?: boolean;
  includeTenants?: boolean;
  includeDocuments?: boolean;
  includeTasks?: boolean;
  includeTransactions?: boolean;
  limit?: number;
}

// Main search function
export function globalSearch(
  query: string,
  data: {
    properties: Property[];
    units: Unit[];
    tenants: Tenant[];
    documents: Document[];
    tasks: Task[];
    transactions: Transaction[];
  },
  options: SearchOptions = {}
): SearchResult[] {
  if (!query.trim()) return [];
  
  const {
    includeProperties = true,
    includeUnits = true,
    includeTenants = true,
    includeDocuments = true,
    includeTasks = true,
    includeTransactions = false, // Usually too many, off by default
    limit = 20,
  } = options;
  
  const results: SearchResult[] = [];
  const normalizedQuery = query.toLowerCase().trim();
  
  // Search properties
  if (includeProperties) {
    data.properties.forEach(p => {
      const score = calculateScore(normalizedQuery, [
        p.name,
        p.address,
        p.city,
        p.postalCode,
        p.notes,
      ]);
      
      if (score > 0) {
        results.push({
          type: 'property',
          id: p.id,
          title: p.name,
          subtitle: `${p.address}, ${p.city}`,
          icon: 'building',
          score,
        });
      }
    });
  }
  
  // Search units
  if (includeUnits) {
    data.units.forEach(u => {
      const property = data.properties.find(p => p.id === u.propertyId);
      const score = calculateScore(normalizedQuery, [
        u.unitNumber,
        u.description,
        property?.name,
      ]);
      
      if (score > 0) {
        results.push({
          type: 'unit',
          id: u.id,
          title: u.unitNumber,
          subtitle: `${property?.name || 'Unbekannt'} - ${u.area}m²`,
          icon: 'door',
          propertyId: u.propertyId,
          score,
        });
      }
    });
  }
  
  // Search tenants
  if (includeTenants) {
    data.tenants.forEach(t => {
      const unit = data.units.find(u => u.id === t.unitId);
      const property = unit ? data.properties.find(p => p.id === unit.propertyId) : null;
      
      const score = calculateScore(normalizedQuery, [
        t.firstName,
        t.lastName,
        t.email,
        t.phone,
        t.street,
        t.city,
        `${t.firstName} ${t.lastName}`,
      ]);
      
      if (score > 0) {
        results.push({
          type: 'tenant',
          id: t.id,
          title: `${t.firstName} ${t.lastName}`,
          subtitle: `${property?.name || ''} - ${unit?.unitNumber || ''}`,
          icon: 'user',
          unitId: t.unitId,
          propertyId: property?.id,
          score,
        });
      }
    });
  }
  
  // Search documents
  if (includeDocuments) {
    data.documents.forEach(d => {
      const property = d.propertyId ? data.properties.find(p => p.id === d.propertyId) : null;
      
      const score = calculateScore(normalizedQuery, [
        d.name,
        d.description,
        d.fileName,
        property?.name,
      ]);
      
      if (score > 0) {
        results.push({
          type: 'document',
          id: d.id,
          title: d.name,
          subtitle: property?.name || 'Allgemein',
          icon: 'file',
          propertyId: d.propertyId,
          score,
        });
      }
    });
  }
  
  // Search tasks
  if (includeTasks) {
    data.tasks.forEach(t => {
      const property = t.propertyId ? data.properties.find(p => p.id === t.propertyId) : null;
      
      const score = calculateScore(normalizedQuery, [
        t.title,
        t.description,
        property?.name,
      ]);
      
      if (score > 0) {
        results.push({
          type: 'task',
          id: t.id,
          title: t.title,
          subtitle: property?.name || 'Allgemein',
          icon: 'task',
          propertyId: t.propertyId,
          score,
        });
      }
    });
  }
  
  // Search transactions (optional)
  if (includeTransactions) {
    data.transactions.forEach(t => {
      const property = t.propertyId ? data.properties.find(p => p.id === t.propertyId) : null;
      
      const score = calculateScore(normalizedQuery, [
        t.description,
        property?.name,
      ]);
      
      if (score > 0) {
        results.push({
          type: 'transaction',
          id: t.id,
          title: t.description,
          subtitle: `${property?.name || ''} - ${t.amount.toFixed(2)}€`,
          icon: 'transaction',
          propertyId: t.propertyId,
          score,
        });
      }
    });
  }
  
  // Sort by score and limit
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Calculate relevance score
function calculateScore(query: string, fields: (string | undefined)[]): number {
  let maxScore = 0;
  
  fields.forEach(field => {
    if (!field) return;
    
    const normalizedField = field.toLowerCase();
    
    // Exact match
    if (normalizedField === query) {
      maxScore = Math.max(maxScore, 100);
      return;
    }
    
    // Starts with query
    if (normalizedField.startsWith(query)) {
      maxScore = Math.max(maxScore, 80);
      return;
    }
    
    // Contains query as word
    const wordRegex = new RegExp(`\\b${escapeRegex(query)}\\b`, 'i');
    if (wordRegex.test(normalizedField)) {
      maxScore = Math.max(maxScore, 60);
      return;
    }
    
    // Contains query
    if (normalizedField.includes(query)) {
      maxScore = Math.max(maxScore, 40);
      return;
    }
    
    // Fuzzy match (for longer queries)
    if (query.length >= 3) {
      const similarity = calculateSimilarity(query, normalizedField);
      if (similarity > 0.7) {
        maxScore = Math.max(maxScore, Math.round(similarity * 30));
      }
    }
  });
  
  return maxScore;
}

// Escape regex special characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Calculate string similarity (Jaccard similarity for bigrams)
function calculateSimilarity(a: string, b: string): number {
  const aBigrams = getBigrams(a);
  const bBigrams = getBigrams(b);
  
  const intersection = aBigrams.filter(x => bBigrams.includes(x));
  const union = [...new Set([...aBigrams, ...bBigrams])];
  
  return union.length > 0 ? intersection.length / union.length : 0;
}

// Get bigrams from string
function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}

// Quick filter for autocomplete
export function quickFilter<T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string[]
): T[] {
  if (!query.trim()) return items;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return items.filter(item => {
    const texts = getSearchableText(item);
    return texts.some(text => 
      text?.toLowerCase().includes(normalizedQuery)
    );
  });
}
