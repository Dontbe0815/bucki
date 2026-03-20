'use client';

/**
 * Help Tooltip Component
 * Reusable tooltip with help icon and explanations
 * 
 * @module components/common/HelpTooltip
 */

import React from 'react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { HelpCircle, ExternalLink, Info } from 'lucide-react';

export interface HelpTooltipProps {
  title: string;
  description: string;
  docLink?: string;
  icon?: 'help' | 'info';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  language?: 'de' | 'en';
}

export default function HelpTooltip({
  title,
  description,
  docLink,
  icon = 'help',
  side = 'top',
  align = 'center',
  language = 'de',
}: HelpTooltipProps) {
  const IconComponent = icon === 'help' ? HelpCircle : Info;
  const isGerman = language === 'de';
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <IconComponent className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className="max-w-xs p-3"
          sideOffset={5}
        >
          <div className="space-y-2">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            {docLink && (
              <a
                href={docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                {isGerman ? 'Mehr erfahren' : 'Learn more'}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Pre-defined tooltips for common financial metrics
export function LTVTooltip({ language = 'de' }: { language?: 'de' | 'en' }) {
  const isGerman = language === 'de';
  
  return (
    <HelpTooltip
      title={isGerman ? 'Loan-to-Value (LTV)' : 'Loan-to-Value (LTV)'}
      description={
        isGerman
          ? 'Das Verhältnis von Kreditbetrag zum Verkehrswert der Immobilie. Ein niedriger LTV (unter 80%) gilt als sicherer. Banken nutzen diesen Wert zur Risikobewertung.'
          : 'The ratio of loan amount to the market value of the property. A lower LTV (under 80%) is considered safer. Banks use this value for risk assessment.'
      }
      docLink="https://de.wikipedia.org/wiki/Loan-to-Value"
      language={language}
    />
  );
}

export function ROETooltip({ language = 'de' }: { language?: 'de' | 'en' }) {
  const isGerman = language === 'de';
  
  return (
    <HelpTooltip
      title={isGerman ? 'Eigenkapitalrendite (ROE)' : 'Return on Equity (ROE)'}
      description={
        isGerman
          ? 'Die Rendite auf das eingesetzte Eigenkapital. Berechnet als (Jahresüberschuss / Eigenkapital) × 100. Eine ROE über 10% gilt als gute Investition.'
          : 'The return on invested equity. Calculated as (Annual profit / Equity) × 100. An ROE above 10% is considered a good investment.'
      }
      language={language}
    />
  );
}

export function DepreciationTooltip({ language = 'de' }: { language?: 'de' | 'en' }) {
  const isGerman = language === 'de';
  
  return (
    <HelpTooltip
      title={isGerman ? 'Abschreibung (AfA)' : 'Depreciation'}
      description={
        isGerman
          ? 'Die steuerlich absetzbare Wertminderung. Gebäude werden linear über 2-3% p.a. abgeschrieben (40-50 Jahre). Möbel und Inventar haben kürzere Zeiträume (5-10 Jahre).'
          : 'The tax-deductible decrease in value. Buildings are depreciated linearly at 2-3% p.a. (40-50 years). Furniture and inventory have shorter periods (5-10 years).'
      }
      docLink="https://de.wikipedia.org/wiki/Abschreibung"
      language={language}
    />
  );
}

export function DepreciationCategoryTooltip({ 
  category, 
  language = 'de' 
}: { 
  category: 'gebaeude' | 'moebel' | 'kueche' | 'elektro' | 'inventar' | 'ausstattung' | 'sonstiges';
  language?: 'de' | 'en';
}) {
  const isGerman = language === 'de';
  
  const categoryInfo: Record<string, { title: string; titleEn: string; description: string; descriptionEn: string }> = {
    gebaeude: {
      title: 'Gebäude-AfA',
      titleEn: 'Building Depreciation',
      description: 'Lineare Abschreibung für Gebäude, je nach Baujahr 2-3% p.a. über 40-50 Jahre.',
      descriptionEn: 'Linear depreciation for buildings, depending on year built 2-3% p.a. over 40-50 years.',
    },
    moebel: {
      title: 'Möbel',
      titleEn: 'Furniture',
      description: 'Einrichtung und Möblierung, typischerweise 10 Jahre Nutzungsdauer (10% p.a.).',
      descriptionEn: 'Furnishings and furniture, typically 10 years useful life (10% p.a.).',
    },
    kueche: {
      title: 'Küche',
      titleEn: 'Kitchen',
      description: 'Einbauküchen und -geräte, 10-15 Jahre Nutzungsdauer je nach Qualität.',
      descriptionEn: 'Built-in kitchens and appliances, 10-15 years useful life depending on quality.',
    },
    elektro: {
      title: 'Elektrogeräte',
      titleEn: 'Electronics',
      description: 'Haushaltsgeräte wie Waschmaschine, Kühlschrank, etc. Ca. 5-10 Jahre.',
      descriptionEn: 'Household appliances like washing machine, refrigerator, etc. About 5-10 years.',
    },
    inventar: {
      title: 'Inventar',
      titleEn: 'Inventory',
      description: 'Sonstiges Inventar wie Teppiche, Vorhänge, etc. 5-10 Jahre.',
      descriptionEn: 'Other inventory like carpets, curtains, etc. 5-10 years.',
    },
    ausstattung: {
      title: 'Ausstattung',
      titleEn: 'Equipment',
      description: 'Objektspezifische Ausstattungselemente, je nach Art 5-15 Jahre.',
      descriptionEn: 'Property-specific equipment elements, depending on type 5-15 years.',
    },
    sonstiges: {
      title: 'Sonstiges',
      titleEn: 'Other',
      description: 'Andere abschreibungsfähige Wirtschaftsgüter.',
      descriptionEn: 'Other depreciable assets.',
    },
  };
  
  const info = categoryInfo[category];
  
  return (
    <HelpTooltip
      title={isGerman ? info.title : info.titleEn}
      description={isGerman ? info.description : info.descriptionEn}
      language={language}
    />
  );
}

export function TaxFieldTooltip({ 
  field, 
  language = 'de' 
}: { 
  field: 'grundsteuer' | 'ertragsteuer' | 'gewerbesteuer' | 'spekulationsfrist';
  language?: 'de' | 'en';
}) {
  const isGerman = language === 'de';
  
  const fieldInfo: Record<string, { title: string; titleEn: string; description: string; descriptionEn: string }> = {
    grundsteuer: {
      title: 'Grundsteuer',
      titleEn: 'Property Tax',
      description: 'Jährliche Steuer auf Immobilienbesitz. Wird basierend auf Einheitswert und Hebesatz der Gemeinde berechnet.',
      descriptionEn: 'Annual tax on property ownership. Calculated based on assessed value and municipal tax rate.',
    },
    ertragsteuer: {
      title: 'Ertragsteuer',
      titleEn: 'Income Tax',
      description: 'Steuer auf Mieteinnahmen nach Abzug aller Werbungskosten. Progressiver Steuersatz je nach Gesamteinkommen.',
      descriptionEn: 'Tax on rental income after deducting all expenses. Progressive tax rate depending on total income.',
    },
    gewerbesteuer: {
      title: 'Gewerbesteuer',
      titleEn: 'Trade Tax',
      description: 'Fällig bei gewerblicher Vermietung (mehr als 3 Immobilien). Wird auf den Gewerbeertrag erhoben.',
      descriptionEn: 'Due for commercial rentals (more than 3 properties). Levied on trade income.',
    },
    spekulationsfrist: {
      title: 'Spekulationsfrist',
      titleEn: 'Speculation Period',
      description: 'Verkauf innerhalb von 10 Jahren nach Kauf ist steuerpflichtig (Spekulationsgewinn). Nach 10 Jahren steuerfrei.',
      descriptionEn: 'Sale within 10 years of purchase is taxable (speculative gain). After 10 years it is tax-free.',
    },
  };
  
  const info = fieldInfo[field];
  
  return (
    <HelpTooltip
      title={isGerman ? info.title : info.titleEn}
      description={isGerman ? info.description : info.descriptionEn}
      language={language}
    />
  );
}

export function CashOnCashTooltip({ language = 'de' }: { language?: 'de' | 'en' }) {
  const isGerman = language === 'de';
  
  return (
    <HelpTooltip
      title="Cash-on-Cash Return"
      description={
        isGerman
          ? 'Die Rendite auf das tatsächlich investierte Eigenkapital. Berechnet als (Jahres-Cashflow / Eigenkapital) × 100. Berücksichtigt nur liquide Mittel, keine Wertsteigerungen.'
          : 'The return on actually invested equity. Calculated as (Annual Cashflow / Equity) × 100. Only considers liquid funds, not appreciation.'
      }
      language={language}
    />
  );
}

export function MietrenditeTooltip({ language = 'de', type = 'brutto' }: { language?: 'de' | 'en'; type?: 'brutto' | 'netto' }) {
  const isGerman = language === 'de';
  
  const descriptions = {
    brutto: isGerman
      ? 'Jahreskaltmiete / Kaufpreis × 100. Ein einfacher Indikator ohne Berücksichtigung von Kosten. Gut für schnelle Vergleiche.'
      : 'Annual base rent / Purchase price × 100. A simple indicator without considering costs. Good for quick comparisons.',
    netto: isGerman
      ? 'Jahreskaltmiete abzüglich aller Kosten / Kaufpreis × 100. Genauer als Bruttorendite, da alle laufenden Kosten berücksichtigt werden.'
      : 'Annual base rent minus all costs / Purchase price × 100. More accurate than gross yield, as all ongoing costs are considered.',
  };
  
  return (
    <HelpTooltip
      title={isGerman ? `${type === 'brutto' ? 'Brutto' : 'Netto'}mietrendite` : `${type === 'brutto' ? 'Gross' : 'Net'} Rental Yield`}
      description={descriptions[type]}
      language={language}
    />
  );
}

export function LeerstandsquoteTooltip({ language = 'de' }: { language?: 'de' | 'en' }) {
  const isGerman = language === 'de';
  
  return (
    <HelpTooltip
      title={isGerman ? 'Leerstandsquote' : 'Vacancy Rate'}
      description={
        isGerman
          ? 'Anteil der leerstehenden Einheiten an der Gesamtanzahl. Eine Quote unter 5% gilt als gut. Berücksichtigt auch Renovierungsphasen.'
          : 'Proportion of vacant units to the total. A rate below 5% is considered good. Also considers renovation phases.'
      }
      language={language}
    />
  );
}

export function BreakEvenTooltip({ language = 'de' }: { language?: 'de' | 'en' }) {
  const isGerman = language === 'de';
  
  return (
    <HelpTooltip
      title={isGerman ? 'Break-even Punkt' : 'Break-even Point'}
      description={
        isGerman
          ? 'Zeitpunkt, zu dem die kumulierten Einnahmen die kumulierten Ausgaben decken. Je kürzer, desto besser. Hilfreich für Investitionsentscheidungen.'
          : 'Point in time when cumulative revenues cover cumulative expenses. The shorter, the better. Helpful for investment decisions.'
      }
      language={language}
    />
  );
}

export function KostenquoteTooltip({ language = 'de' }: { language?: 'de' | 'en' }) {
  const isGerman = language === 'de';
  
  return (
    <HelpTooltip
      title={isGerman ? 'Kostenquote' : 'Cost Ratio'}
      description={
        isGerman
          ? 'Verhältnis der Bewirtschaftungskosten zu den Einnahmen. Eine Quote unter 30% gilt als gut. Einschließlich Verwaltung, Instandhaltung, Versicherung.'
          : 'Ratio of operating costs to income. A ratio below 30% is considered good. Including management, maintenance, insurance.'
      }
      language={language}
    />
  );
}

// Inline help label component for forms
export function HelpLabel({
  children,
  title,
  description,
  language = 'de',
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  language?: 'de' | 'en';
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{children}</span>
      <HelpTooltip title={title} description={description} language={language} />
    </div>
  );
}
