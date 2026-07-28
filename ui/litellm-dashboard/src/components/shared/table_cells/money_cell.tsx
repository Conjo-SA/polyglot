"use client";

import { formatNumberWithCommas } from "@/utils/dataUtils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface MoneyCellProps {
  value: number | null | undefined;
  decimals?: number;
  emptyText?: string;
  showZero?: boolean;
}

export function MoneyCell({ value, decimals = 4, emptyText = "-", showZero = false }: MoneyCellProps) {
  const { currency, rate, symbol } = useCurrency();
  
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-muted-foreground">{emptyText}</span>;
  }
  if (value === 0) {
    if (!showZero) {
      return <span className="text-muted-foreground">-</span>;
    }
    const formattedValue = formatNumberWithCommas(0, decimals, false, true);
    return <span className="whitespace-nowrap">{`${symbol}${formattedValue}`}</span>;
  }
  
  const convertedValue = currency === "BRL" ? value * rate : value;
  const formattedValue = formatNumberWithCommas(convertedValue, decimals, false, false);
  return <span className="whitespace-nowrap">{`${symbol}${formattedValue}`}</span>;
}
