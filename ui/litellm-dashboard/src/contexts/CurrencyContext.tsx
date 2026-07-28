'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Currency } from '@/utils/currencyUtils';

interface CurrencyContextType {
  currency: Currency;
  rate: number;
  symbol: string;
  setCurrency?: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('displayCurrency');
      return saved === 'BRL' ? 'BRL' : 'USD';
    }
    return 'USD';
  });

  const [rate, setRate] = useState<number>(5.30);  

  useEffect(() => {
    // Load currency and rate from the public API endpoint
    const fetchCurrencyConfig = async () => {
      try {
        const response = await fetch('/public/currency-config');
        if (response.ok) {
          const config = await response.json();
          setRate(config.rate);
          // Only update currency if it's not set yet (avoid overriding user preference)
          if (typeof window !== 'undefined') {
            const savedCurrency = localStorage.getItem('displayCurrency');
            if (!savedCurrency) {
              setCurrency(config.currency);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch currency config:', error);
        // Fallback to localStorage or default value
        if (typeof window !== 'undefined') {
          const savedRate = localStorage.getItem('usdToBrlRate');
          if (savedRate) {
            setRate(parseFloat(savedRate));
          }
        }
      }
    };

    fetchCurrencyConfig();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('displayCurrency', currency);
    }
  }, [currency]);

  const value = {
    currency,
    rate,
    symbol: currency === 'BRL' ? 'R$' : '$',
    setCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};