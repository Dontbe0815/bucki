'use client';

/**
 * Onboarding Wizard Component
 * Step-by-step guide for first-time users of Bucki
 * 
 * @module components/onboarding/OnboardingWizard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Building2, DoorOpen, Users, Sparkles, Check, ChevronLeft, ChevronRight, SkipForward,
  Plus, Settings, BarChart3, FileText, CreditCard
} from 'lucide-react';

const ONBOARDING_COMPLETED_KEY = 'bucki-onboarding-completed';

export interface OnboardingStep {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  language: 'de' | 'en';
}

const steps: Omit<OnboardingStep, 'content'>[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Bucki',
    titleEn: 'Welcome to Bucki',
    description: 'Ihre Immobilienverwaltung auf einen Blick',
    descriptionEn: 'Your property management at a glance',
    icon: <Sparkles className="h-8 w-8 text-emerald-500" />,
  },
  {
    id: 'property',
    title: 'Immobilie hinzufügen',
    titleEn: 'Add your first property',
    description: 'Erfassen Sie Ihre erste Immobilie mit allen wichtigen Daten',
    descriptionEn: 'Add your first property with all important details',
    icon: <Building2 className="h-8 w-8 text-blue-500" />,
  },
  {
    id: 'units',
    title: 'Einheiten konfigurieren',
    titleEn: 'Configure units',
    description: 'Definieren Sie Wohnungen, Flächen und Mieten',
    descriptionEn: 'Define apartments, areas, and rents',
    icon: <DoorOpen className="h-8 w-8 text-purple-500" />,
  },
  {
    id: 'tenants',
    title: 'Mieter anlegen',
    titleEn: 'Set up tenants',
    description: 'Verwalten Sie Ihre Mieter und Verträge',
    descriptionEn: 'Manage your tenants and contracts',
    icon: <Users className="h-8 w-8 text-orange-500" />,
  },
  {
    id: 'features',
    title: 'Features entdecken',
    titleEn: 'Explore features',
    description: 'Lernen Sie die wichtigsten Funktionen kennen',
    descriptionEn: 'Get to know the key features',
    icon: <BarChart3 className="h-8 w-8 text-pink-500" />,
  },
];

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
}

export function setOnboardingCompleted(): void {
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
}

export default function OnboardingWizard({ onComplete, language }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  const isGerman = language === 'de';
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    } else {
      setOnboardingCompleted();
      onComplete();
    }
  }, [currentStep, onComplete]);
  
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const handleSkip = useCallback(() => {
    setOnboardingCompleted();
    onComplete();
  }, [onComplete]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, handleSkip]);
  
  const step = steps[currentStep];
  
  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Building2 className="h-5 w-5" />, label: isGerman ? 'Immobilien' : 'Properties' },
                { icon: <Users className="h-5 w-5" />, label: isGerman ? 'Mieter' : 'Tenants' },
                { icon: <CreditCard className="h-5 w-5" />, label: isGerman ? 'Finanzen' : 'Finances' },
                { icon: <FileText className="h-5 w-5" />, label: isGerman ? 'Dokumente' : 'Documents' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="text-emerald-500">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {isGerman 
                ? 'Bucki hilft Ihnen, Ihre Immobilien professionell zu verwalten.'
                : 'Bucki helps you manage your properties professionally.'}
            </p>
          </div>
        );
        
      case 'property':
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-xs p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg text-center">
                <Plus className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-medium">
                  {isGerman ? 'Neue Immobilie' : 'New Property'}
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{isGerman ? 'Name & Adresse' : 'Name & Address'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{isGerman ? 'Kaufpreis & Marktwert' : 'Purchase & Market Value'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{isGerman ? 'Baujahr & Fläche' : 'Year Built & Area'}</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'units':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {['1. OG', '2. OG', 'EG'].map((floor, i) => (
                <div key={i} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                  <DoorOpen className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs font-medium">{floor}</p>
                  <p className="text-xs text-muted-foreground">{75 + i * 10} m²</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                {isGerman ? 'Wohnfläche & Zimmer' : 'Area & Rooms'}
              </p>
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                {isGerman ? 'Kaltmiete & Nebenkosten' : 'Base Rent & Utilities'}
              </p>
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                {isGerman ? 'Status: Vermietet/Leer' : 'Status: Rented/Vacant'}
              </p>
            </div>
          </div>
        );
        
      case 'tenants':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Max Mustermann</p>
                <p className="text-xs text-muted-foreground">max@example.com</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">€850</p>
                <p className="text-xs text-muted-foreground">
                  {isGerman ? 'Warmmiete' : 'Total Rent'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-muted/30 rounded text-center">
                <p className="font-medium">{isGerman ? 'Vertrag' : 'Contract'}</p>
                <p className="text-xs text-muted-foreground">PDF</p>
              </div>
              <div className="p-2 bg-muted/30 rounded text-center">
                <p className="font-medium">{isGerman ? 'Kaution' : 'Deposit'}</p>
                <p className="text-xs text-muted-foreground">€1.700</p>
              </div>
            </div>
          </div>
        );
        
      case 'features':
        return (
          <div className="space-y-3">
            {[
              { icon: <BarChart3 className="h-5 w-5" />, label: isGerman ? 'Dashboard & KPIs' : 'Dashboard & KPIs', color: 'text-pink-500' },
              { icon: <CreditCard className="h-5 w-5" />, label: isGerman ? 'Cashflow-Tracking' : 'Cashflow Tracking', color: 'text-emerald-500' },
              { icon: <FileText className="h-5 w-5" />, label: isGerman ? 'Dokumentenablage' : 'Document Storage', color: 'text-blue-500' },
              { icon: <Settings className="h-5 w-5" />, label: isGerman ? 'Einstellungen' : 'Settings', color: 'text-gray-500' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <div className={feature.color}>{feature.icon}</div>
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
            <p className="text-xs text-center text-muted-foreground pt-2">
              {isGerman 
                ? 'Drücken Sie ? für Tastaturkürzel'
                : 'Press ? for keyboard shortcuts'}
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          {/* Progress */}
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {isGerman ? 'Schritt' : 'Step'} {currentStep + 1} {isGerman ? 'von' : 'of'} {steps.length}
            </p>
          </div>
          
          {/* Step indicator */}
          <div className="flex justify-center gap-1 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep 
                    ? 'bg-emerald-500' 
                    : i < currentStep 
                      ? 'bg-emerald-300' 
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {step.icon}
          </div>
          
          <CardTitle className="text-xl">
            {isGerman ? step.title : step.titleEn}
          </CardTitle>
          <CardDescription>
            {isGerman ? step.description : step.descriptionEn}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-4">
          {renderStepContent()}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            <SkipForward className="h-4 w-4 mr-1" />
            {isGerman ? 'Überspringen' : 'Skip'}
          </Button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {isGerman ? 'Zurück' : 'Back'}
              </Button>
            )}
            <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
              {currentStep === steps.length - 1 
                ? (isGerman ? 'Starten' : 'Get Started')
                : (isGerman ? 'Weiter' : 'Next')}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
