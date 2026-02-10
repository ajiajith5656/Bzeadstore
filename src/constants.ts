// Utility function to format prices
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const COUNTRIES_ALLOWED = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
];

export const BUSINESS_TYPES = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Beauty & Personal Care',
  'Home & Living',
  'Health & Wellness',
  'Sports & Outdoor',
  'Food & Grocery',
  'Automotive',
  'Jewelry & Accessories',
  'Other',
];

// Mock products for seller dashboard
export const ALL_PRODUCTS = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    category: 'Electronics',
    price: 299.99,
    stockCount: 45,
    inStock: true,
    approved: true,
    revenue: 8999.70,
    orders: 30,
    views: 1250,
    rating: 4.5,
    image: '/images/products/headphones.jpg'
  },
  {
    id: 2,
    name: 'Smart Fitness Watch',
    category: 'Wearables',
    price: 199.99,
    stockCount: 5,
    inStock: true,
    approved: true,
    revenue: 3999.80,
    orders: 20,
    views: 890,
    rating: 4.7,
    image: '/images/products/watch.jpg'
  },
  {
    id: 3,
    name: 'Bluetooth Speaker',
    category: 'Electronics',
    price: 79.99,
    stockCount: 0,
    inStock: false,
    approved: false,
    revenue: 0,
    orders: 0,
    views: 234,
    rating: 0,
    image: '/images/products/speaker.jpg'
  },
];
