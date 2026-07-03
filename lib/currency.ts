export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'JPY' | 'CAD' | 'AUD';

export type Currency = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** Demo rate: 1 USD = rate in this currency */
  rateFromUsd: number;
  decimals: number;
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', rateFromUsd: 1, decimals: 0 },
  { code: 'GBP', label: 'British Pound', symbol: '£', rateFromUsd: 0.79, decimals: 0 },
  { code: 'EUR', label: 'Euro', symbol: '€', rateFromUsd: 0.92, decimals: 0 },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥', rateFromUsd: 157, decimals: 0 },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$', rateFromUsd: 1.36, decimals: 0 },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', rateFromUsd: 1.52, decimals: 0 },
];

const currencyMap = Object.fromEntries(CURRENCIES.map((c) => [c.code, c])) as Record<
  CurrencyCode,
  Currency
>;

export function getCurrency(code: CurrencyCode): Currency {
  return currencyMap[code];
}

export function convertFromUsd(amountUsd: number, code: CurrencyCode): number {
  const currency = getCurrency(code);
  const converted = amountUsd * currency.rateFromUsd;
  if (code === 'JPY') return Math.round(converted);
  return Math.round(converted * 100) / 100;
}

export function formatCurrency(amountUsd: number, code: CurrencyCode): string {
  const currency = getCurrency(code);
  const value = convertFromUsd(amountUsd, code);
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  if (code === 'USD') return `$${formatted}`;
  if (code === 'GBP') return `£${formatted}`;
  if (code === 'EUR') return `€${formatted}`;
  if (code === 'JPY') return `¥${formatted}`;
  return `${currency.symbol}${formatted}`;
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return value in currencyMap;
}
