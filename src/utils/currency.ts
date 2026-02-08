// Currency conversion using a free API (exchangerate-api.com)
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

interface ExchangeRates {
  [key: string]: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - lastFetch) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    cachedRates = data.rates;
    lastFetch = now;
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return default rates if fetch fails
    return {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      INR: 74.0,
      AUD: 1.35,
      CAD: 1.25,
    };
  }
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;

  const rates = await fetchExchangeRates();
  
  // Validate that both currencies exist in the rates
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.warn(`Currency conversion: Missing rate for ${fromCurrency} or ${toCurrency}`);
    return amount; // Return original amount if conversion not possible
  }

  // Validate that rates are valid numbers greater than 0
  if (rates[fromCurrency] <= 0 || rates[toCurrency] <= 0) {
    console.warn(`Currency conversion: Invalid rate value`);
    return amount;
  }
  
  // Convert to USD first, then to target currency
  const amountInUSD = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency];
  const convertedAmount = toCurrency === 'USD' ? amountInUSD : amountInUSD * rates[toCurrency];
  
  return Math.round(convertedAmount * 100) / 100;
};

export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];
