'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { Calendar, ClipboardList } from 'lucide-react';

function PropertyManagementSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  
  const openTasks = store.tasks.filter(task => task.status !== 'completed').length;
  const pendingInspections = store.inspections?.filter(i => i.status === 'scheduled').length || 0;
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hausverwaltung</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Offene Aufgaben</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{openTasks}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Anstehende Inspektionen</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{pendingInspections}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Aktive Mieter</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{store.tenants.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Wartungsverträge</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">0</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Dringende Aufgaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            {store.tasks.filter(t => t.status !== 'completed' && t.priority === 'urgent').length > 0 ? (
              <div className="space-y-2">
                {store.tasks.filter(t => t.status !== 'completed' && t.priority === 'urgent').slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded">
                    <span className="font-medium">{task.title}</span>
                    <Badge className="bg-red-100 text-red-800">Dringend</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Keine dringenden Aufgaben</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Nächste Termine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Ablesung Wasser</span>
                <span className="text-sm text-muted-foreground">In 30 Tagen</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Jahresabrechnung</span>
                <span className="text-sm text-muted-foreground">In 60 Tagen</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PropertyManagementSection;
