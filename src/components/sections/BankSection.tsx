'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Landmark, Upload, RefreshCw, List, Plus, CreditCard, Building2 } from 'lucide-react';
import BankImport from '@/components/bank/BankImport';
import BankTransactions from '@/components/bank/BankTransactions';
import BankReconcile from '@/components/bank/BankReconcile';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

function BankSection() {
  const { bankAccounts, addBankAccount, bankTransactions } = useStore();
  const { formatCurrency, language } = useI18n();
  const [activeTab, setActiveTab] = useState('transactions');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    bankName: '',
    iban: '',
    bic: '',
    accountType: 'checking' as 'checking' | 'savings' | 'loan',
  });

  // Calculate stats
  const totalBalance = bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const transactionCount = bankTransactions.length;
  const unmatchedCount = bankTransactions.filter(t => t.matchStatus === 'unmatched').length;

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.bankName || !newAccount.iban) {
      toast.error(language === 'de' ? 'Bitte füllen Sie alle Pflichtfelder aus' : 'Please fill in all required fields');
      return;
    }

    addBankAccount({
      name: newAccount.name,
      bankName: newAccount.bankName,
      iban: newAccount.iban,
      bic: newAccount.bic,
      accountNumber: '',
      blz: '',
      accountType: newAccount.accountType,
      currency: 'EUR',
      currentBalance: 0,
      isActive: true,
      notes: '',
    });

    setNewAccount({
      name: '',
      bankName: '',
      iban: '',
      bic: '',
      accountType: 'checking',
    });
    setShowAddAccount(false);
    toast.success(language === 'de' ? 'Bankkonto hinzugefügt' : 'Bank account added');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="h-8 w-8 text-emerald-600" />
            {language === 'de' ? 'Bank' : 'Bank'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'de' 
              ? 'Kontoführung, Import und Abstimmung Ihrer Banktransaktionen'
              : 'Account management, import and reconciliation of your bank transactions'}
          </p>
        </div>
        <Button onClick={() => setShowAddAccount(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          {language === 'de' ? 'Konto hinzufügen' : 'Add Account'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Konten' : 'Accounts'}
                </p>
                <p className="text-2xl font-bold">{bankAccounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Gesamtsaldo' : 'Total Balance'}
                </p>
                <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <List className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Transaktionen' : 'Transactions'}
                </p>
                <p className="text-2xl font-bold">{transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Nicht zugeordnet' : 'Unmatched'}
                </p>
                <p className="text-2xl font-bold text-amber-600">{unmatchedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts List */}
      {bankAccounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'de' ? 'Keine Bankkonten' : 'No Bank Accounts'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'de' 
                ? 'Fügen Sie Ihr erstes Bankkonto hinzu, um Transaktionen zu importieren'
                : 'Add your first bank account to import transactions'}
            </p>
            <Button onClick={() => setShowAddAccount(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'de' ? 'Erstes Konto hinzufügen' : 'Add First Account'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Accounts Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(account => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <Badge variant={account.accountType === 'checking' ? 'default' : 'secondary'}>
                      {account.accountType === 'checking' 
                        ? (language === 'de' ? 'Girokonto' : 'Checking')
                        : (language === 'de' ? 'Sparkonto' : 'Savings')}
                    </Badge>
                  </div>
                  <CardDescription>{account.bankName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IBAN</span>
                      <span className="font-mono text-xs">{account.iban.slice(0, 8)}...{account.iban.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        {language === 'de' ? 'Saldo' : 'Balance'}
                      </span>
                      <span className={`font-bold ${account.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                {language === 'de' ? 'Transaktionen' : 'Transactions'}
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {language === 'de' ? 'Import' : 'Import'}
              </TabsTrigger>
              <TabsTrigger value="reconcile" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {language === 'de' ? 'Abstimmen' : 'Reconcile'}
                {unmatchedCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {unmatchedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-4">
              <BankTransactions />
            </TabsContent>

            <TabsContent value="import" className="mt-4">
              <BankImport onImportComplete={() => setActiveTab('reconcile')} />
            </TabsContent>

            <TabsContent value="reconcile" className="mt-4">
              <BankReconcile />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'de' ? 'Bankkonto hinzufügen' : 'Add Bank Account'}
            </DialogTitle>
            <DialogDescription>
              {language === 'de'
                ? 'Verbinden Sie Ihr Bankkonto für den Import von Transaktionen'
                : 'Connect your bank account to import transactions'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'de' ? 'Kontoname *' : 'Account Name *'}</Label>
              <Input
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder={language === 'de' ? 'z.B. Hauptkonto' : 'e.g. Main Account'}
              />
            </div>
            <div>
              <Label>{language === 'de' ? 'Bankname *' : 'Bank Name *'}</Label>
              <Input
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                placeholder={language === 'de' ? 'z.B. Sparkasse Köln' : 'e.g. Sparkasse'}
              />
            </div>
            <div>
              <Label>IBAN *</Label>
              <Input
                value={newAccount.iban}
                onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value.toUpperCase() })}
                placeholder="DE00 0000 0000 0000 0000 00"
                maxLength={22}
              />
            </div>
            <div>
              <Label>BIC</Label>
              <Input
                value={newAccount.bic}
                onChange={(e) => setNewAccount({ ...newAccount, bic: e.target.value.toUpperCase() })}
                placeholder="XXXXXXXXXXX"
                maxLength={11}
              />
            </div>
            <div>
              <Label>{language === 'de' ? 'Kontoart' : 'Account Type'}</Label>
              <Select
                value={newAccount.accountType}
                onValueChange={(v: 'checking' | 'savings' | 'loan') => setNewAccount({ ...newAccount, accountType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">{language === 'de' ? 'Girokonto' : 'Checking'}</SelectItem>
                  <SelectItem value="savings">{language === 'de' ? 'Sparkonto' : 'Savings'}</SelectItem>
                  <SelectItem value="loan">{language === 'de' ? 'Darlehenskonto' : 'Loan'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)}>
              {language === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
            <Button onClick={handleAddAccount} className="bg-emerald-600 hover:bg-emerald-700">
              {language === 'de' ? 'Hinzufügen' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BankSection;
