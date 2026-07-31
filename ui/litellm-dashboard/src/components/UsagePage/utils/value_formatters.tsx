export function valueFormatter(number: number) {
  if (number >= 1_000_000_000) {
    return (number / 1_000_000_000).toFixed(2) + "B";
  }
  if (number >= 1_000_000) {
    return (number / 1_000_000).toFixed(2) + "M";
  }
  if (number >= 1000) {
    return number / 1000 + "k";
  }
  return number.toString();
}

export function valueFormatterSpend(number: number, symbol: string = "$", rate: number = 1) {
  const converted = symbol === "$" ? number : number * rate;
  if (converted === 0) return `${symbol}0`;
  if (converted >= 1_000_000_000) {
    return symbol + parseFloat((converted / 1_000_000_000).toFixed(2)) + "B";
  }
  if (converted >= 1_000_000) {
    return symbol + parseFloat((converted / 1_000_000).toFixed(2)) + "M";
  }
  if (converted >= 1000) {
    return symbol + converted / 1000 + "k";
  }
  return symbol + converted;
}
