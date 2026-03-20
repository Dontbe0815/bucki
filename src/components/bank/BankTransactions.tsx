'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import type { BankTransaction, BankAccount, BankTransactionCategory } from '@/lib/types';
import { BANK_TRANSACTION_CATEGORY_LABELS } from '@/lib/types';
import { 
  Search, Filter, ArrowUpRight, ArrowDownRight, Building2, Calendar,
  ChevronDown, ChevronUp, MoreHorizontal, Check, X, Tag, Users,
  Home, CreditCard, RefreshCw, Eye, Trash2, Download, SortAsc, SortDesc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface BankTransactionsProps {
  accountId?: string;
  showAccountFilter?: boolean;
  maxHeight?: string;
}

type SortField = 'date' | 'amount' | 'counterpartyName' | 'category';
type SortDirection = 'asc' | 'desc';

export default function BankTransactions({ 
  accountId, 
  showAccountFilter = true,
  maxHeight = 'h-[600px]'
}: BankTransactionsProps) {
  const { 
    bankAccounts, 
    bankTransactions, 
    tenants, 
    units, 
    properties,
    categorizeTransaction,
    updateBankTransaction,
    deleteBankTransaction
  } = useStore();
  const { formatCurrency, language } = useI18n();
  
  // Filters
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accountId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [matchStatusFilter, setMatchStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Get account name
  const getAccountName = (id: string) => {
    const account = bankAccounts.find(a => a.id === id);
    return account?.name || id;
  };
  
  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...bankTransactions];
    
    // Account filter
    if (selectedAccountId !== 'all') {
      result = result.filter(t => t.bankAccountId === selectedAccountId);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.counterpartyName.toLowerCase().includes(query) ||
        t.counterpartyIban?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }
    
    // Match status filter
    if (matchStatusFilter !== 'all') {
      result = result.filter(t => t.matchStatus === matchStatusFilter);
    }
    
    // Date range filter
    if (dateFrom) {
      result = result.filter(t => t.originalDate >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(t => t.originalDate <= dateTo);
    }
    
    // Amount range filter
    if (amountMin) {
      const min = parseFloat(amountMin);
      result = result.filter(t => Math.abs(t.amount) >= min);
    }
    if (amountMax) {
      const max = parseFloat(amountMax);
      result = result.filter(t => Math.abs(t.amount) <= max);
    }
    
    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = a.originalDate.localeCompare(b.originalDate);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'counterpartyName':
          comparison = a.counterpartyName.localeCompare(b.counterpartyName);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [bankTransactions, selectedAccountId, searchQuery, categoryFilter, matchStatusFilter, dateFrom, dateTo, amountMin, amountMax, sortField, sortDirection]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.amount >= 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);
  
  // Get category label
  const getCategoryLabel = (category: BankTransactionCategory) => {
    return BANK_TRANSACTION_CATEGORY_LABELS[category]?.[language] || category;
  };
  
  // Get category color
  const getCategoryColor = (category: BankTransactionCategory) => {
    const colors: Record<string, string> = {
      rent_income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      utility_income: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      deposit_income: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      other_income: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      mortgage_payment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      interest_payment: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      insurance_payment: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      utilities_payment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      maintenance_payment: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      management_fee: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      tax_payment: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      unknown: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    };
    return colors[category] || colors.other;
  };
  
  // Handle category change
  const handleCategoryChange = (transactionId: string, newCategory: BankTransactionCategory) => {
    categorizeTransaction(transactionId, newCategory, 'manual');
    toast.success(language === 'de' ? 'Kategorie aktualisiert' : 'Category updated');
  };
  
  // Handle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const selectAll = () => {
    setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
  };
  
  const clearSelection = () => {
    setSelectedIds(new Set());
  };
  
  // Bulk actions
  const bulkCategorize = (category: BankTransactionCategory) => {
    selectedIds.forEach(id => categorizeTransaction(id, category, 'manual'));
    toast.success(language === 'de' 
      ? `${selectedIds.size} Transaktionen kategorisiert` 
      : `${selectedIds.size} transactions categorized`);
    clearSelection();
  };
  
  const bulkDelete = () => {
    selectedIds.forEach(id => deleteBankTransaction(id));
    toast.success(language === 'de'
      ? `${selectedIds.size} Transaktionen gelöscht`
      : `${selectedIds.size} transactions deleted`);
    clearSelection();
  };
  
  // Get matched entity name
  const getMatchedName = (transaction: BankTransaction) => {
    if (!transaction.matchedId) return null;
    
    switch (transaction.matchedType) {
      case 'tenant':
        const tenant = tenants.find(t => t.id === transaction.matchedId);
        return tenant ? `${tenant.firstName} ${tenant.lastName}` : null;
      case 'property':
        const property = properties.find(p => p.id === transaction.matchedId);
        return property?.name || null;
      case 'financing':
        // Financing not in store yet
        return null;
      default:
        return null;
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMatchStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
  };
  
  const activeFilterCount = [
    searchQuery,
    categoryFilter !== 'all' ? categoryFilter : null,
    matchStatusFilter !== 'all' ? matchStatusFilter : null,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
  ].filter(Boolean).length;
  
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Einnahmen' : 'Income'}
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(totals.income)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Ausgaben' : 'Expenses'}
                </p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totals.expenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Saldo' : 'Balance'}
                </p>
                <p className={`text-xl font-bold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Filter */}
            {showAccountFilter && (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={language === 'de' ? 'Konto' : 'Account'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'de' ? 'Alle Konten' : 'All Accounts'}</SelectItem>
                  {bankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'de' ? 'Suchen...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={language === 'de' ? 'Kategorie' : 'Category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'de' ? 'Alle Kategorien' : 'All Categories'}</SelectItem>
                {Object.entries(BANK_TRANSACTION_CATEGORY_LABELS).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>
                    {labels[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* More Filters */}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  {language === 'de' ? 'Filter' : 'Filters'}
                  {activeFilterCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      {language === 'de' ? 'Match-Status' : 'Match Status'}
                    </label>
                    <Select value={matchStatusFilter} onValueChange={setMatchStatusFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'de' ? 'Alle' : 'All'}</SelectItem>
                        <SelectItem value="matched">{language === 'de' ? 'Zugeordnet' : 'Matched'}</SelectItem>
                        <SelectItem value="unmatched">{language === 'de' ? 'Nicht zugeordnet' : 'Unmatched'}</SelectItem>
                        <SelectItem value="ambiguous">{language === 'de' ? 'Mehrdeutig' : 'Ambiguous'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">
                        {language === 'de' ? 'Von' : 'From'}
                      </label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {language === 'de' ? 'Bis' : 'To'}
                      </label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">
                        {language === 'de' ? 'Betrag min' : 'Amount min'}
                      </label>
                      <Input
                        type="number"
                        placeholder="€"
                        value={amountMin}
                        onChange={(e) => setAmountMin(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {language === 'de' ? 'Betrag max' : 'Amount max'}
                      </label>
                      <Input
                        type="number"
                        placeholder="€"
                        value={amountMax}
                        onChange={(e) => setAmountMax(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full" onClick={resetFilters}>
                    {language === 'de' ? 'Filter zurücksetzen' : 'Reset Filters'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Sort */}
            <Select 
              value={`${sortField}-${sortDirection}`} 
              onValueChange={(v) => {
                const [field, direction] = v.split('-') as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}
            >
              <SelectTrigger className="w-40">
                {sortDirection === 'desc' ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">{language === 'de' ? 'Datum (neueste)' : 'Date (newest)'}</SelectItem>
                <SelectItem value="date-asc">{language === 'de' ? 'Datum (älteste)' : 'Date (oldest)'}</SelectItem>
                <SelectItem value="amount-desc">{language === 'de' ? 'Betrag (höchste)' : 'Amount (highest)'}</SelectItem>
                <SelectItem value="amount-asc">{language === 'de' ? 'Betrag (niedrigste)' : 'Amount (lowest)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Selection Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">
            {selectedIds.size} {language === 'de' ? 'ausgewählt' : 'selected'}
          </span>
          <div className="flex items-center gap-2">
            <Select onValueChange={(v) => bulkCategorize(v as BankTransactionCategory)}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder={language === 'de' ? 'Kategorie setzen' : 'Set category'} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BANK_TRANSACTION_CATEGORY_LABELS).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>{labels[language]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" />
              {language === 'de' ? 'Abwählen' : 'Deselect'}
            </Button>
          </div>
        </div>
      )}
      
      {/* Transaction List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {filteredTransactions.length} {language === 'de' ? 'Transaktionen' : 'Transactions'}
            </CardTitle>
            {selectedIds.size === 0 && (
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {language === 'de' ? 'Alle auswählen' : 'Select all'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className={maxHeight}>
            <div className="divide-y">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {language === 'de' ? 'Keine Transaktionen gefunden' : 'No transactions found'}
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      expandedId === transaction.id ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.has(transaction.id)}
                        onCheckedChange={() => toggleSelection(transaction.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {transaction.counterpartyName || transaction.description}
                            </span>
                            {transaction.matchStatus === 'matched' && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                {getMatchedName(transaction)}
                              </Badge>
                            )}
                          </div>
                          <span className={`font-semibold whitespace-nowrap ${
                            transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span>{transaction.originalDate}</span>
                          <span>•</span>
                          <span className="truncate">{transaction.description}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getCategoryColor(transaction.category)}>
                            {getCategoryLabel(transaction.category)}
                          </Badge>
                          {transaction.categoryConfidence < 80 && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.categoryConfidence}%
                            </Badge>
                          )}
                          {showAccountFilter && selectedAccountId === 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              {getAccountName(transaction.bankAccountId)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Expanded Details */}
                        {expandedId === transaction.id && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  {language === 'de' ? 'Buchungsdatum' : 'Booking Date'}:
                                </span>
                                <p className="font-medium">{transaction.originalDate}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  {language === 'de' ? 'Wertstellungsdatum' : 'Value Date'}:
                                </span>
                                <p className="font-medium">{transaction.valueDate}</p>
                              </div>
                              {transaction.counterpartyIban && (
                                <div>
                                  <span className="text-muted-foreground">IBAN:</span>
                                  <p className="font-medium font-mono text-xs">{transaction.counterpartyIban}</p>
                                </div>
                              )}
                              {transaction.transactionCode && (
                                <div>
                                  <span className="text-muted-foreground">
                                    {language === 'de' ? 'Transaktionscode' : 'Transaction Code'}:
                                  </span>
                                  <p className="font-medium">{transaction.transactionCode}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Select
                                value={transaction.category}
                                onValueChange={(v) => handleCategoryChange(transaction.id, v as BankTransactionCategory)}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(BANK_TRANSACTION_CATEGORY_LABELS).map(([key, labels]) => (
                                    <SelectItem key={key} value={key}>{labels[language]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteBankTransaction(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === transaction.id ? null : transaction.id)}
                      >
                        {expandedId === transaction.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
