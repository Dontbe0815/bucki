'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Receipt } from 'lucide-react';

function UtilityCostsSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Nebenkostenabrechnung</h1>

      <Card>
        <CardContent className="py-12 text-center">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nebenkosten-Abrechnung</h3>
          <p className="text-gray-500">Erstellen Sie Nebenkostenabrechnungen für Ihre Mieter</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default UtilityCostsSection;
