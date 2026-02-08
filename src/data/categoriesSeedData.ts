export const CATEGORIES_SEED_DATA = [
  {
    id: 'cat-1',
    name: 'Electronics',
    description: 'Mobile phones, laptops, computers, and electronics',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-2',
    name: 'Fashion',
    description: 'Clothing, footwear, watches, and accessories',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-3',
    name: 'Beauty & Personal Care',
    description: 'Skincare, haircare, makeup, and fragrances',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-4',
    name: 'Home, Kitchen & Living',
    description: 'Furniture, home décor, kitchen, and bedding',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-5',
    name: 'Grocery & Gourmet Food',
    description: 'Staples, packaged foods, snacks, and gourmet items',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-6',
    name: 'Health, Household & Baby Care',
    description: 'Health supplements, household supplies, and baby care',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-7',
    name: 'Books',
    description: 'Fiction, non-fiction, academic, and e-books',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-8',
    name: 'Sports, Fitness & Outdoors',
    description: 'Fitness equipment, sports gear, and outdoor adventure',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-9',
    name: 'Toys, Games & Baby Products',
    description: 'Toys, games, puzzles, and baby products',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-10',
    name: 'Automotive & Industrial',
    description: 'Car accessories, bike accessories, and tools',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-11',
    name: 'Jewellery & Luxury',
    description: 'Gold, silver, watches, and luxury items',
    imageUrl: 'https://...',
  },
  {
    id: 'cat-12',
    name: 'Software & Digital Products',
    description: 'Software licenses, subscriptions, and digital content',
    imageUrl: 'https://...',
  },
];

export const SUBCATEGORIES_SEED_DATA = [
  // Electronics
  { categoryId: 'cat-1', name: 'Mobiles & Smartphones' },
  { categoryId: 'cat-1', name: 'Laptops & Computers' },
  { categoryId: 'cat-1', name: 'Tablets' },
  { categoryId: 'cat-1', name: 'Televisions' },
  { categoryId: 'cat-1', name: 'Cameras' },
  { categoryId: 'cat-1', name: 'Audio (Headphones, Speakers)' },
  { categoryId: 'cat-1', name: 'Wearable Technology' },
  { categoryId: 'cat-1', name: 'Computer Accessories' },
  { categoryId: 'cat-1', name: 'Mobile Accessories' },

  // Fashion
  { categoryId: 'cat-2', name: "Men's Clothing" },
  { categoryId: 'cat-2', name: "Women's Clothing" },
  { categoryId: 'cat-2', name: 'Kids & Baby Clothing' },
  { categoryId: 'cat-2', name: 'Footwear' },
  { categoryId: 'cat-2', name: 'Watches' },
  { categoryId: 'cat-2', name: 'Fashion Jewellery' },
  { categoryId: 'cat-2', name: 'Bags & Luggage' },
  { categoryId: 'cat-2', name: 'Sunglasses & Accessories' },

  // Beauty & Personal Care
  { categoryId: 'cat-3', name: 'Skincare' },
  { categoryId: 'cat-3', name: 'Haircare' },
  { categoryId: 'cat-3', name: 'Makeup' },
  { categoryId: 'cat-3', name: 'Fragrances' },
  { categoryId: 'cat-3', name: 'Grooming & Shaving' },
  { categoryId: 'cat-3', name: 'Bath & Body' },
  { categoryId: 'cat-3', name: 'Beauty Tools & Accessories' },

  // Home, Kitchen & Living
  { categoryId: 'cat-4', name: 'Furniture' },
  { categoryId: 'cat-4', name: 'Home Décor' },
  { categoryId: 'cat-4', name: 'Kitchen & Dining' },
  { categoryId: 'cat-4', name: 'Cookware' },
  { categoryId: 'cat-4', name: 'Home Storage' },
  { categoryId: 'cat-4', name: 'Bedding & Furnishings' },
  { categoryId: 'cat-4', name: 'Lighting' },
  { categoryId: 'cat-4', name: 'Cleaning Supplies' },

  // Grocery & Gourmet Food
  { categoryId: 'cat-5', name: 'Staples (Rice, Flour, Pulses)' },
  { categoryId: 'cat-5', name: 'Packaged Foods' },
  { categoryId: 'cat-5', name: 'Snacks & Beverages' },
  { categoryId: 'cat-5', name: 'Breakfast Foods' },
  { categoryId: 'cat-5', name: 'Organic & Health Foods' },
  { categoryId: 'cat-5', name: 'Baby Food' },
  { categoryId: 'cat-5', name: 'Gourmet & Imported Foods' },

  // Health, Household & Baby Care
  { categoryId: 'cat-6', name: 'Health Supplements' },
  { categoryId: 'cat-6', name: 'Medical Devices' },
  { categoryId: 'cat-6', name: 'Personal Hygiene' },
  { categoryId: 'cat-6', name: 'Household Supplies' },
  { categoryId: 'cat-6', name: 'Baby Care' },
  { categoryId: 'cat-6', name: 'Elder Care' },
  { categoryId: 'cat-6', name: 'Wellness Products' },

  // Books
  { categoryId: 'cat-7', name: 'Fiction' },
  { categoryId: 'cat-7', name: 'Non-Fiction' },
  { categoryId: 'cat-7', name: 'Academic & Textbooks' },
  { categoryId: 'cat-7', name: 'Competitive Exam Prep' },
  { categoryId: 'cat-7', name: "Children's Books" },
  { categoryId: 'cat-7', name: 'Comics & Manga' },
  { categoryId: 'cat-7', name: 'E-Books' },

  // Sports, Fitness & Outdoors
  { categoryId: 'cat-8', name: 'Fitness Equipment' },
  { categoryId: 'cat-8', name: 'Sports Gear' },
  { categoryId: 'cat-8', name: 'Outdoor & Adventure' },
  { categoryId: 'cat-8', name: 'Cycling' },
  { categoryId: 'cat-8', name: 'Yoga & Meditation' },
  { categoryId: 'cat-8', name: 'Team Sports' },
  { categoryId: 'cat-8', name: 'Gym Accessories' },

  // Toys, Games & Baby Products
  { categoryId: 'cat-9', name: 'Toys & Action Figures' },
  { categoryId: 'cat-9', name: 'Educational Toys' },
  { categoryId: 'cat-9', name: 'Board Games' },
  { categoryId: 'cat-9', name: 'Puzzles' },
  { categoryId: 'cat-9', name: 'Baby Toys' },
  { categoryId: 'cat-9', name: "Kids Ride-Ons" },
  { categoryId: 'cat-9', name: 'School & Learning Toys' },

  // Automotive & Industrial
  { categoryId: 'cat-10', name: 'Car Accessories' },
  { categoryId: 'cat-10', name: 'Bike Accessories' },
  { categoryId: 'cat-10', name: 'Tools & Equipment' },
  { categoryId: 'cat-10', name: 'Industrial Supplies' },
  { categoryId: 'cat-10', name: 'Spare Parts' },
  { categoryId: 'cat-10', name: 'Lubricants & Oils' },
  { categoryId: 'cat-10', name: 'Safety Equipment' },

  // Jewellery & Luxury
  { categoryId: 'cat-11', name: 'Fine Jewellery (Gold, Diamond)' },
  { categoryId: 'cat-11', name: 'Silver Jewellery' },
  { categoryId: 'cat-11', name: 'Fashion Jewellery' },
  { categoryId: 'cat-11', name: 'Luxury Watches' },
  { categoryId: 'cat-11', name: 'Precious Stones' },
  { categoryId: 'cat-11', name: 'Gift Jewellery' },

  // Software & Digital Products
  { categoryId: 'cat-12', name: 'Software Licenses' },
  { categoryId: 'cat-12', name: 'Digital Subscriptions' },
  { categoryId: 'cat-12', name: 'E-Books' },
  { categoryId: 'cat-12', name: 'Online Courses' },
  { categoryId: 'cat-12', name: 'Game Codes' },
  { categoryId: 'cat-12', name: 'Design Templates' },
];
