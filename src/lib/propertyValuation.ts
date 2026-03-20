// ImmoScout24-ähnliche Immobilienbewertung
// Basierend auf dem Vergleichswertverfahren mit KI-Anpassungen

import type { Property } from './types';

/**
 * Berechnet den geschätzten Immobilienwert basierend auf ImmoScout24-Algorithmus
 * 
 * Faktoren:
 * 1. Lage (Location) - Wichtigster Faktor (40% Gewichtung)
 * 2. Wohnfläche (Area) - Preis pro m² (25% Gewichtung)
 * 3. Baujahr/Alter (Age) - Altersabschreibung (15% Gewichtung)
 * 4. Zustand (Condition) - Renovierungsgrad (10% Gewichtung)
 * 5. Energieeffizienz (Energy) - Energieklasse (5% Gewichtung)
 * 6. Immobilien-Typ (Type) - Art der Immobilie (5% Gewichtung)
 */

// Durchschnittspreise pro m² nach Stadt (Beispieldaten, in der Praxis aus API)
const averagePricePerSqmByCity: Record<string, number> = {
  // Top-Lagen (München, Hamburg, Frankfurt, Berlin)
  'münchen': 8500,
  'hamburg': 5500,
  'frankfurt': 5500,
  'berlin': 4800,
  'stuttgart': 4500,
  'düsseldorf': 4200,
  'köln': 4000,
  'dortmund': 2200,
  'essen': 2100,
  'leipzig': 2800,
  'dresden': 3200,
  'hannover': 2800,
  'nürnberg': 3800,
  'bochum': 2000,
  'wuppertal': 1800,
  'datteln': 1900,
  'wien': 6000,
  'zürich': 12000,
};

// Lagequalitäts-Faktor
const locationQualityFactor: Record<string, number> = {
  'top': 1.25,        // +25%
  'good': 1.10,       // +10%
  'average': 1.00,    // 0%
  'below_average': 0.85, // -15%
};

// Zustands-Faktor
const conditionFactor: Record<string, number> = {
  'excellent': 1.15,      // Neuwertig/Saniert
  'good': 1.00,           // Gut
  'fair': 0.85,           // Mittel
  'needs_renovation': 0.70, // Renovierungsbedürftig
};

// Energieklasse-Faktor
const energyClassFactor: Record<string, number> = {
  'A': 1.08,
  'B': 1.05,
  'C': 1.02,
  'D': 1.00,
  'E': 0.97,
  'F': 0.94,
  'G': 0.90,
  'H': 0.85,
  'unknown': 1.00,
};

// Immobilien-Typ Faktor
const propertyTypeFactor: Record<string, number> = {
  'apartment': 1.00,
  'house': 1.15,
  'commercial': 0.90,
  'mixed': 0.95,
};

/**
 * Berechnet das Alter der Immobilie und den Abschreibungsfaktor
 * Lineare Abschreibung: 2% pro Jahr für erste 30 Jahre, dann 1%
 */
function calculateAgeDepreciation(yearBuilt: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  
  if (age <= 0) return 1.00; // Neubau
  if (age <= 10) return 1.00 - (age * 0.005); // 0.5% pro Jahr für erste 10 Jahre
  if (age <= 30) return 0.95 - ((age - 10) * 0.01); // 1% pro Jahr für Jahre 11-30
  if (age <= 50) return 0.75 - ((age - 30) * 0.005); // 0.5% pro Jahr für Jahre 31-50
  return 0.65; // Mindestwert für sehr alte Gebäude
}

/**
 * Berechnet einen lokalen Markttrend-Faktor
 * In der Praxis würde dies aus aktuellen Verkaufsdaten berechnet
 */
function calculateMarketTrend(city: string): number {
  // Vereinfachte Markttrends (in Praxis aus API)
  const trends: Record<string, number> = {
    'münchen': 1.05,
    'hamburg': 1.03,
    'berlin': 1.08,
    'frankfurt': 1.04,
    'dortmund': 1.02,
    'default': 1.00,
  };
  
  const normalizedCity = city.toLowerCase().trim();
  return trends[normalizedCity] || trends['default'];
}

/**
 * Hauptfunktion: Berechnet den geschätzten Immobilienwert
 */
export function calculateEstimatedValue(property: {
  city: string;
  totalArea: number;
  yearBuilt: number;
  condition: Property['condition'];
  energyClass: Property['energyClass'];
  propertyType: Property['propertyType'];
  locationQuality: Property['locationQuality'];
  purchasePrice: number;
}): {
  estimatedValue: number;
  pricePerSqm: number;
  factors: {
    basePrice: number;
    locationFactor: number;
    ageFactor: number;
    conditionFactor: number;
    energyFactor: number;
    typeFactor: number;
    marketTrend: number;
  };
} {
  // 1. Basis-Preis pro m² ermitteln
  const normalizedCity = property.city.toLowerCase().trim();
  const basePricePerSqm = averagePricePerSqmByCity[normalizedCity] || 2500; // Default wenn Stadt nicht gefunden
  
  // 2. Faktoren berechnen
  const locationFactor = locationQualityFactor[property.locationQuality] || 1.00;
  const ageFactor = calculateAgeDepreciation(property.yearBuilt);
  const conditionF = conditionFactor[property.condition] || 1.00;
  const energyF = energyClassFactor[property.energyClass] || 1.00;
  const typeF = propertyTypeFactor[property.propertyType] || 1.00;
  const marketTrend = calculateMarketTrend(property.city);
  
  // 3. Preis pro m² mit Faktoren berechnen
  const adjustedPricePerSqm = basePricePerSqm * 
    locationFactor * 
    ageFactor * 
    conditionF * 
    energyF * 
    typeF * 
    marketTrend;
  
  // 4. Gesamtwert berechnen
  let estimatedValue = Math.round(adjustedPricePerSqm * property.totalArea);
  
  // 5. Plausibilitätsprüfung: Nicht weniger als 50% des Kaufpreises
  const minValue = property.purchasePrice * 0.5;
  if (estimatedValue < minValue) {
    estimatedValue = Math.round(minValue);
  }
  
  // 6. Auf glatte 1000 runden
  estimatedValue = Math.round(estimatedValue / 1000) * 1000;
  
  return {
    estimatedValue,
    pricePerSqm: Math.round(adjustedPricePerSqm),
    factors: {
      basePrice: basePricePerSqm,
      locationFactor,
      ageFactor,
      conditionFactor: conditionF,
      energyFactor: energyF,
      typeFactor: typeF,
      marketTrend,
    },
  };
}

/**
 * Formatiert die Schätzung für die Anzeige
 */
export function formatEstimationDetails(factors: {
  basePrice: number;
  locationFactor: number;
  ageFactor: number;
  conditionFactor: number;
  energyFactor: number;
  typeFactor: number;
  marketTrend: number;
}): string[] {
  const details: string[] = [];
  
  details.push(`Basispreis: ${factors.basePrice.toLocaleString('de-DE')} €/m²`);
  
  if (factors.locationFactor !== 1) {
    const change = ((factors.locationFactor - 1) * 100).toFixed(0);
    details.push(`Lage: ${factors.locationFactor > 1 ? '+' : ''}${change}%`);
  }
  
  if (factors.ageFactor !== 1) {
    const change = ((factors.ageFactor - 1) * 100).toFixed(0);
    details.push(`Alter: ${change}%`);
  }
  
  if (factors.conditionFactor !== 1) {
    const change = ((factors.conditionFactor - 1) * 100).toFixed(0);
    details.push(`Zustand: ${factors.conditionFactor > 1 ? '+' : ''}${change}%`);
  }
  
  if (factors.energyFactor !== 1) {
    const change = ((factors.energyFactor - 1) * 100).toFixed(0);
    details.push(`Energie: ${factors.energyFactor > 1 ? '+' : ''}${change}%`);
  }
  
  if (factors.marketTrend !== 1) {
    const change = ((factors.marketTrend - 1) * 100).toFixed(0);
    details.push(`Markt: ${factors.marketTrend > 1 ? '+' : ''}${change}%`);
  }
  
  return details;
}

/**
 * Berechnet die Wertentwicklung (prognostiziert)
 */
export function calculateValueProjection(
  currentValue: number,
  years: number = 5,
  annualGrowthRate: number = 0.03 // 3% p.a. als Durchschnitt
): { year: number; value: number }[] {
  const projections: { year: number; value: number }[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 1; i <= years; i++) {
    const projectedValue = currentValue * Math.pow(1 + annualGrowthRate, i);
    projections.push({
      year: currentYear + i,
      value: Math.round(projectedValue / 1000) * 1000,
    });
  }
  
  return projections;
}
