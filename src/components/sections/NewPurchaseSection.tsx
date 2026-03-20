'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/contexts/I18nContext';

function NewPurchaseSection() {
  const { t, formatCurrency } = useI18n();
  const [calculation, setCalculation] = useState({
    purchasePrice: 300000,
    renovationCosts: 20000,
    notaryCosts: 0,
    agentFee: 0,
    transferTax: 0,
    equity: 80000,
    interestRate: 4.0,
    repaymentRate: 2.0,
    fixedRateYears: 10,
    expectedRent: 1200,
  });
  
  // Auto-calculate costs
  const notaryCosts = calculation.purchasePrice * 0.015;
  const agentFee = calculation.purchasePrice * 0.0357;
  const transferTax = calculation.purchasePrice * 0.05; // Varies by state
  const totalCosts = calculation.purchasePrice + calculation.renovationCosts + notaryCosts + agentFee + transferTax;
  const loanAmount = totalCosts - calculation.equity;
  const monthlyRate = loanAmount * ((calculation.interestRate + calculation.repaymentRate) / 100 / 12);
  const annualRent = calculation.expectedRent * 12;
  const grossYield = totalCosts > 0 ? (annualRent / totalCosts) * 100 : 0;
  const cashOnCash = calculation.equity > 0 ? ((annualRent - monthlyRate * 12) / calculation.equity) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Neukauf-Berechnung</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Kaufpreis & Kosten</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kaufpreis</Label>
              <Input 
                type="number" 
                value={calculation.purchasePrice} 
                onChange={(e) => setCalculation({...calculation, purchasePrice: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Renovierungskosten</Label>
              <Input 
                type="number" 
                value={calculation.renovationCosts} 
                onChange={(e) => setCalculation({...calculation, renovationCosts: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Notarkosten (1,5%)</Label>
                <Input type="text" value={formatCurrency(notaryCosts)} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Maklercourtage (3,57%)</Label>
                <Input type="text" value={formatCurrency(agentFee)} disabled className="bg-muted" />
              </div>
            </div>
            <div>
              <Label>Grunderwerbsteuer (5%)</Label>
              <Input type="text" value={formatCurrency(transferTax)} disabled className="bg-muted" />
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
              <div className="flex justify-between">
                <span className="font-bold">Gesamtkosten</span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalCosts)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Finanzierung</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Eigenkapital</Label>
              <Input 
                type="number" 
                value={calculation.equity} 
                onChange={(e) => setCalculation({...calculation, equity: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="p-3 bg-muted rounded">
              <div className="flex justify-between">
                <span>Darlehensbetrag</span>
                <span className="font-bold">{formatCurrency(loanAmount)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Zins (%)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={calculation.interestRate} 
                  onChange={(e) => setCalculation({...calculation, interestRate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Tilgung (%)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={calculation.repaymentRate} 
                  onChange={(e) => setCalculation({...calculation, repaymentRate: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex justify-between">
                <span className="font-bold">Monatliche Rate</span>
                <span className="font-bold text-blue-600">{formatCurrency(monthlyRate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Rendite-Kennzahlen</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Erwartete Miete</p>
              <Input 
                type="number"
                className="text-center text-xl font-bold mt-1"
                value={calculation.expectedRent}
                onChange={(e) => setCalculation({...calculation, expectedRent: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Bruttomietrendite</p>
              <p className="text-2xl font-bold text-emerald-600">{grossYield.toFixed(2)}%</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Cash-on-Cash</p>
              <p className="text-2xl font-bold text-blue-600">{cashOnCash.toFixed(2)}%</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Eigenkapitalquote</p>
              <p className="text-2xl font-bold text-purple-600">{((calculation.equity / totalCosts) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewPurchaseSection;
