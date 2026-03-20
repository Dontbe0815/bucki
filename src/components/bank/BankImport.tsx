'use client';

import { useState, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import type { BankAccount, BankTransaction, BankStatementImport, BankTransactionCategory } from '@/lib/types';
import { BANK_TRANSACTION_CATEGORY_LABELS, GERMAN_BANK_FORMATS } from '@/lib/types';
import { 
  Upload, FileText, AlertCircle, Check, X, Building2, 
  Calendar, Euro, ChevronDown, ChevronUp, Loader2, FileDown,
  Inbox, FileSpreadsheet, CheckCircle, XCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface BankImportProps {
  onImportComplete?: (imported: number) => void;
}

// Simulated parse function for demo - in production this would call the API
function simulateParseFile(content: string, fileName: string): Promise<{
  transactions: Array<{
    originalDate: string;
    valueDate: string;
    amount: number;
    currency: string;
    description: string;
    counterpartyName: string;
    counterpartyIban?: string;
  }>;
  format: string;
  dateRange: { from: string; to: string };
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate demo transactions based on file name
      const demoTransactions = [];
      const now = new Date();
      
      // Create some demo transactions
      const demoData = [
        { desc: 'Miete Januar 2024 - Müller', amount: 850.00, counterparty: 'Müller, Thomas' },
        { desc: 'Miete Januar 2024 - Schmidt', amount: 720.00, counterparty: 'Schmidt, Anna' },
        { desc: 'Stadtwerke Köln - Strom', amount: -145.30, counterparty: 'Stadtwerke Köln' },
        { desc: 'Allianz Versicherung', amount: -89.50, counterparty: 'Allianz Versicherung' },
        { desc: 'Finanzamt Grundsteuer', amount: -234.00, counterparty: 'Finanzamt Köln' },
        { desc: 'Miete Februar 2024 - Müller', amount: 850.00, counterparty: 'Müller, Thomas' },
        { desc: 'Miete Februar 2024 - Schmidt', amount: 720.00, counterparty: 'Schmidt, Anna' },
        { desc: 'Sparkasse Darlehen', amount: -1250.00, counterparty: 'Sparkasse Köln' },
        { desc: 'Handwerkerrechnung Sanitär', amount: -450.00, counterparty: 'Sanitär Meier' },
        { desc: 'Nebenkostenabschlag', amount: 150.00, counterparty: 'Müller, Thomas' },
      ];
      
      for (let i = 0; i < demoData.length; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 3));
        
        demoTransactions.push({
          originalDate: date.toISOString().split('T')[0],
          valueDate: date.toISOString().split('T')[0],
          amount: demoData[i].amount,
          currency: 'EUR',
          description: demoData[i].desc,
          counterpartyName: demoData[i].counterparty,
          counterpartyIban: demoData[i].amount > 0 ? `DE${Math.random().toString().slice(2, 22)}` : undefined,
        });
      }
      
      const dates = demoTransactions.map(t => t.originalDate).sort();
      
      resolve({
        transactions: demoTransactions,
        format: fileName.endsWith('.csv') ? 'CSV (Sparkasse)' : 'MT940',
        dateRange: {
          from: dates[0] || now.toISOString().split('T')[0],
          to: dates[dates.length - 1] || now.toISOString().split('T')[0],
        },
      });
    }, 1500);
  });
}

// Categorize transaction locally
function categorizeTransactionLocal(amount: number, description: string, counterpartyName: string): {
  category: BankTransactionCategory;
  confidence: number;
} {
  const desc = description.toLowerCase();
  const cp = counterpartyName.toLowerCase();
  
  if (amount > 0) {
    if (desc.includes('miete') || cp.includes('müller') || cp.includes('schmidt')) {
      return { category: 'rent_income', confidence: 85 };
    }
    if (desc.includes('nebenkosten') || desc.includes('abschlag')) {
      return { category: 'utility_income', confidence: 80 };
    }
    return { category: 'other_income', confidence: 50 };
  } else {
    if (desc.includes('stadtwerke') || desc.includes('strom') || desc.includes('gas')) {
      return { category: 'utilities_payment', confidence: 90 };
    }
    if (desc.includes('versicherung') || cp.includes('allianz')) {
      return { category: 'insurance_payment', confidence: 90 };
    }
    if (desc.includes('finanzamt') || desc.includes('steuer')) {
      return { category: 'tax_payment', confidence: 95 };
    }
    if (desc.includes('darlehen') || desc.includes('kredit') || cp.includes('sparkasse')) {
      return { category: 'mortgage_payment', confidence: 85 };
    }
    if (desc.includes('handwerker') || desc.includes('reparatur')) {
      return { category: 'maintenance_payment', confidence: 80 };
    }
    return { category: 'other', confidence: 40 };
  }
}

export default function BankImport({ onImportComplete }: BankImportProps) {
  const { bankAccounts, addBankTransactions, addBankImport, updateBankAccount } = useStore();
  const { formatCurrency, language } = useI18n();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<Array<{
    originalDate: string;
    valueDate: string;
    amount: number;
    currency: string;
    description: string;
    counterpartyName: string;
    counterpartyIban?: string;
    category?: BankTransactionCategory;
    confidence?: number;
    selected?: boolean;
  }>>([]);
  const [parseResult, setParseResult] = useState<{
    format: string;
    dateRange: { from: string; to: string };
  } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);
  
  const processFile = async (file: File) => {
    if (!selectedAccountId) {
      toast.error(language === 'de' ? 'Bitte wählen Sie zuerst ein Bankkonto aus' : 'Please select a bank account first');
      return;
    }
    
    setIsProcessing(true);
    setImportErrors([]);
    
    try {
      // Read file content
      const content = await file.text();
      
      // Parse file
      const result = await simulateParseFile(content, file.name);
      
      // Categorize transactions
      const categorized = result.transactions.map(t => {
        const { category, confidence } = categorizeTransactionLocal(t.amount, t.description, t.counterpartyName);
        return {
          ...t,
          category,
          confidence,
          selected: true,
        };
      });
      
      setParsedTransactions(categorized);
      setParseResult({
        format: result.format,
        dateRange: result.dateRange,
      });
      setStep('preview');
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : 'Unbekannter Fehler beim Verarbeiten der Datei']);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleTransaction = (index: number) => {
    setParsedTransactions(prev => prev.map((t, i) => 
      i === index ? { ...t, selected: !t.selected } : t
    ));
  };
  
  const selectAll = () => {
    setParsedTransactions(prev => prev.map(t => ({ ...t, selected: true })));
  };
  
  const deselectAll = () => {
    setParsedTransactions(prev => prev.map(t => ({ ...t, selected: false })));
  };
  
  const updateCategory = (index: number, category: BankTransactionCategory) => {
    setParsedTransactions(prev => prev.map((t, i) => 
      i === index ? { ...t, category, confidence: 100 } : t
    ));
  };
  
  const handleImport = async () => {
    if (!selectedAccountId || !parseResult) return;
    
    setStep('importing');
    
    const selectedTransactions = parsedTransactions.filter(t => t.selected);
    const importId = `import-${Date.now()}`;
    
    // Create bank transactions
    const bankTransactions: Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'>[] = selectedTransactions.map(t => ({
      bankAccountId: selectedAccountId,
      originalDate: t.originalDate,
      valueDate: t.valueDate,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      counterpartyName: t.counterpartyName,
      counterpartyIban: t.counterpartyIban,
      category: t.category || 'unknown',
      categoryConfidence: t.confidence || 50,
      categorySource: 'auto' as const,
      matchStatus: 'unmatched' as const,
      importId,
      importSource: parseResult.format.includes('CSV') ? 'csv' as const : 'mt940' as const,
      notes: '',
      isReconciled: false,
    }));
    
    // Add transactions to store
    addBankTransactions(bankTransactions);
    
    // Create import record
    const account = bankAccounts.find(a => a.id === selectedAccountId);
    addBankImport({
      bankAccountId: selectedAccountId,
      fileName: 'bankauszug.csv',
      fileType: parseResult.format.includes('CSV') ? 'csv' : 'mt940',
      fileSize: 0,
      importDate: new Date().toISOString().split('T')[0],
      status: 'completed',
      transactionsCount: selectedTransactions.length,
      importedCount: selectedTransactions.length,
      skippedCount: parsedTransactions.length - selectedTransactions.length,
      errorCount: 0,
      errors: [],
      warnings: [],
      dateRange: parseResult.dateRange,
    });
    
    // Update account balance (simplified)
    const balanceChange = selectedTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (account) {
      updateBankAccount(selectedAccountId, {
        currentBalance: account.currentBalance + balanceChange,
        lastSyncDate: new Date().toISOString().split('T')[0],
      });
    }
    
    setStep('complete');
    
    if (onImportComplete) {
      onImportComplete(selectedTransactions.length);
    }
    
    toast.success(language === 'de' 
      ? `${selectedTransactions.length} Transaktionen erfolgreich importiert` 
      : `${selectedTransactions.length} transactions imported successfully`);
  };
  
  const resetImport = () => {
    setStep('upload');
    setParsedTransactions([]);
    setParseResult(null);
    setImportErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const selectedCount = parsedTransactions.filter(t => t.selected).length;
  const totalAmount = parsedTransactions.filter(t => t.selected).reduce((sum, t) => sum + t.amount, 0);
  
  // Get category label
  const getCategoryLabel = (cat?: BankTransactionCategory) => {
    if (!cat) return '';
    return BANK_TRANSACTION_CATEGORY_LABELS[cat]?.[language] || cat;
  };
  
  return (
    <div className="space-y-4">
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <>
          {/* Account Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {language === 'de' ? 'Bankkonto auswählen' : 'Select Bank Account'}
              </CardTitle>
              <CardDescription>
                {language === 'de' 
                  ? 'Wählen Sie das Konto, auf das die Transaktionen importiert werden sollen' 
                  : 'Select the account to import transactions to'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={language === 'de' ? 'Bankkonto wählen...' : 'Select bank account...'} />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span>{account.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({account.bankName})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          {/* File Drop Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                {language === 'de' ? 'Bankauszug importieren' : 'Import Bank Statement'}
              </CardTitle>
              <CardDescription>
                {language === 'de'
                  ? 'Laden Sie CSV-, MT940- oder CAMT-Dateien hoch'
                  : 'Upload CSV, MT940, or CAMT files'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={dropRef}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
                    <p className="text-lg font-medium">
                      {language === 'de' ? 'Datei wird verarbeitet...' : 'Processing file...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">
                      {language === 'de' 
                        ? 'Datei hierher ziehen' 
                        : 'Drag and drop file here'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === 'de'
                        ? 'oder klicken Sie zum Durchsuchen'
                        : 'or click to browse'}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv,.mt940,.sta,.xml"
                      onChange={handleFileSelect}
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!selectedAccountId}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {language === 'de' ? 'Datei auswählen' : 'Select File'}
                    </Button>
                  </>
                )}
              </div>
              
              {/* Supported Formats */}
              <div className="mt-4 flex flex-wrap gap-2">
                {GERMAN_BANK_FORMATS.slice(0, 4).map(format => (
                  <Badge key={format.bankIdentifier} variant="outline" className="text-xs">
                    {format.name}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">MT940</Badge>
                <Badge variant="outline" className="text-xs">CAMT.052</Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Errors */}
          {importErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{language === 'de' ? 'Fehler beim Import' : 'Import Error'}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
      
      {/* Step 2: Preview */}
      {step === 'preview' && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                {language === 'de' ? 'Transaktionsvorschau' : 'Transaction Preview'}
              </span>
              <Badge variant="secondary">
                {parseResult.format}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {parseResult.dateRange.from} - {parseResult.dateRange.to}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {parsedTransactions.length} {language === 'de' ? 'Transaktionen' : 'transactions'}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {language === 'de' ? 'Alle auswählen' : 'Select all'}
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  {language === 'de' ? 'Alle abwählen' : 'Deselect all'}
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedCount} / {parsedTransactions.length} {language === 'de' ? 'ausgewählt' : 'selected'}
              </span>
            </div>
            
            {/* Transaction List */}
            <ScrollArea className="h-96 rounded-md border">
              <div className="divide-y">
                {parsedTransactions.map((transaction, index) => (
                  <div 
                    key={index}
                    className={`p-3 hover:bg-muted/50 transition-colors ${
                      !transaction.selected ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={transaction.selected}
                        onCheckedChange={() => toggleTransaction(index)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">
                            {transaction.counterpartyName || transaction.description}
                          </span>
                          <span className={`font-semibold ${
                            transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{transaction.originalDate}</span>
                          <span>•</span>
                          <span className="truncate">{transaction.description}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Select
                            value={transaction.category}
                            onValueChange={(val) => updateCategory(index, val as BankTransactionCategory)}
                          >
                            <SelectTrigger className="h-7 text-xs w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(BANK_TRANSACTION_CATEGORY_LABELS)
                                .filter(([key]) => 
                                  transaction.amount >= 0 
                                    ? key.includes('income') || key === 'other' || key === 'unknown'
                                    : !key.includes('income') || key === 'other' || key === 'unknown'
                                )
                                .map(([key, labels]) => (
                                  <SelectItem key={key} value={key} className="text-xs">
                                    {labels[language]}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                          {transaction.confidence && (
                            <Badge variant={transaction.confidence > 70 ? 'default' : 'secondary'} className="text-xs">
                              {transaction.confidence}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Summary */}
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{selectedCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'de' ? 'Zu importieren' : 'To import'}
                  </p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'de' ? 'Gesamtsumme' : 'Total amount'}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{parsedTransactions.length - selectedCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'de' ? 'Übersprungen' : 'Skipped'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetImport}>
              <X className="h-4 w-4 mr-2" />
              {language === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
            <Button onClick={handleImport} disabled={selectedCount === 0}>
              <Check className="h-4 w-4 mr-2" />
              {language === 'de' ? `${selectedCount} importieren` : `Import ${selectedCount}`}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
              <p className="text-lg font-medium">
                {language === 'de' ? 'Transaktionen werden importiert...' : 'Importing transactions...'}
              </p>
              <Progress className="w-64" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 4: Complete */}
      {step === 'complete' && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-xl font-medium">
                {language === 'de' ? 'Import erfolgreich!' : 'Import successful!'}
              </p>
              <p className="text-muted-foreground">
                {selectedCount} {language === 'de' ? 'Transaktionen wurden importiert' : 'transactions have been imported'}
              </p>
              <Button onClick={resetImport}>
                {language === 'de' ? 'Weitere Datei importieren' : 'Import another file'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
