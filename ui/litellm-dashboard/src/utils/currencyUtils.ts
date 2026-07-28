export type Currency = "USD" | "BRL";

const SYMBOLS: Record<Currency, string> = { USD: "$", BRL: "R$" };

export function convertAndFormat(
  usdValue: number,
  currency: Currency,
  rate: number,
  decimals = 4
): string {
  const converted = currency === "BRL" ? usdValue * rate : usdValue;
  return `${SYMBOLS[currency]}${converted.toFixed(decimals)}`;
}