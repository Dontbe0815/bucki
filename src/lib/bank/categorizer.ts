// Bank Transaction Categorizer
// ML-based and rule-based categorization for German real estate transactions

import type { 
  BankTransaction, 
  BankTransactionCategory, 
  CategoryRule,
  TransactionMatchSuggestion,
  Tenant,
  Property,
  Financing,
  Unit
} from '@/lib/types';

// Category keywords for automatic categorization
const CATEGORY_KEYWORDS: Record<BankTransactionCategory, {
  keywords: string[];
  counterpartyPatterns: string[];
  amountSign: 'positive' | 'negative' | 'any';
}> = {
  rent_income: {
    keywords: ['miete', 'mieter', 'rent', 'kaltmiete', 'warmmiete', 'wohnung', 'haus'],
    counterpartyPatterns: ['mieter', 'bewohner'],
    amountSign: 'positive',
  },
  utility_income: {
    keywords: ['nebenkosten', 'betriebskosten', 'nk-', 'bk-', 'vorauszahlung', 'abschlag'],
    counterpartyPatterns: [],
    amountSign: 'positive',
  },
  deposit_income: {
    keywords: ['kaution', 'depot', 'sicherheit', 'mietkaution'],
    counterpartyPatterns: [],
    amountSign: 'positive',
  },
  other_income: {
    keywords: ['gutschrift', 'erstattung', 'rückzahlung', 'dividende'],
    counterpartyPatterns: [],
    amountSign: 'positive',
  },
  mortgage_payment: {
    keywords: ['darlehen', 'kredit', 'tilgung', 'rate', 'hypothek', ' finanzierung'],
    counterpartyPatterns: ['bank', 'sparkasse', 'volksbank', 'hypovereinsbank', 'commerzbank', 'deutsche bank'],
    amountSign: 'negative',
  },
  interest_payment: {
    keywords: ['zins', 'zinsen', 'interest'],
    counterpartyPatterns: [],
    amountSign: 'negative',
  },
  insurance_payment: {
    keywords: ['versicherung', 'vers.', 'allianz', 'huk', 'axa', 'generali', 'conto', 'gebäude'],
    counterpartyPatterns: ['versicherung', 'allianz', 'axa', 'generali', 'huk-coburg'],
    amountSign: 'negative',
  },
  utilities_payment: {
    keywords: ['stadtwerke', 'ew', 'gas', 'wasser', 'strom', 'elektrizität', 'energie', 'heizung', 'fernwärme', 'abwasser', 'müll', 'abfall'],
    counterpartyPatterns: ['stadtwerke', 'ewerke', 'energie', 'gasversorgung', 'wasserwerk'],
    amountSign: 'negative',
  },
  maintenance_payment: {
    keywords: ['handwerker', 'reparatur', 'instandhaltung', 'sanitär', 'elektriker', 'maler', 'zimmermann', 'dach', 'heizung', 'schornstein', 'aufzug'],
    counterpartyPatterns: ['handwerker', 'bau', 'sanitär', 'elektro', 'maler', 'schlosser'],
    amountSign: 'negative',
  },
  management_fee: {
    keywords: ['hausverwaltung', 'verwalter', 'verwaltung', 'wg-'],
    counterpartyPatterns: ['hausverwaltung', 'verwaltung', 'immobilien'],
    amountSign: 'negative',
  },
  tax_payment: {
    keywords: ['finanzamt', 'steuer', 'grundsteuer', 'gewerbesteuer', 'einkommensteuer', 'kirchensteuer'],
    counterpartyPatterns: ['finanzamt'],
    amountSign: 'negative',
  },
  reserve_deposit: {
    keywords: ['rücklage', 'erhaltungsrücklage', 'instandhaltungsrücklage', 'irk'],
    counterpartyPatterns: [],
    amountSign: 'negative',
  },
  reserve_withdrawal: {
    keywords: ['rücklage', 'entnahme'],
    counterpartyPatterns: [],
    amountSign: 'positive',
  },
  salary_payment: {
    keywords: ['gehalt', 'lohn', 'lhn', 'loh', 'netto', 'brutto'],
    counterpartyPatterns: [],
    amountSign: 'negative',
  },
  vendor_payment: {
    keywords: ['rechnung', 'rg-', 're.', 'kauf', 'einkauf', 'lieferung'],
    counterpartyPatterns: ['gmbh', 'kg', 'ag'],
    amountSign: 'negative',
  },
  transfer_in: {
    keywords: ['umbuchung', 'übertrag', 'einzahlung', 'gutschrift'],
    counterpartyPatterns: [],
    amountSign: 'positive',
  },
  transfer_out: {
    keywords: ['umbuchung', 'übertrag', 'auszahlung', 'dauerauftrag'],
    counterpartyPatterns: [],
    amountSign: 'negative',
  },
  fee: {
    keywords: ['gebühr', 'provision', 'entgelt', 'konto', 'dispo', 'kontoführung'],
    counterpartyPatterns: [],
    amountSign: 'negative',
  },
  unknown: {
    keywords: [],
    counterpartyPatterns: [],
    amountSign: 'any',
  },
  other: {
    keywords: [],
    counterpartyPatterns: [],
    amountSign: 'any',
  },
};

// GVC (Geschäftsfallcode) to category mapping
const GVC_TO_CATEGORY: Record<string, BankTransactionCategory> = {
  // SEPA credit transfer
  '052': 'transfer_in',
  '053': 'transfer_out',
  // Standing orders
  '045': 'mortgage_payment',
  '046': 'mortgage_payment',
  // Direct debit
  '005': 'utilities_payment',
  '006': 'utilities_payment',
  '007': 'insurance_payment',
  '008': 'insurance_payment',
  // SEPA direct debit
  '035': 'mortgage_payment',
  '037': 'mortgage_payment',
  // Bank internal
  '067': 'fee',
  '068': 'fee',
  '069': 'fee',
  // Credit
  '051': 'other_income',
  '054': 'other_income',
  '084': 'rent_income',
  '085': 'rent_income',
};

// Categorize a single transaction using rules and keywords
export function categorizeTransaction(
  transaction: Omit<BankTransaction, 'category' | 'categoryConfidence' | 'categorySource'>,
  rules: CategoryRule[] = []
): { category: BankTransactionCategory; confidence: number; source: 'rule' | 'auto' | 'ml' } {
  const description = (transaction.description || '').toLowerCase();
  const counterpartyName = (transaction.counterpartyName || '').toLowerCase();
  const isPositive = transaction.amount >= 0;
  
  // 1. Check custom rules first (highest priority)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  
  for (const rule of sortedRules) {
    if (!rule.isActive) continue;
    
    const keywordMatch = rule.keywords.some(kw => description.includes(kw.toLowerCase()));
    const counterpartyMatch = rule.counterpartyPatterns.some(cp => 
      counterpartyName.includes(cp.toLowerCase())
    );
    const ibanMatch = rule.ibanPatterns.some(ip => 
      transaction.counterpartyIban?.includes(ip.replace(/\s/g, ''))
    );
    const amountInRange = 
      (rule.amountMin === undefined || transaction.amount >= rule.amountMin) &&
      (rule.amountMax === undefined || transaction.amount <= rule.amountMax);
    const signMatch = 
      rule.amountSign === 'any' ||
      (rule.amountSign === 'positive' && isPositive) ||
      (rule.amountSign === 'negative' && !isPositive);
    
    let matches = 0;
    if (keywordMatch) matches++;
    if (counterpartyMatch) matches++;
    if (ibanMatch) matches++;
    if (amountInRange && signMatch) matches++;
    
    if ((rule.matchType === 'any' && (keywordMatch || counterpartyMatch || ibanMatch)) ||
        (rule.matchType === 'all' && keywordMatch && counterpartyMatch)) {
      return {
        category: rule.category,
        confidence: 95,
        source: 'rule',
      };
    }
  }
  
  // 2. Check GVC code
  if (transaction.gvc && GVC_TO_CATEGORY[transaction.gvc]) {
    return {
      category: GVC_TO_CATEGORY[transaction.gvc],
      confidence: 80,
      source: 'auto',
    };
  }
  
  // 3. Keyword-based categorization
  let bestMatch: { category: BankTransactionCategory; score: number } = {
    category: 'unknown',
    score: 0,
  };
  
  for (const [category, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'unknown' || category === 'other') continue;
    
    // Check amount sign
    if (patterns.amountSign !== 'any') {
      if (patterns.amountSign === 'positive' && !isPositive) continue;
      if (patterns.amountSign === 'negative' && isPositive) continue;
    }
    
    let score = 0;
    
    // Count keyword matches
    for (const keyword of patterns.keywords) {
      if (description.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
    
    // Count counterparty matches (weighted higher)
    for (const pattern of patterns.counterpartyPatterns) {
      if (counterpartyName.includes(pattern.toLowerCase())) {
        score += 20;
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { category: category as BankTransactionCategory, score };
    }
  }
  
  // Convert score to confidence (0-100)
  const confidence = Math.min(100, Math.max(0, bestMatch.score));
  
  // 4. If no good match, use amount sign as fallback
  if (bestMatch.score === 0) {
    return {
      category: isPositive ? 'other_income' : 'other',
      confidence: 20,
      source: 'auto',
    };
  }
  
  return {
    category: bestMatch.category,
    confidence: Math.min(confidence, 90), // Cap at 90 for keyword-based
    source: 'auto',
  };
}

// Get ML-based category suggestion using AI
export async function getMLCategorySuggestion(
  transaction: BankTransaction
): Promise<{ category: BankTransactionCategory; confidence: number }> {
  try {
    // Use z-ai-web-dev-sdk for ML-based categorization
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    
    const prompt = `You are a German real estate transaction categorizer. 
Given the following bank transaction, categorize it into one of these categories:
- rent_income (Mieteinnahmen)
- utility_income (Nebenkosteneinnahmen)
- deposit_income (Kautionseinzug)
- other_income (Sonstige Einnahmen)
- mortgage_payment (Darlehensrate)
- interest_payment (Zinszahlung)
- insurance_payment (Versicherung)
- utilities_payment (Betriebskosten)
- maintenance_payment (Instandhaltung)
- management_fee (Hausverwaltung)
- tax_payment (Steuern)
- reserve_deposit (Rücklageneinzahlung)
- reserve_withdrawal (Rücklagenentnahme)
- salary_payment (Gehälter)
- vendor_payment (Lieferantenzahlung)
- transfer_in (Umbuchung Eingang)
- transfer_out (Umbuchung Ausgang)
- fee (Bankgebühren)
- other (Sonstiges)
- unknown (Unkategorisiert)

Transaction:
- Amount: ${transaction.amount} ${transaction.currency}
- Description: ${transaction.description}
- Counterparty: ${transaction.counterpartyName}
- IBAN: ${transaction.counterpartyIban || 'N/A'}
- Date: ${transaction.originalDate}

Respond with only the category name and a confidence score (0-100) in this exact format:
category|confidence`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a financial transaction categorizer for German real estate. Respond only with the category and confidence score in the specified format.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content || '';
    const [categoryStr, confidenceStr] = response.split('|');
    
    const category = categoryStr.trim() as BankTransactionCategory;
    const confidence = Math.min(100, Math.max(0, parseInt(confidenceStr) || 50));
    
    if (Object.keys(CATEGORY_KEYWORDS).includes(category)) {
      return { category, confidence };
    }
    
    return { category: 'unknown', confidence: 30 };
  } catch (error) {
    console.error('ML categorization failed:', error);
    return { category: 'unknown', confidence: 0 };
  }
}

// Match transaction with tenants
export function matchWithTenants(
  transaction: BankTransaction,
  tenants: Tenant[],
  units: Unit[]
): TransactionMatchSuggestion[] {
  const suggestions: TransactionMatchSuggestion[] = [];
  const isPositive = transaction.amount >= 0;
  
  // Only match positive amounts (income) with tenants
  if (!isPositive) return [];
  
  for (const tenant of tenants) {
    let confidence = 0;
    let matchReason = '';
    const details: TransactionMatchSuggestion['details'] = {};
    
    // Find the unit for this tenant
    const unit = units.find(u => u.id === tenant.unitId);
    
    // Check name match
    const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
    const counterpartyName = transaction.counterpartyName.toLowerCase();
    
    // Various name matching strategies
    const nameParts = counterpartyName.split(/\s+/);
    const lastNameMatch = nameParts.some(p => 
      p.includes(tenant.lastName.toLowerCase()) || 
      tenant.lastName.toLowerCase().includes(p)
    );
    const firstNameMatch = nameParts.some(p => 
      p.includes(tenant.firstName.toLowerCase()) ||
      tenant.firstName.toLowerCase().includes(p)
    );
    
    if (lastNameMatch && firstNameMatch) {
      confidence += 50;
      matchReason = 'Name matched';
      details.nameMatch = true;
    } else if (lastNameMatch) {
      confidence += 30;
      matchReason = 'Last name matched';
      details.nameMatch = true;
    }
    
    // Check amount match with expected rent
    if (unit) {
      const amountDiff = Math.abs(Math.abs(transaction.amount) - unit.totalRent);
      if (amountDiff < 0.01) {
        confidence += 40;
        matchReason += matchReason ? ', exact rent amount' : 'Exact rent amount';
        details.amountMatch = true;
      } else if (amountDiff < 5) {
        confidence += 20;
        matchReason += matchReason ? ', close rent amount' : 'Close rent amount';
        details.amountMatch = true;
      }
    }
    
    if (confidence >= 30) {
      suggestions.push({
        bankTransactionId: transaction.id,
        matchType: 'tenant',
        matchedId: tenant.id,
        matchedName: `${tenant.firstName} ${tenant.lastName}`,
        confidence: Math.min(100, confidence),
        matchReason,
        details,
      });
    }
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

// Match transaction with properties (for expenses)
export function matchWithProperties(
  transaction: BankTransaction,
  properties: Property[]
): TransactionMatchSuggestion[] {
  const suggestions: TransactionMatchSuggestion[] = [];
  const description = transaction.description.toLowerCase();
  
  for (const property of properties) {
    let confidence = 0;
    let matchReason = '';
    
    // Check if property name or address is mentioned
    if (property.name.toLowerCase().includes(description) || 
        description.includes(property.name.toLowerCase())) {
      confidence += 40;
      matchReason = 'Property name in description';
    }
    
    if (description.includes(property.address.toLowerCase()) ||
        description.includes(property.city.toLowerCase())) {
      confidence += 30;
      matchReason += matchReason ? ', address matched' : 'Address matched';
    }
    
    if (confidence >= 30) {
      suggestions.push({
        bankTransactionId: transaction.id,
        matchType: 'property',
        matchedId: property.id,
        matchedName: property.name,
        confidence: Math.min(100, confidence),
        matchReason,
      });
    }
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

// Match transaction with financing (loan payments)
export function matchWithFinancing(
  transaction: BankTransaction,
  financings: Financing[]
): TransactionMatchSuggestion[] {
  const suggestions: TransactionMatchSuggestion[] = [];
  const counterpartyName = (transaction.counterpartyName || '').toLowerCase();
  const amount = Math.abs(transaction.amount);
  
  for (const financing of financings) {
    let confidence = 0;
    let matchReason = '';
    const details: TransactionMatchSuggestion['details'] = {};
    
    // Check bank name match
    if (financing.bankName.toLowerCase().includes(counterpartyName) ||
        counterpartyName.includes(financing.bankName.toLowerCase())) {
      confidence += 50;
      matchReason = 'Bank name matched';
    }
    
    // Check loan number match
    if (financing.loanNumber && 
        (transaction.description.includes(financing.loanNumber) ||
         transaction.counterpartyIban?.includes(financing.loanNumber))) {
      confidence += 30;
      matchReason += matchReason ? ', loan number matched' : 'Loan number matched';
    }
    
    // Check amount match with monthly rate
    const amountDiff = Math.abs(amount - financing.monthlyRate);
    if (amountDiff < 0.01) {
      confidence += 40;
      matchReason += matchReason ? ', exact rate amount' : 'Exact rate amount';
      details.amountMatch = true;
    } else if (amountDiff < 10) {
      confidence += 20;
      matchReason += matchReason ? ', close rate amount' : 'Close rate amount';
      details.amountMatch = true;
    }
    
    if (confidence >= 40) {
      suggestions.push({
        bankTransactionId: transaction.id,
        matchType: 'financing',
        matchedId: financing.id,
        matchedName: `${financing.bankName} - ${financing.loanNumber}`,
        confidence: Math.min(100, confidence),
        matchReason,
        details,
      });
    }
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

// Get all match suggestions for a transaction
export function getAllMatchSuggestions(
  transaction: BankTransaction,
  tenants: Tenant[],
  units: Unit[],
  properties: Property[],
  financings: Financing[]
): TransactionMatchSuggestion[] {
  const allSuggestions: TransactionMatchSuggestion[] = [];
  
  // Try matching based on transaction category
  if (transaction.amount >= 0) {
    // Income - try tenant matching first
    allSuggestions.push(...matchWithTenants(transaction, tenants, units));
  }
  
  // Always try property matching
  allSuggestions.push(...matchWithProperties(transaction, properties));
  
  // Try financing matching for mortgage-like payments
  if (transaction.category === 'mortgage_payment' || 
      transaction.category === 'interest_payment') {
    allSuggestions.push(...matchWithFinancing(transaction, financings));
  }
  
  // Sort by confidence and remove duplicates
  const seen = new Set<string>();
  return allSuggestions
    .sort((a, b) => b.confidence - a.confidence)
    .filter(s => {
      const key = `${s.matchType}-${s.matchedId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// Create a learning rule from a manual categorization
export function createLearningRule(
  transaction: BankTransaction,
  category: BankTransactionCategory
): Omit<CategoryRule, 'id' | 'createdAt' | 'updatedAt'> {
  const keywords: string[] = [];
  const counterpartyPatterns: string[] = [];
  
  // Extract meaningful words from description
  const words = transaction.description
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !/^\d+$/.test(w));
  
  keywords.push(...words.slice(0, 5));
  
  // Add counterparty name pattern
  if (transaction.counterpartyName) {
    counterpartyPatterns.push(transaction.counterpartyName);
  }
  
  return {
    name: `Auto-learned: ${category}`,
    category,
    keywords: [...new Set(keywords)],
    counterpartyPatterns,
    ibanPatterns: transaction.counterpartyIban ? [transaction.counterpartyIban] : [],
    amountSign: transaction.amount >= 0 ? 'positive' : 'negative',
    matchType: 'any',
    priority: 50,
    isActive: true,
    learnedFrom: 'manual',
    usageCount: 1,
    lastUsed: new Date().toISOString(),
  };
}

// Batch categorize transactions
export function batchCategorize(
  transactions: BankTransaction[],
  rules: CategoryRule[] = []
): Map<string, { category: BankTransactionCategory; confidence: number; source: 'rule' | 'auto' | 'ml' }> {
  const results = new Map<string, { category: BankTransactionCategory; confidence: number; source: 'rule' | 'auto' | 'ml' }>();
  
  for (const transaction of transactions) {
    const result = categorizeTransaction(transaction, rules);
    results.set(transaction.id, result);
  }
  
  return results;
}

// Get category statistics
export function getCategoryStats(
  transactions: BankTransaction[]
): Record<BankTransactionCategory, { count: number; totalAmount: number; avgAmount: number }> {
  const stats: Record<string, { count: number; totalAmount: number; avgAmount: number }> = {};
  
  for (const transaction of transactions) {
    const cat = transaction.category;
    if (!stats[cat]) {
      stats[cat] = { count: 0, totalAmount: 0, avgAmount: 0 };
    }
    stats[cat].count++;
    stats[cat].totalAmount += transaction.amount;
  }
  
  // Calculate averages
  for (const cat of Object.keys(stats)) {
    stats[cat].avgAmount = stats[cat].count > 0 
      ? stats[cat].totalAmount / stats[cat].count 
      : 0;
  }
  
  return stats;
}
