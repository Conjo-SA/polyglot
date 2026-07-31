"use client";

import { InputNumber } from "antd";
import type { CSSProperties } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  value?: number | null;  // always in USD (the form/backend expects)
  onChange?: (usdValue: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  step?: number;
  precision?: number;
  className?: string;
  width?: number | string;
  style?: CSSProperties;
}

export function CurrencyMoneyInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  min,
  step,
  precision,
  className,
  width,
  style,
}: Props) {
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
        step={step ?? (currency === "BRL" ? 10 : 1)}
        min={min}
        precision={precision}
        disabled={disabled}
        className={className}
        style={width !== undefined ? { ...style, width } : style}
      />
      {currency === "BRL" && value ? (
        <span className="text-xs text-gray-400 ml-2">
          ≈ ${value.toFixed(2)} USD (taxa {rate.toFixed(2)})
        </span>
      ) : null}
    </>
  );
}