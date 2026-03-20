'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { FileText, Upload } from 'lucide-react';

function DocumentsSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dokumente</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {store.documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{doc.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Typ</span>
                  <span>{doc.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Datum</span>
                  <span>{formatDate(doc.date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {store.documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Dokumente</h3>
            <p className="text-gray-500">Laden Sie Ihre ersten Dokumente hoch</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DocumentsSection;
