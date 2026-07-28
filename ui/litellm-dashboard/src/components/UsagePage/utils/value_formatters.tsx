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
  if (number === 0) return `${symbol}0`;
  if (number >= 1_000_000_000) {
    return symbol + parseFloat((number / 1_000_000_000).toFixed(2)) + "B";
  }
  if (number >= 1_000_000) {
    return symbol + parseFloat((number / 1_000_000).toFixed(2)) + "M";
  }
  if (number >= 1000) {
    return symbol + number / 1000 + "k";
  }
  return symbol + number;
}
