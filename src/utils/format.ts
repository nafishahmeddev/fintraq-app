import * as Localization from 'expo-localization';
import i18n, { getIntlLocale } from '@/src/i18n';
import { parseAmountInput } from '@/src/utils/amount';
import { CURRENCIES } from '@/src/constants/currency';

/** A typed amount as a number, 0 when blank or unreadable. See parseAmountInput for the rules. */
export const parseAmount = (value: string | undefined | null): number => parseAmountInput(value ?? '') ?? 0;

export const toDbColor = (value: string): number => {
  return Number.parseInt(value.replace('#', ''), 16);
};

export const colorNumberToHex = (value: number): string =>
  `#${value.toString(16).padStart(6, '0')}`;

export const withAlpha = (color: string, hexAlpha: string): string =>
  `${color}${hexAlpha}`;

const COMPACT_TIERS: { limit: number; suffix: string }[] = [
  { limit: 1e12, suffix: 'T' },
  { limit: 1e9, suffix: 'B' },
  { limit: 1e6, suffix: 'M' },
  { limit: 1e3, suffix: 'K' },
];

/** The Intl locale for the app's language, falling back to the device's. */
const appLocale = (): string => {
  const deviceLocale = Localization.getLocales()?.[0]?.languageTag ?? 'en-US';
  return getIntlLocale(i18n.resolvedLanguage ?? i18n.language, deviceLocale);
};

export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions): string => {
  try {
    return new Intl.DateTimeFormat(appLocale(), options).format(date);
  } catch {
    return date.toDateString();
  }
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCIES.find((c) => c.code === currencyCode.toUpperCase())?.symbol ?? currencyCode;
};

export const formatCurrency = (amount: number, currencyCode?: string, compact?: boolean): string => {
  const locale = appLocale();

  if (!currencyCode) {
    return new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  try {
    const code = currencyCode.toUpperCase();
    const abs = Math.abs(amount);
    const tier = compact ? COMPACT_TIERS.find((t) => abs >= t.limit) : undefined;
    const scaled = tier ? amount / tier.limit : amount;

    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      ...(compact ? { minimumFractionDigits: 0, maximumFractionDigits: 1 } : {}),
    }).formatToParts(scaled);

    const NUMERIC = new Set(['integer', 'group', 'decimal', 'fraction']);
    let lastDigit = -1;
    if (tier) {
      parts.forEach((part, i) => {
        if (NUMERIC.has(part.type)) lastDigit = i;
      });
    }

    return parts.map((part, i) => {
      let val = part.value;
      // Hermes fallback: If Intl didn't resolve a native symbol (e.g. outputs "TRY" for TRY), use our registry.
      if (part.type === 'currency' && val === code) {
        val = getCurrencySymbol(code);
      }
      return i === lastDigit && tier ? `${val}${tier.suffix}` : val;
    }).join('');
  } catch {
    return `${currencyCode.toUpperCase()} ${amount.toFixed(2)}`;
  }
};

/** Human-readable file size, e.g. 1536 → "1.5 KB". */
export const formatFileSize = (bytes: number): string => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};
