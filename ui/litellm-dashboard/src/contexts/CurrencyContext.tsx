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
    // Load rate from localStorage or set default
    if (typeof window !== 'undefined') {
      const savedRate = localStorage.getItem('usdToBrlRate');
      if (savedRate) {
        setRate(parseFloat(savedRate));
      }
    }
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