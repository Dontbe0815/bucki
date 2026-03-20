'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import type { BankTransaction, BankAccount, Tenant, Property, Unit, Financing } from '@/lib/types';
import { BANK_TRANSACTION_CATEGORY_LABELS } from '@/lib/types';
import { 
  RefreshCw, AlertCircle, CheckCircle, Users, Home, Building2,
  CreditCard, Link2, Unlink, Search, ChevronDown, ChevronUp,
  Filter, Eye, Check, X, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BankReconcileProps {
  accountId?: string;
}

export default function BankReconcile({ accountId }: BankReconcileProps) {
  const { 
    bankAccounts, 
    bankTransactions, 
    tenants, 
    units, 
    properties,
    financings,
    payments,
    matchTransaction,
    updateBankTransaction,
    reconcileTransaction
  } = useStore();
  const { formatCurrency, language } = useI18n();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accountId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'unmatched' | 'matched' | 'all'>('unmatched');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [matchingTransactionId, setMatchingTransactionId] = useState<string | null>(null);
  
  // Get unmatched transactions
  const unmatchedTransactions = useMemo(() => {
    let filtered = bankTransactions.filter(t => t.matchStatus === 'unmatched');
    
    if (selectedAccountId !== 'all') {
      filtered = filtered.filter(t => t.bankAccountId === selectedAccountId);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.counterpartyName.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [bankTransactions, selectedAccountId, searchQuery]);
  
  // Get matched transactions
  const matchedTransactions = useMemo(() => {
    let filtered = bankTransactions.filter(t => t.matchStatus === 'matched');
    
    if (selectedAccountId !== 'all') {
      filtered = filtered.filter(t => t.bankAccountId === selectedAccountId);
    }
    
    return filtered;
  }, [bankTransactions, selectedAccountId]);
  
  // Calculate reconciliation stats
  const stats = useMemo(() => {
    const relevantTransactions = selectedAccountId === 'all' 
      ? bankTransactions 
      : bankTransactions.filter(t => t.bankAccountId === selectedAccountId);
    
    const total = relevantTransactions.length;
    const matched = relevantTransactions.filter(t => t.matchStatus === 'matched').length;
    const unmatched = relevantTransactions.filter(t => t.matchStatus === 'unmatched').length;
    const reconciled = relevantTransactions.filter(t => t.isReconciled).length;
    
    return { total, matched, unmatched, reconciled, matchRate: total > 0 ? (matched / total) * 100 : 0 };
  }, [bankTransactions, selectedAccountId]);
  
  // Find potential matches for a transaction
  const findPotentialMatches = (transaction: BankTransaction) => {
    const matches: Array<{
      type: 'tenant' | 'property' | 'financing' | 'payment';
      entity: Tenant | Property | Financing | any;
      score: number;
      reason: string;
    }> = [];
    
    const isPositive = transaction.amount >= 0;
    
    // For income, match with tenants
    if (isPositive) {
      for (const tenant of tenants) {
        let score = 0;
        let reason = '';
        const unit = units.find(u => u.id === tenant.unitId);
        
        // Name matching
        const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
        const counterparty = transaction.counterpartyName.toLowerCase();
        
        if (counterparty.includes(tenant.lastName.toLowerCase())) {
          score += 40;
          reason = language === 'de' ? 'Name stimmt überein' : 'Name matches';
        }
        
        // Amount matching with rent
        if (unit) {
          const diff = Math.abs(Math.abs(transaction.amount) - unit.totalRent);
          if (diff < 0.01) {
            score += 50;
            reason += reason ? ' + ' : '';
            reason += language === 'de' ? 'Exakter Mietbetrag' : 'Exact rent amount';
          } else if (diff < 5) {
            score += 25;
            reason += reason ? ' + ' : '';
            reason += language === 'de' ? 'Ähnlicher Betrag' : 'Similar amount';
          }
        }
        
        if (score >= 40) {
          matches.push({
            type: 'tenant',
            entity: { ...tenant, unit },
            score,
            reason,
          });
        }
      }
      
      // Match with pending payments
      for (const payment of payments) {
        if (payment.status !== 'pending' && payment.status !== 'partial') continue;
        
        const tenant = tenants.find(t => t.id === payment.tenantId);
        const diff = Math.abs(Math.abs(transaction.amount) - payment.expectedAmount);
        
        if (diff < 0.01) {
          matches.push({
            type: 'tenant',
            entity: { ...payment, tenant },
            score: 80,
            reason: language === 'de' ? 'Erwartete Zahlung gefunden' : 'Expected payment found',
          });
        }
      }
    }
    
    // For expenses, match with financings
    if (!isPositive) {
      for (const financing of financings) {
        let score = 0;
        let reason = '';
        
        // Bank name match
        if (transaction.counterpartyName.toLowerCase().includes(financing.bankName.toLowerCase())) {
          score += 40;
          reason = language === 'de' ? 'Bankname stimmt überein' : 'Bank name matches';
        }
        
        // Amount match
        const diff = Math.abs(Math.abs(transaction.amount) - financing.monthlyRate);
        if (diff < 0.01) {
          score += 50;
          reason += reason ? ' + ' : '';
          reason += language === 'de' ? 'Exakte Monatsrate' : 'Exact monthly rate';
        }
        
        if (score >= 40) {
          matches.push({
            type: 'financing',
            entity: financing,
            score,
            reason,
          });
        }
      }
    }
    
    // Match with properties (for expenses)
    if (!isPositive) {
      for (const property of properties) {
        const desc = transaction.description.toLowerCase();
        const address = property.address.toLowerCase();
        const name = property.name.toLowerCase();
        
        if (desc.includes(address) || desc.includes(name)) {
          matches.push({
            type: 'property',
            entity: property,
            score: 60,
            reason: language === 'de' ? 'Adresse/Name erwähnt' : 'Address/Name mentioned',
          });
        }
      }
    }
    
    return matches.sort((a, b) => b.score - a.score).slice(0, 5);
  };
  
  // Handle match
  const handleMatch = (transactionId: string, matchType: 'tenant' | 'property' | 'financing' | 'vendor', matchedId: string) => {
    matchTransaction(transactionId, matchType, matchedId);
    toast.success(language === 'de' ? 'Transaktion zugeordnet' : 'Transaction matched');
    setMatchingTransactionId(null);
  };
  
  // Handle unmatch
  const handleUnmatch = (transactionId: string) => {
    updateBankTransaction(transactionId, {
      matchStatus: 'unmatched',
      matchedType: undefined,
      matchedId: undefined,
      matchConfidence: undefined,
    });
    toast.success(language === 'de' ? 'Zuordnung aufgehoben' : 'Match removed');
  };
  
  // Handle reconcile
  const handleReconcile = (transactionId: string) => {
    reconcileTransaction(transactionId);
    toast.success(language === 'de' ? 'Transaktion abgestimmt' : 'Transaction reconciled');
  };
  
  // Get entity name
  const getEntityName = (type: string, entity: any) => {
    switch (type) {
      case 'tenant':
        return `${entity.firstName} ${entity.lastName}`;
      case 'property':
        return entity.name;
      case 'financing':
        return `${entity.bankName} - ${entity.loanNumber}`;
      case 'payment':
        return entity.tenant 
          ? `${entity.tenant.firstName} ${entity.tenant.lastName} (${entity.month})`
          : entity.month;
      default:
        return 'Unknown';
    }
  };
  
  // Get entity icon
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'tenant':
        return Users;
      case 'property':
        return Home;
      case 'financing':
        return CreditCard;
      case 'payment':
        return Building2;
      default:
        return Home;
    }
  };
  
  // Render transaction card
  const renderTransactionCard = (transaction: BankTransaction, isMatched: boolean = false) => {
    const isExpanded = expandedId === transaction.id;
    const potentialMatches = findPotentialMatches(transaction);
    const isMatching = matchingTransactionId === transaction.id;
    
    return (
      <Card key={transaction.id} className={`${isMatched ? 'border-emerald-200 dark:border-emerald-800' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{transaction.counterpartyName || transaction.description}</span>
                {isMatched && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {language === 'de' ? 'Zugeordnet' : 'Matched'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{transaction.originalDate}</span>
                <span>•</span>
                <span className="truncate">{transaction.description}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`font-semibold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(transaction.amount)}
                </span>
                <Badge variant="secondary">
                  {BANK_TRANSACTION_CATEGORY_LABELS[transaction.category]?.[language] || transaction.category}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isMatched && transaction.matchedType && transaction.matchedId && (
                <Badge variant="outline">
                  {(() => {
                    const Icon = getEntityIcon(transaction.matchedType);
                    return <Icon className="h-3 w-3 mr-1" />;
                  })()}
                  {transaction.matchedType === 'tenant' && (() => {
                    const tenant = tenants.find(t => t.id === transaction.matchedId);
                    return tenant ? `${tenant.firstName} ${tenant.lastName}` : transaction.matchedId;
                  })()}
                  {transaction.matchedType === 'property' && (() => {
                    const property = properties.find(p => p.id === transaction.matchedId);
                    return property?.name || transaction.matchedId;
                  })()}
                  {transaction.matchedType === 'financing' && (() => {
                    const financing = financings.find(f => f.id === transaction.matchedId);
                    return financing?.bankName || transaction.matchedId;
                  })()}
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedId(isExpanded ? null : transaction.id)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Expanded Section */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t">
              {isMatched ? (
                // Matched transaction actions
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleUnmatch(transaction.id)}>
                    <Unlink className="h-4 w-4 mr-2" />
                    {language === 'de' ? 'Zuordnung aufheben' : 'Remove Match'}
                  </Button>
                  {!transaction.isReconciled && (
                    <Button size="sm" onClick={() => handleReconcile(transaction.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      {language === 'de' ? 'Abstimmen' : 'Reconcile'}
                    </Button>
                  )}
                </div>
              ) : (
                // Unmatched transaction matching
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'de' ? 'Mögliche Zuordnungen:' : 'Potential Matches:'}
                  </p>
                  
                  {potentialMatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {language === 'de' ? 'Keine automatischen Vorschläge gefunden' : 'No automatic matches found'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {potentialMatches.map((match, index) => {
                        const Icon = getEntityIcon(match.type);
                        return (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{getEntityName(match.type, match.entity)}</p>
                                <p className="text-xs text-muted-foreground">{match.reason}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={match.score >= 70 ? 'default' : 'secondary'}>
                                {match.score}%
                              </Badge>
                              <Button 
                                size="sm"
                                onClick={() => handleMatch(transaction.id, match.type as any, match.entity.id)}
                              >
                                <Link2 className="h-4 w-4 mr-1" />
                                {language === 'de' ? 'Zuordnen' : 'Match'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Manual Match */}
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Select 
                      onValueChange={(v) => {
                        const [type, id] = v.split(':');
                        handleMatch(transaction.id, type as any, id);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={language === 'de' ? 'Manuell zuordnen...' : 'Manual match...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>
                          {language === 'de' ? '-- Mieter --' : '-- Tenants --'}
                        </SelectItem>
                        {tenants.map(tenant => (
                          <SelectItem key={`tenant:${tenant.id}`} value={`tenant:${tenant.id}`}>
                            {tenant.firstName} {tenant.lastName}
                          </SelectItem>
                        ))}
                        <SelectItem value="none" disabled>
                          {language === 'de' ? '-- Immobilien --' : '-- Properties --'}
                        </SelectItem>
                        {properties.map(property => (
                          <SelectItem key={`property:${property.id}`} value={`property:${property.id}`}>
                            {property.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="none" disabled>
                          {language === 'de' ? '-- Finanzierungen --' : '-- Financings --'}
                        </SelectItem>
                        {financings.map(financing => (
                          <SelectItem key={`financing:${financing.id}`} value={`financing:${financing.id}`}>
                            {financing.bankName} - {financing.loanNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              {language === 'de' ? 'Gesamt' : 'Total'}
            </p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              {language === 'de' ? 'Zugeordnet' : 'Matched'}
            </p>
            <p className="text-2xl font-bold text-emerald-600">{stats.matched}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              {language === 'de' ? 'Offen' : 'Unmatched'}
            </p>
            <p className="text-2xl font-bold text-amber-600">{stats.unmatched}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              {language === 'de' ? 'Abgestimmt' : 'Reconciled'}
            </p>
            <p className="text-2xl font-bold text-blue-600">{stats.reconciled}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Match Rate Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {language === 'de' ? 'Zuordnungsrate' : 'Match Rate'}
            </span>
            <span className="text-sm text-muted-foreground">
              {stats.matchRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={stats.matchRate} className="h-2" />
        </CardContent>
      </Card>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={language === 'de' ? 'Bankkonto' : 'Bank Account'} />
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
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'de' ? 'Suchen...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="unmatched" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {language === 'de' ? 'Nicht zugeordnet' : 'Unmatched'}
            <Badge variant="secondary" className="ml-1">{unmatchedTransactions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="matched" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {language === 'de' ? 'Zugeordnet' : 'Matched'}
            <Badge variant="secondary" className="ml-1">{matchedTransactions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            {language === 'de' ? 'Alle' : 'All'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="unmatched" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {unmatchedTransactions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                    <p>{language === 'de' ? 'Alle Transaktionen zugeordnet!' : 'All transactions matched!'}</p>
                  </CardContent>
                </Card>
              ) : (
                unmatchedTransactions.map(t => renderTransactionCard(t))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="matched" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {matchedTransactions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-amber-500" />
                    <p>{language === 'de' ? 'Keine zugeordneten Transaktionen' : 'No matched transactions'}</p>
                  </CardContent>
                </Card>
              ) : (
                matchedTransactions.map(t => renderTransactionCard(t, true))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="all" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {bankTransactions
                .filter(t => selectedAccountId === 'all' || t.bankAccountId === selectedAccountId)
                .map(t => renderTransactionCard(t, t.matchStatus === 'matched'))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
