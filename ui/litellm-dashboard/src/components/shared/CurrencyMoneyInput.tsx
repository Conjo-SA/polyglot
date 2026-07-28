"use client";

import { InputNumber } from "antd";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  value?: number;        // always in USD (the form/backend expects)
  onChange?: (usdValue: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CurrencyMoneyInput({ value, onChange, placeholder, disabled = false }: Props) {
  const { currency, rate, symbol } = useCurrency();

  const displayValue =
    value !== undefined && value !== null
      ? currency === "BRL" ? value * rate : value
      : undefined;

  const handleChange = (v: number | null) => {
    if (v === null) return onChange?.(null);
    const usd = currency === "BRL" ? v / rate : v;
    onChange?.(Number(usd.toFixed(6))); // converts to USD for form
  };

  return (
    <>
      <InputNumber
        prefix={symbol}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        step={currency === "BRL" ? 10 : 1}
        disabled={disabled}
      />
      {currency === "BRL" && value ? (
        <span className="text-xs text-gray-400 ml-2">
          ≈ ${value.toFixed(2)} USD (taxa {rate.toFixed(2)})
        </span>
      ) : null}
    </>
  );
}