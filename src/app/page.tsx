'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from 'next-themes';
import type { 
  Property, Unit, Tenant, Transaction, Financing, Document, Task,
  TransactionCategory, TransactionType, TaskPriority, TaskStatus, DocumentType,
  DepreciationItem, DepreciationCategory,
  HealthScore, HealthRecommendation, CalendarEventType,
  DunningLetter, DunningLevel, DunningStatus, UtilityCostSettlement,
  DashboardWidget, DashboardWidgetType,
  TimeFilter, ForecastYear, NotificationSettings, Currency, InspectionItem
} from '@/lib/types';
import { DEFAULT_DASHBOARD_WIDGETS, WIDGET_METADATA } from '@/lib/types';
import { 
  Home, Building2, DoorOpen, Users, DollarSign, CreditCard, FileText, 
  ClipboardList, BarChart3, Settings, Menu, X, Plus, Edit2, Trash2, 
  TrendingUp, TrendingDown, Building, Calendar, Phone, Mail, MapPin,
  ChevronRight, AlertTriangle, CheckCircle, Clock, Upload, Download,
  Save, RotateCcw, Eye, ArrowUpRight, ArrowDownRight, Euro, FileSpreadsheet,
  BedDouble, Ruler, Hash, Briefcase, AlertCircle, Check, Calculator, Receipt,
  Sofa, Lamp, Refrigerator, Package, Filter, MoreHorizontal, Sun, Moon, Search,
  Star, Bell, Lock, Globe, ChevronUp, ChevronDown, FileDown, FileUp, Printer,
  Zap, LayoutGrid, List, Shield, Key, Fingerprint, Activity, Target, Gauge,
  Percent, Minus, Wallet, PiggyBank, LineChart as LineChartIcon,
  ArrowRight, Play, Pause, Settings2, RefreshCw, ExternalLink, Info, HelpCircle,
  ChevronLeft, Layers, PieChart as PieChartIcon, BarChart2, Sparkles, BookmarkPlus,
  UserPlus, FilePlus, HandCoins, Scale, Landmark, Clock4, CalendarDays,
  CalendarRange, Milestone, Award, ThumbsUp, ThumbsDown, Lightbulb, Brain,
  LucideIcon, PlusCircle, LockKeyhole, Unlock, RefreshCcw, Trash, SquareCheck,
  Square, XCircle, Monitor, User, Send, Wrench, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, ComposedChart,
  ReferenceLine
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, addMonths, addYears, differenceInMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear, isAfter, isBefore, isToday, isSameMonth, isSameYear, parseISO, getDaysInMonth, getDay, setDate as setDateField, subMonths, subYears } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  getSecuritySettings, 
  saveSecuritySettings, 
  setPin, 
  verifyPin, 
  removePin, 
  changePin,
  forgotPinReset,
  isPinRequired, 
  isSessionValid, 
  lockSession, 
  unlockSession,
  updateLastActivity,
  isBiometricAvailable,
  autoLockOptions
} from '@/lib/security';
import {
  areNotificationsSupported,
  requestNotificationPermission,
  getNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  showNotification,
  notifyDueTask,
  notifyContractExpiration,
  initializeNotifications
} from '@/lib/notifications';
import OnboardingWizard, { isOnboardingCompleted, setOnboardingCompleted } from '@/components/onboarding/OnboardingWizard';
import { SectionErrorBoundary } from '@/components/common/ErrorBoundary';
import { LTVTooltip, ROETooltip, DepreciationTooltip, CashOnCashTooltip } from '@/components/common/HelpTooltip';
import {
  calculateAnlageVSummary,
  type AnlageVProperty,
  type AnlageVSummary,
} from '@/lib/tax/anlageV';
import BankSection from '@/components/sections/BankSection';
import DashboardSection from '@/components/sections/DashboardSection';
import PropertiesSection from '@/components/sections/PropertiesSection';
import FinancesSectionImport from '@/components/sections/FinancesSection';
import { geocodeAddressCached } from '@/lib/geocoding';

// Navigation Items - wird dynamisch mit i18n gesetzt
const getNavItems = (t: any) => [
  { id: 'dashboard', label: t.nav.dashboard, icon: Home },
  { id: 'properties', label: 'Immobilien', icon: Building2 },
  { id: 'units', label: 'Einheiten', icon: DoorOpen },
  { id: 'tenants', label: 'Mieter', icon: Users },
  { id: 'finances', label: 'Finanzen', icon: DollarSign },
  { id: 'financing', label: 'Finanzierungen', icon: CreditCard },
  { id: 'depreciation', label: 'Abschreibungen', icon: TrendingDown },
  { id: 'taxes', label: 'Steuern', icon: Receipt },
  { id: 'propertymanagement', label: 'Hausverwaltung', icon: Wrench },
  { id: 'sales', label: 'Verkauf', icon: TrendingUp },
  { id: 'documents', label: 'Dokumente', icon: FileText },
  { id: 'newpurchase', label: 'Neukauf', icon: PlusCircle },
  { id: 'settings', label: t.nav.settings, icon: Settings },
];

// Color palette for charts
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Format currency - wird dynamisch mit i18n gesetzt
// Diese Funktionen werden innerhalb der Komponenten mit useI18n() verwendet

// Category labels
const categoryLabels: Record<TransactionCategory, string> = {
  rent: 'Miete',
  utilities: 'Nebenkosten',
  repairs: 'Reparaturen',
  insurance: 'Versicherung',
  mortgage: 'Kreditrate',
  reserves: 'Rücklagen',
  management: 'Verwaltung',
  taxes: 'Steuern',
  other: 'Sonstiges',
};

const documentTypeLabels: Record<DocumentType, string> = {
  rental_contract: 'Mietvertrag',
  purchase_contract: 'Kaufvertrag',
  invoice: 'Rechnung',
  energy_certificate: 'Energieausweis',
  insurance: 'Versicherung',
  mortgage: 'Kreditvertrag',
  other: 'Sonstiges',
};

const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  urgent: 'Dringend',
};

const taskStatusLabels: Record<TaskStatus, string> = {
  pending: 'Offen',
  in_progress: 'In Bearbeitung',
  completed: 'Erledigt',
  cancelled: 'Abgebrochen',
};

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const unitStatusLabels: Record<string, string> = {
  rented: 'Vermietet',
  vacant: 'Leer',
  renovation: 'Renovierung',
  reserved: 'Reserviert',
};

const unitStatusColors: Record<string, string> = {
  rented: 'bg-green-100 text-green-800',
  vacant: 'bg-red-100 text-red-800',
  renovation: 'bg-yellow-100 text-yellow-800',
  reserved: 'bg-blue-100 text-blue-800',
};

// Abschreibungskategorie Labels und Icons
const depreciationCategoryLabels: Record<DepreciationCategory, string> = {
  gebaeude: 'Gebäude',
  moebel: 'Möbel',
  kueche: 'Küche',
  elektro: 'Elektrogeräte',
  inventar: 'Inventar',
  ausstattung: 'Ausstattung',
  sonstiges: 'Sonstiges',
};

const depreciationCategoryColors: Record<DepreciationCategory, string> = {
  gebaeude: 'bg-blue-100 text-blue-800',
  moebel: 'bg-amber-100 text-amber-800',
  kueche: 'bg-orange-100 text-orange-800',
  elektro: 'bg-cyan-100 text-cyan-800',
  inventar: 'bg-purple-100 text-purple-800',
  ausstattung: 'bg-pink-100 text-pink-800',
  sonstiges: 'bg-gray-100 text-gray-800',
};

// ============================================
// LOCK SCREEN COMPONENT
// ============================================
function LockScreen({ onUnlock, t }: { onUnlock: () => void; t: any }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePinChange = (value: string) => {
    if (/^\d*$/.test(value) && value.length <= 6) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = async () => {
    const isValid = await verifyPin(pin);
    if (isValid) {
      unlockSession();
      onUnlock();
    } else {
      setError(t.auth.wrongPin);
      setPin('');
    }
  };

  const handleForgotPin = () => {
    setShowForgotConfirm(true);
  };

  const handleConfirmForgot = () => {
    forgotPinReset();
    setShowForgotConfirm(false);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center z-50">
      <Card className="w-full max-w-sm mx-4 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <LockKeyhole className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">{t.auth.locked}</CardTitle>
          <CardDescription>{t.auth.enterPin}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < pin.length ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <Input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="text-center text-2xl tracking-widest"
            placeholder="••••"
            maxLength={6}
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={pin.length < 4}
          >
            <Unlock className="h-4 w-4 mr-2" />
            {t.auth.unlock}
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground"
            onClick={handleForgotPin}
          >
            {t.auth.forgotPin}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showForgotConfirm} onOpenChange={setShowForgotConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.auth.forgotPin}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.auth.resetPinConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmForgot} className="bg-red-600 hover:bg-red-700">
              {t.common.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// BULK ACTION TOOLBAR COMPONENT
// ============================================
function BulkActionToolbar({ 
  selectedCount, 
  onDelete, 
  onStatusChange, 
  onExport,
  onClear,
  t 
}: { 
  selectedCount: number; 
  onDelete: () => void; 
  onStatusChange?: () => void; 
  onExport?: () => void;
  onClear: () => void;
  t: any;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border shadow-lg rounded-lg px-4 py-2 flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedCount} {t.bulkActions.selectedCount}
      </span>
      <Separator orientation="vertical" className="h-6" />
      <Button size="sm" variant="destructive" onClick={onDelete}>
        <Trash className="h-4 w-4 mr-1" />
        {t.common.delete}
      </Button>
      {onStatusChange && (
        <Button size="sm" variant="outline" onClick={onStatusChange}>
          {t.bulkActions.changeStatus}
        </Button>
      )}
      {onExport && (
        <Button size="sm" variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-1" />
          {t.common.export}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================
// PULL TO REFRESH COMPONENT
// ============================================
function usePullToRefresh(onRefresh: () => void) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      setPullDistance(Math.min(diff, threshold * 2));
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const element = document.documentElement;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isPulling, pullDistance, isRefreshing };
}

// ============================================
// MAIN APP
// ============================================
export default function BuckiApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ type: 'month' });
  const [isLocked, setIsLocked] = useState(true); // Start locked until we verify session
  const [showOnboarding, setShowOnboarding] = useState(false); // Onboarding wizard
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false); // Keyboard shortcuts help
  
  const store = useStore();
  const { t, language, setLanguage, formatCurrency, formatDate, currency, setCurrency, exchangeRates } = useI18n();
  const { theme, setTheme } = useTheme();
  const navItems = getNavItems(t);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const initialCheckRef = useRef(false);
  
  // Check if PIN is required on mount
  useEffect(() => {
    if (mounted && !initialCheckRef.current) {
      initialCheckRef.current = true;
      const settings = getSecuritySettings();
      
      // Initialize PIN 1234 if no security settings exist (first time setup)
      if (!settings.pinHash) {
        setPin('1234').then(() => {
          // Stay locked - user needs to enter PIN 1234
        });
      } else if (settings.pinEnabled && isSessionValid()) {
        // Session is valid, unlock - use microtask to defer
        queueMicrotask(() => setIsLocked(false));
      }
      // Otherwise stay locked (user needs to enter PIN)
    }
  }, [mounted]);
  
  // Check onboarding status after unlocking
  useEffect(() => {
    if (!isLocked && mounted) {
      const onboardingDone = isOnboardingCompleted();
      if (!onboardingDone && store.properties.length === 0) {
        // Show onboarding for new users with no properties
        // Use microtask to defer state update
        queueMicrotask(() => setShowOnboarding(true));
      }
    }
  }, [isLocked, mounted, store.properties.length]);
  
  // Global keyboard shortcuts
  useEffect(() => {
    if (isLocked) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // Navigation shortcuts
      switch (e.key.toLowerCase()) {
        case '?':
          e.preventDefault();
          setShortcutsHelpOpen(true);
          break;
        case 'd':
          e.preventDefault();
          setActiveTab('dashboard');
          break;
        case 'p':
          e.preventDefault();
          setActiveTab('properties');
          break;
        case 't':
          e.preventDefault();
          setActiveTab('tasks');
          break;
        case 'f':
          e.preventDefault();
          setActiveTab('finances');
          break;
        case 's':
          e.preventDefault();
          setActiveTab('settings');
          break;
        case 'n':
          e.preventDefault();
          // Context-aware new item
          if (activeTab === 'properties') setActiveTab('properties'); // Opens dialog in section
          break;
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setSearchOpen(true);
          }
          break;
        case 'escape':
          setShortcutsHelpOpen(false);
          setSearchOpen(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, activeTab]);
  
  // Activity tracking for auto-lock
  useEffect(() => {
    const handleActivity = () => {
      updateLastActivity();
    };
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);
  
  // Pull to refresh
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    // Using flushSync-like pattern for initialization
    const initMounted = () => setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    
    // Initialize
    initMounted();
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('bucki-favorites');
    if (savedFavorites) {
      const parsed = JSON.parse(savedFavorites);
      // Use a microtask to defer state update
      queueMicrotask(() => setFavorites(parsed));
    }
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id];
      localStorage.setItem('bucki-favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // Global search shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: Array<{ type: string; id: string; title: string; subtitle?: string }> = [];
    
    // Search properties
    store.properties.forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.address.toLowerCase().includes(query) || p.city.toLowerCase().includes(query)) {
        results.push({ type: 'property', id: p.id, title: p.name, subtitle: `${p.address}, ${p.city}` });
      }
    });
    
    // Search tenants
    store.tenants.forEach(t => {
      const fullName = `${t.firstName} ${t.lastName}`;
      if (fullName.toLowerCase().includes(query) || t.email.toLowerCase().includes(query)) {
        results.push({ type: 'tenant', id: t.id, title: fullName, subtitle: t.email });
      }
    });
    
    // Search tasks
    store.tasks.forEach(task => {
      if (task.title.toLowerCase().includes(query)) {
        results.push({ type: 'task', id: task.id, title: task.title, subtitle: task.description });
      }
    });
    
    return results.slice(0, 10);
  }, [searchQuery, store.properties, store.tenants, store.tasks]);

  // Calculate dashboard stats with time filter
  const stats = useMemo(() => {
    const totalProperties = store.properties.length;
    const totalUnits = store.units.length;
    const rentedUnits = store.units.filter(u => u.status === 'rented').length;
    const vacantUnits = store.units.filter(u => u.status === 'vacant').length;
    
    // Filter transactions by time
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    switch (timeFilter.type) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = timeFilter.startDate ? new Date(timeFilter.startDate) : new Date(now.getFullYear(), 0, 1);
        endDate = timeFilter.endDate ? new Date(timeFilter.endDate) : now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Gesamtmieteinnahmen (Warmmiete)
    const totalRentIncome = store.transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && t.category === 'rent' && date >= startDate && date <= endDate;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Kaltmieteneinnahmen (aus units.baseRent)
    const coldRentIncome = store.units
      .filter(u => u.status === 'rented')
      .reduce((sum, u) => sum + u.baseRent, 0);
    
    // Ausgaben gesamt
    const totalExpenses = store.transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date >= startDate && date <= endDate;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Cashflow
    const cashflow = totalRentIncome - totalExpenses;
    
    // Vorjahresvergleich berechnen
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
    const previousPeriodEnd = new Date(endDate);
    previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);
    
    const previousIncome = store.transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date >= previousPeriodStart && date <= previousPeriodEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const incomeChange = previousIncome > 0 ? ((totalRentIncome - previousIncome) / previousIncome) * 100 : 0;
    
    const totalMarketValue = store.properties.reduce((sum, p) => sum + p.marketValue, 0);
    const totalEstimatedValue = store.properties.reduce((sum, p) => sum + (p.estimatedValue || p.marketValue), 0);
    const totalRemainingDebt = store.financings.reduce((sum, f) => sum + f.remainingDebt, 0);
    const equity = totalEstimatedValue - totalRemainingDebt;
    const monthlyRepayment = store.financings.reduce((sum, f) => {
      const totalMonthlyRate = f.monthlyRate;
      const interestAmount = f.principalAmount * (f.interestRate / 100) / 12;
      const repayment = Math.max(0, totalMonthlyRate - interestAmount);
      return sum + repayment;
    }, 0);
    const monthlyInterest = store.transactions
      .filter(t => t.type === 'expense' && t.category === 'mortgage')
      .reduce((sum, t) => sum + t.amount, 0);
    const assetGrowth = coldRentIncome - monthlyInterest + monthlyRepayment;
    const monthlyDepreciation = store.depreciationItems.reduce((sum, d) => sum + d.monthlyDepreciation, 0);
    const annualDepreciation = store.depreciationItems.reduce((sum, d) => sum + d.annualDepreciation, 0);

    return {
      totalProperties,
      totalUnits,
      rentedUnits,
      vacantUnits,
      totalRentIncome,
      coldRentIncome,
      totalExpenses,
      cashflow,
      totalMarketValue,
      totalEstimatedValue,
      totalRemainingDebt,
      equity,
      monthlyRepayment,
      assetGrowth,
      monthlyDepreciation,
      annualDepreciation,
      incomeChange,
      previousIncome,
      // Enhanced KPIs
      warmRentIncome: totalRentIncome,
      totalPurchasePrice: store.properties.reduce((sum, p) => sum + p.purchasePrice, 0),
      monthlyInterest: store.financings.reduce((sum, f) => {
        return sum + (f.principalAmount * (f.interestRate / 100) / 12);
      }, 0),
      monthlyMortgagePayment: store.financings.reduce((sum, f) => sum + f.monthlyRate, 0),
      // Previous period calculations
      previousExpenses: store.transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'expense' && date >= previousPeriodStart && date <= previousPeriodEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0),
      previousCashflow: previousIncome - store.transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'expense' && date >= previousPeriodStart && date <= previousPeriodEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0),
    };
  }, [store.properties, store.units, store.transactions, store.financings, store.depreciationItems, timeFilter]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Show lock screen if PIN is enabled and session is not valid
  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} t={t} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => setShowOnboarding(false)}
          language={language}
        />
      )}
      
      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {language === 'de' ? 'Tastaturkürzel' : 'Keyboard Shortcuts'}
            </DialogTitle>
            <DialogDescription>
              {language === 'de' 
                ? 'Nutzen Sie diese Kürzel für schnelleres Arbeiten'
                : 'Use these shortcuts to work faster'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                {language === 'de' ? 'Navigation' : 'Navigation'}
              </h4>
              <div className="space-y-1">
                {[
                  { key: 'D', label: language === 'de' ? 'Dashboard' : 'Dashboard' },
                  { key: 'P', label: language === 'de' ? 'Immobilien' : 'Properties' },
                  { key: 'T', label: language === 'de' ? 'Aufgaben' : 'Tasks' },
                  { key: 'F', label: language === 'de' ? 'Finanzen' : 'Finances' },
                  { key: 'S', label: language === 'de' ? 'Einstellungen' : 'Settings' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <span className="text-sm">{item.label}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{item.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                {language === 'de' ? 'Aktionen' : 'Actions'}
              </h4>
              <div className="space-y-1">
                {[
                  { key: 'Ctrl+K', label: language === 'de' ? 'Suche öffnen' : 'Open search' },
                  { key: 'N', label: language === 'de' ? 'Neues Element' : 'New item' },
                  { key: '?', label: language === 'de' ? 'Diese Hilfe' : 'This help' },
                  { key: 'Esc', label: language === 'de' ? 'Dialog schließen' : 'Close dialog' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <span className="text-sm">{item.label}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{item.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Global Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-80">
            {searchResults.length === 0 && searchQuery && (
              <p className="text-center text-muted-foreground py-4">{t.search.noResults}</p>
            )}
            <div className="space-y-2">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                  onClick={() => {
                    if (result.type === 'property') setActiveTab('properties');
                    if (result.type === 'tenant') setActiveTab('tenants');
                    if (result.type === 'task') setActiveTab('tasks');
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <div className="font-medium">{result.title}</div>
                  {result.subtitle && <div className="text-sm text-muted-foreground">{result.subtitle}</div>}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Mobile Header */}
      {isMobile && (
        <header className="sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between safe-top">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-600">Bucki</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSearchOpen(true)}
              className="tap-target"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="tap-target"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-72 bg-card shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-600">Bucki</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors tap-target touch-active ${
                    activeTab === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            {/* Theme & Language Toggle in Mobile Menu */}
            <div className="p-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.theme}</span>
                <div className="flex gap-1">
                  <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
                    <Moon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.language}</span>
                <Select value={language} onValueChange={(v: 'de' | 'en') => setLanguage(v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-4 border-t text-xs text-muted-foreground">
              <p>Version 2.0.0 PWA</p>
              <p>© 2024 Bucki</p>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r transition-all duration-300 flex flex-col`}>
          <div className="p-4 border-b flex items-center justify-between">
            {sidebarOpen && (
              <span className="text-xl font-bold text-emerald-600">Bucki</span>
            )}
            {!sidebarOpen && (
              <span className="text-lg font-bold text-emerald-600 mx-auto">B</span>
            )}
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          <nav className="flex-1 p-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeTab === item.id
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
          {/* Theme & Language Toggle in Desktop Sidebar */}
          {sidebarOpen && (
            <div className="p-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.theme}</span>
                <div className="flex gap-1">
                  <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
                    <Moon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.language}</span>
                <Select value={language} onValueChange={(v: 'de' | 'en') => setLanguage(v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="p-4 border-t">
            {sidebarOpen && (
              <div className="text-xs text-muted-foreground">
                <p>Version 2.0.0 PWA</p>
                <p>© 2024 Bucki</p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          {activeTab === 'dashboard' && (
            <SectionErrorBoundary section="dashboard">
              <DashboardSection stats={stats} isMobile={isMobile} setActiveTab={setActiveTab} />
            </SectionErrorBoundary>
          )}
          {activeTab === 'properties' && (
            <SectionErrorBoundary section="properties">
              <PropertiesSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'units' && (
            <SectionErrorBoundary section="units">
              <UnitsSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'tenants' && (
            <SectionErrorBoundary section="tenants">
              <TenantsSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'finances' && (
            <SectionErrorBoundary section="finances">
              <FinancesSectionImport />
            </SectionErrorBoundary>
          )}
          {activeTab === 'financing' && (
            <SectionErrorBoundary section="financing">
              <FinancingSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'depreciation' && (
            <SectionErrorBoundary section="depreciation">
              <DepreciationSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'taxes' && (
            <SectionErrorBoundary section="taxes">
              <TaxesSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'housemoney' && (
            <SectionErrorBoundary section="housemoney">
              <HouseMoneySection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'utilitycosts' && (
            <SectionErrorBoundary section="utilitycosts">
              <UtilityCostsSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'reserves' && (
            <SectionErrorBoundary section="reserves">
              <ReservesSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'propertymanagement' && (
            <SectionErrorBoundary section="propertymanagement">
              <PropertyManagementSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'sales' && (
            <SectionErrorBoundary section="sales">
              <SalesSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'documents' && (
            <SectionErrorBoundary section="documents">
              <DocumentsSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'newpurchase' && (
            <SectionErrorBoundary section="newpurchase">
              <NewPurchaseSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'bank' && (
            <SectionErrorBoundary section="bank">
              <BankSection />
            </SectionErrorBoundary>
          )}
          {activeTab === 'settings' && (
            <SectionErrorBoundary section="settings">
              <SettingsSection />
            </SectionErrorBoundary>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-bottom">
          <div className="flex justify-around items-center h-16">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg tap-target touch-active transition-colors ${
                  activeTab === item.id
                    ? 'text-emerald-600'
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-2 px-3 rounded-lg tap-target touch-active text-muted-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Mehr</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

// ============================================
// DASHBOARD SECTION HELPER COMPONENTS
// ============================================

// Trend Arrow Component
function TrendArrow({ value, invertColors = false }: { value: number; invertColors?: boolean }) {
  if (Math.abs(value) < 1) {
    return <Minus className="h-4 w-4 text-gray-400" />;
  }
  const isPositive = value > 0;
  const colorClass = invertColors 
    ? (isPositive ? 'text-red-500' : 'text-emerald-500')
    : (isPositive ? 'text-emerald-500' : 'text-red-500');
  return isPositive 
    ? <ArrowUpRight className={`h-4 w-4 ${colorClass}`} />
    : <ArrowDownRight className={`h-4 w-4 ${colorClass}`} />;
}

// LTV Gauge Component
function LTVGauge({ ltv }: { ltv: number }) {
  const getLTVColor = (ltv: number) => {
    if (ltv <= 60) return '#10b981';
    if (ltv <= 75) return '#f59e0b';
    if (ltv <= 85) return '#f97316';
    return '#ef4444';
  };
  
  return (
    <div className="relative w-32 h-16 mx-auto">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={getLTVColor(ltv)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${Math.min(ltv, 100) * 1.26} 126`}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-lg font-bold" style={{ color: getLTVColor(ltv) }}>
          {ltv.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}


// ============================================
// UNITS SECTION
// ============================================
function UnitsSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [formData, setFormData] = useState({
    propertyId: '',
    unitNumber: '',
    floor: 0,
    area: 0,
    rooms: 0,
    baseRent: 0,
    additionalCosts: 0,
    status: 'vacant' as Unit['status'],
    description: '',
  });

  const filteredUnits = filterProperty === 'all' 
    ? store.units 
    : store.units.filter(u => u.propertyId === filterProperty);

  const openNewDialog = () => {
    setEditingUnit(null);
    setFormData({
      propertyId: store.properties[0]?.id || '',
      unitNumber: '',
      floor: 0,
      area: 0,
      rooms: 0,
      baseRent: 0,
      additionalCosts: 0,
      status: 'vacant',
      description: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      area: unit.area,
      rooms: unit.rooms,
      baseRent: unit.baseRent,
      additionalCosts: unit.additionalCosts,
      status: unit.status,
      description: unit.description,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.propertyId || !formData.unitNumber) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    const totalRent = formData.baseRent + formData.additionalCosts;

    if (editingUnit) {
      store.updateUnit(editingUnit.id, { ...formData, totalRent });
      toast.success('Einheit aktualisiert');
    } else {
      store.addUnit({ ...formData, totalRent });
      toast.success('Einheit hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      store.deleteUnit(deletingId);
      toast.success('Einheit gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || 'Unbekannt';
  };

  const getTenant = (unitId: string) => {
    return store.tenants.find(t => t.unitId === unitId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Einheiten</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Einheit
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Immobilie filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Immobilien</SelectItem>
            {store.properties.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Units Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Einheit</th>
                  <th className="text-left p-4 font-medium text-gray-600">Immobilie</th>
                  <th className="text-left p-4 font-medium text-gray-600">Fläche</th>
                  <th className="text-left p-4 font-medium text-gray-600">Zimmer</th>
                  <th className="text-left p-4 font-medium text-gray-600">Miete</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 font-medium text-gray-600">Mieter</th>
                  <th className="text-right p-4 font-medium text-gray-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((unit) => {
                  const tenant = getTenant(unit.id);
                  return (
                    <tr key={unit.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{unit.unitNumber}</td>
                      <td className="p-4">{getPropertyName(unit.propertyId)}</td>
                      <td className="p-4">{unit.area} m²</td>
                      <td className="p-4">{unit.rooms}</td>
                      <td className="p-4">{formatCurrency(unit.totalRent)}</td>
                      <td className="p-4">
                        <Badge className={unitStatusColors[unit.status]}>
                          {unitStatusLabels[unit.status]}
                        </Badge>
                      </td>
                      <td className="p-4">{tenant ? `${tenant.firstName} ${tenant.lastName}` : '-'}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(unit)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              setDeletingId(unit.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredUnits.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Keine Einheiten gefunden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Einheit bearbeiten' : 'Neue Einheit'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Immobilie *</Label>
              <Select 
                value={formData.propertyId} 
                onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {store.properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Wohnungsnummer *</Label>
              <Input 
                value={formData.unitNumber} 
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                placeholder="z.B. EG links"
              />
            </div>
            <div>
              <Label>Etage</Label>
              <Input 
                type="number" 
                value={formData.floor} 
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fläche (m²)</Label>
              <Input 
                type="number" 
                value={formData.area} 
                onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Zimmer</Label>
              <Input 
                type="number" 
                step="0.5"
                value={formData.rooms} 
                onChange={(e) => setFormData({ ...formData, rooms: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Kaltmiete (€)</Label>
              <Input 
                type="number" 
                value={formData.baseRent} 
                onChange={(e) => setFormData({ ...formData, baseRent: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Nebenkosten (€)</Label>
              <Input 
                type="number" 
                value={formData.additionalCosts} 
                onChange={(e) => setFormData({ ...formData, additionalCosts: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: Unit['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rented">Vermietet</SelectItem>
                  <SelectItem value="vacant">Leer</SelectItem>
                  <SelectItem value="renovation">Renovierung</SelectItem>
                  <SelectItem value="reserved">Reserviert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Beschreibung</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einheit löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Einheit wirklich löschen? Alle zugehörigen Mieter werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// TENANTS SECTION
// ============================================
function TenantsSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    unitId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    moveInDate: '',
    moveOutDate: '',
    deposit: 0,
    contractType: 'indefinite' as Tenant['contractType'],
    contractStartDate: '',
    contractEndDate: '',
    notes: '',
  });

  const openNewDialog = () => {
    setEditingTenant(null);
    setFormData({
      unitId: store.units.filter(u => u.status === 'vacant')[0]?.id || '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      moveInDate: '',
      moveOutDate: '',
      deposit: 0,
      contractType: 'indefinite',
      contractStartDate: '',
      contractEndDate: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      unitId: tenant.unitId,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
      street: tenant.street,
      city: tenant.city,
      postalCode: tenant.postalCode,
      moveInDate: tenant.moveInDate,
      moveOutDate: tenant.moveOutDate || '',
      deposit: tenant.deposit,
      contractType: tenant.contractType,
      contractStartDate: tenant.contractStartDate,
      contractEndDate: tenant.contractEndDate || '',
      notes: tenant.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.unitId) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingTenant) {
      store.updateTenant(editingTenant.id, formData);
      toast.success('Mieter aktualisiert');
    } else {
      store.addTenant(formData);
      // Update unit status to rented
      store.updateUnit(formData.unitId, { status: 'rented' });
      toast.success('Mieter hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      const tenant = store.tenants.find(t => t.id === deletingId);
      if (tenant) {
        store.updateUnit(tenant.unitId, { status: 'vacant' });
      }
      store.deleteTenant(deletingId);
      toast.success('Mieter gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const getUnitInfo = (unitId: string) => {
    const unit = store.units.find(u => u.id === unitId);
    const property = unit ? store.properties.find(p => p.id === unit.propertyId) : null;
    return { unit, property };
  };

  const vacantUnits = store.units.filter(u => u.status === 'vacant');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mieter</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neuer Mieter
        </Button>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {store.tenants.map((tenant) => {
          const { unit, property } = getUnitInfo(tenant.unitId);
          return (
            <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{tenant.firstName} {tenant.lastName}</CardTitle>
                    <CardDescription className="mt-1">
                      {property?.name} - {unit?.unitNumber}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{tenant.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{tenant.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Einzug: {formatDate(tenant.moveInDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Euro className="h-4 w-4" />
                    <span>Kaution: {formatCurrency(tenant.deposit)}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(tenant)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Bearbeiten
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => {
                        setDeletingId(tenant.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {store.tenants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Mieter</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihren ersten Mieter hinzu</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neuer Mieter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tenant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTenant ? 'Mieter bearbeiten' : 'Neuer Mieter'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Einheit *</Label>
              <Select 
                value={formData.unitId} 
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {(editingTenant ? store.units : vacantUnits).map(u => {
                    const property = store.properties.find(p => p.id === u.propertyId);
                    return (
                      <SelectItem key={u.id} value={u.id}>
                        {property?.name} - {u.unitNumber}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div></div>
            <div>
              <Label>Vorname *</Label>
              <Input 
                value={formData.firstName} 
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label>Nachname *</Label>
              <Input 
                value={formData.lastName} 
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label>E-Mail</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Straße</Label>
              <Input 
                value={formData.street} 
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>
            <div>
              <Label>PLZ</Label>
              <Input 
                value={formData.postalCode} 
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
            <div>
              <Label>Stadt</Label>
              <Input 
                value={formData.city} 
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label>Einzugsdatum</Label>
              <Input 
                type="date"
                value={formData.moveInDate} 
                onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Auszugsdatum</Label>
              <Input 
                type="date"
                value={formData.moveOutDate} 
                onChange={(e) => setFormData({ ...formData, moveOutDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Kaution (€)</Label>
              <Input 
                type="number"
                value={formData.deposit} 
                onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Vertragstyp</Label>
              <Select 
                value={formData.contractType} 
                onValueChange={(value: Tenant['contractType']) => setFormData({ ...formData, contractType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinite">Unbefristet</SelectItem>
                  <SelectItem value="fixed">Befristet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vertragsbeginn</Label>
              <Input 
                type="date"
                value={formData.contractStartDate} 
                onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Vertragsende</Label>
              <Input 
                type="date"
                value={formData.contractEndDate} 
                onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notizen</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mieter löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Mieter wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


// ============================================
// FINANCING SECTION
// ============================================
function FinancingSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFinancing, setEditingFinancing] = useState<Financing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    propertyId: '',
    bankName: '',
    loanNumber: '',
    principalAmount: 0,
    interestRate: 0,
    repaymentRate: 0,
    monthlyRate: 0,
    remainingDebt: 0,
    startDate: '',
    endDate: '',
    fixedInterestUntil: '',
    notes: '',
  });

  const openNewDialog = () => {
    setEditingFinancing(null);
    setFormData({
      propertyId: store.properties[0]?.id || '',
      bankName: '',
      loanNumber: '',
      principalAmount: 0,
      interestRate: 0,
      repaymentRate: 0,
      monthlyRate: 0,
      remainingDebt: 0,
      startDate: '',
      endDate: '',
      fixedInterestUntil: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (financing: Financing) => {
    setEditingFinancing(financing);
    setFormData({
      propertyId: financing.propertyId,
      bankName: financing.bankName,
      loanNumber: financing.loanNumber,
      principalAmount: financing.principalAmount,
      interestRate: financing.interestRate,
      repaymentRate: financing.repaymentRate,
      monthlyRate: financing.monthlyRate,
      remainingDebt: financing.remainingDebt,
      startDate: financing.startDate,
      endDate: financing.endDate,
      fixedInterestUntil: financing.fixedInterestUntil || '',
      notes: financing.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.propertyId || !formData.bankName) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingFinancing) {
      store.updateFinancing(editingFinancing.id, formData);
      toast.success('Finanzierung aktualisiert');
    } else {
      store.addFinancing(formData);
      toast.success('Finanzierung hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      store.deleteFinancing(deletingId);
      toast.success('Finanzierung gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || 'Unbekannt';
  };

  const totalRemainingDebt = store.financings.reduce((sum, f) => sum + f.remainingDebt, 0);
  const totalMonthlyRate = store.financings.reduce((sum, f) => sum + f.monthlyRate, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Finanzierung</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Finanzierung
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Restschuld gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRemainingDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monatliche Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Anzahl Darlehen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.financings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Financings List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {store.financings.map((financing) => {
          const paydownProgress = ((financing.principalAmount - financing.remainingDebt) / financing.principalAmount) * 100;
          
          return (
            <Card key={financing.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{financing.bankName}</CardTitle>
                    <CardDescription>{getPropertyName(financing.propertyId)}</CardDescription>
                  </div>
                  <Badge variant="outline">{financing.loanNumber}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Tilgungsfortschritt</span>
                      <span className="font-medium">{paydownProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={paydownProgress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Darlehensbetrag</span>
                      <p className="font-medium">{formatCurrency(financing.principalAmount)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Restschuld</span>
                      <p className="font-medium">{formatCurrency(financing.remainingDebt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Zins</span>
                      <p className="font-medium">{financing.interestRate}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tilgung</span>
                      <p className="font-medium">{financing.repaymentRate}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Monatsrate</span>
                      <p className="font-medium text-emerald-600">{formatCurrency(financing.monthlyRate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Zinsbindung bis</span>
                      <p className="font-medium">{formatDate(financing.fixedInterestUntil || '')}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(financing)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Bearbeiten
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => {
                        setDeletingId(financing.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {store.financings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Finanzierungen</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihre erste Finanzierung hinzu</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neue Finanzierung
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Financing Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFinancing ? 'Finanzierung bearbeiten' : 'Neue Finanzierung'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Immobilie *</Label>
              <Select 
                value={formData.propertyId} 
                onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {store.properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bank *</Label>
              <Input 
                value={formData.bankName} 
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>
            <div>
              <Label>Darlehensnummer</Label>
              <Input 
                value={formData.loanNumber} 
                onChange={(e) => setFormData({ ...formData, loanNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Darlehensbetrag (€)</Label>
              <Input 
                type="number"
                value={formData.principalAmount} 
                onChange={(e) => setFormData({ ...formData, principalAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Zins (%)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.interestRate} 
                onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Tilgung (%)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.repaymentRate} 
                onChange={(e) => setFormData({ ...formData, repaymentRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Monatsrate (€)</Label>
              <Input 
                type="number"
                value={formData.monthlyRate} 
                onChange={(e) => setFormData({ ...formData, monthlyRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Restschuld (€)</Label>
              <Input 
                type="number"
                value={formData.remainingDebt} 
                onChange={(e) => setFormData({ ...formData, remainingDebt: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Laufzeit von</Label>
              <Input 
                type="date"
                value={formData.startDate} 
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Laufzeit bis</Label>
              <Input 
                type="date"
                value={formData.endDate} 
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Zinsbindung bis</Label>
              <Input 
                type="date"
                value={formData.fixedInterestUntil} 
                onChange={(e) => setFormData({ ...formData, fixedInterestUntil: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notizen</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finanzierung löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Finanzierung wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// DOCUMENTS SECTION
// ============================================
function DocumentsSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    name: '',
    type: 'other' as DocumentType,
    date: '',
    description: '',
    fileData: '',
    fileName: '',
    fileType: '',
    fileSize: 0,
  });

  const filteredDocuments = filterType === 'all' 
    ? store.documents 
    : store.documents.filter(d => d.type === filterType);

  const openNewDialog = () => {
    setEditingDocument(null);
    setFormData({
      propertyId: '',
      unitId: '',
      tenantId: '',
      name: '',
      type: 'other',
      date: new Date().toISOString().split('T')[0],
      description: '',
      fileData: '',
      fileName: '',
      fileType: '',
      fileSize: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      propertyId: document.propertyId || '',
      unitId: document.unitId || '',
      tenantId: document.tenantId || '',
      name: document.name,
      type: document.type,
      date: document.date,
      description: document.description,
      fileData: document.fileData,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
    });
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({
          ...formData,
          fileData: reader.result as string,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          name: formData.name || file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingDocument) {
      store.updateDocument(editingDocument.id, formData);
      toast.success('Dokument aktualisiert');
    } else {
      store.addDocument(formData);
      toast.success('Dokument hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      store.deleteDocument(deletingId);
      toast.success('Dokument gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleDownload = (doc: Document) => {
    if (doc.fileData) {
      const link = window.document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName;
      link.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dokumente</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neues Dokument
        </Button>
      </div>

      {/* Filter */}
      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Typ filtern" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Typen</SelectItem>
          {Object.entries(documentTypeLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{document.name}</CardTitle>
                  <CardDescription>{documentTypeLabels[document.type]}</CardDescription>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Datum: {formatDate(document.date)}</p>
                {document.fileName && <p>Datei: {document.fileName}</p>}
                {document.fileSize > 0 && <p>Größe: {formatFileSize(document.fileSize)}</p>}
                {document.description && <p className="text-gray-500">{document.description}</p>}
              </div>
              <Separator className="my-3" />
              <div className="flex gap-2">
                {document.fileData && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(document)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600"
                  onClick={() => {
                    setDeletingId(document.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Dokumente</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihr erstes Dokument hinzu</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neues Dokument
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Document Upload Section */}
      <Card className="border-dashed border-2 border-emerald-300 dark:border-emerald-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            KI-Dokumentenanalyse
          </CardTitle>
          <CardDescription>
            Laden Sie Kaufverträge, Mietverträge oder Kreditverträge hoch - die KI extrahiert automatisch alle relevanten Daten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    // Handle purchase contract upload
                    toast.info('Analysiere Kaufvertrag...');
                    // TODO: Call API for analysis
                  }
                };
                input.click();
              }}
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Kaufvertrag</p>
              <p className="text-sm text-muted-foreground">PDF oder Bild</p>
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    toast.info('Analysiere Mietvertrag...');
                    // TODO: Call API for analysis
                  }
                };
                input.click();
              }}
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
              <p className="font-medium">Mietvertrag</p>
              <p className="text-sm text-muted-foreground">PDF oder Bild</p>
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    toast.info('Analysiere Kreditvertrag...');
                    // TODO: Call API for analysis
                  }
                };
                input.click();
              }}
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-medium">Kreditvertrag</p>
              <p className="text-sm text-muted-foreground">PDF oder Bild</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-300">So funktioniert es:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-600 dark:text-blue-400">
                  <li>Klicken Sie auf den gewünschten Dokumenttyp</li>
                  <li>Wählen Sie die Datei aus (PDF, JPG, PNG)</li>
                  <li>Die KI analysiert das Dokument und extrahiert alle Daten</li>
                  <li>Überprüfen Sie die extrahierten Daten und speichern Sie</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDocument ? 'Dokument bearbeiten' : 'Neues Dokument'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Typ</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: DocumentType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Datum</Label>
              <Input 
                type="date"
                value={formData.date} 
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Immobilie</Label>
              <Select 
                value={formData.propertyId || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, propertyId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  {store.properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Datei</Label>
              <Input 
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
              />
              {formData.fileName && (
                <p className="text-sm text-gray-500 mt-1">
                  Aktuelle Datei: {formData.fileName}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie dieses Dokument wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// TASKS SECTION
// ============================================
function TasksSection() {
  const store = useStore();
  const { t, formatCurrency, formatDate } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    category: 'other' as Task['category'],
  });

  const filteredTasks = filterStatus === 'all' 
    ? store.tasks 
    : store.tasks.filter(t => t.status === filterStatus);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const openNewDialog = () => {
    setEditingTask(null);
    setFormData({
      propertyId: '',
      unitId: '',
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      category: 'other',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      propertyId: task.propertyId || '',
      unitId: task.unitId || '',
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      category: task.category,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.dueDate) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingTask) {
      store.updateTask(editingTask.id, {
        ...formData,
        completedAt: formData.status === 'completed' ? new Date().toISOString() : undefined,
      });
      toast.success('Aufgabe aktualisiert');
    } else {
      store.addTask(formData);
      toast.success('Aufgabe hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      store.deleteTask(deletingId);
      toast.success('Aufgabe gelöscht');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleComplete = (task: Task) => {
    store.updateTask(task.id, {
      status: task.status === 'completed' ? 'pending' : 'completed',
      completedAt: task.status === 'completed' ? undefined : new Date().toISOString(),
    });
  };

  const isOverdue = (task: Task) => {
    return task.status !== 'completed' && new Date(task.dueDate) < new Date();
  };

  const categoryLabelsTask: Record<string, string> = {
    rent_check: 'Mietprüfung',
    rent_increase: 'Mieterhöhung',
    maintenance: 'Wartung',
    deadline: 'Frist',
    inspection: 'Inspektion',
    other: 'Sonstiges',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Aufgaben</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Aufgabe
        </Button>
      </div>

      {/* Filter */}
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          {Object.entries(taskStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tasks List */}
      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const property = task.propertyId ? store.properties.find(p => p.id === task.propertyId) : null;
          
          return (
            <Card 
              key={task.id} 
              className={`${task.status === 'completed' ? 'opacity-60' : ''} ${isOverdue(task) ? 'border-red-300 bg-red-50' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`mt-1 ${task.status === 'completed' ? 'text-emerald-600' : ''}`}
                    onClick={() => handleToggleComplete(task)}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(task.dueDate)}
                            {isOverdue(task) && (
                              <Badge variant="destructive" className="ml-1">Überfällig</Badge>
                            )}
                          </span>
                          {property && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {property.name}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={priorityColors[task.priority]}>
                          {taskPriorityLabels[task.priority]}
                        </Badge>
                        <Badge className={statusColors[task.status]}>
                          {taskStatusLabels[task.status]}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(task)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            setDeletingId(task.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Aufgaben</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihre erste Aufgabe hinzu</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neue Aufgabe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Titel *</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priorität</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskPriorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategorie</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: Task['category']) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabelsTask).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fälligkeitsdatum *</Label>
                <Input 
                  type="date"
                  value={formData.dueDate} 
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Immobilie</Label>
              <Select 
                value={formData.propertyId || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, propertyId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  {store.properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Aufgabe wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// CALENDAR SECTION
// ============================================
function CalendarSection() {
  const store = useStore();
  const { t, formatDate } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Get all calendar events from tasks, tenant contracts, financing dates
  const calendarEvents = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      date: string;
      type: 'task' | 'contract' | 'financing' | 'payment';
      color: string;
      propertyId?: string;
    }> = [];
    
    // Tasks
    store.tasks.forEach(task => {
      if (task.dueDate && task.status !== 'completed') {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          date: task.dueDate,
          type: 'task',
          color: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f59e0b' : '#3b82f6',
          propertyId: task.propertyId,
        });
      }
    });
    
    // Tenant contracts
    store.tenants.forEach(tenant => {
      if (tenant.contractEndDate) {
        events.push({
          id: `contract-${tenant.id}`,
          title: `Vertrag endet: ${tenant.firstName} ${tenant.lastName}`,
          date: tenant.contractEndDate,
          type: 'contract',
          color: '#8b5cf6',
        });
      }
    });
    
    // Financing fixed interest dates
    store.financings.forEach(financing => {
      if (financing.fixedInterestUntil) {
        events.push({
          id: `financing-${financing.id}`,
          title: `Zinsbindung endet: ${financing.bankName}`,
          date: financing.fixedInterestUntil,
          type: 'financing',
          color: '#ec4899',
        });
      }
    });
    
    return events;
  }, [store.tasks, store.tenants, store.financings]);
  
  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; events: typeof calendarEvents }> = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        events: calendarEvents.filter(e => e.date === format(dayDate, 'yyyy-MM-dd')),
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        events: calendarEvents.filter(e => e.date === format(dayDate, 'yyyy-MM-dd')),
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const dayDate = new Date(year, month + 1, i);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        events: calendarEvents.filter(e => e.date === format(dayDate, 'yyyy-MM-dd')),
      });
    }
    
    return days;
  };
  
  const days = getDaysInMonth(currentDate);
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };
  
  const selectedDateEvents = selectedDate 
    ? calendarEvents.filter(e => e.date === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.calendar.title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            {t.calendar.today}
          </Button>
          <div className="flex items-center border rounded-lg">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 font-medium">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayIsToday = isToday(day.date);
                const dayIsSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd');
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      min-h-[80px] p-1 rounded-lg border text-left transition-colors
                      ${day.isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                      ${dayIsToday ? 'border-emerald-500 border-2' : 'border-gray-200 dark:border-gray-700'}
                      ${dayIsSelected ? 'ring-2 ring-blue-500' : ''}
                      hover:bg-gray-100 dark:hover:bg-gray-700
                    `}
                  >
                    <div className={`text-sm font-medium ${dayIsToday ? 'text-emerald-600' : ''} ${!day.isCurrentMonth ? 'text-gray-400' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {day.events.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="text-xs px-1 py-0.5 rounded truncate text-white"
                          style={{ backgroundColor: event.color }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 3 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{day.events.length - 3} weitere
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate 
                ? `${selectedDate.getDate()}. ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                : 'Tag auswählen'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">{t.calendar.noEvents}</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border-l-4"
                    style={{ borderColor: event.color, backgroundColor: `${event.color}10` }}
                  >
                    <div className="flex items-center gap-2">
                      {event.type === 'task' && <ClipboardList className="h-4 w-4" style={{ color: event.color }} />}
                      {event.type === 'contract' && <FileText className="h-4 w-4" style={{ color: event.color }} />}
                      {event.type === 'financing' && <CreditCard className="h-4 w-4" style={{ color: event.color }} />}
                      <span className="font-medium text-sm">{event.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anstehende Termine</CardTitle>
        </CardHeader>
        <CardContent>
          {calendarEvents
            .filter(e => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 10)
            .map(event => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                  <span className="text-sm">{event.title}</span>
                </div>
                <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
              </div>
            ))}
          {calendarEvents.filter(e => new Date(e.date) >= new Date()).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Keine anstehenden Termine</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// REPORTS SECTION
// ============================================
function ReportsSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Monthly cashflow data
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    return months.map((month, index) => {
      const monthTransactions = store.transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === selectedYear && date.getMonth() === index;
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      return { month, income, expenses, cashflow: income - expenses };
    });
  }, [store.transactions, selectedYear]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const expenses = store.transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const byCategory = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(byCategory).map(([category, amount]) => ({
      name: categoryLabels[category as TransactionCategory],
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [store.transactions]);

  // Property performance
  const propertyPerformance = useMemo(() => {
    return store.properties.map(p => {
      const units = store.units.filter(u => u.propertyId === p.id);
      const transactions = store.transactions.filter(t => t.propertyId === p.id);
      
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const financing = store.financings.find(f => f.propertyId === p.id);
      
      return {
        name: p.name,
        units: units.length,
        rented: units.filter(u => u.status === 'rented').length,
        marketValue: p.marketValue,
        purchasePrice: p.purchasePrice,
        income,
        expenses,
        cashflow: income - expenses,
        mortgage: financing?.remainingDebt || 0,
        yield: p.purchasePrice > 0 ? ((income - expenses) / p.purchasePrice) * 100 : 0,
      };
    });
  }, [store.properties, store.units, store.transactions, store.financings]);

  // Summary stats
  const summary = useMemo(() => {
    const totalMarketValue = store.properties.reduce((sum, p) => sum + p.marketValue, 0);
    const totalPurchasePrice = store.properties.reduce((sum, p) => sum + p.purchasePrice, 0);
    const totalMortgage = store.financings.reduce((sum, f) => sum + f.remainingDebt, 0);
    const totalIncome = store.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = store.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalMarketValue,
      totalPurchasePrice,
      totalMortgage,
      equity: totalMarketValue - totalMortgage,
      totalIncome,
      totalExpenses,
      cashflow: totalIncome - totalExpenses,
      avgYield: totalPurchasePrice > 0 ? ((totalIncome - totalExpenses) / totalPurchasePrice) * 100 : 0,
    };
  }, [store.properties, store.financings, store.transactions]);

  const years = useMemo(() => {
    const allYears = store.transactions.map(t => new Date(t.date).getFullYear());
    const uniqueYears = [...new Set(allYears)].sort((a, b) => b - a);
    return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()];
  }, [store.transactions]);

  // PDF Export Functions
  const generateFinancialReportPDF = () => {
    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bucki - Finanzbericht ${selectedYear}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .summary-card { background: #f9fafb; padding: 20px; border-radius: 8px; }
    .summary-card h3 { margin: 0 0 10px; color: #6b7280; font-size: 14px; }
    .summary-card .value { font-size: 24px; font-weight: bold; color: #111827; }
    .positive { color: #10b981 !important; }
    .negative { color: #ef4444 !important; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Bucki - Finanzbericht ${selectedYear}</h1>
  <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
  
  <h2>Zusammenfassung</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <h3>Portfolio-Wert</h3>
      <div class="value">${formatCurrency(summary.totalMarketValue)}</div>
    </div>
    <div class="summary-card">
      <h3>Eigenkapital</h3>
      <div class="value">${formatCurrency(summary.equity)}</div>
    </div>
    <div class="summary-card">
      <h3>Jahres-Cashflow</h3>
      <div class="value ${summary.cashflow >= 0 ? 'positive' : 'negative'}">${formatCurrency(summary.cashflow)}</div>
    </div>
    <div class="summary-card">
      <h3>Durchschnittsrendite</h3>
      <div class="value">${summary.avgYield.toFixed(2)}%</div>
    </div>
  </div>
  
  <h2>Monatlicher Cashflow</h2>
  <table>
    <thead>
      <tr>
        <th>Monat</th>
        <th>Einnahmen</th>
        <th>Ausgaben</th>
        <th>Cashflow</th>
      </tr>
    </thead>
    <tbody>
      ${monthlyData.map(m => `
        <tr>
          <td>${m.month}</td>
          <td>${formatCurrency(m.income)}</td>
          <td>${formatCurrency(m.expenses)}</td>
          <td class="${m.cashflow >= 0 ? 'positive' : 'negative'}">${formatCurrency(m.cashflow)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Ausgaben nach Kategorie</h2>
  <table>
    <thead>
      <tr>
        <th>Kategorie</th>
        <th>Betrag</th>
        <th>Anteil</th>
      </tr>
    </thead>
    <tbody>
      ${categoryData.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${formatCurrency(c.amount)}</td>
          <td>${c.percentage.toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Immobilien-Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Immobilie</th>
        <th>Einheiten</th>
        <th>Marktwert</th>
        <th>Einnahmen</th>
        <th>Ausgaben</th>
        <th>Cashflow</th>
        <th>Rendite</th>
      </tr>
    </thead>
    <tbody>
      ${propertyPerformance.map(p => `
        <tr>
          <td>${p.name}</td>
          <td>${p.rented}/${p.units}</td>
          <td>${formatCurrency(p.marketValue)}</td>
          <td>${formatCurrency(p.income)}</td>
          <td>${formatCurrency(p.expenses)}</td>
          <td class="${p.cashflow >= 0 ? 'positive' : 'negative'}">${formatCurrency(p.cashflow)}</td>
          <td>${p.yield.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Dieser Bericht wurde automatisch von Bucki generiert.</p>
    <p>Bucki - Immobilien-Verwaltung v2.0.0</p>
  </div>
</body>
</html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    toast.success('PDF-Bericht erstellt');
  };

  const generateTenantListPDF = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bucki - Mieterliste</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Bucki - Mieterliste</h1>
  <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
  
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Einheit</th>
        <th>E-Mail</th>
        <th>Telefon</th>
        <th>Einzug</th>
        <th>Kaution</th>
      </tr>
    </thead>
    <tbody>
      ${store.tenants.map(t => {
        const unit = store.units.find(u => u.id === t.unitId);
        const property = unit ? store.properties.find(p => p.id === unit.propertyId) : null;
        return `
          <tr>
            <td>${t.firstName} ${t.lastName}</td>
            <td>${property?.name || '-'} ${unit?.unitNumber || ''}</td>
            <td>${t.email || '-'}</td>
            <td>${t.phone || '-'}</td>
            <td>${t.moveInDate}</td>
            <td>${formatCurrency(t.deposit)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Bucki - Immobilien-Verwaltung v2.0.0</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    toast.success('Mieterliste exportiert');
  };

  const generatePropertyOverviewPDF = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bucki - Immobilien-Übersicht</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .property-card { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .property-card h3 { margin: 0 0 15px; color: #111827; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .info-item { }
    .info-item label { color: #6b7280; font-size: 12px; display: block; }
    .info-item .value { font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Bucki - Immobilien-Übersicht</h1>
  <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
  
  <h2>Portfolio-Zusammenfassung</h2>
  <div class="info-grid">
    <div class="info-item">
      <label>Anzahl Immobilien</label>
      <div class="value">${store.properties.length}</div>
    </div>
    <div class="info-item">
      <label>Gesamtfläche</label>
      <div class="value">${store.properties.reduce((sum, p) => sum + p.totalArea, 0)} m²</div>
    </div>
    <div class="info-item">
      <label>Gesamtwert</label>
      <div class="value">${formatCurrency(summary.totalMarketValue)}</div>
    </div>
  </div>
  
  ${store.properties.map(p => {
    const units = store.units.filter(u => u.propertyId === p.id);
    return `
      <div class="property-card">
        <h3>${p.name}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Adresse</label>
            <div class="value">${p.address}, ${p.postalCode} ${p.city}</div>
          </div>
          <div class="info-item">
            <label>Kaufpreis</label>
            <div class="value">${formatCurrency(p.purchasePrice)}</div>
          </div>
          <div class="info-item">
            <label>Marktwert</label>
            <div class="value">${formatCurrency(p.marketValue)}</div>
          </div>
          <div class="info-item">
            <label>Einheiten</label>
            <div class="value">${units.length} (${units.filter(u => u.status === 'rented').length} vermietet)</div>
          </div>
          <div class="info-item">
            <label>Fläche</label>
            <div class="value">${p.totalArea} m²</div>
          </div>
          <div class="info-item">
            <label>Baujahr</label>
            <div class="value">${p.yearBuilt}</div>
          </div>
        </div>
      </div>
    `;
  }).join('')}
  
  <div class="footer">
    <p>Bucki - Immobilien-Verwaltung v2.0.0</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    toast.success('Immobilien-Übersicht exportiert');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Auswertungen</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                PDF Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={generateFinancialReportPDF}>
                <BarChart2 className="h-4 w-4 mr-2" />
                Finanzbericht
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generateTenantListPDF}>
                <Users className="h-4 w-4 mr-2" />
                Mieterliste
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generatePropertyOverviewPDF}>
                <Building2 className="h-4 w-4 mr-2" />
                Immobilien-Übersicht
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio-Wert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalMarketValue)}</div>
            <p className="text-sm text-muted-foreground">Eigenkapital: {formatCurrency(summary.equity)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jahres-Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.cashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(summary.cashflow)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Durchschnittsrendite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgYield.toFixed(2)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vermietungsquote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {store.units.length > 0 
                ? Math.round((store.units.filter(u => u.status === 'rented').length / store.units.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Monatlicher Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" name="Einnahmen" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" name="Ausgaben" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="cashflow" name="Cashflow" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Ausgaben nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Immobilien-Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Immobilie</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Einheiten</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Marktwert</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Einnahmen</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Ausgaben</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Cashflow</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Rendite</th>
                </tr>
              </thead>
              <tbody>
                {propertyPerformance.map((p, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 font-medium">{p.name}</td>
                    <td className="p-4 text-right">{p.rented}/{p.units}</td>
                    <td className="p-4 text-right">{formatCurrency(p.marketValue)}</td>
                    <td className="p-4 text-right text-emerald-600">{formatCurrency(p.income)}</td>
                    <td className="p-4 text-right text-red-600">{formatCurrency(p.expenses)}</td>
                    <td className={`p-4 text-right font-medium ${p.cashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(p.cashflow)}
                    </td>
                    <td className="p-4 text-right font-medium">{p.yield.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// DEPRECIATION SECTION (Abschreibungen)
// ============================================
function DepreciationSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<DepreciationCategory | 'all'>('all');
  
  // Legacy formData für Gebäude-AfA
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    name: '',
    purchasePrice: 0,
    buildingShare: 0,
    landShare: 0,
    depreciationRate: 2.5,
    startDate: '',
    endDate: '',
    annualDepreciation: 0,
    monthlyDepreciation: 0,
    accumulatedDepreciation: 0,
    remainingValue: 0,
    type: 'linear' as 'linear' | 'degressive',
    notes: '',
  });
  
  // Neues formData für detaillierte Abschreibungspositionen
  const [itemFormData, setItemFormData] = useState({
    propertyId: '',
    unitId: '',
    name: '',
    category: 'gebaeude' as DepreciationCategory,
    purchaseValue: 0,
    depreciationRate: 2.5,
    depreciationYears: 40,
    startDate: new Date().toISOString().split('T')[0],
    annualDepreciation: 0,
    monthlyDepreciation: 0,
    accumulatedDepreciation: 0,
    remainingValue: 0,
    notes: '',
  });

  // Calculate depreciation automatically
  const calculateDepreciation = (value: number, rate: number) => {
    const annual = value * (rate / 100);
    const monthly = annual / 12;
    return { annual, monthly };
  };

  // Gefilterte Abschreibungspositionen
  const filteredItems = useMemo(() => {
    return store.depreciationItems.filter(item => {
      if (filterProperty !== 'all' && item.propertyId !== filterProperty) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      return true;
    });
  }, [store.depreciationItems, filterProperty, filterCategory]);

  // Summary stats für beide Systeme
  const totalAnnualDepreciation = store.depreciations.reduce((sum, d) => sum + d.annualDepreciation, 0);
  const totalMonthlyDepreciation = store.depreciationItems.reduce((sum, d) => sum + d.monthlyDepreciation, 0);
  const totalAnnualItems = store.depreciationItems.reduce((sum, d) => sum + d.annualDepreciation, 0);
  const totalAccumulated = store.depreciationItems.reduce((sum, d) => sum + d.accumulatedDepreciation, 0);
  const totalRemaining = store.depreciationItems.reduce((sum, d) => sum + d.remainingValue, 0);

  // Nach Kategorien gruppiert
  const depreciationByCategory = useMemo(() => {
    const grouped: Record<DepreciationCategory, { count: number; monthly: number; annual: number }> = {
      gebaeude: { count: 0, monthly: 0, annual: 0 },
      moebel: { count: 0, monthly: 0, annual: 0 },
      kueche: { count: 0, monthly: 0, annual: 0 },
      elektro: { count: 0, monthly: 0, annual: 0 },
      inventar: { count: 0, monthly: 0, annual: 0 },
      ausstattung: { count: 0, monthly: 0, annual: 0 },
      sonstiges: { count: 0, monthly: 0, annual: 0 },
    };
    store.depreciationItems.forEach(item => {
      grouped[item.category].count++;
      grouped[item.category].monthly += item.monthlyDepreciation;
      grouped[item.category].annual += item.annualDepreciation;
    });
    return grouped;
  }, [store.depreciationItems]);

  const openNewItemDialog = () => {
    setEditingItemId(null);
    setItemFormData({
      propertyId: store.properties[0]?.id || '',
      unitId: '',
      name: '',
      category: 'gebaeude',
      purchaseValue: 0,
      depreciationRate: 2.5,
      depreciationYears: 40,
      startDate: new Date().toISOString().split('T')[0],
      annualDepreciation: 0,
      monthlyDepreciation: 0,
      accumulatedDepreciation: 0,
      remainingValue: 0,
      notes: '',
    });
    setItemDialogOpen(true);
  };

  const openEditItemDialog = (item: DepreciationItem) => {
    setEditingItemId(item.id);
    setItemFormData({
      propertyId: item.propertyId,
      unitId: item.unitId || '',
      name: item.name,
      category: item.category,
      purchaseValue: item.purchaseValue,
      depreciationRate: item.depreciationRate,
      depreciationYears: item.depreciationYears,
      startDate: item.startDate,
      annualDepreciation: item.annualDepreciation,
      monthlyDepreciation: item.monthlyDepreciation,
      accumulatedDepreciation: item.accumulatedDepreciation,
      remainingValue: item.remainingValue,
      notes: item.notes,
    });
    setItemDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!itemFormData.name || !itemFormData.propertyId) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    const { annual, monthly } = calculateDepreciation(itemFormData.purchaseValue, itemFormData.depreciationRate);
    const remaining = itemFormData.purchaseValue - itemFormData.accumulatedDepreciation;

    if (editingItemId) {
      store.updateDepreciationItem(editingItemId, {
        ...itemFormData,
        annualDepreciation: annual,
        monthlyDepreciation: monthly,
        remainingValue: remaining,
      });
      toast.success('Abschreibungsposition aktualisiert');
    } else {
      store.addDepreciationItem({
        ...itemFormData,
        annualDepreciation: annual,
        monthlyDepreciation: monthly,
        remainingValue: itemFormData.purchaseValue,
      });
      toast.success('Abschreibungsposition hinzugefügt');
    }
    setItemDialogOpen(false);
  };

  const getPropertyName = (propertyId: string) => {
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Abschreibungen</h1>
        <Button onClick={openNewItemDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Position
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Jährliche AfA (alle)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAnnualItems)}</div>
            <p className="text-xs text-gray-500 mt-1">pro Jahr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monatliche AfA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyDepreciation)}</div>
            <p className="text-xs text-gray-500 mt-1">pro Monat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bisher abgeschrieben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalAccumulated)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Restbuchwert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRemaining)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kategorien-Übersicht */}
      <Card>
        <CardHeader>
          <CardTitle>Abschreibungen nach Kategorien</CardTitle>
          <CardDescription>Aufteilung nach Art des Wirtschaftsguts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {(Object.entries(depreciationByCategory) as [DepreciationCategory, { count: number; monthly: number; annual: number }][]).map(([category, data]) => (
              <div 
                key={category} 
                className={`text-center p-3 rounded-lg cursor-pointer transition-colors ${
                  filterCategory === category ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setFilterCategory(filterCategory === category ? 'all' : category)}
              >
                <Badge className={depreciationCategoryColors[category] + ' mb-2'}>
                  {depreciationCategoryLabels[category]}
                </Badge>
                <div className="text-lg font-bold">{formatCurrency(data.monthly)}</div>
                <p className="text-xs text-gray-500">{data.count} Positionen</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Immobilie filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Immobilien</SelectItem>
            {store.properties.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterCategory !== 'all' && (
          <Button variant="outline" onClick={() => setFilterCategory('all')}>
            Filter entfernen
          </Button>
        )}
      </div>

      {/* Abschreibungspositionen Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Detaillierte Abschreibungspositionen</CardTitle>
          <CardDescription>Individuelle Abschreibungen pro Wirtschaftsgut</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Bezeichnung</th>
                  <th className="text-left p-4 font-medium text-gray-600">Kategorie</th>
                  <th className="text-left p-4 font-medium text-gray-600">Immobilie</th>
                  <th className="text-right p-4 font-medium text-gray-600">Anschaffung</th>
                  <th className="text-right p-4 font-medium text-gray-600">AfA-Satz</th>
                  <th className="text-right p-4 font-medium text-gray-600">Jahre</th>
                  <th className="text-right p-4 font-medium text-gray-600">Monatl. AfA</th>
                  <th className="text-right p-4 font-medium text-gray-600">Bisher</th>
                  <th className="text-right p-4 font-medium text-gray-600">Restwert</th>
                  <th className="text-right p-4 font-medium text-gray-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4">
                        <Badge className={depreciationCategoryColors[item.category]}>
                          {depreciationCategoryLabels[item.category]}
                        </Badge>
                      </td>
                      <td className="p-4">{getPropertyName(item.propertyId)}</td>
                      <td className="p-4 text-right">{formatCurrency(item.purchaseValue)}</td>
                      <td className="p-4 text-right">{item.depreciationRate}%</td>
                      <td className="p-4 text-right">{item.depreciationYears}</td>
                      <td className="p-4 text-right">{formatCurrency(item.monthlyDepreciation)}</td>
                      <td className="p-4 text-right text-emerald-600">{formatCurrency(item.accumulatedDepreciation)}</td>
                      <td className="p-4 text-right text-blue-600">{formatCurrency(item.remainingValue)}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEditItemDialog(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => store.deleteDepreciationItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Keine Abschreibungspositionen gefunden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog für neue Abschreibungspositionen */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItemId ? 'Position bearbeiten' : 'Neue Abschreibungsposition'}</DialogTitle>
            <DialogDescription>
              Erfassen Sie alle abschreibbaren Wirtschaftsgüter (Gebäude, Möbel, Inventar, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Bezeichnung *</Label>
              <Input 
                value={itemFormData.name} 
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                placeholder="z.B. Einbauküche, Möbel, Markise"
              />
            </div>
            <div>
              <Label>Kategorie *</Label>
              <Select 
                value={itemFormData.category} 
                onValueChange={(value: DepreciationCategory) => setItemFormData({ ...itemFormData, category: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(depreciationCategoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Immobilie *</Label>
              <Select 
                value={itemFormData.propertyId} 
                onValueChange={(v) => setItemFormData({ ...itemFormData, propertyId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  {store.properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Einheit (optional)</Label>
              <Select 
                value={itemFormData.unitId || 'none'} 
                onValueChange={(v) => setItemFormData({ ...itemFormData, unitId: v === 'none' ? '' : v })}
              >
                <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  {store.units
                    .filter(u => u.propertyId === itemFormData.propertyId)
                    .map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Anschaffungswert (€) *</Label>
              <Input 
                type="number" 
                value={itemFormData.purchaseValue} 
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const { annual, monthly } = calculateDepreciation(value, itemFormData.depreciationRate);
                  setItemFormData({ 
                    ...itemFormData, 
                    purchaseValue: value,
                    annualDepreciation: annual,
                    monthlyDepreciation: monthly,
                    remainingValue: value - itemFormData.accumulatedDepreciation,
                  });
                }}
              />
            </div>
            <div>
              <Label>Abschreibungssatz (%) *</Label>
              <Input 
                type="number" 
                step="0.1"
                value={itemFormData.depreciationRate} 
                onChange={(e) => {
                  const rate = parseFloat(e.target.value) || 0;
                  const { annual, monthly } = calculateDepreciation(itemFormData.purchaseValue, rate);
                  setItemFormData({ 
                    ...itemFormData, 
                    depreciationRate: rate,
                    annualDepreciation: annual,
                    monthlyDepreciation: monthly,
                  });
                }}
              />
            </div>
            <div>
              <Label>Abschreibungsdauer (Jahre)</Label>
              <Input 
                type="number" 
                value={itemFormData.depreciationYears} 
                onChange={(e) => setItemFormData({ ...itemFormData, depreciationYears: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Startdatum</Label>
              <Input 
                type="date" 
                value={itemFormData.startDate} 
                onChange={(e) => setItemFormData({ ...itemFormData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Bereits abgeschrieben (€)</Label>
              <Input 
                type="number" 
                value={itemFormData.accumulatedDepreciation} 
                onChange={(e) => {
                  const acc = parseFloat(e.target.value) || 0;
                  setItemFormData({ 
                    ...itemFormData, 
                    accumulatedDepreciation: acc,
                    remainingValue: itemFormData.purchaseValue - acc,
                  });
                }}
              />
            </div>
            <div>
              <Label>Berechnete Monats-AfA</Label>
              <div className="text-lg font-bold text-indigo-600 py-2">
                {formatCurrency(itemFormData.monthlyDepreciation)}
              </div>
            </div>
            <div className="col-span-2">
              <Label>Notizen</Label>
              <Textarea 
                value={itemFormData.notes} 
                onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSaveItem} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// HOUSE MONEY SECTION (Hausgelder)
// ============================================
function HouseMoneySection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    month: new Date().toISOString().slice(0, 7),
    totalAmount: 0,
    maintenanceReserve: 0,
    administrativeFee: 0,
    utilities: 0,
    water: 0,
    heating: 0,
    garbage: 0,
    insurance: 0,
    other: 0,
    paymentStatus: 'pending' as 'paid' | 'pending' | 'overdue',
    paymentDate: '',
    notes: '',
  });

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({
      propertyId: store.properties[0]?.id || '',
      unitId: '',
      month: new Date().toISOString().slice(0, 7),
      totalAmount: 0,
      maintenanceReserve: 0,
      administrativeFee: 0,
      utilities: 0,
      water: 0,
      heating: 0,
      garbage: 0,
      insurance: 0,
      other: 0,
      paymentStatus: 'pending',
      paymentDate: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (hm: typeof store.houseMoney[0]) => {
    setEditingId(hm.id);
    setFormData({
      propertyId: hm.propertyId,
      unitId: hm.unitId || '',
      month: hm.month,
      totalAmount: hm.totalAmount,
      maintenanceReserve: hm.maintenanceReserve,
      administrativeFee: hm.administrativeFee,
      utilities: hm.utilities,
      water: hm.water,
      heating: hm.heating,
      garbage: hm.garbage,
      insurance: hm.insurance,
      other: hm.other,
      paymentStatus: hm.paymentStatus,
      paymentDate: hm.paymentDate || '',
      notes: hm.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.propertyId || !formData.month) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    const total = formData.maintenanceReserve + formData.administrativeFee + formData.utilities + 
                  formData.water + formData.heating + formData.garbage + formData.insurance + formData.other;

    if (editingId) {
      store.updateHouseMoney(editingId, { ...formData, totalAmount: total });
      toast.success('Hausgeld aktualisiert');
    } else {
      store.addHouseMoney({ ...formData, totalAmount: total });
      toast.success('Hausgeld hinzugefügt');
    }
    setDialogOpen(false);
  };

  // Summary
  const filteredHouseMoney = store.houseMoney.filter(hm => hm.month.startsWith(filterMonth.split('-')[0]));
  const totalHouseMoney = filteredHouseMoney.reduce((sum, hm) => sum + hm.totalAmount, 0);
  const paidHouseMoney = filteredHouseMoney.filter(hm => hm.paymentStatus === 'paid').reduce((sum, hm) => sum + hm.totalAmount, 0);
  const pendingHouseMoney = filteredHouseMoney.filter(hm => hm.paymentStatus === 'pending').reduce((sum, hm) => sum + hm.totalAmount, 0);

  const statusColors = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    paid: 'Bezahlt',
    pending: 'Offen',
    overdue: 'Überfällig',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Hausgelder</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neues Hausgeld
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gesamt Hausgeld</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalHouseMoney)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bezahlt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(paidHouseMoney)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Offen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingHouseMoney)}</div>
          </CardContent>
        </Card>
      </div>

      {/* House Money Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hausgeld-Übersicht</CardTitle>
          <CardDescription>Nebenkostenabrechnungen und Vorauszahlungen</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Monat</th>
                  <th className="text-left p-4 font-medium text-gray-600">Einheit</th>
                  <th className="text-right p-4 font-medium text-gray-600">Gesamt</th>
                  <th className="text-right p-4 font-medium text-gray-600">Rücklage</th>
                  <th className="text-right p-4 font-medium text-gray-600">Verwaltung</th>
                  <th className="text-right p-4 font-medium text-gray-600">Betriebskosten</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-right p-4 font-medium text-gray-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {store.houseMoney.map((hm) => {
                  const property = store.properties.find(p => p.id === hm.propertyId);
                  const unit = store.units.find(u => u.id === hm.unitId);
                  return (
                    <tr key={hm.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{hm.month}</td>
                      <td className="p-4">{property?.name} {unit ? `- ${unit.unitNumber}` : ''}</td>
                      <td className="p-4 text-right">{formatCurrency(hm.totalAmount)}</td>
                      <td className="p-4 text-right">{formatCurrency(hm.maintenanceReserve)}</td>
                      <td className="p-4 text-right">{formatCurrency(hm.administrativeFee)}</td>
                      <td className="p-4 text-right">{formatCurrency(hm.utilities + hm.water + hm.heating + hm.garbage)}</td>
                      <td className="p-4">
                        <Badge className={statusColors[hm.paymentStatus]}>{statusLabels[hm.paymentStatus]}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(hm)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => store.deleteHouseMoney(hm.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {store.houseMoney.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Keine Hausgelder erfasst
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Hausgeld bearbeiten' : 'Neues Hausgeld'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Immobilie *</Label>
              <Select value={formData.propertyId} onValueChange={(v) => setFormData({ ...formData, propertyId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {store.properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monat *</Label>
              <Input type="month" value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} />
            </div>
            <div>
              <Label>Instandhaltungsrücklage (€)</Label>
              <Input type="number" value={formData.maintenanceReserve} onChange={(e) => setFormData({ ...formData, maintenanceReserve: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Verwaltungskostenbeitrag (€)</Label>
              <Input type="number" value={formData.administrativeFee} onChange={(e) => setFormData({ ...formData, administrativeFee: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Betriebskosten (€)</Label>
              <Input type="number" value={formData.utilities} onChange={(e) => setFormData({ ...formData, utilities: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Wasser (€)</Label>
              <Input type="number" value={formData.water} onChange={(e) => setFormData({ ...formData, water: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Heizung (€)</Label>
              <Input type="number" value={formData.heating} onChange={(e) => setFormData({ ...formData, heating: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Müll (€)</Label>
              <Input type="number" value={formData.garbage} onChange={(e) => setFormData({ ...formData, garbage: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Versicherung (€)</Label>
              <Input type="number" value={formData.insurance} onChange={(e) => setFormData({ ...formData, insurance: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.paymentStatus} onValueChange={(v: 'paid' | 'pending' | 'overdue') => setFormData({ ...formData, paymentStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Offen</SelectItem>
                  <SelectItem value="paid">Bezahlt</SelectItem>
                  <SelectItem value="overdue">Überfällig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Notizen</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// PAYMENTS SECTION (Zahlungstracking)
// ============================================
function PaymentsSection() {
  const store = useStore();
  const { formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'late' | 'partial'>('all');
  const [formData, setFormData] = useState({
    tenantId: '',
    unitId: '',
    propertyId: '',
    expectedAmount: 0,
    receivedAmount: 0,
    expectedDate: '',
    receivedDate: '',
    status: 'pending' as 'pending' | 'partial' | 'paid' | 'late' | 'waived',
    paymentType: 'rent' as 'rent' | 'deposit' | 'utility' | 'other',
    month: new Date().toISOString().slice(0, 7),
    lateFee: 0,
    discount: 0,
    notes: '',
    reminderSent: false,
  });

  const filteredPayments = useMemo(() => {
    return store.payments.filter(p => {
      const matchesMonth = p.month === filterMonth;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesMonth && matchesStatus;
    });
  }, [store.payments, filterMonth, filterStatus]);

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({
      tenantId: '',
      unitId: '',
      propertyId: store.properties[0]?.id || '',
      expectedAmount: 0,
      receivedAmount: 0,
      expectedDate: `${filterMonth}-03`,
      receivedDate: '',
      status: 'pending',
      paymentType: 'rent',
      month: filterMonth,
      lateFee: 0,
      discount: 0,
      notes: '',
      reminderSent: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (payment: typeof store.payments[0]) => {
    setEditingId(payment.id);
    setFormData({
      tenantId: payment.tenantId,
      unitId: payment.unitId,
      propertyId: payment.propertyId,
      expectedAmount: payment.expectedAmount,
      receivedAmount: payment.receivedAmount,
      expectedDate: payment.expectedDate,
      receivedDate: payment.receivedDate || '',
      status: payment.status,
      paymentType: payment.paymentType,
      month: payment.month,
      lateFee: payment.lateFee || 0,
      discount: payment.discount || 0,
      notes: payment.notes,
      reminderSent: payment.reminderSent || false,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.propertyId || !formData.tenantId || !formData.month) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingId) {
      store.updatePayment(editingId, formData);
      toast.success('Zahlung aktualisiert');
    } else {
      store.addPayment(formData);
      toast.success('Zahlung hinzugefügt');
    }
    setDialogOpen(false);
  };

  const handleMarkAsPaid = (payment: typeof store.payments[0]) => {
    store.updatePayment(payment.id, {
      status: 'paid',
      receivedAmount: payment.expectedAmount,
      receivedDate: new Date().toISOString().split('T')[0],
    });
    toast.success('Zahlung als bezahlt markiert');
  };

  const handleSendReminder = (payment: typeof store.payments[0]) => {
    store.updatePayment(payment.id, {
      reminderSent: true,
      reminderDate: new Date().toISOString().split('T')[0],
    });
    toast.success('Zahlungserinnerung gesendet');
  };

  const generateMonthlyPayments = () => {
    store.generateMonthlyPayments(filterMonth);
  };

  const getTenantName = (tenantId: string) => {
    const tenant = store.tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unbekannt';
  };

  const getUnitName = (unitId: string) => {
    const unit = store.units.find(u => u.id === unitId);
    const property = unit ? store.properties.find(p => p.id === unit.propertyId) : null;
    return unit ? `${property?.name || ''} - ${unit.unitNumber}` : 'Unbekannt';
  };

  const paymentStats = useMemo(() => {
    const monthPayments = store.payments.filter(p => p.month === filterMonth);
    const total = monthPayments.reduce((sum, p) => sum + p.expectedAmount, 0);
    const received = monthPayments.reduce((sum, p) => sum + p.receivedAmount, 0);
    const pending = monthPayments.filter(p => p.status === 'pending').length;
    const late = monthPayments.filter(p => p.status === 'late').length;
    return { total, received, pending, late };
  }, [store.payments, filterMonth]);

  const statusLabels = {
    pending: 'Offen',
    partial: 'Teilzahlung',
    paid: 'Bezahlt',
    late: 'Überfällig',
    waived: 'Erlassen',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    late: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    waived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  const paymentTypeLabels = {
    rent: 'Miete',
    deposit: 'Kaution',
    utility: 'Nebenkosten',
    other: 'Sonstiges',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Zahlungstracking</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateMonthlyPayments}>
            <RefreshCw className="h-4 w-4 mr-2" /> Zahlungen generieren
          </Button>
          <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Neue Zahlung
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Erwartete Zahlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paymentStats.total)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Erhaltene Zahlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(paymentStats.received)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offene Zahlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{paymentStats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Überfällige Zahlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{paymentStats.late}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label>Monat:</Label>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="pending">Offen</SelectItem>
                  <SelectItem value="paid">Bezahlt</SelectItem>
                  <SelectItem value="late">Überfällig</SelectItem>
                  <SelectItem value="partial">Teilzahlung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Zahlungen für {filterMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mieter</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Einheit</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Typ</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Erwartet</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Erhalten</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fällig</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{getTenantName(payment.tenantId)}</td>
                    <td className="py-3 px-4">{getUnitName(payment.unitId)}</td>
                    <td className="py-3 px-4">{paymentTypeLabels[payment.paymentType]}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(payment.expectedAmount)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(payment.receivedAmount)}</td>
                    <td className="py-3 px-4">{payment.expectedDate}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[payment.status]}>{statusLabels[payment.status]}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        {payment.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(payment)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSendReminder(payment)}>
                              <Bell className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(payment)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => store.deletePayment(payment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                Keine Zahlungen für diesen Monat gefunden
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Zahlung bearbeiten' : 'Neue Zahlung'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Immobilie *</Label>
                <Select value={formData.propertyId} onValueChange={(v) => {
                  setFormData({ ...formData, propertyId: v, unitId: '', tenantId: '' });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {store.properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Einheit *</Label>
                <Select value={formData.unitId} onValueChange={(v) => {
                  const unit = store.units.find(u => u.id === v);
                  const tenant = store.tenants.find(t => t.unitId === v);
                  setFormData({ 
                    ...formData, 
                    unitId: v, 
                    tenantId: tenant?.id || '',
                    expectedAmount: unit?.totalRent || 0,
                  });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {store.units.filter(u => u.propertyId === formData.propertyId).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monat *</Label>
                <Input type="month" value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} />
              </div>
              <div>
                <Label>Typ</Label>
                <Select value={formData.paymentType} onValueChange={(v: any) => setFormData({ ...formData, paymentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Miete</SelectItem>
                    <SelectItem value="deposit">Kaution</SelectItem>
                    <SelectItem value="utility">Nebenkosten</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Erwarteter Betrag (€)</Label>
                <Input type="number" value={formData.expectedAmount} onChange={(e) => setFormData({ ...formData, expectedAmount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Erhaltener Betrag (€)</Label>
                <Input type="number" value={formData.receivedAmount} onChange={(e) => setFormData({ ...formData, receivedAmount: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fälligkeitsdatum</Label>
                <Input type="date" value={formData.expectedDate} onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })} />
              </div>
              <div>
                <Label>Zahlungseingang</Label>
                <Input type="date" value={formData.receivedDate} onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Offen</SelectItem>
                  <SelectItem value="partial">Teilzahlung</SelectItem>
                  <SelectItem value="paid">Bezahlt</SelectItem>
                  <SelectItem value="late">Überfällig</SelectItem>
                  <SelectItem value="waived">Erlassen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notizen</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// DUNNING SECTION (Mahnwesen)
// ============================================
function DunningSection() {
  const store = useStore();
  const { formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedDunning, setSelectedDunning] = useState<DunningLetter | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | DunningStatus>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | DunningLevel>('all');
  const [formData, setFormData] = useState({
    paymentId: '',
    tenantId: '',
    level: 'first' as DunningLevel,
    status: 'pending' as DunningStatus,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    originalAmount: 0,
    lateFee: 0,
    totalAmount: 0,
    sentVia: 'email' as 'email' | 'mail' | 'both',
    notes: '',
  });

  // Get overdue payments that don't have a dunning letter yet
  const overduePayments = useMemo(() => {
    return store.payments.filter(p => 
      p.status === 'late' || (p.status === 'pending' && new Date(p.expectedDate) < new Date())
    );
  }, [store.payments]);

  const filteredDunnings = useMemo(() => {
    return store.dunningLetters.filter(d => {
      const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
      const matchesLevel = filterLevel === 'all' || d.level === filterLevel;
      return matchesStatus && matchesLevel;
    });
  }, [store.dunningLetters, filterStatus, filterLevel]);

  const openNewDialog = (paymentId?: string) => {
    const payment = paymentId ? store.payments.find(p => p.id === paymentId) : null;
    setFormData({
      paymentId: paymentId || '',
      tenantId: payment?.tenantId || '',
      level: 'first',
      status: 'pending',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      originalAmount: payment?.expectedAmount || 0,
      lateFee: payment ? Math.round(payment.expectedAmount * 0.015 * 100) / 100 : 0,
      totalAmount: payment ? payment.expectedAmount + Math.round(payment.expectedAmount * 0.015 * 100) / 100 : 0,
      sentVia: 'email',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.paymentId || !formData.tenantId) {
      toast.error('Bitte wählen Sie eine Zahlung und einen Mieter aus');
      return;
    }

    store.addDunningLetter(formData);
    toast.success('Mahnung erstellt');
    setDialogOpen(false);
  };

  const handleGenerateDunning = (paymentId: string, level: DunningLevel) => {
    const result = store.generateDunningLetter(paymentId, level);
    if (result) {
      toast.success(`${level === 'first' ? 'Erste' : level === 'second' ? 'Zweite' : level === 'third' ? 'Dritte' : 'Letzte'} Mahnung erstellt`);
    } else {
      toast.error('Fehler beim Erstellen der Mahnung');
    }
  };

  const handleUpdateStatus = (id: string, status: DunningStatus) => {
    store.updateDunningLetter(id, { status });
    toast.success('Status aktualisiert');
  };

  const getTenantName = (tenantId: string) => {
    const tenant = store.tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unbekannt';
  };

  const levelLabels: Record<DunningLevel, string> = {
    first: '1. Mahnung',
    second: '2. Mahnung',
    third: '3. Mahnung',
    final: 'Letzte Mahnung',
  };

  const statusLabels: Record<DunningStatus, string> = {
    pending: 'Ausstehend',
    sent: 'Versendet',
    paid: 'Bezahlt',
    escalated: 'Inkasso',
  };

  const statusColors: Record<DunningStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    escalated: 'bg-red-100 text-red-800',
  };

  const levelColors: Record<DunningLevel, string> = {
    first: 'bg-blue-100 text-blue-800',
    second: 'bg-orange-100 text-orange-800',
    third: 'bg-red-100 text-red-800',
    final: 'bg-red-200 text-red-900',
  };

  const printDunningLetter = (dunning: DunningLetter) => {
    const tenant = store.tenants.find(t => t.id === dunning.tenantId);
    const payment = store.payments.find(p => p.id === dunning.paymentId);
    const unit = payment ? store.units.find(u => u.id === payment.unitId) : null;
    const property = unit ? store.properties.find(p => p.id === unit.propertyId) : null;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mahnung - ${tenant?.firstName} ${tenant?.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .address { margin-bottom: 40px; }
          .content { line-height: 1.6; }
          .amount { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { margin-top: 60px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${levelLabels[dunning.level]}</h1>
        <div class="header">
          <div>
            <strong>Datum:</strong> ${format(new Date(dunning.issueDate), 'dd.MM.yyyy', { locale: de })}<br>
            <strong>Fällig bis:</strong> ${format(new Date(dunning.dueDate), 'dd.MM.yyyy', { locale: de })}
          </div>
        </div>
        <div class="address">
          <strong>${tenant?.firstName} ${tenant?.lastName}</strong><br>
          ${tenant?.street}<br>
          ${tenant?.postalCode} ${tenant?.city}
        </div>
        <div class="content">
          <p>Sehr geehrte(r) ${tenant?.firstName} ${tenant?.lastName},</p>
          <p>wie wir festgestellt haben, haben wir die Miete für ${payment?.month || 'den betreffenden Zeitraum'} noch nicht erhalten.</p>
          <div class="amount">
            <table style="width: 100%;">
              <tr><td>Offener Betrag:</td><td style="text-align: right;">${formatCurrency(dunning.originalAmount)}</td></tr>
              <tr><td>Mahngebühr:</td><td style="text-align: right;">${formatCurrency(dunning.lateFee)}</td></tr>
              <tr style="font-weight: bold; border-top: 1px solid #ccc;"><td style="padding-top: 10px;">Gesamtbetrag:</td><td style="text-align: right; padding-top: 10px;">${formatCurrency(dunning.totalAmount)}</td></tr>
            </table>
          </div>
          <p>Bitte überweisen Sie den Gesamtbetrag bis zum ${format(new Date(dunning.dueDate), 'dd.MM.yyyy', { locale: de })} auf unser Konto.</p>
          <p>Should you have any questions, please contact us.</p>
          <p>Mit freundlichen Grüßen<br>Ihr Vermieter</p>
        </div>
        <div class="footer">
          Immobilie: ${property?.name || ''} ${property?.address || ''}<br>
          Einheit: ${unit?.unitNumber || ''}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = store.dunningLetters.length;
    const pending = store.dunningLetters.filter(d => d.status === 'pending').length;
    const sent = store.dunningLetters.filter(d => d.status === 'sent').length;
    const totalAmount = store.dunningLetters.reduce((sum, d) => sum + d.totalAmount, 0);
    return { total, pending, sent, totalAmount };
  }, [store.dunningLetters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mahnwesen</h1>
        <Button onClick={() => openNewDialog()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Mahnung
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alle Mahnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausstehend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Versendet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtbetrag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Payments */}
      {overduePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Überfällige Zahlungen
            </CardTitle>
            <CardDescription>Diese Zahlungen sind überfällig und können gemahnt werden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {overduePayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{getTenantName(payment.tenantId)}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(payment.expectedAmount)} - fällig am {format(new Date(payment.expectedDate), 'dd.MM.yyyy', { locale: de })}</p>
                  </div>
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => handleGenerateDunning(payment.id, value as DunningLevel)}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Mahnung..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">1. Mahnung</SelectItem>
                        <SelectItem value="second">2. Mahnung</SelectItem>
                        <SelectItem value="third">3. Mahnung</SelectItem>
                        <SelectItem value="final">Letzte Mahnung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="pending">Ausstehend</SelectItem>
            <SelectItem value="sent">Versendet</SelectItem>
            <SelectItem value="paid">Bezahlt</SelectItem>
            <SelectItem value="escalated">Inkasso</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={(v: any) => setFilterLevel(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mahnstufe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Stufen</SelectItem>
            <SelectItem value="first">1. Mahnung</SelectItem>
            <SelectItem value="second">2. Mahnung</SelectItem>
            <SelectItem value="third">3. Mahnung</SelectItem>
            <SelectItem value="final">Letzte Mahnung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dunning Letters List */}
      <div className="grid gap-4">
        {filteredDunnings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Keine Mahnungen gefunden
            </CardContent>
          </Card>
        ) : (
          filteredDunnings.map(dunning => (
            <Card key={dunning.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={levelColors[dunning.level]}>{levelLabels[dunning.level]}</Badge>
                      <Badge className={statusColors[dunning.status]}>{statusLabels[dunning.status]}</Badge>
                    </div>
                    <p className="font-medium text-lg">{getTenantName(dunning.tenantId)}</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Datum: {format(new Date(dunning.issueDate), 'dd.MM.yyyy', { locale: de })}</p>
                      <p>Fällig: {format(new Date(dunning.dueDate), 'dd.MM.yyyy', { locale: de })}</p>
                      <p>Versand: {dunning.sentVia === 'email' ? 'E-Mail' : dunning.sentVia === 'mail' ? 'Post' : 'E-Mail & Post'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(dunning.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">inkl. {formatCurrency(dunning.lateFee)} Mahngebühr</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => printDunningLetter(dunning)}>
                        <Printer className="h-4 w-4 mr-1" /> Drucken
                      </Button>
                      <Select onValueChange={(v) => handleUpdateStatus(dunning.id, v as DunningStatus)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sent">Versendet</SelectItem>
                          <SelectItem value="paid">Bezahlt</SelectItem>
                          <SelectItem value="escalated">Inkasso</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="destructive" onClick={() => store.deleteDunningLetter(dunning.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Dunning Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neue Mahnung erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie eine neue Mahnung für eine überfällige Zahlung</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Zahlung</Label>
              <Select value={formData.paymentId} onValueChange={(v) => {
                const payment = store.payments.find(p => p.id === v);
                setFormData({
                  ...formData,
                  paymentId: v,
                  tenantId: payment?.tenantId || '',
                  originalAmount: payment?.expectedAmount || 0,
                  lateFee: payment ? Math.round(payment.expectedAmount * 0.015 * 100) / 100 : 0,
                  totalAmount: payment ? payment.expectedAmount + Math.round(payment.expectedAmount * 0.015 * 100) / 100 : 0,
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Zahlung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {overduePayments.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {getTenantName(p.tenantId)} - {formatCurrency(p.expectedAmount)} ({p.month})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mahnstufe</Label>
                <Select value={formData.level} onValueChange={(v: DunningLevel) => {
                  const rates: Record<DunningLevel, number> = { first: 0.015, second: 0.03, third: 0.05, final: 0.07 };
                  const days: Record<DunningLevel, number> = { first: 14, second: 10, third: 7, final: 5 };
                  const lateFee = Math.round(formData.originalAmount * rates[v] * 100) / 100;
                  const dueDate = new Date();
                  dueDate.setDate(dueDate.getDate() + days[v]);
                  setFormData({
                    ...formData,
                    level: v,
                    lateFee,
                    totalAmount: formData.originalAmount + lateFee,
                    dueDate: dueDate.toISOString().split('T')[0],
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">1. Mahnung (1,5%)</SelectItem>
                    <SelectItem value="second">2. Mahnung (3%)</SelectItem>
                    <SelectItem value="third">3. Mahnung (5%)</SelectItem>
                    <SelectItem value="final">Letzte Mahnung (7%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Versandart</Label>
                <Select value={formData.sentVia} onValueChange={(v: any) => setFormData({ ...formData, sentVia: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-Mail</SelectItem>
                    <SelectItem value="mail">Post</SelectItem>
                    <SelectItem value="both">E-Mail & Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ausstellungsdatum</Label>
                <Input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fälligkeitsdatum</Label>
                <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Offener Betrag:</span>
                <span>{formatCurrency(formData.originalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mahngebühr:</span>
                <span>{formatCurrency(formData.lateFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Gesamtbetrag:</span>
                <span className="text-red-600">{formatCurrency(formData.totalAmount)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// UTILITY COSTS SECTION (Nebenkostenabrechnung)
// ============================================
function UtilityCostsSection() {
  const store = useStore();
  const { formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'disputed'>('all');
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    year: new Date().getFullYear() - 1,
    startDate: '',
    endDate: '',
    heatingConsumption: 0,
    heatingCosts: 0,
    waterConsumption: 0,
    waterCosts: 0,
    garbageCosts: 0,
    insuranceCosts: 0,
    maintenanceCosts: 0,
    administrativeCosts: 0,
    otherCosts: 0,
    prepaymentsTotal: 0,
    totalCosts: 0,
    tenantShare: 0,
    balance: 0,
    status: 'draft' as 'draft' | 'sent' | 'accepted' | 'disputed',
    notes: '',
  });

  const filteredSettlements = useMemo(() => {
    return store.utilitySettlements.filter(s => {
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      const matchesYear = s.year === selectedYear;
      return matchesStatus && matchesYear;
    });
  }, [store.utilitySettlements, filterStatus, selectedYear]);

  const openNewDialog = () => {
    setEditingId(null);
    setWizardStep(1);
    setFormData({
      propertyId: store.properties[0]?.id || '',
      unitId: '',
      tenantId: '',
      year: selectedYear,
      startDate: `${selectedYear}-01-01`,
      endDate: `${selectedYear}-12-31`,
      heatingConsumption: 0,
      heatingCosts: 0,
      waterConsumption: 0,
      waterCosts: 0,
      garbageCosts: 0,
      insuranceCosts: 0,
      maintenanceCosts: 0,
      administrativeCosts: 0,
      otherCosts: 0,
      prepaymentsTotal: 0,
      totalCosts: 0,
      tenantShare: 0,
      balance: 0,
      status: 'draft',
      notes: '',
    });
    setDialogOpen(true);
  };

  const calculateTotals = () => {
    const totalCosts = formData.heatingCosts + formData.waterCosts + formData.garbageCosts + 
      formData.insuranceCosts + formData.maintenanceCosts + formData.administrativeCosts + formData.otherCosts;
    const balance = formData.prepaymentsTotal - totalCosts;
    setFormData({
      ...formData,
      totalCosts,
      tenantShare: totalCosts,
      balance,
    });
  };

  const handleSave = () => {
    if (!formData.propertyId || !formData.tenantId) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingId) {
      store.updateUtilitySettlement(editingId, formData);
      toast.success('Nebenkostenabrechnung aktualisiert');
    } else {
      store.addUtilitySettlement(formData);
      toast.success('Nebenkostenabrechnung erstellt');
    }
    setDialogOpen(false);
  };

  const handleSend = (id: string) => {
    store.updateUtilitySettlement(id, { 
      status: 'sent', 
      sentDate: new Date().toISOString().split('T')[0] 
    });
    toast.success('Nebenkostenabrechnung versendet');
  };

  const getTenantName = (tenantId: string) => {
    const tenant = store.tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unbekannt';
  };

  const getPropertyName = (propertyId: string) => {
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || 'Unbekannt';
  };

  const statusLabels = {
    draft: 'Entwurf',
    sent: 'Versendet',
    accepted: 'Akzeptiert',
    disputed: 'Widersprochen',
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    disputed: 'bg-red-100 text-red-800',
  };

  // Stats
  const stats = useMemo(() => {
    const yearSettlements = store.utilitySettlements.filter(s => s.year === selectedYear);
    const total = yearSettlements.length;
    const totalBalance = yearSettlements.reduce((sum, s) => sum + s.balance, 0);
    const nachzahlungen = yearSettlements.filter(s => s.balance > 0).reduce((sum, s) => sum + s.balance, 0);
    const guthaben = yearSettlements.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0);
    return { total, totalBalance, nachzahlungen, guthaben };
  }, [store.utilitySettlements, selectedYear]);

  const printSettlement = (settlement: UtilityCostSettlement) => {
    const tenant = store.tenants.find(t => t.id === settlement.tenantId);
    const property = store.properties.find(p => p.id === settlement.propertyId);
    const unit = settlement.unitId ? store.units.find(u => u.id === settlement.unitId) : null;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nebenkostenabrechnung ${settlement.year} - ${tenant?.firstName} ${tenant?.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .total { font-weight: bold; background: #f9f9f9; }
          .balance-positive { color: #dc2626; font-size: 1.2em; }
          .balance-negative { color: #16a34a; font-size: 1.2em; }
          .footer { margin-top: 60px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Nebenkostenabrechnung ${settlement.year}</h1>
        <p><strong>Zeitraum:</strong> ${format(new Date(settlement.startDate), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(settlement.endDate), 'dd.MM.yyyy', { locale: de })}</p>
        
        <div style="margin: 30px 0;">
          <strong>${tenant?.firstName} ${tenant?.lastName}</strong><br>
          ${tenant?.street}<br>
          ${tenant?.postalCode} ${tenant?.city}
        </div>

        <h2>Verbrauchsdaten</h2>
        <table>
          <tr><th>Heizung</th><td>${settlement.heatingConsumption} kWh</td><td style="text-align: right;">${formatCurrency(settlement.heatingCosts)}</td></tr>
          <tr><th>Wasser</th><td>${settlement.waterConsumption} m³</td><td style="text-align: right;">${formatCurrency(settlement.waterCosts)}</td></tr>
        </table>

        <h2>Kostenübersicht</h2>
        <table>
          <tr><th>Position</th><th style="text-align: right;">Betrag</th></tr>
          <tr><td>Heizungskosten</td><td style="text-align: right;">${formatCurrency(settlement.heatingCosts)}</td></tr>
          <tr><td>Wasserkosten</td><td style="text-align: right;">${formatCurrency(settlement.waterCosts)}</td></tr>
          <tr><td>Müllabfuhr</td><td style="text-align: right;">${formatCurrency(settlement.garbageCosts)}</td></tr>
          <tr><td>Versicherung</td><td style="text-align: right;">${formatCurrency(settlement.insuranceCosts)}</td></tr>
          <tr><td>Instandhaltung</td><td style="text-align: right;">${formatCurrency(settlement.maintenanceCosts)}</td></tr>
          <tr><td>Verwaltungskosten</td><td style="text-align: right;">${formatCurrency(settlement.administrativeCosts)}</td></tr>
          ${settlement.otherCosts > 0 ? `<tr><td>Sonstiges</td><td style="text-align: right;">${formatCurrency(settlement.otherCosts)}</td></tr>` : ''}
          <tr class="total"><td>Gesamtkosten</td><td style="text-align: right;">${formatCurrency(settlement.totalCosts)}</td></tr>
        </table>

        <h2>Abrechnung</h2>
        <table>
          <tr><td>Ihre Vorauszahlungen</td><td style="text-align: right;">${formatCurrency(settlement.prepaymentsTotal)}</td></tr>
          <tr><td>Ihre Kosten</td><td style="text-align: right;">${formatCurrency(settlement.tenantShare)}</td></tr>
          <tr class="total">
            <td><strong>${settlement.balance >= 0 ? 'Nachzahlung' : 'Guthaben'}</strong></td>
            <td style="text-align: right;"><strong class="${settlement.balance >= 0 ? 'balance-positive' : 'balance-negative'}">${formatCurrency(Math.abs(settlement.balance))}</strong></td>
          </tr>
        </table>

        ${settlement.balance > 0 ? `
          <p style="margin-top: 20px; padding: 15px; background: #fef2f2; border-radius: 8px;">
            Bitte überweisen Sie den Nachzahlungsbetrag von <strong>${formatCurrency(settlement.balance)}</strong> innerhalb von 14 Tagen.
          </p>
        ` : `
          <p style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px;">
            Das Guthaben von <strong>${formatCurrency(Math.abs(settlement.balance))}</strong> wird mit zukünftigen Zahlungen verrechnet oder auf Wunsch erstattet.
          </p>
        `}

        <div class="footer">
          Immobilie: ${property?.name || ''} ${property?.address || ''}<br>
          Einheit: ${unit?.unitNumber || ''}<br>
          Abrechnungsdatum: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nebenkostenabrechnung</h1>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2024, 2023, 2022, 2021].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Neue Abrechnung
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abrechnungen {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nachzahlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.nachzahlungen)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Guthaben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.guthaben)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(stats.totalBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          <SelectItem value="draft">Entwurf</SelectItem>
          <SelectItem value="sent">Versendet</SelectItem>
          <SelectItem value="accepted">Akzeptiert</SelectItem>
          <SelectItem value="disputed">Widersprochen</SelectItem>
        </SelectContent>
      </Select>

      {/* Settlements List */}
      <div className="grid gap-4">
        {filteredSettlements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Keine Nebenkostenabrechnungen für {selectedYear} gefunden
            </CardContent>
          </Card>
        ) : (
          filteredSettlements.map(settlement => (
            <Card key={settlement.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[settlement.status]}>{statusLabels[settlement.status]}</Badge>
                      <span className="text-sm text-muted-foreground">Jahr: {settlement.year}</span>
                    </div>
                    <p className="font-medium text-lg">{getTenantName(settlement.tenantId)}</p>
                    <p className="text-sm text-muted-foreground">{getPropertyName(settlement.propertyId)}</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Zeitraum: {format(new Date(settlement.startDate), 'dd.MM.yyyy', { locale: de })} - {format(new Date(settlement.endDate), 'dd.MM.yyyy', { locale: de })}</p>
                      <p>Heizung: {settlement.heatingConsumption} kWh | Wasser: {settlement.waterConsumption} m³</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${settlement.balance >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {settlement.balance >= 0 ? 'Nachzahlung: ' : 'Guthaben: '}{formatCurrency(Math.abs(settlement.balance))}
                    </p>
                    <p className="text-sm text-muted-foreground">Vorauszahlungen: {formatCurrency(settlement.prepaymentsTotal)}</p>
                    <p className="text-sm text-muted-foreground">Gesamtkosten: {formatCurrency(settlement.totalCosts)}</p>
                    <div className="flex gap-2 mt-4 justify-end">
                      <Button size="sm" variant="outline" onClick={() => printSettlement(settlement)}>
                        <Printer className="h-4 w-4 mr-1" /> Drucken
                      </Button>
                      {settlement.status === 'draft' && (
                        <Button size="sm" onClick={() => handleSend(settlement.id)} className="bg-emerald-600 hover:bg-emerald-700">
                          <Send className="h-4 w-4 mr-1" /> Versenden
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingId(settlement.id);
                        setFormData({
                          propertyId: settlement.propertyId,
                          unitId: settlement.unitId || '',
                          tenantId: settlement.tenantId,
                          year: settlement.year,
                          startDate: settlement.startDate,
                          endDate: settlement.endDate,
                          heatingConsumption: settlement.heatingConsumption,
                          heatingCosts: settlement.heatingCosts,
                          waterConsumption: settlement.waterConsumption,
                          waterCosts: settlement.waterCosts,
                          garbageCosts: settlement.garbageCosts,
                          insuranceCosts: settlement.insuranceCosts,
                          maintenanceCosts: settlement.maintenanceCosts,
                          administrativeCosts: settlement.administrativeCosts,
                          otherCosts: settlement.otherCosts,
                          prepaymentsTotal: settlement.prepaymentsTotal,
                          totalCosts: settlement.totalCosts,
                          tenantShare: settlement.tenantShare,
                          balance: settlement.balance,
                          status: settlement.status,
                          notes: settlement.notes,
                        });
                        setDialogOpen(true);
                      }}>
                        <Edit2 className="h-4 w-4 mr-1" /> Bearbeiten
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => store.deleteUtilitySettlement(settlement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Nebenkostenabrechnung bearbeiten' : 'Neue Nebenkostenabrechnung'}</DialogTitle>
            <DialogDescription>
              {wizardStep === 1 && 'Schritt 1: Mieter und Zeitraum auswählen'}
              {wizardStep === 2 && 'Schritt 2: Verbrauchsdaten eingeben'}
              {wizardStep === 3 && 'Schritt 3: Kosten eingeben'}
              {wizardStep === 4 && 'Schritt 4: Zusammenfassung'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Tenant & Period */}
          {wizardStep === 1 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Immobilie</Label>
                  <Select value={formData.propertyId} onValueChange={(v) => setFormData({ ...formData, propertyId: v, unitId: '', tenantId: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Immobilie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {store.properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Einheit</Label>
                  <Select value={formData.unitId} onValueChange={(v) => {
                    const unit = store.units.find(u => u.id === v);
                    const tenant = store.tenants.find(t => t.unitId === v);
                    const prepayments = unit ? unit.additionalCosts * 12 : 0;
                    setFormData({ 
                      ...formData, 
                      unitId: v, 
                      tenantId: tenant?.id || '',
                      prepaymentsTotal: prepayments
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Einheit auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {store.units.filter(u => u.propertyId === formData.propertyId).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.unitNumber} ({u.area}m²)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mieter</Label>
                <Select value={formData.tenantId} onValueChange={(v) => setFormData({ ...formData, tenantId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mieter auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.tenants.filter(t => t.unitId === formData.unitId).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Jahr</Label>
                  <Select value={formData.year.toString()} onValueChange={(v) => {
                    const year = parseInt(v);
                    setFormData({ 
                      ...formData, 
                      year,
                      startDate: `${year}-01-01`,
                      endDate: `${year}-12-31`
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2024, 2023, 2022].map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Von</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Bis</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vorauszahlungen (jährlich)</Label>
                <Input type="number" value={formData.prepaymentsTotal} onChange={(e) => setFormData({ ...formData, prepaymentsTotal: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          )}

          {/* Step 2: Consumption Data */}
          {wizardStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Heizung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Verbrauch (kWh)</Label>
                      <Input type="number" value={formData.heatingConsumption} onChange={(e) => setFormData({ ...formData, heatingConsumption: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Kosten (€)</Label>
                      <Input type="number" value={formData.heatingCosts} onChange={(e) => setFormData({ ...formData, heatingCosts: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Wasser</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Verbrauch (m³)</Label>
                      <Input type="number" value={formData.waterConsumption} onChange={(e) => setFormData({ ...formData, waterConsumption: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Kosten (€)</Label>
                      <Input type="number" value={formData.waterCosts} onChange={(e) => setFormData({ ...formData, waterCosts: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Cost Items */}
          {wizardStep === 3 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Müllabfuhr</Label>
                  <Input type="number" value={formData.garbageCosts} onChange={(e) => setFormData({ ...formData, garbageCosts: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Versicherung</Label>
                  <Input type="number" value={formData.insuranceCosts} onChange={(e) => setFormData({ ...formData, insuranceCosts: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Instandhaltung</Label>
                  <Input type="number" value={formData.maintenanceCosts} onChange={(e) => setFormData({ ...formData, maintenanceCosts: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Verwaltungskosten</Label>
                  <Input type="number" value={formData.administrativeCosts} onChange={(e) => setFormData({ ...formData, administrativeCosts: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Sonstige Kosten</Label>
                  <Input type="number" value={formData.otherCosts} onChange={(e) => setFormData({ ...formData, otherCosts: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {wizardStep === 4 && (
            <div className="space-y-4 py-4">
              {(() => {
                calculateTotals();
                return null;
              })()}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold mb-4">Kostenübersicht</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Heizung:</span><span className="text-right">{formatCurrency(formData.heatingCosts)}</span>
                  <span>Wasser:</span><span className="text-right">{formatCurrency(formData.waterCosts)}</span>
                  <span>Müllabfuhr:</span><span className="text-right">{formatCurrency(formData.garbageCosts)}</span>
                  <span>Versicherung:</span><span className="text-right">{formatCurrency(formData.insuranceCosts)}</span>
                  <span>Instandhaltung:</span><span className="text-right">{formatCurrency(formData.maintenanceCosts)}</span>
                  <span>Verwaltung:</span><span className="text-right">{formatCurrency(formData.administrativeCosts)}</span>
                  {formData.otherCosts > 0 && (<><span>Sonstiges:</span><span className="text-right">{formatCurrency(formData.otherCosts)}</span></>)}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Gesamtkosten:</span>
                    <span>{formatCurrency(formData.totalCosts)}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Vorauszahlungen:</span>
                    <span>{formatCurrency(formData.prepaymentsTotal)}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-lg mt-2 ${formData.balance >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    <span>{formData.balance >= 0 ? 'Nachzahlung:' : 'Guthaben:'}</span>
                    <span>{formatCurrency(Math.abs(formData.balance))}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notizen</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {wizardStep > 1 && (
                <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>
                  Zurück
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              {wizardStep < 4 ? (
                <Button onClick={() => setWizardStep(wizardStep + 1)} className="bg-emerald-600 hover:bg-emerald-700">
                  Weiter
                </Button>
              ) : (
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                  Speichern
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// INSPECTIONS SECTION (Inspektionen)
// ============================================
function InspectionsSection() {
  const store = useStore();
  const { formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<typeof store.inspections[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    type: 'periodic' as 'move_in' | 'move_out' | 'periodic' | 'maintenance' | 'special',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    scheduledDate: '',
    inspector: '',
    overallCondition: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    summary: '',
    recommendations: [] as string[],
    followUpRequired: false,
    followUpDate: '',
    notes: '',
    items: [] as InspectionItem[],
  });

  const filteredInspections = useMemo(() => {
    return store.inspections.filter(i => {
      const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
      return matchesStatus;
    });
  }, [store.inspections, filterStatus]);

  const openNewDialog = () => {
    setEditingId(null);
    setFormData({
      propertyId: store.properties[0]?.id || '',
      unitId: '',
      tenantId: '',
      type: 'periodic',
      status: 'scheduled',
      scheduledDate: new Date().toISOString().split('T')[0],
      inspector: '',
      overallCondition: 'good',
      summary: '',
      recommendations: [],
      followUpRequired: false,
      followUpDate: '',
      notes: '',
      items: [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (inspection: typeof store.inspections[0]) => {
    setEditingId(inspection.id);
    setFormData({
      propertyId: inspection.propertyId,
      unitId: inspection.unitId || '',
      tenantId: inspection.tenantId || '',
      type: inspection.type,
      status: inspection.status,
      scheduledDate: inspection.scheduledDate,
      inspector: inspection.inspector,
      overallCondition: inspection.overallCondition,
      summary: inspection.summary,
      recommendations: inspection.recommendations,
      followUpRequired: inspection.followUpRequired,
      followUpDate: inspection.followUpDate || '',
      notes: '',
      items: inspection.items || [],
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.propertyId || !formData.scheduledDate) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editingId) {
      store.updateInspection(editingId, formData);
      toast.success('Inspektion aktualisiert');
    } else {
      store.addInspection(formData);
      toast.success('Inspektion geplant');
    }
    setDialogOpen(false);
  };

  const getPropertyName = (propertyId: string) => {
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || 'Unbekannt';
  };

  const getUnitName = (unitId?: string) => {
    if (!unitId) return '-';
    const unit = store.units.find(u => u.id === unitId);
    return unit?.unitNumber || 'Unbekannt';
  };

  const typeLabels = {
    move_in: 'Einzug',
    move_out: 'Auszug',
    periodic: 'Regelmäßig',
    maintenance: 'Wartung',
    special: 'Sonder',
  };

  const typeColors = {
    move_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    move_out: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    periodic: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    maintenance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    special: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  };

  const statusLabels = {
    scheduled: 'Geplant',
    in_progress: 'In Durchführung',
    completed: 'Abgeschlossen',
    cancelled: 'Abgebrochen',
  };

  const statusColors = {
    scheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  const conditionColors = {
    excellent: 'text-green-600',
    good: 'text-emerald-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  };

  const upcomingInspections = useMemo(() => {
    const today = new Date();
    return store.inspections
      .filter(i => i.status === 'scheduled' && new Date(i.scheduledDate) >= today)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5);
  }, [store.inspections]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inspektionen</h1>
        <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Inspektion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Geplante Inspektionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.inspections.filter(i => i.status === 'scheduled').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Durchführung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{store.inspections.filter(i => i.status === 'in_progress').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abgeschlossen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{store.inspections.filter(i => i.status === 'completed').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nachverfolgung nötig</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{store.inspections.filter(i => i.followUpRequired).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Inspections */}
      {upcomingInspections.length > 0 && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Anstehende Inspektionen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingInspections.map(inspection => (
                <div key={inspection.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium">{getPropertyName(inspection.propertyId)}</p>
                      <p className="text-sm text-muted-foreground">{inspection.scheduledDate}</p>
                    </div>
                  </div>
                  <Badge className={typeColors[inspection.type]}>{typeLabels[inspection.type]}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Card className="bg-card">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Label>Status:</Label>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="scheduled">Geplant</SelectItem>
                <SelectItem value="in_progress">In Durchführung</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInspections.map((inspection) => (
          <Card key={inspection.id} className="hover:shadow-lg transition-shadow bg-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{getPropertyName(inspection.propertyId)}</CardTitle>
                  <CardDescription>Einheit: {getUnitName(inspection.unitId)}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={typeColors[inspection.type]}>{typeLabels[inspection.type]}</Badge>
                  <Badge className={statusColors[inspection.status]}>{statusLabels[inspection.status]}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{inspection.scheduledDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{inspection.inspector || 'Nicht zugewiesen'}</span>
                </div>
                {inspection.status === 'completed' && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`h-4 w-4 ${conditionColors[inspection.overallCondition]}`} />
                    <span>Zustand: {inspection.overallCondition}</span>
                  </div>
                )}
                {inspection.followUpRequired && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Nachverfolgung erforderlich</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{inspection.summary}</p>
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedInspection(inspection);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(inspection)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => store.deleteInspection(inspection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInspections.length === 0 && (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Inspektionen</h3>
            <p className="text-muted-foreground mb-4">Planen Sie Ihre erste Inspektion</p>
            <Button onClick={openNewDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Neue Inspektion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Inspection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Inspektion bearbeiten' : 'Neue Inspektion'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Immobilie *</Label>
                <Select value={formData.propertyId} onValueChange={(v) => setFormData({ ...formData, propertyId: v, unitId: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {store.properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Einheit</Label>
                <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                  <SelectTrigger><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    {store.units.filter(u => u.propertyId === formData.propertyId).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Typ *</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="move_in">Einzug</SelectItem>
                    <SelectItem value="move_out">Auszug</SelectItem>
                    <SelectItem value="periodic">Regelmäßig</SelectItem>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                    <SelectItem value="special">Sonder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Geplant</SelectItem>
                    <SelectItem value="in_progress">In Durchführung</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                    <SelectItem value="cancelled">Abgebrochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Datum *</Label>
                <Input type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} />
              </div>
              <div>
                <Label>Inspekteur</Label>
                <Input value={formData.inspector} onChange={(e) => setFormData({ ...formData, inspector: e.target.value })} placeholder="Name" />
              </div>
            </div>
            {formData.status === 'completed' && (
              <div>
                <Label>Gesamtzustand</Label>
                <Select value={formData.overallCondition} onValueChange={(v: any) => setFormData({ ...formData, overallCondition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Ausgezeichnet</SelectItem>
                    <SelectItem value="good">Gut</SelectItem>
                    <SelectItem value="fair">Befriedigend</SelectItem>
                    <SelectItem value="poor">Schlecht</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Zusammenfassung</Label>
              <Textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.followUpRequired} onCheckedChange={(v) => setFormData({ ...formData, followUpRequired: v })} />
              <Label>Nachverfolgung erforderlich</Label>
            </div>
            {formData.followUpRequired && (
              <div>
                <Label>Nachverfolgungsdatum</Label>
                <Input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inspektionsdetails</DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Immobilie</Label>
                  <p className="font-medium">{getPropertyName(selectedInspection.propertyId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Einheit</Label>
                  <p className="font-medium">{getUnitName(selectedInspection.unitId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Typ</Label>
                  <Badge className={typeColors[selectedInspection.type]}>{typeLabels[selectedInspection.type]}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedInspection.status]}>{statusLabels[selectedInspection.status]}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Datum</Label>
                  <p className="font-medium">{selectedInspection.scheduledDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Inspekteur</Label>
                  <p className="font-medium">{selectedInspection.inspector || 'Nicht zugewiesen'}</p>
                </div>
              </div>
              
              {selectedInspection.items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Prüfpunkte</Label>
                    <div className="mt-2 space-y-2">
                      {selectedInspection.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({item.category})</span>
                          </div>
                          <Badge variant="outline">{item.condition}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {selectedInspection.summary && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Zusammenfassung</Label>
                    <p className="mt-1">{selectedInspection.summary}</p>
                  </div>
                </>
              )}
              
              {selectedInspection.recommendations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Empfehlungen</Label>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {selectedInspection.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// SETTINGS SECTION
// ============================================
function SettingsSection() {
  const store = useStore();
  const { t, formatCurrency, currency, setCurrency, exchangeRates, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>('');
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState(getSecuritySettings());
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinStep, setPinStep] = useState<'set' | 'confirm' | 'change' | 'change_old'>('set');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Notification settings
  const [notificationSettings, setNotificationSettingsState] = useState(getNotificationSettings());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Load notification permission on mount
  useEffect(() => {
    if (areNotificationsSupported()) {
      queueMicrotask(() => setNotificationPermission(Notification.permission));
    }
  }, []);
  
  const handleExport = () => {
    const data = store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bucki-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Daten exportiert');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImportData(reader.result as string);
        setImportDialogOpen(true);
      };
      reader.readAsText(file);
    }
  };

  const handleImportConfirm = () => {
    try {
      const data = JSON.parse(importData);
      if (data.data) {
        store.importData(data);
        toast.success('Daten importiert');
      } else {
        toast.error('Ungültiges Datenformat');
      }
    } catch {
      toast.error('Fehler beim Importieren');
    }
    setImportDialogOpen(false);
    setImportData('');
  };

  const handleReset = () => {
    if (confirm('Möchten Sie wirklich alle Daten zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      store.resetData();
      toast.success('Daten zurückgesetzt');
    }
  };
  
  // PIN handlers
  const handleSetPin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError(t.auth.pinLengthError);
      return;
    }
    setPinStep('confirm');
  };
  
  const handleConfirmPin = async () => {
    if (newPin !== confirmPin) {
      setPinError(t.auth.pinMismatch);
      return;
    }
    const result = await setPin(newPin);
    if (result.success) {
      setSecuritySettings(getSecuritySettings());
      setPinDialogOpen(false);
      setNewPin('');
      setConfirmPin('');
      setPinError('');
      toast.success(t.auth.pinSet);
    } else {
      setPinError(result.error || 'Fehler');
    }
  };
  
  const handleChangePin = async () => {
    if (pinStep === 'change_old') {
      const isValid = await verifyPin(oldPin);
      if (!isValid) {
        setPinError(t.auth.wrongPin);
        return;
      }
      setPinStep('change');
      setOldPin('');
      return;
    }
    
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError(t.auth.pinLengthError);
      return;
    }
    
    const result = await changePin(oldPin || '', newPin);
    if (result.success) {
      setSecuritySettings(getSecuritySettings());
      setPinDialogOpen(false);
      setNewPin('');
      setConfirmPin('');
      setOldPin('');
      setPinError('');
      toast.success(t.auth.pinChanged);
    } else {
      setPinError(result.error || 'Fehler');
    }
  };
  
  const handleDisablePin = () => {
    removePin();
    setSecuritySettings(getSecuritySettings());
    toast.success(t.auth.pinDisabled);
  };
  
  const handleAutoLockChange = (minutes: number) => {
    saveSecuritySettings({ autoLockMinutes: minutes });
    setSecuritySettings(getSecuritySettings());
  };
  
  // Notification handlers
  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        toast.error(t.notifications.permissionDenied);
        return;
      }
    }
    saveNotificationSettings({ pushEnabled: enabled });
    setNotificationSettingsState(getNotificationSettings());
  };
  
  const handleNotificationSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    saveNotificationSettings({ [key]: value });
    setNotificationSettingsState(getNotificationSettings());
  };

  const stats = useMemo(() => ({
    properties: store.properties.length,
    units: store.units.length,
    tenants: store.tenants.length,
    transactions: store.transactions.length,
    financings: store.financings.length,
    documents: store.documents.length,
    tasks: store.tasks.length,
  }), [store.properties, store.units, store.tenants, store.transactions, store.financings, store.documents, store.tasks]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h1>

      {/* Appearance Settings - Theme & Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            {t.settings.appearance}
          </CardTitle>
          <CardDescription>{t.settings.theme}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t.settings.theme}</Label>
                <p className="text-sm text-muted-foreground">Hell oder Dunkel einstellen</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setTheme('light')}
                  className={theme === 'light' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <Sun className="h-4 w-4 mr-1" />
                  {t.settings.themes.light}
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setTheme('dark')}
                  className={theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <Moon className="h-4 w-4 mr-1" />
                  {t.settings.themes.dark}
                </Button>
                <Button 
                  variant={theme === 'system' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setTheme('system')}
                  className={theme === 'system' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  {t.settings.themes.system}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Premium Themes */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Premium-Themes
                </Label>
                <p className="text-sm text-muted-foreground">Wählen Sie einen stilvollen Look</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={theme === 'banking' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setTheme('banking')}
                  className={theme === 'banking' ? 'bg-slate-700 hover:bg-slate-800' : ''}
                >
                  <Landmark className="h-4 w-4 mr-1" />
                  Banking
                </Button>
                <Button 
                  variant={theme === 'fancy' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setTheme('fancy')}
                  className={theme === 'fancy' ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' : ''}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Fancy
                </Button>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Language Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t.settings.language}</Label>
              <p className="text-sm text-muted-foreground">App-Sprache ändern</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={language === 'de' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setLanguage('de')}
                className={language === 'de' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                🇩🇪 Deutsch
              </Button>
              <Button 
                variant={language === 'en' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                🇬🇧 English
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.settings.security}
          </CardTitle>
          <CardDescription>Schützen Sie Ihre Daten mit einem PIN-Schutz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t.settings.pinProtection}</Label>
              <p className="text-sm text-muted-foreground">4-6 stellige PIN zum Schutz der App</p>
            </div>
            {securitySettings.pinEnabled ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setPinStep('change_old');
                  setPinDialogOpen(true);
                }}>
                  {t.settings.changePin}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDisablePin}>
                  {t.auth.disablePin}
                </Button>
              </div>
            ) : (
              <Button onClick={() => {
                setPinStep('set');
                setNewPin('');
                setConfirmPin('');
                setPinError('');
                setPinDialogOpen(true);
              }}>
                {t.auth.setPin}
              </Button>
            )}
          </div>
          
          {securitySettings.pinEnabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t.settings.autoLock}</Label>
                  <p className="text-sm text-muted-foreground">App automatisch sperren nach Inaktivität</p>
                </div>
                <Select
                  value={securitySettings.autoLockMinutes.toString()}
                  onValueChange={(v) => handleAutoLockChange(parseInt(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {autoLockOptions.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.settings.notifications}
          </CardTitle>
          <CardDescription>{t.settings.pushNotifications}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t.notifications.enabled}</Label>
              <p className="text-sm text-muted-foreground">
                {notificationPermission === 'granted' 
                  ? t.notifications.permissionGranted 
                  : notificationPermission === 'denied'
                  ? t.notifications.permissionDenied
                  : 'Aktivieren Sie Push-Benachrichtigungen'}
              </p>
            </div>
            <Switch
              checked={notificationSettings.pushEnabled}
              onCheckedChange={handleNotificationToggle}
              disabled={notificationPermission === 'denied'}
            />
          </div>
          
          {notificationSettings.pushEnabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t.settings.notificationSettings.dueTasks}</Label>
                  <Switch
                    checked={notificationSettings.dueTasks}
                    onCheckedChange={(v) => handleNotificationSettingChange('dueTasks', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t.settings.notificationSettings.contractExpirations}</Label>
                  <Switch
                    checked={notificationSettings.contractExpirations}
                    onCheckedChange={(v) => handleNotificationSettingChange('contractExpirations', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t.settings.notificationSettings.rentIncreases}</Label>
                  <Switch
                    checked={notificationSettings.rentIncreases}
                    onCheckedChange={(v) => handleNotificationSettingChange('rentIncreases', v)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.currency.title}
          </CardTitle>
          <CardDescription>{t.currency.defaultCurrency}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t.currency.defaultCurrency}</Label>
            <Select value={currency} onValueChange={(v: Currency) => setCurrency(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">{t.currency.currencies.EUR}</SelectItem>
                <SelectItem value="USD">{t.currency.currencies.USD}</SelectItem>
                <SelectItem value="GBP">{t.currency.currencies.GBP}</SelectItem>
                <SelectItem value="CHF">{t.currency.currencies.CHF}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t.currency.exchangeRates}</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>EUR</span>
                <span>1.00</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>USD</span>
                <span>{exchangeRates.USD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>GBP</span>
                <span>{exchangeRates.GBP.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>CHF</span>
                <span>{exchangeRates.CHF.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t.currency.lastUpdated}: {new Date().toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Automatic Rent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Automatische Miet-Buchungen
          </CardTitle>
          <CardDescription>Monatliche Mieteinnahmen automatisch buchen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatische Buchung aktivieren</Label>
              <p className="text-sm text-muted-foreground">Erstellt automatisch Miet-Transaktionen für vermietete Einheiten</p>
            </div>
            <Switch
              checked={localStorage.getItem('bucki-auto-rent-booking') === 'true'}
              onCheckedChange={(checked) => {
                localStorage.setItem('bucki-auto-rent-booking', String(checked));
                toast.success(checked ? 'Automatische Buchung aktiviert' : 'Automatische Buchung deaktiviert');
              }}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Buchungstag</Label>
                <p className="text-sm text-muted-foreground">Tag des Monats, an dem gebucht wird</p>
              </div>
              <Select 
                value={localStorage.getItem('bucki-auto-rent-day') || '1'} 
                onValueChange={(v) => {
                  localStorage.setItem('bucki-auto-rent-day', v);
                  toast.success('Buchungstag geändert');
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1. des Monats</SelectItem>
                  <SelectItem value="15">15. des Monats</SelectItem>
                  <SelectItem value="last">Letzter Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vorschau der nächsten Buchungen</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {store.units.filter(u => u.status === 'rented').slice(0, 5).map(unit => {
                const property = store.properties.find(p => p.id === unit.propertyId);
                const tenant = store.tenants.find(t => t.unitId === unit.id);
                return (
                  <div key={unit.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <div>
                      <span className="font-medium">{property?.name}</span>
                      <span className="text-muted-foreground ml-2">- {unit.unitNumber}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(unit.totalRent)}</p>
                      <p className="text-xs text-muted-foreground">{tenant?.firstName} {tenant?.lastName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Gesamt: {formatCurrency(store.units.filter(u => u.status === 'rented').reduce((sum, u) => sum + u.totalRent, 0))} / Monat
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const currentMonth = new Date().toISOString().slice(0, 7);
                store.generateMonthlyPayments(currentMonth);
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Jetzt ausführen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Datenübersicht</CardTitle>
          <CardDescription>Aktuelle Anzahl der gespeicherten Datensätze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">{t.nav.properties}</p>
              <p className="text-2xl font-bold">{stats.properties}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">{t.nav.units}</p>
              <p className="text-2xl font-bold">{stats.units}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">{t.nav.tenants}</p>
              <p className="text-2xl font-bold">{stats.tenants}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">{t.nav.finances}</p>
              <p className="text-2xl font-bold">{stats.transactions}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">{t.nav.financing}</p>
              <p className="text-2xl font-bold">{stats.financings}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">{t.nav.documents}</p>
              <p className="text-2xl font-bold">{stats.documents}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500">{t.nav.tasks}</p>
              <p className="text-2xl font-bold">{stats.tasks}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.data}</CardTitle>
          <CardDescription>Exportieren oder importieren Sie Ihre Daten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="h-4 w-4 mr-2" /> {t.settings.exportData}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> {t.settings.importData}
            </Button>
            <Input 
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button variant="outline" className="text-red-600" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" /> {t.settings.resetData}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>App-Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> Bucki - Immobilien-Verwaltung</p>
            <p><strong>{t.settings.version}:</strong> 2.0.0</p>
            <p><strong>Datenspeicherung:</strong> Lokal (localStorage)</p>
            <p><strong>Framework:</strong> Next.js 16 mit TypeScript</p>
            <p><strong>UI:</strong> Tailwind CSS & shadcn/ui</p>
          </div>
        </CardContent>
      </Card>

      {/* PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pinStep === 'set' || pinStep === 'confirm' ? t.auth.setPin : t.settings.changePin}
            </DialogTitle>
            <DialogDescription>
              {pinStep === 'set' && t.auth.enterPin}
              {pinStep === 'confirm' && t.auth.confirmPin}
              {pinStep === 'change_old' && t.auth.currentPin}
              {pinStep === 'change' && t.auth.newPin}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(pinStep === 'set' || pinStep === 'change') && (
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            )}
            {pinStep === 'confirm' && (
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            )}
            {pinStep === 'change_old' && (
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            )}
            {pinError && <p className="text-red-500 text-sm text-center">{pinError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPinDialogOpen(false);
              setNewPin('');
              setConfirmPin('');
              setOldPin('');
              setPinError('');
            }}>
              {t.common.cancel}
            </Button>
            <Button 
              onClick={() => {
                if (pinStep === 'set') handleSetPin();
                else if (pinStep === 'confirm') handleConfirmPin();
                else handleChangePin();
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.settings.importData}</DialogTitle>
            <DialogDescription>
              Möchten Sie die Daten aus dieser Datei importieren? Alle vorhandenen Daten werden überschrieben.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Die Datei enthält die neue Datenbank. Dieser Vorgang kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleImportConfirm} className="bg-emerald-600 hover:bg-emerald-700">
              {t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// MAINTENANCE PLANNER SECTION (Wartungsplaner)
// ============================================
function MaintenanceSection() {
  const store = useStore();
  const { formatCurrency } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  
  interface MaintenanceTask {
    id: string;
    propertyId: string;
    unitId?: string;
    title: string;
    description: string;
    category: 'heating' | 'plumbing' | 'electrical' | 'painting' | 'roofing' | 'general' | 'inspection';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    scheduledDate: string;
    completedDate?: string;
    estimatedCost: number;
    actualCost?: number;
    contractor?: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  }
  
  const [formData, setFormData] = useState<Partial<MaintenanceTask>>({
    propertyId: '',
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    status: 'pending',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedCost: 0,
    notes: '',
  });
  
  // Demo maintenance tasks
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: 'maint-1',
      propertyId: 'prop-1',
      title: 'Heizungswartung',
      description: 'Jährliche Wartung der Zentralheizung',
      category: 'heating',
      priority: 'medium',
      status: 'pending',
      scheduledDate: '2026-03-15',
      estimatedCost: 250,
      contractor: 'Heizungsbauer Müller',
      notes: 'Jährliche Wartung gemäß Wartungsvertrag',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
    },
    {
      id: 'maint-2',
      propertyId: 'prop-6',
      title: 'Fassadenreinigung',
      description: 'Reinigung der Fassade Phönixseeallee',
      category: 'general',
      priority: 'low',
      status: 'pending',
      scheduledDate: '2026-04-01',
      estimatedCost: 800,
      contractor: 'Reinigungsservice Dortmund',
      notes: '',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
    },
    {
      id: 'maint-3',
      propertyId: 'prop-2',
      title: 'Rohrreinigung',
      description: 'Kontrolle und Reinigung der Abwasserrohre',
      category: 'plumbing',
      priority: 'high',
      status: 'in_progress',
      scheduledDate: '2026-02-01',
      estimatedCost: 180,
      contractor: 'Kanalmeister GmbH',
      notes: 'Mieter hat langsam ablaufendes Wasser gemeldet',
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-20T10:00:00.000Z',
    },
  ]);
  
  const filteredTasks = useMemo(() => {
    return maintenanceTasks.filter(task => {
      const matchesProperty = filterProperty === 'all' || task.propertyId === filterProperty;
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      return matchesProperty && matchesStatus;
    });
  }, [maintenanceTasks, filterProperty, filterStatus]);
  
  const handleSave = () => {
    if (!formData.propertyId || !formData.title || !formData.scheduledDate) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    const task: MaintenanceTask = {
      id: editingId || `maint-${Date.now()}`,
      propertyId: formData.propertyId || '',
      unitId: formData.unitId,
      title: formData.title || '',
      description: formData.description || '',
      category: formData.category || 'general',
      priority: formData.priority || 'medium',
      status: formData.status || 'pending',
      scheduledDate: formData.scheduledDate || '',
      completedDate: formData.completedDate,
      estimatedCost: formData.estimatedCost || 0,
      actualCost: formData.actualCost,
      contractor: formData.contractor,
      notes: formData.notes || '',
      createdAt: editingId ? maintenanceTasks.find(t => t.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (editingId) {
      setMaintenanceTasks(prev => prev.map(t => t.id === editingId ? task : t));
      toast.success('Wartungsaufgabe aktualisiert');
    } else {
      setMaintenanceTasks(prev => [...prev, task]);
      toast.success('Wartungsaufgabe erstellt');
    }
    setDialogOpen(false);
    setEditingId(null);
  };
  
  const handleDelete = (id: string) => {
    setMaintenanceTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Wartungsaufgabe gelöscht');
  };
  
  const handleStatusChange = (id: string, status: MaintenanceTask['status']) => {
    setMaintenanceTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status, completedDate: status === 'completed' ? new Date().toISOString().split('T')[0] : t.completedDate } : t
    ));
    toast.success('Status aktualisiert');
  };
  
  const getPropertyName = (propertyId: string) => {
    const property = store.properties.find(p => p.id === propertyId);
    return property?.name || 'Unbekannt';
  };
  
  const categoryLabels = {
    heating: 'Heizung',
    plumbing: 'Sanitär',
    electrical: 'Elektro',
    painting: 'Malerarbeiten',
    roofing: 'Dach',
    general: 'Allgemein',
    inspection: 'Inspektion',
  };
  
  const priorityLabels = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    urgent: 'Dringend',
  };
  
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  
  const statusLabels = {
    pending: 'Geplant',
    in_progress: 'In Bearbeitung',
    completed: 'Erledigt',
    cancelled: 'Abgebrochen',
  };
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };
  
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    return maintenanceTasks
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .filter(t => new Date(t.scheduledDate) >= today)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5);
  }, [maintenanceTasks]);
  
  const stats = useMemo(() => ({
    total: maintenanceTasks.length,
    pending: maintenanceTasks.filter(t => t.status === 'pending').length,
    inProgress: maintenanceTasks.filter(t => t.status === 'in_progress').length,
    completed: maintenanceTasks.filter(t => t.status === 'completed').length,
    totalEstimated: maintenanceTasks.filter(t => t.status !== 'completed').reduce((sum, t) => sum + t.estimatedCost, 0),
  }), [maintenanceTasks]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Wartungsplaner</h1>
        <Button onClick={() => { setEditingId(null); setFormData({ propertyId: store.properties[0]?.id || '', title: '', category: 'general', priority: 'medium', status: 'pending', scheduledDate: new Date().toISOString().split('T')[0], estimatedCost: 0, notes: '' }); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Neue Wartung
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Geplant</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Bearbeitung</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Erledigt</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalEstimated)}</div>
            <p className="text-sm text-muted-foreground">Kosten (offen)</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock4 className="h-5 w-5" />
              Nächste Wartungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{getPropertyName(task.propertyId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{task.scheduledDate}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(task.estimatedCost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Filters */}
      <Card className="bg-card">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Immobilie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Immobilien</SelectItem>
                {store.properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="pending">Geplant</SelectItem>
                <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                <SelectItem value="completed">Erledigt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Tasks Table */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Wartungsaufgaben</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Immobilie</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Aufgabe</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kategorie</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priorität</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Termin</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Kosten</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{getPropertyName(task.propertyId)}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </td>
                    <td className="py-3 px-4">{categoryLabels[task.category]}</td>
                    <td className="py-3 px-4"><Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge></td>
                    <td className="py-3 px-4">{task.scheduledDate}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(task.actualCost || task.estimatedCost)}</td>
                    <td className="py-3 px-4"><Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge></td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        {task.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'in_progress')}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'completed')}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(task.id); setFormData(task); setDialogOpen(true); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTasks.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">Keine Wartungsaufgaben gefunden</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Wartung bearbeiten' : 'Neue Wartung'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Immobilie *</Label>
              <Select value={formData.propertyId} onValueChange={(v) => setFormData({ ...formData, propertyId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {store.properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titel *</Label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategorie</Label>
                <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heating">Heizung</SelectItem>
                    <SelectItem value="plumbing">Sanitär</SelectItem>
                    <SelectItem value="electrical">Elektro</SelectItem>
                    <SelectItem value="painting">Malerarbeiten</SelectItem>
                    <SelectItem value="roofing">Dach</SelectItem>
                    <SelectItem value="general">Allgemein</SelectItem>
                    <SelectItem value="inspection">Inspektion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorität</Label>
                <Select value={formData.priority} onValueChange={(v: any) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="urgent">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Termin *</Label>
                <Input type="date" value={formData.scheduledDate || ''} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} />
              </div>
              <div>
                <Label>Geschätzte Kosten (€)</Label>
                <Input type="number" value={formData.estimatedCost || ''} onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Handwerker / Firma</Label>
              <Input value={formData.contractor || ''} onChange={(e) => setFormData({ ...formData, contractor: e.target.value })} />
            </div>
            <div>
              <Label>Notizen</Label>
              <Textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// BANK IMPORT SECTION (Bank-Integration)
// ============================================
function BankImportSection() {
  const store = useStore();
  const { formatCurrency } = useI18n();
  const [importedTransactions, setImportedTransactions] = useState<any[]>([]);
  const [matchedTransactions, setMatchedTransactions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        // Parse CSV (German bank format)
        const lines = content.split('\n');
        const transactions: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Try to parse CSV with semicolon separator (German format)
          const parts = line.split(';');
          if (parts.length >= 4) {
            const date = parts[0]?.replace(/"/g, '').trim();
            const description = parts[2]?.replace(/"/g, '').trim() || parts[1]?.replace(/"/g, '').trim();
            const amountStr = parts[parts.length - 2]?.replace(/"/g, '').replace(',', '.').trim();
            const amount = parseFloat(amountStr) || 0;
            
            if (date && amount !== 0) {
              transactions.push({
                id: `bank-${Date.now()}-${i}`,
                date: parseGermanDate(date),
                description,
                amount,
                status: 'unmatched',
              });
            }
          }
        }
        
        setImportedTransactions(transactions);
        toast.success(`${transactions.length} Transaktionen importiert`);
        
        // Auto-match transactions
        autoMatchTransactions(transactions);
      } catch (error) {
        toast.error('Fehler beim Lesen der Datei');
      }
    };
    reader.readAsText(file);
  };
  
  const parseGermanDate = (dateStr: string): string => {
    // Try DD.MM.YYYY format
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    // Try YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    return new Date().toISOString().split('T')[0];
  };
  
  const autoMatchTransactions = (transactions: any[]) => {
    const matched: any[] = [];
    
    transactions.forEach(t => {
      // Try to match with tenants
      const tenantMatch = store.tenants.find(tenant => {
        const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
        return t.description.toLowerCase().includes(fullName) || 
               t.description.toLowerCase().includes(tenant.lastName.toLowerCase());
      });
      
      if (tenantMatch) {
        matched.push({
          ...t,
          tenantId: tenantMatch.id,
          unitId: tenantMatch.unitId,
          propertyId: store.units.find(u => u.id === tenantMatch.unitId)?.propertyId,
          matchType: 'tenant',
          matchConfidence: 0.9,
        });
      }
    });
    
    setMatchedTransactions(matched);
  };
  
  const handleImportSelected = () => {
    matchedTransactions.forEach(t => {
      if (t.status === 'confirmed') {
        store.addTransaction({
          propertyId: t.propertyId,
          unitId: t.unitId,
          type: t.amount > 0 ? 'income' : 'expense',
          category: 'rent',
          amount: Math.abs(t.amount),
          date: t.date,
          description: t.description,
          isRecurring: false,
        });
      }
    });
    
    toast.success(`${matchedTransactions.filter(t => t.status === 'confirmed').length} Transaktionen importiert`);
    setImportedTransactions([]);
    setMatchedTransactions([]);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bank-Import</h1>
      </div>
      
      {/* Upload Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Kontoauszug importieren
          </CardTitle>
          <CardDescription>
            Laden Sie einen Kontoauszug im CSV-Format hoch. Unterstützt werden deutsche Bankformate (CAMT.053, CSV).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Datei hier ablegen oder klicken</p>
            <p className="text-sm text-muted-foreground mt-1">CSV, MT940 oder CAMT.053</p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Imported Transactions */}
      {importedTransactions.length > 0 && (
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Importierte Transaktionen ({importedTransactions.length})</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600">
                  {matchedTransactions.length} automatisch zugeordnet
                </Badge>
                <Button onClick={handleImportSelected} className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="h-4 w-4 mr-2" />
                  Ausgewählte importieren
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Datum</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Beschreibung</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Betrag</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Zuordnung</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importedTransactions.map((t, idx) => {
                    const match = matchedTransactions.find(m => m.id === t.id);
                    return (
                      <tr key={t.id || idx} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4">{t.date}</td>
                        <td className="py-3 px-4 max-w-xs truncate">{t.description}</td>
                        <td className={`py-3 px-4 text-right font-medium ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(t.amount))}
                        </td>
                        <td className="py-3 px-4">
                          {match ? (
                            <span className="text-emerald-600">
                              {store.tenants.find(t => t.id === match.tenantId)?.firstName} {store.tenants.find(t => t.id === match.tenantId)?.lastName}
                            </span>
                          ) : (
                            <Select onValueChange={(v) => {
                              const tenant = store.tenants.find(t => t.id === v);
                              if (tenant) {
                                setMatchedTransactions(prev => [...prev.filter(m => m.id !== t.id), {
                                  ...t,
                                  tenantId: v,
                                  unitId: tenant.unitId,
                                  propertyId: store.units.find(u => u.id === tenant.unitId)?.propertyId,
                                  status: 'confirmed',
                                }]);
                              }
                            }}>
                              <SelectTrigger className="w-40"><SelectValue placeholder="Zuordnen" /></SelectTrigger>
                              <SelectContent>
                                {store.tenants.map(tenant => (
                                  <SelectItem key={tenant.id} value={tenant.id}>
                                    {tenant.firstName} {tenant.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {match ? (
                            <Badge className="bg-green-100 text-green-800">Zugeordnet</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600">Offen</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Help Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            So funktioniert der Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 font-bold">1</div>
              <div>
                <p className="font-medium">Kontoauszug herunterladen</p>
                <p className="text-sm text-muted-foreground">Exportieren Sie Ihre Umsätze aus dem Online-Banking als CSV oder CAMT.053</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 font-bold">2</div>
              <div>
                <p className="font-medium">Datei hochladen</p>
                <p className="text-sm text-muted-foreground">Laden Sie die Datei hier hoch. Das System analysiert automatisch die Transaktionen.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 font-bold">3</div>
              <div>
                <p className="font-medium">Zuordnen & Importieren</p>
                <p className="text-sm text-muted-foreground">Bestätigen Sie die automatische Zuordnung oder weisen Sie Transaktionen manuell zu.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// TAXES SECTION
// ============================================
function TaxesSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  
  const taxSummary = useMemo(() => {
    const year = new Date().getFullYear();
    const yearTransactions = store.transactions.filter(tr => new Date(tr.date).getFullYear() === year);
    
    const income = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const depreciation = store.depreciationItems.reduce((sum, d) => sum + d.annualDepreciation, 0);
    const taxableIncome = income - expenses - depreciation;
    
    // Geschätzte Steuer (angenommen 25% Durchschnittssteuersatz)
    const estimatedTax = Math.max(0, taxableIncome * 0.25);
    
    return { income, expenses, depreciation, taxableIncome, estimatedTax };
  }, [store.transactions, store.depreciationItems]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Steuern</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Einnahmen (Jahr)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(taxSummary.income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ausgaben (Jahr)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(taxSummary.expenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Abschreibungen</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(taxSummary.depreciation)}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Steuerliche Berechnung</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span>Bruttoeinnahmen</span>
            <span className="font-medium">{formatCurrency(taxSummary.income)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>- Ausgaben</span>
            <span className="font-medium text-red-600">-{formatCurrency(taxSummary.expenses)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>- Abschreibungen</span>
            <span className="font-medium text-blue-600">-{formatCurrency(taxSummary.depreciation)}</span>
          </div>
          <div className="flex justify-between py-2 border-b font-bold">
            <span>Steuerpflichtiges Einkommen</span>
            <span>{formatCurrency(taxSummary.taxableIncome)}</span>
          </div>
          <div className="flex justify-between py-2 bg-muted rounded p-3">
            <span className="font-bold">Geschätzte Steuerlast (25%)</span>
            <span className="font-bold text-red-600">{formatCurrency(taxSummary.estimatedTax)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// RESERVES SECTION
// ============================================
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

// ============================================
// PROPERTY MANAGEMENT SECTION
// ============================================
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

// ============================================
// SALES SECTION
// ============================================
function SalesSection() {
  const store = useStore();
  const { t, formatCurrency } = useI18n();
  
  const salesAnalysis = useMemo(() => {
    return store.properties.map(p => {
      const appreciation = p.estimatedValue || p.marketValue - p.purchasePrice;
      const appreciationPercent = p.purchasePrice > 0 ? (appreciation / p.purchasePrice) * 100 : 0;
      const annualReturn = appreciationPercent / Math.max(1, (new Date().getFullYear() - new Date(p.purchaseDate || new Date()).getFullYear()));
      
      return {
        ...p,
        appreciation,
        appreciationPercent,
        annualReturn,
      };
    }).sort((a, b) => b.appreciationPercent - a.appreciationPercent);
  }, [store.properties]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Verkauf</h1>
      
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Verkaufs-Analyse
          </CardTitle>
          <CardDescription>Potenzielle Gewinne bei Verkauf</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Gesamtkaufpreis</p>
              <p className="text-xl font-bold">{formatCurrency(store.properties.reduce((sum, p) => sum + p.purchasePrice, 0))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Geschätzter Wert</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(store.properties.reduce((sum, p) => sum + (p.estimatedValue || p.marketValue), 0))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potenzieller Gewinn</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(store.properties.reduce((sum, p) => sum + ((p.estimatedValue || p.marketValue) - p.purchasePrice), 0))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Immobilien nach Wertsteigerung</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Immobilie</th>
                <th className="text-right p-4">Kaufpreis</th>
                <th className="text-right p-4">Schätzwert</th>
                <th className="text-right p-4">Steigerung</th>
                <th className="text-right p-4">%/Jahr</th>
              </tr>
            </thead>
            <tbody>
              {salesAnalysis.map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-right">{formatCurrency(p.purchasePrice)}</td>
                  <td className="p-4 text-right">{formatCurrency(p.estimatedValue || p.marketValue)}</td>
                  <td className={`p-4 text-right font-bold ${p.appreciation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(p.appreciation)}
                  </td>
                  <td className={`p-4 text-right ${p.annualReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {p.annualReturn.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// NEW PURCHASE SECTION
// ============================================
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
