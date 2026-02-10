import type { Product } from '../types';

// Featured Products — curated picks by admin
export const mockProducts: Product[] = [
  {
    id: 'fp-1', name: 'Samsung Galaxy S24 Ultra', description: 'Premium flagship smartphone with S Pen',
    price: 74999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop',
    seller_id: 's1', category: 'Mobile', stock: 50, approval_status: 'approved', created_at: '2026-01-15', brand: 'Samsung', rating: 4.8, discount: 10, isNew: true, is_featured: true,
  },
  {
    id: 'fp-2', name: 'MacBook Air M3 15"', description: 'Supercharged by M3 chip, incredibly thin',
    price: 134900, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    seller_id: 's2', category: 'Laptops', stock: 25, approval_status: 'approved', created_at: '2026-01-10', brand: 'Apple', rating: 4.9, discount: 5, isNew: true, is_featured: true,
  },
  {
    id: 'fp-3', name: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise cancellation',
    price: 24990, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop',
    seller_id: 's3', category: 'Audio', stock: 80, approval_status: 'approved', created_at: '2026-01-12', brand: 'Sony', rating: 4.7, discount: 15, is_featured: true,
  },
  {
    id: 'fp-4', name: 'iPad Pro 12.9" M2', description: 'The ultimate iPad experience with M2 chip',
    price: 112900, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
    seller_id: 's2', category: 'Tablets', stock: 30, approval_status: 'approved', created_at: '2026-01-08', brand: 'Apple', rating: 4.8, discount: 8, is_featured: true,
  },
  {
    id: 'fp-5', name: 'Canon EOS R6 Mark II', description: 'Full-frame mirrorless camera for professionals',
    price: 175000, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
    seller_id: 's4', category: 'Cameras', stock: 15, approval_status: 'approved', created_at: '2026-01-05', brand: 'Canon', rating: 4.9, discount: 0, isNew: true, is_featured: true,
  },
  {
    id: 'fp-6', name: 'PS5 Slim Digital Edition', description: 'Next-gen gaming console',
    price: 39990, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop',
    seller_id: 's5', category: 'Gaming', stock: 40, approval_status: 'approved', created_at: '2026-01-18', brand: 'Sony', rating: 4.6, discount: 0, is_featured: true,
  },
  {
    id: 'fp-7', name: 'Apple Watch Ultra 2', description: 'The most rugged and capable Apple Watch',
    price: 89900, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop',
    seller_id: 's2', category: 'Watches', stock: 20, approval_status: 'approved', created_at: '2026-01-20', brand: 'Apple', rating: 4.7, discount: 5, isNew: true, is_featured: true,
  },
  {
    id: 'fp-8', name: 'Google Nest Hub Max', description: 'Smart home display with Google Assistant',
    price: 22999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400&h=400&fit=crop',
    seller_id: 's6', category: 'Smart Home', stock: 60, approval_status: 'approved', created_at: '2026-01-14', brand: 'Google', rating: 4.4, discount: 12, is_featured: true,
  },
  {
    id: 'fp-9', name: 'Bose SoundLink Flex', description: 'Portable Bluetooth speaker with deep bass',
    price: 14900, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
    seller_id: 's3', category: 'Audio', stock: 100, approval_status: 'approved', created_at: '2026-01-22', brand: 'Bose', rating: 4.5, discount: 10, is_featured: true,
  },
  {
    id: 'fp-10', name: 'Samsung Galaxy Tab S9 FE', description: 'Everyday tablet with stunning display',
    price: 44999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=400&fit=crop',
    seller_id: 's1', category: 'Tablets', stock: 35, approval_status: 'approved', created_at: '2026-01-25', brand: 'Samsung', rating: 4.3, discount: 15, is_featured: true,
  },
];

// Hot Deals — products with high discounts, managed by admin
export const hotDeals: Product[] = [
  {
    id: 'hd-1', name: 'OnePlus 12 5G', description: 'Flagship killer with Snapdragon 8 Gen 3',
    price: 49999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop',
    seller_id: 's7', category: 'Mobile', stock: 45, approval_status: 'approved', created_at: '2026-01-10', brand: 'OnePlus', rating: 4.6, discount: 25,
  },
  {
    id: 'hd-2', name: 'Lenovo IdeaPad Slim 5', description: '14" FHD+ IPS display, AMD Ryzen 7',
    price: 62990, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
    seller_id: 's8', category: 'Laptops', stock: 20, approval_status: 'approved', created_at: '2026-01-08', brand: 'Lenovo', rating: 4.3, discount: 30,
  },
  {
    id: 'hd-3', name: 'JBL Charge 5 Speaker', description: 'Portable waterproof bluetooth speaker',
    price: 15999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=400&h=400&fit=crop',
    seller_id: 's3', category: 'Audio', stock: 70, approval_status: 'approved', created_at: '2026-01-12', brand: 'JBL', rating: 4.5, discount: 35,
  },
  {
    id: 'hd-4', name: 'Amazfit GTR 4', description: 'Smart watch with AMOLED display and GPS',
    price: 16999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    seller_id: 's9', category: 'Watches', stock: 55, approval_status: 'approved', created_at: '2026-01-15', brand: 'Amazfit', rating: 4.2, discount: 40,
  },
  {
    id: 'hd-5', name: 'GoPro HERO12 Black', description: 'Waterproof action camera with 5.3K video',
    price: 40490, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop',
    seller_id: 's4', category: 'Cameras', stock: 18, approval_status: 'approved', created_at: '2026-01-20', brand: 'GoPro', rating: 4.6, discount: 20,
  },
  {
    id: 'hd-6', name: 'Nintendo Switch OLED', description: 'Hybrid gaming console with vibrant OLED screen',
    price: 34999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop',
    seller_id: 's5', category: 'Gaming', stock: 30, approval_status: 'approved', created_at: '2026-01-18', brand: 'Nintendo', rating: 4.7, discount: 22,
  },
  {
    id: 'hd-7', name: 'Mi Smart Band 8 Pro', description: 'Fitness tracker with AMOLED display',
    price: 3999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop',
    seller_id: 's7', category: 'Fitness', stock: 200, approval_status: 'approved', created_at: '2026-01-22', brand: 'Xiaomi', rating: 4.1, discount: 45,
  },
  {
    id: 'hd-8', name: 'Samsung 1TB T7 SSD', description: 'Portable external SSD with USB 3.2',
    price: 8999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop',
    seller_id: 's1', category: 'Storage', stock: 90, approval_status: 'approved', created_at: '2026-01-25', brand: 'Samsung', rating: 4.5, discount: 28,
  },
  {
    id: 'hd-9', name: 'Anker 65W USB-C Charger', description: 'GaN fast charger for laptops and phones',
    price: 3499, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop',
    seller_id: 's10', category: 'Accessories', stock: 150, approval_status: 'approved', created_at: '2026-01-28', brand: 'Anker', rating: 4.4, discount: 30,
  },
  {
    id: 'hd-10', name: 'Realme Pad 2', description: '11.5 inch 2K display tablet with Dolby Atmos',
    price: 19999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=400&fit=crop',
    seller_id: 's7', category: 'Tablets', stock: 40, approval_status: 'approved', created_at: '2026-02-01', brand: 'Realme', rating: 4.0, discount: 32,
  },
];

// Trending Now — currently popular products, managed by admin
export const trendingDeals: Product[] = [
  {
    id: 'td-1', name: 'iPhone 16 Pro Max', description: '6.9-inch Super Retina XDR display, A18 Pro chip',
    price: 144900, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
    seller_id: 's2', category: 'Mobile', stock: 35, approval_status: 'approved', created_at: '2026-01-28', brand: 'Apple', rating: 4.9, discount: 5, isNew: true,
  },
  {
    id: 'td-2', name: 'ASUS ROG Strix G16', description: 'Gaming laptop with RTX 4070 and 240Hz display',
    price: 149990, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop',
    seller_id: 's8', category: 'Laptops', stock: 12, approval_status: 'approved', created_at: '2026-01-22', brand: 'ASUS', rating: 4.7, discount: 10,
  },
  {
    id: 'td-3', name: 'AirPods Pro 2 (USB-C)', description: 'Active Noise Cancellation with Adaptive Audio',
    price: 24900, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop',
    seller_id: 's2', category: 'Audio', stock: 65, approval_status: 'approved', created_at: '2026-01-30', brand: 'Apple', rating: 4.8, discount: 8, isNew: true,
  },
  {
    id: 'td-4', name: 'Garmin Venu 3', description: 'GPS smartwatch with health monitoring suite',
    price: 49990, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=400&fit=crop',
    seller_id: 's9', category: 'Watches', stock: 22, approval_status: 'approved', created_at: '2026-01-26', brand: 'Garmin', rating: 4.6, discount: 12,
  },
  {
    id: 'td-5', name: 'DJI Mini 4 Pro', description: 'Compact drone with 4K HDR video and obstacle sensing',
    price: 79500, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop',
    seller_id: 's4', category: 'Cameras', stock: 10, approval_status: 'approved', created_at: '2026-02-01', brand: 'DJI', rating: 4.8, discount: 0, isNew: true,
  },
  {
    id: 'td-6', name: 'Xbox Series X', description: 'Most powerful Xbox console with 4K gaming',
    price: 49990, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&h=400&fit=crop',
    seller_id: 's5', category: 'Gaming', stock: 25, approval_status: 'approved', created_at: '2026-01-20', brand: 'Microsoft', rating: 4.5, discount: 10,
  },
  {
    id: 'td-7', name: 'Amazon Echo Show 10', description: 'Smart display with motion tracking and Alexa',
    price: 24999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&h=400&fit=crop',
    seller_id: 's6', category: 'Smart Home', stock: 38, approval_status: 'approved', created_at: '2026-01-24', brand: 'Amazon', rating: 4.3, discount: 18,
  },
  {
    id: 'td-8', name: 'Fitbit Charge 6', description: 'Advanced health and fitness tracker with GPS',
    price: 14999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=400&h=400&fit=crop',
    seller_id: 's9', category: 'Fitness', stock: 75, approval_status: 'approved', created_at: '2026-02-02', brand: 'Fitbit', rating: 4.4, discount: 15, isNew: true,
  },
  {
    id: 'td-9', name: 'Pixel 9 Pro', description: 'Google AI-powered smartphone with Tensor G4',
    price: 99999, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    seller_id: 's6', category: 'Mobile', stock: 28, approval_status: 'approved', created_at: '2026-02-03', brand: 'Google', rating: 4.7, discount: 7, isNew: true,
  },
  {
    id: 'td-10', name: 'Logitech MX Master 3S', description: 'Wireless ergonomic mouse for productivity',
    price: 8995, currency: 'INR', image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop',
    seller_id: 's10', category: 'Accessories', stock: 120, approval_status: 'approved', created_at: '2026-02-05', brand: 'Logitech', rating: 4.6, discount: 10,
  },
];

export type ProductSection = 'featured' | 'hot-deals' | 'trending';

export const getProductsBySection = (section: ProductSection): Product[] => {
  switch (section) {
    case 'featured': return mockProducts;
    case 'hot-deals': return hotDeals;
    case 'trending': return trendingDeals;
    default: return [];
  }
};

export const sectionInfo: Record<ProductSection, { title: string; subtitle: string; icon: string }> = {
  featured: {
    title: 'Featured Products',
    subtitle: 'Hand-picked by our team — the best products across all categories',
    icon: '⭐',
  },
  'hot-deals': {
    title: 'Hot Deals',
    subtitle: 'Massive discounts on top products — limited time offers',
    icon: '🔥',
  },
  trending: {
    title: 'Trending Now',
    subtitle: 'What everyone is buying right now — most popular picks',
    icon: '📈',
  },
};

export const categories = [
  { id: 'cat-1', name: 'Electronics', icon: '⚡', count: 1250 },
  { id: 'cat-2', name: 'Laptops', icon: '💻', count: 456 },
  { id: 'cat-3', name: 'Watches', icon: '⌚', count: 789 },
  { id: 'cat-4', name: 'Cameras', icon: '📷', count: 234 },
  { id: 'cat-5', name: 'Audio', icon: '🎧', count: 567 },
  { id: 'cat-6', name: 'Gaming', icon: '🎮', count: 890 },
  { id: 'cat-7', name: 'Smart Home', icon: '🏠', count: 345 },
  { id: 'cat-8', name: 'Fitness', icon: '💪', count: 678 },
  { id: 'cat-9', name: 'Mobile', icon: '📱', count: 1123 },
  { id: 'cat-10', name: 'Tablets', icon: '📱', count: 234 },
  { id: 'cat-11', name: 'Accessories', icon: '🔌', count: 2345 },
  { id: 'cat-12', name: 'Storage', icon: '💾', count: 456 },
];
