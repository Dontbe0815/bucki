'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translations, Language, TranslationStrings } from '@/lib/i18n/translations';
import type { Currency } from '@/lib/types';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationStrings;
  formatCurrency: (amount: number, currency?: Currency) => string;
  formatDate: (dateString: string) => string;
  formatNumber: (num: number) => string;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRates: Record<Currency, number>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'bucki-language';
const CURRENCY_STORAGE_KEY = 'bucki-currency';

// Static exchange rates (base: EUR)
const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.95,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('de');
  const [currency, setCurrencyState] = useState<Currency>('EUR');
  const [exchangeRates] = useState<Record<Currency, number>>(DEFAULT_EXCHANGE_RATES);

  // Load language and currency from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
      
      queueMicrotask(() => {
        if (savedLanguage && (savedLanguage === 'de' || savedLanguage === 'en')) {
          setLanguageState(savedLanguage);
        } else {
          const browserLang = navigator.language.toLowerCase();
          if (browserLang.startsWith('de')) {
            setLanguageState('de');
          } else {
            setLanguageState('en');
          }
        }
        
        if (savedCurrency && ['EUR', 'USD', 'GBP', 'CHF'].includes(savedCurrency)) {
          setCurrencyState(savedCurrency);
        }
      });
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  const setCurrency = useCallback((curr: Currency) => {
    setCurrencyState(curr);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENCY_STORAGE_KEY, curr);
    }
  }, []);

  const formatCurrency = useCallback((amount: number, targetCurrency?: Currency) => {
    const curr = targetCurrency || currency;
    const locale = language === 'de' ? 'de-DE' : 'en-US';
    
    // Convert from EUR to target currency if needed
    const convertedAmount = curr === 'EUR' ? amount : amount * exchangeRates[curr];
    
    if (curr === 'CHF') {
      // CHF doesn't use the standard currency format in all locales
      return `${new Intl.NumberFormat(locale, { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedAmount)} ${CURRENCY_SYMBOLS[curr]}`;
    }
    
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: curr 
    }).format(convertedAmount);
  }, [language, currency, exchangeRates]);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '-';
    const locale = language === 'de' ? 'de-DE' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [language]);

  const formatNumber = useCallback((num: number) => {
    const locale = language === 'de' ? 'de-DE' : 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
    formatCurrency,
    formatDate,
    formatNumber,
    currency,
    setCurrency,
    exchangeRates,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Export for convenience
export { translations };
export type { Language, TranslationStrings };
