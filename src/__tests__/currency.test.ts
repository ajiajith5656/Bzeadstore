import { describe, it, expect } from 'vitest';
import {
  convertAmount,
  formatCurrency,
  currencyForCountry,
  COUNTRY_TO_CURRENCY,
} from '../utils/currency';

// ── convertAmount ─────────────────────────────────────────────────────
describe('convertAmount', () => {
  const rates = { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, JPY: 149.5 };

  it('returns same amount when currencies match', () => {
    expect(convertAmount(100, 'USD', 'USD', rates)).toBe(100);
  });

  it('converts USD to INR', () => {
    const result = convertAmount(10, 'USD', 'INR', rates);
    expect(result).toBe(835);
  });

  it('converts INR to USD', () => {
    const result = convertAmount(835, 'INR', 'USD', rates);
    expect(result).toBe(10);
  });

  it('converts between two non-USD currencies via USD', () => {
    const result = convertAmount(100, 'EUR', 'GBP', rates);
    // 100 EUR → USD = 100 / 0.92 ≈ 108.70, → GBP = 108.70 * 0.79 ≈ 85.87
    expect(result).toBeCloseTo(85.87, 1);
  });

  it('returns original amount if "from" rate is missing', () => {
    expect(convertAmount(100, 'XXX', 'USD', rates)).toBe(100);
  });

  it('returns original amount if "to" rate is missing', () => {
    expect(convertAmount(100, 'USD', 'XXX', rates)).toBe(100);
  });

  it('handles zero amount', () => {
    expect(convertAmount(0, 'USD', 'INR', rates)).toBe(0);
  });
});

// ── formatCurrency ────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    const result = formatCurrency(10.5, 'USD');
    expect(result).toContain('10.50');
    expect(result).toContain('$');
  });

  it('formats INR correctly', () => {
    const result = formatCurrency(1000, 'INR');
    expect(result).toContain('₹');
  });

  it('formats JPY without decimals', () => {
    const result = formatCurrency(1000, 'JPY');
    expect(result).toContain('1,000');
    expect(result).not.toContain('.00');
  });

  it('handles invalid currency gracefully', () => {
    const result = formatCurrency(50, 'ZZZZ');
    expect(result).toContain('50');
  });
});

// ── currencyForCountry ────────────────────────────────────────────────
describe('currencyForCountry', () => {
  it('maps IN to INR', () => {
    expect(currencyForCountry('IN')).toBe('INR');
  });

  it('maps US to USD', () => {
    expect(currencyForCountry('US')).toBe('USD');
  });

  it('maps GB to GBP', () => {
    expect(currencyForCountry('GB')).toBe('GBP');
  });

  it('maps eurozone countries to EUR', () => {
    expect(currencyForCountry('DE')).toBe('EUR');
    expect(currencyForCountry('FR')).toBe('EUR');
    expect(currencyForCountry('IT')).toBe('EUR');
  });

  it('handles alpha-3 codes', () => {
    expect(currencyForCountry('IND')).toBe('INR');
    expect(currencyForCountry('USA')).toBe('USD');
  });

  it('is case-insensitive', () => {
    expect(currencyForCountry('in')).toBe('INR');
    expect(currencyForCountry('us')).toBe('USD');
  });

  it('returns INR for unknown codes', () => {
    expect(currencyForCountry('ZZ')).toBe('INR');
  });

  it('returns INR for empty string', () => {
    expect(currencyForCountry('')).toBe('INR');
  });

  it('returns the currency code if already a valid currency', () => {
    expect(currencyForCountry('USD')).toBe('USD');
    expect(currencyForCountry('EUR')).toBe('EUR');
  });
});

// ── COUNTRY_TO_CURRENCY mappings ──────────────────────────────────────
describe('COUNTRY_TO_CURRENCY', () => {
  it('contains common countries', () => {
    expect(COUNTRY_TO_CURRENCY.IN).toBe('INR');
    expect(COUNTRY_TO_CURRENCY.US).toBe('USD');
    expect(COUNTRY_TO_CURRENCY.JP).toBe('JPY');
    expect(COUNTRY_TO_CURRENCY.AE).toBe('AED');
  });
});
