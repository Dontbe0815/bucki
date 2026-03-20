'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Plus } from 'lucide-react';

function ReservesSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    monthlyContribution: 0,
    purpose: '',
  });
  
  const totalReserves = store.properties.reduce((sum, p) => sum + (p.reserves || 0), 0);
  const monthlyContributions = store.properties.reduce((sum, p) => sum + (p.monthlyReserve || 0), 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rücklagen</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Rücklage
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardHeader><CardTitle>Gesamte Rücklagen</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{formatCurrency(totalReserves)}</div>
            <p className="text-sm text-muted-foreground mt-1">Aktuell verfügbar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monatliche Einzahlungen</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyContributions)}</div>
            <p className="text-sm text-muted-foreground">in alle Rücklagen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Empfohlene Rücklage</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(store.properties.reduce((sum, p) => sum + p.purchasePrice * 0.02, 0))}
            </div>
            <p className="text-sm text-muted-foreground">2% des Kaufpreises p.a.</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Rücklagen nach Immobilien</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {store.properties.map(property => (
              <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{property.name}</p>
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(property.reserves || 0)}</p>
                  <p className="text-xs text-muted-foreground">+ {formatCurrency(property.monthlyReserve || 0)}/Monat</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReservesSection;
