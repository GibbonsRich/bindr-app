import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  convertFromUsd,
  CurrencyCode,
  formatCurrency,
} from '@/lib/currency';
import { loadCurrency, saveCurrency } from '@/lib/storage';

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatMoney: (amountUsd: number) => string;
  convert: (amountUsd: number) => number;
  ready: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const saved = await loadCurrency();
      if (active) {
        setCurrencyState(saved);
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    void saveCurrency(code);
  }, []);

  const formatMoney = useCallback(
    (amountUsd: number) => formatCurrency(amountUsd, currency),
    [currency]
  );

  const convert = useCallback(
    (amountUsd: number) => convertFromUsd(amountUsd, currency),
    [currency]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, formatMoney, convert, ready }),
    [currency, setCurrency, formatMoney, convert, ready]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
