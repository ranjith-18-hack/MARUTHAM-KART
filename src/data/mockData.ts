export interface Farmer {
  id: string;
  name: string;
  location: string;
  rating: number;
  productsSupplied: number;
  verified: boolean;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  availability: 'Available' | 'Out of Stock' | 'Low Stock';
  availableQty: number;
  rating: number;
  image: string;
  farmer: Farmer;
  description: string;
  qualityInfo: string;
  harvestDate: string;
  deliveryEstimate: string;
}

export const farmers: Farmer[] = [
  {
    id: 'f1',
    name: 'Muthu Kumar',
    location: 'Pollachi, Tamil Nadu',
    rating: 4.9,
    productsSupplied: 1250,
    verified: true,
  },
  {
    id: 'f2',
    name: 'Lakshmi Devi',
    location: 'Erode, Tamil Nadu',
    rating: 4.8,
    productsSupplied: 850,
    verified: true,
  },
  {
    id: 'f3',
    name: 'Senthil Rajan',
    location: 'Theni, Tamil Nadu',
    rating: 4.7,
    productsSupplied: 2100,
    verified: true,
  },
  {
    id: 'f4',
    name: 'Ramasamy Gounder',
    location: 'Salem, Tamil Nadu',
    rating: 4.95,
    productsSupplied: 3400,
    verified: true,
  },
  {
    id: 'f5',
    name: 'Selvi Anbarasan',
    location: 'Ooty, The Nilgiris',
    rating: 4.85,
    productsSupplied: 1780,
    verified: true,
  }
];

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Premium Ponni Rice',
    category: 'Rice & Grains',
    price: 65,
    unit: 'kg',
    availability: 'Available',
    availableQty: 500,
    rating: 4.9,
    image: '/products/ponni_rice.jpg',
    farmer: farmers[0]!,
    description: 'Traditional Ponni rice aged for 12 months for perfect texture and aroma. Direct from the fertile lands of Pollachi.',
    qualityInfo: 'Grade A, Double Polished, Zero Impurities',
    harvestDate: 'Oct 2025',
    deliveryEstimate: 'Tomorrow, 8 AM - 12 PM'
  },
  {
    id: 'p2',
    name: 'Organic Whole Wheat',
    category: 'Wheat',
    price: 42,
    unit: 'kg',
    availability: 'Available',
    availableQty: 250,
    rating: 4.7,
    image: '/products/organic_wheat.jpg',
    farmer: farmers[1]!,
    description: '100% organic whole wheat, rich in fiber and nutrients. Stone-ground quality suitable for all your baking needs.',
    qualityInfo: 'Chemical Free, Pesticide Free, High Protein',
    harvestDate: 'Nov 2025',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p3',
    name: 'Stone-Ground Ragi Flour',
    category: 'Flour',
    price: 55,
    unit: 'kg',
    availability: 'Available',
    availableQty: 100,
    rating: 4.8,
    image: '/products/finger_millet_ragi.jpg',
    farmer: farmers[2]!,
    description: 'Traditional stone-ground finger millet flour. Extremely rich in calcium and iron.',
    qualityInfo: 'Pure Ragi, No Additives, Fine Ground',
    harvestDate: 'Jan 2026',
    deliveryEstimate: 'Tomorrow, 8 AM - 12 PM'
  },
  {
    id: 'p4',
    name: 'Farm Fresh A2 Milk',
    category: 'Milk & Dairy',
    price: 78,
    unit: 'Litre',
    availability: 'Available',
    availableQty: 40,
    rating: 5.0,
    image: '/products/farm_cow_milk.jpg',
    farmer: farmers[0]!,
    description: 'Pure A2 milk from native cow breeds. Delivered within 4 hours of milking.',
    qualityInfo: 'Zero Adulteration, Chilled Delivery',
    harvestDate: 'Daily Fresh',
    deliveryEstimate: 'Today, within 2 hours'
  },
  {
    id: 'p5',
    name: 'Farm Fresh Country Tomatoes',
    category: 'Vegetables',
    price: 35,
    unit: 'kg',
    availability: 'Available',
    availableQty: 120,
    rating: 4.9,
    image: '/products/ai_fresh_country_tomatoes.jpg',
    farmer: farmers[1]!,
    description: 'Juicy, sun-ripened organic country tomatoes picked fresh from Erode farmlands.',
    qualityInfo: 'Hand-picked, Firm Texture, 100% Organic',
    harvestDate: 'Today Morning',
    deliveryEstimate: 'Today, by 6 PM'
  },
  {
    id: 'p6',
    name: 'Salem Alphonso Mangoes',
    category: 'Fruits',
    price: 180,
    unit: 'kg',
    availability: 'Available',
    availableQty: 85,
    rating: 4.95,
    image: '/products/ai_fresh_alphonso_mangoes.jpg',
    farmer: farmers[3]!,
    description: 'Naturally tree-ripened, intensely aromatic sweet Salem Alphonso mangoes direct from heritage orchards.',
    qualityInfo: 'Carbide-Free, Export Grade, Naturally Sweet',
    harvestDate: 'Yesterday',
    deliveryEstimate: 'Tomorrow, 8 AM - 12 PM'
  },
  {
    id: 'p7',
    name: 'Fresh Ooty Organic Carrots',
    category: 'Vegetables',
    price: 48,
    unit: 'kg',
    availability: 'Available',
    availableQty: 150,
    rating: 4.85,
    image: '/products/ai_fresh_ooty_carrots.jpg',
    farmer: farmers[4]!,
    description: 'Crunchy, sweet Nilgiri hill carrots loaded with vitamin A, harvested fresh daily with leafy tops.',
    qualityInfo: 'Mountain Soil Grown, Sweet & Juicy, Freshly Dug',
    harvestDate: 'Today Morning',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p8',
    name: 'Wood Cold-Pressed Groundnut Oil',
    category: 'Oil & Grocery',
    price: 220,
    unit: 'Litre',
    availability: 'Available',
    availableQty: 60,
    rating: 4.92,
    image: '/products/ai_cold_pressed_groundnut_oil.jpg',
    farmer: farmers[1]!,
    description: 'Traditional Marachekku wood cold-pressed unrefined peanut oil preserving natural antioxidants and aroma.',
    qualityInfo: 'Zero Additives, Single Pressed, Glass Bottled',
    harvestDate: 'Feb 2026',
    deliveryEstimate: 'Tomorrow, 8 AM - 12 PM'
  },
  {
    id: 'p9',
    name: 'Pure Organic Palm Jaggery',
    category: 'Other Farm Products',
    price: 145,
    unit: '500g',
    availability: 'Available',
    availableQty: 90,
    rating: 4.88,
    image: '/products/organic_palm_jaggery.jpg',
    farmer: farmers[2]!,
    description: 'Authentic Udangudi palm jaggery (Karupatti) free from clarifying chemicals, rich in natural iron.',
    qualityInfo: '100% Natural Palm Nectar, No Sugar Added',
    harvestDate: 'Jan 2026',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p10',
    name: '100% Raw Natural Forest Honey',
    category: 'Other Farm Products',
    price: 290,
    unit: '500g',
    availability: 'Available',
    availableQty: 45,
    rating: 4.96,
    image: '/products/raw_forest_honey.jpg',
    farmer: farmers[4]!,
    description: 'Pure unheated wild multi-floral honey sustainably collected by tribal honey hunters in the Nilgiris.',
    qualityInfo: 'Raw & Unfiltered, Pollen Rich, Zero Adulteration',
    harvestDate: 'Jan 2026',
    deliveryEstimate: 'Tomorrow, 8 AM - 12 PM'
  },
  {
    id: 'p11',
    name: 'Free-Range Country Hen Eggs',
    category: 'Other Farm Products',
    price: 120,
    unit: 'Pack of 12',
    availability: 'Available',
    availableQty: 75,
    rating: 4.9,
    image: '/products/farm_fresh_eggs.jpg',
    farmer: farmers[0]!,
    description: 'Farm-fresh nutritious country hen eggs (Naatu Kozhi Muttai) from free-range pastured poultry.',
    qualityInfo: 'Antibiotic Free, Pasture Raised, High Omega-3',
    harvestDate: 'Daily Fresh',
    deliveryEstimate: 'Today, within 2 hours'
  },
  {
    id: 'p12',
    name: 'Handcrafted Farm Malai Paneer',
    category: 'Milk & Dairy',
    price: 110,
    unit: '200g',
    availability: 'Available',
    availableQty: 35,
    rating: 4.85,
    image: '/products/fresh_paneer.jpg',
    farmer: farmers[0]!,
    description: 'Soft, melt-in-mouth artisanal cottage cheese made from pure whole A2 cow milk without starch or preservatives.',
    qualityInfo: 'Freshly Made Daily, Vacuum Sealed, Extra Soft',
    harvestDate: 'Today Morning',
    deliveryEstimate: 'Today, within 2 hours'
  },
  {
    id: 'p13',
    name: 'Thick Set Earthen Pot Curd',
    category: 'Milk & Dairy',
    price: 45,
    unit: '500g',
    availability: 'Available',
    availableQty: 50,
    rating: 4.9,
    image: '/products/fresh_curd.jpg',
    farmer: farmers[0]!,
    description: 'Naturally set whole milk yogurt cultured in traditional clay pots for maximum probiotic benefits.',
    qualityInfo: 'Live Probiotics, Creamy Layer, No Artificial Thickener',
    harvestDate: 'Daily Fresh',
    deliveryEstimate: 'Today, within 2 hours'
  },
  {
    id: 'p14',
    name: 'Crisp Green Capsicum',
    category: 'Vegetables',
    price: 55,
    unit: 'kg',
    availability: 'Available',
    availableQty: 80,
    rating: 4.75,
    image: '/products/capsicum.jpg',
    farmer: farmers[4]!,
    description: 'Thick-walled crunchy bell peppers grown under sustainable polyhouse farming in Nilgiri hills.',
    qualityInfo: 'Glossy Skin, Sweet & Juicy, Residue-Free',
    harvestDate: 'Yesterday',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p15',
    name: 'Fresh Country Drumsticks',
    category: 'Vegetables',
    price: 40,
    unit: '500g',
    availability: 'Available',
    availableQty: 95,
    rating: 4.8,
    image: '/products/drumsticks.jpg',
    farmer: farmers[2]!,
    description: 'Tender native drumsticks packed with iron and calcium, ideal for south Indian curries and sambar.',
    qualityInfo: 'Fleshy Pulp, Thin Skin, Freshly Snipped',
    harvestDate: 'Today Morning',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p16',
    name: 'Organic Green Spinach / Palak',
    category: 'Vegetables',
    price: 25,
    unit: 'Bunch',
    availability: 'Available',
    availableQty: 110,
    rating: 4.82,
    image: '/products/fresh_spinach.jpg',
    farmer: farmers[1]!,
    description: 'Vibrant dark green spinach leaves rich in iron and folates, harvested fresh before sunrise.',
    qualityInfo: 'Hydrated Bunch, Chemical-Free, Triple Washed',
    harvestDate: 'Today Morning',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p17',
    name: 'Tender Country Ladies Finger / Okra',
    category: 'Vegetables',
    price: 38,
    unit: 'kg',
    availability: 'Available',
    availableQty: 90,
    rating: 4.78,
    image: '/products/ladies_finger_okra.jpg',
    farmer: farmers[1]!,
    description: 'Young, tender and snappy okra hand-sorted to guarantee no fibrous pieces.',
    qualityInfo: '100% Snap-Tested, Fresh Harvest, No Pesticides',
    harvestDate: 'Today Morning',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p18',
    name: 'Pollachi Sweet Tender Coconut',
    category: 'Fruits',
    price: 55,
    unit: 'Piece',
    availability: 'Available',
    availableQty: 140,
    rating: 4.95,
    image: '/products/fresh_coconut.jpg',
    farmer: farmers[0]!,
    description: 'Fresh young coconuts containing 450ml+ of sweet electrolyte water and soft malai.',
    qualityInfo: '450ml+ Water Guaranteed, Heavy & Freshly Plucked',
    harvestDate: 'Yesterday',
    deliveryEstimate: 'Today, within 2 hours'
  },
  {
    id: 'p19',
    name: 'Nagpur Sweet Juicy Oranges',
    category: 'Fruits',
    price: 95,
    unit: 'kg',
    availability: 'Available',
    availableQty: 70,
    rating: 4.84,
    image: '/products/nagpur_oranges.jpg',
    farmer: farmers[3]!,
    description: 'Plump citrus oranges with vibrant orange pulp and rich vitamin C juice.',
    qualityInfo: 'Easy Peel, High Juice Content, Natural Sweetness',
    harvestDate: 'Yesterday',
    deliveryEstimate: 'Tomorrow, 8 AM - 12 PM'
  },
  {
    id: 'p20',
    name: 'Unpolished Native Toor Dal',
    category: 'Pulses',
    price: 165,
    unit: 'kg',
    availability: 'Available',
    availableQty: 130,
    rating: 4.9,
    image: '/products/toor_dal.jpg',
    farmer: farmers[2]!,
    description: 'High-protein unpolished pigeon peas dehulled naturally without chemical oil glazing.',
    qualityInfo: 'Quick Cooking, High Protein, Zero Artificial Color',
    harvestDate: 'Jan 2026',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p21',
    name: 'Organic Yellow Moong Dal',
    category: 'Pulses',
    price: 140,
    unit: 'kg',
    availability: 'Available',
    availableQty: 110,
    rating: 4.86,
    image: '/products/moong_dal.jpg',
    farmer: farmers[2]!,
    description: 'Light, comforting split yellow moong lentils perfect for khichdi, dal tadka, and pongal.',
    qualityInfo: 'Pure Split Lentils, Cleaned & Graded, Easy Digest',
    harvestDate: 'Jan 2026',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p22',
    name: 'Fresh Ooty Hill Potatoes',
    category: 'Vegetables',
    price: 38,
    unit: 'kg',
    availability: 'Available',
    availableQty: 200,
    rating: 4.79,
    image: '/products/fresh_potatoes.jpg',
    farmer: farmers[4]!,
    description: 'Firm, buttery hill potatoes grown in the cool Nilgiris soil with outstanding starch balance.',
    qualityInfo: 'Sprout-Free, Dry & Cleaned, Ideal for Cooking',
    harvestDate: '3 Days Ago',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p23',
    name: 'Organic Small Sambar Onions',
    category: 'Vegetables',
    price: 60,
    unit: 'kg',
    availability: 'Available',
    availableQty: 160,
    rating: 4.88,
    image: '/products/red_onions.jpg',
    farmer: farmers[1]!,
    description: 'Pungent, authentic shallots (Chinna Vengayam) essential for traditional Tamil Nadu sambar and rasam.',
    qualityInfo: 'Firm Bulbs, Long Shelf Life, High Quercetin',
    harvestDate: 'Yesterday',
    deliveryEstimate: 'Today, by 8 PM'
  },
  {
    id: 'p24',
    name: 'Kuthiraivali Barnyard Millet',
    category: 'Millets',
    price: 90,
    unit: 'kg',
    availability: 'Available',
    availableQty: 95,
    rating: 4.91,
    image: '/products/barnyard_millet.jpg',
    farmer: farmers[2]!,
    description: 'Ancient low-GI gluten-free grain loaded with fiber, iron, and slow-burning complex carbs.',
    qualityInfo: '100% Whole Grain, Sand & Husk Free, Diabetic Friendly',
    harvestDate: 'Jan 2026',
    deliveryEstimate: 'Tomorrow, 8 AM - 12 PM'
  }
];

export const categories = [
  { name: 'Rice & Grains', icon: '🌾', count: 45 },
  { name: 'Wheat', icon: '🍞', count: 12 },
  { name: 'Flour', icon: '🥡', count: 28 },
  { name: 'Pulses', icon: '🫘', count: 34 },
  { name: 'Milk & Dairy', icon: '🥛', count: 15 },
  { name: 'Vegetables', icon: '🥬', count: 56 },
  { name: 'Fruits', icon: '🍎', count: 42 },
  { name: 'Oil & Grocery', icon: '🛒', count: 88 },
  { name: 'Spices', icon: '🌶️', count: 64 },
  { name: 'Millets', icon: '🌱', count: 22 },
  { name: 'Organic Products', icon: '🌿', count: 110 },
  { name: 'Other Farm Products', icon: '🚜', count: 18 }
];

export const farmerOrders = [
  { id: 'ORD-1001', product: 'Premium Rice', quantity: '100 kg', buyerType: 'Hotel', value: '₹6,500', date: 'Aug 14, 2026', pickupDate: 'Aug 16, 2026', status: 'New' },
  { id: 'ORD-1002', product: 'Organic Wheat', quantity: '50 kg', buyerType: 'Customer', value: '₹2,100', date: 'Aug 13, 2026', pickupDate: 'Aug 15, 2026', status: 'Processing' },
  { id: 'ORD-1003', product: 'Ragi Flour', quantity: '200 kg', buyerType: 'Business', value: '₹11,000', date: 'Aug 12, 2026', pickupDate: 'Aug 14, 2026', status: 'Ready for Pickup' }
];

export const farmerEarnings = {
  today: 12500,
  thisWeek: 45000,
  thisMonth: 84500,
  total: 1245000,
  pending: 12400
};

export interface B2BProduct extends Product {
  minBulkQty: number;
  priceTiers: {
    min: number;
    max: number | 'plus';
    price: number;
  }[];
}

export const b2bProducts: B2BProduct[] = products.map((prod) => ({
  ...prod,
  minBulkQty: prod.category === 'Fruits' || prod.category === 'Vegetables' ? 25 : prod.category === 'Milk & Dairy' ? 10 : 50,
  priceTiers: [
    { min: 1, max: prod.category === 'Fruits' || prod.category === 'Vegetables' ? 24 : 49, price: prod.price },
    { min: prod.category === 'Fruits' || prod.category === 'Vegetables' ? 25 : 50, max: prod.category === 'Fruits' || prod.category === 'Vegetables' ? 99 : 199, price: Math.round(prod.price * 0.92) },
    { min: prod.category === 'Fruits' || prod.category === 'Vegetables' ? 100 : 200, max: 'plus', price: Math.round(prod.price * 0.85) }
  ]
}));

export const businessOrders = [
  { id: 'B-ORD-7001', date: 'Aug 12, 2026', products: 'Rice, Wheat, Flour', quantity: '1,200 kg', total: '₹72,400', deliveryDate: 'Aug 15, 2026', status: 'Processing' },
  { id: 'B-ORD-6985', date: 'Aug 08, 2026', products: 'Vegetables, Milk', quantity: '450 kg', total: '₹28,600', deliveryDate: 'Aug 09, 2026', status: 'Delivered' },
  { id: 'B-ORD-7012', date: 'Aug 14, 2026', products: 'Premium Rice', quantity: '500 kg', total: '₹30,500', deliveryDate: 'Aug 16, 2026', status: 'Order Placed' }
];

export const quotes = [
  { id: 'QT-4521', product: 'Organic Wheat', quantity: '1,000 kg', date: 'Aug 13, 2026', status: 'Awaiting Response' },
  { id: 'QT-4510', product: 'Premium Rice', quantity: '2,500 kg', date: 'Aug 10, 2026', status: 'Quote Ready' }
];

export const invoices = [
  { id: 'INV-8801', orderId: 'B-ORD-6985', amount: '₹28,600', date: 'Aug 09, 2026', status: 'Paid' },
  { id: 'INV-8802', orderId: 'B-ORD-7001', amount: '₹72,400', date: 'Aug 15, 2026', status: 'Pending' }
];

export const procurementAnalytics = {
  monthlySpending: [45000, 52000, 48000, 61000, 75000, 82000],
  topProducts: [
    { name: 'Rice', qty: '1,500 kg', percent: 45 },
    { name: 'Wheat', qty: '800 kg', percent: 25 },
    { name: 'Flour', qty: '450 kg', percent: 15 },
    { name: 'Vegetables', qty: '700 kg', percent: 15 }
  ]
};

// --- Godown / Warehouse Portal Mock Data ---

export interface Godown {
  id: string;
  name: string;
  location: string;
  officerName: string;
  totalCapacity: number; // in kg
  usedCapacity: number; // in kg
}

export const currentGodown: Godown = {
  id: 'GD-CHENNAI-01',
  name: 'Marutham Regional Godown 01',
  location: 'Guindy Industrial Estate, Chennai',
  officerName: 'Prakash Raj',
  totalCapacity: 25000,
  usedCapacity: 18450
};

export interface WarehouseZone {
  id: string;
  name: string;
  category: string;
  capacity: number;
  currentStock: number;
  temperature?: string;
  humidity?: string;
}

export const warehouseZones: WarehouseZone[] = [
  { id: 'Zone A', name: 'Grains Section', category: 'Rice & Grains', capacity: 10000, currentStock: 8500 },
  { id: 'Zone B', name: 'Pulses Section', category: 'Pulses', capacity: 5000, currentStock: 3200 },
  { id: 'Zone C', name: 'Flour Section', category: 'Flour', capacity: 3000, currentStock: 1800 },
  { id: 'Zone D', name: 'Vegetables Section', category: 'Vegetables', capacity: 2000, currentStock: 1400, temperature: '18°C', humidity: '70%' },
  { id: 'Zone E', name: 'Fruits Section', category: 'Fruits', capacity: 2000, currentStock: 1200, temperature: '15°C', humidity: '65%' },
  { id: 'Zone F', name: 'Dairy Cold Storage', category: 'Milk & Dairy', capacity: 1000, currentStock: 650, temperature: '4°C', humidity: '60%' },
  { id: 'Zone G', name: 'General Storage', category: 'General', capacity: 2000, currentStock: 1700 }
];

export interface Batch {
  id: string;
  productId: string;
  productName: string;
  farmerName: string;
  quantity: number;
  receivedDate: string;
  harvestDate: string;
  expiryDate: string;
  storageZone: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Blocked' | 'Dispatched' | 'Completed';
  qualityStatus: 'Good' | 'Average' | 'Poor';
}

export const batches: Batch[] = [
  { 
    id: 'BATCH-MK-1024', 
    productId: 'p1', 
    productName: 'Premium Rice', 
    farmerName: 'Arun Kumar', 
    quantity: 500, 
    receivedDate: '15 Aug 2026', 
    harvestDate: '14 Aug 2026', 
    expiryDate: '15 Aug 2027', 
    storageZone: 'Zone A', 
    status: 'Active',
    qualityStatus: 'Good'
  },
  { 
    id: 'BATCH-MK-MILK-204', 
    productId: 'p4', 
    productName: 'Farm Fresh A2 Milk', 
    farmerName: 'Lakshmi Devi', 
    quantity: 100, 
    receivedDate: '15 Aug 2026', 
    harvestDate: '15 Aug 2026', 
    expiryDate: '17 Aug 2026', 
    storageZone: 'Zone F', 
    status: 'Expiring Soon',
    qualityStatus: 'Good'
  },
  { 
    id: 'BATCH-MK-VEG-501', 
    productId: 'p5', 
    productName: 'Country Tomatoes', 
    farmerName: 'Senthil Rajan', 
    quantity: 200, 
    receivedDate: '14 Aug 2026', 
    harvestDate: '13 Aug 2026', 
    expiryDate: '18 Aug 2026', 
    storageZone: 'Zone D', 
    status: 'Active',
    qualityStatus: 'Good'
  }
];

export interface InboundStock {
  id: string;
  batchId: string;
  farmer: string;
  product: string;
  quantity: number;
  harvestDate: string;
  arrivalDate: string;
  qualityStatus: string;
  inspectionStatus: 'Pending' | 'In Progress' | 'Completed';
  storageZone: string;
}

export const inboundStocks: InboundStock[] = [
  { id: 'IN-101', batchId: 'BATCH-MK-1024', farmer: 'Arun Kumar', product: 'Premium Rice', quantity: 500, harvestDate: '14 Aug 2026', arrivalDate: '15 Aug 2026', qualityStatus: 'Good', inspectionStatus: 'Pending', storageZone: 'Zone A' },
  { id: 'IN-102', batchId: 'BATCH-MK-1025', farmer: 'Muthu Kumar', product: 'Organic Wheat', quantity: 300, harvestDate: '14 Aug 2026', arrivalDate: '15 Aug 2026', qualityStatus: 'Good', inspectionStatus: 'In Progress', storageZone: 'Zone B' }
];

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  minThreshold: number;
  unit: string;
  storageZone: string;
  status: 'Healthy' | 'Low Stock' | 'Critical' | 'Out of Stock' | 'Active' | 'Inactive';
  lastUpdated: string;
  sellingPrice: number;
  purchasePrice: number;
  supplier: string;
  category: string;
  image?: string;
  description?: string;
}

export const inventoryItems: InventoryItem[] = products.map((prod, idx) => ({
  id: `INV-${String(idx + 1).padStart(3, '0')}`,
  productId: prod.id,
  productName: prod.name,
  batchId: `BATCH-MK-${1020 + idx}`,
  totalStock: prod.availableQty + 100,
  reservedStock: 25,
  availableStock: prod.availableQty,
  minThreshold: 30,
  unit: prod.unit,
  storageZone: prod.category === 'Rice & Grains' || prod.category === 'Wheat' || prod.category === 'Flour' ? 'Zone A' :
               prod.category === 'Pulses' || prod.category === 'Millets' ? 'Zone B' :
               prod.category === 'Vegetables' ? 'Zone D' :
               prod.category === 'Fruits' ? 'Zone E' :
               prod.category === 'Milk & Dairy' ? 'Zone F' : 'Zone G',
  status: 'Healthy',
  lastUpdated: '16 Aug 2026, 11:00 AM',
  sellingPrice: prod.price,
  purchasePrice: Math.round(prod.price * 0.8),
  supplier: prod.farmer.name,
  category: prod.category,
  image: prod.image,
  description: prod.description
}));

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  prevQty: number;
  changedQty: number;
  newQty: number;
  reason: string;
  user: string;
  date: string;
  type: 'Addition' | 'Removal' | 'Adjustment';
}

export const stockMovements: StockMovement[] = [
  {
    id: 'SM-001',
    productId: 'p1',
    productName: 'Premium Ponni Rice',
    prevQty: 450,
    changedQty: 50,
    newQty: 500,
    reason: 'Restocked from Farmer Muthu Kumar',
    user: 'Prakash Raj (Godown Officer)',
    date: '15 Aug 2026, 10:30 AM',
    type: 'Addition'
  },
  {
    id: 'SM-002',
    productId: 'p4',
    productName: 'Farm Fresh A2 Milk',
    prevQty: 120,
    changedQty: -20,
    newQty: 100,
    reason: 'Damaged packaging during transit',
    user: 'Karthik S (Picker)',
    date: '15 Aug 2026, 09:15 AM',
    type: 'Removal'
  }
];


export interface OutboundOrder {
  id: string;
  weight: number;
  volume: number;
  buyer: string;
  buyerType: 'Customer' | 'Business / Hotel';
  product: string;
  quantity: number;
  destination: string;
  requiredDate: string;
  status: 'Pending' | 'Picking' | 'Packing' | 'Ready for Dispatch' | 'Dispatched' | 'Completed';
  pickingEmployee?: string;
  packingEmployee?: string;
}

export const outboundOrders: OutboundOrder[] = [
  { id: 'ORD-MK-2045', buyer: 'Grand Hyatt', buyerType: 'Business / Hotel', product: 'Premium Rice', quantity: 150, weight: 150, volume: 0.5, destination: 'Guindy, Chennai', requiredDate: '16 Aug 2026', status: 'Pending' },
  { id: 'ORD-MK-2046', buyer: 'Ranjith R', buyerType: 'Customer', product: 'A2 Milk', quantity: 2, weight: 2, volume: 0.05, destination: 'Adyar, Chennai', requiredDate: '15 Aug 2026', status: 'Picking', pickingEmployee: 'MK-W-104' }
];

export interface WarehouseEmployee {
  id: string;
  name: string;
  role: 'Godown Officer' | 'Inventory Executive' | 'Quality Inspector' | 'Picker' | 'Packer' | 'Loader' | 'Security';
  shift: 'Morning' | 'Evening' | 'Night';
  status: 'Active' | 'On Leave' | 'Offline';
  currentTask?: string;
}

export const warehouseEmployees: WarehouseEmployee[] = [
  { id: 'MK-W-101', name: 'Prakash Raj', role: 'Godown Officer', shift: 'Morning', status: 'Active', currentTask: 'Overview' },
  { id: 'MK-W-104', name: 'Karthik S', role: 'Picker', shift: 'Morning', status: 'Active', currentTask: 'Picking ORD-MK-2046' },
  { id: 'MK-W-117', name: 'Ravi V', role: 'Packer', shift: 'Morning', status: 'Active', currentTask: 'Awaiting Task' }
];

export interface WarehouseTask {
  id: string;
  employeeId: string;
  employeeName: string;
  taskType: string;
  referenceId: string;
  startTime: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Delayed';
}

export const warehouseTasks: WarehouseTask[] = [
  { id: 'TASK-501', employeeId: 'MK-W-104', employeeName: 'Karthik S', taskType: 'Picking', referenceId: 'ORD-MK-2046', startTime: '09:30 AM', status: 'In Progress' }
];

// --- Transport Department Portal Mock Data ---

export interface TransportVehicle {
  id: string;
  number: string;
  type: 'Two Wheeler' | 'Three Wheeler' | 'Small delivery vehicle' | 'Mini Truck' | 'Truck' | 'Heavy Vehicle';
  maxWeight: number; // in kg
  maxVolume: number; // in cubic meters
  capacity: string;
  assignedDriver?: string;
  currentLocation: string;
  status: 'Available' | 'Assigned' | 'On Route' | 'Maintenance' | 'Inactive';
  serviceStatus: 'Healthy' | 'Service Due' | 'Under Maintenance' | 'Unavailable';
  lastService: string;
  nextService: string;
  insuranceStatus: 'Valid' | 'Expiring Soon' | 'Expired';
  fitnessStatus: 'Valid' | 'Expired';
}

export const transportVehicles: TransportVehicle[] = [
  { 
    id: 'MK-V-1024', 
    number: 'TN-38-AB-1234', 
    type: 'Mini Truck', 
    maxWeight: 1000,
    maxVolume: 4,
    capacity: '1,000 kg', 
    assignedDriver: 'Manoj Kumar', 
    currentLocation: 'Coimbatore', 
    status: 'Available', 
    serviceStatus: 'Healthy',
    lastService: '10 July 2026',
    nextService: '10 Oct 2026',
    insuranceStatus: 'Valid',
    fitnessStatus: 'Valid'
  },
  { 
    id: 'MK-V-104', 
    number: 'TN-37-CD-5678', 
    type: 'Truck', 
    maxWeight: 5000,
    maxVolume: 15,
    capacity: '5,000 kg', 
    assignedDriver: 'Siva R', 
    currentLocation: 'On Route to Erode', 
    status: 'On Route', 
    serviceStatus: 'Service Due',
    lastService: '05 May 2026',
    nextService: '15 Aug 2026',
    insuranceStatus: 'Valid',
    fitnessStatus: 'Valid'
  },
  { 
    id: 'MK-V-205', 
    number: 'TN-38-XY-9876', 
    type: 'Two Wheeler', 
    maxWeight: 30,
    maxVolume: 0.2,
    capacity: '30 kg', 
    assignedDriver: 'Rajesh K', 
    currentLocation: 'Adyar, Chennai', 
    status: 'Assigned', 
    serviceStatus: 'Healthy',
    lastService: '12 Aug 2026',
    nextService: '12 Nov 2026',
    insuranceStatus: 'Valid',
    fitnessStatus: 'Valid'
  }
];

export interface TransportDriver {
  id: string;
  name: string;
  phone: string;
  vehicleId?: string;
  type: 'Home Delivery Driver' | 'Bulk Delivery Driver';
  currentAssignment?: string;
  availability: 'Available' | 'Assigned' | 'On Route' | 'Off Duty' | 'On Leave';
  workload: number;
}

export const transportDrivers: TransportDriver[] = [
  { id: 'MK-D-101', name: 'Manoj Kumar', phone: '+91 98*** **123', vehicleId: 'MK-V-1024', type: 'Bulk Delivery Driver', availability: 'Available', workload: 0 },
  { id: 'MK-D-102', name: 'Siva R', phone: '+91 97*** **456', vehicleId: 'MK-V-104', type: 'Bulk Delivery Driver', availability: 'On Route', workload: 1 },
  { id: 'MK-D-201', name: 'Rajesh K', phone: '+91 96*** **789', vehicleId: 'MK-V-205', type: 'Home Delivery Driver', availability: 'Assigned', workload: 2 }
];

export interface TransportDelivery {
  id: string;
  type: 'Home Delivery' | 'Bulk Delivery';
  sourceGodown: string;
  destination: string;
  quantity: string;
  requiredDate: string;
  priority: 'Normal' | 'High' | 'Urgent';
  status: 'Awaiting Assignment' | 'Vehicle Assigned' | 'Driver Assigned' | 'Picked Up' | 'On Route' | 'Arriving' | 'Delivered' | 'Delayed';
  vehicleId?: string;
  driverId?: string;
  eta?: string;
  delayReason?: string;
  customerName?: string;
  timeline?: { status: string; time: string; note?: string }[];
}

export const transportQueue: TransportDelivery[] = [
  { id: 'MK-ORD-2045', type: 'Home Delivery', sourceGodown: 'Coimbatore Godown', destination: 'Coimbatore', quantity: '12 kg', requiredDate: 'Today', priority: 'Normal', status: 'Awaiting Assignment', customerName: 'Arul Mozhi' },
  { id: 'MK-BULK-1032', type: 'Bulk Delivery', sourceGodown: 'Coimbatore Godown', destination: 'Hotel ABC', quantity: '850 kg', requiredDate: 'Today', priority: 'High', status: 'On Route', vehicleId: 'MK-V-104', driverId: 'MK-D-102', eta: '2:30 PM' }
];

export const transportHistory: TransportDelivery[] = [
  { 
    id: 'MK-ORD-2040', 
    type: 'Home Delivery', 
    sourceGodown: 'Chennai Godown', 
    destination: 'Adyar, Chennai', 
    quantity: '5 kg', 
    requiredDate: '14 Aug 2026', 
    priority: 'Normal', 
    status: 'Delivered', 
    timeline: [
      { status: 'Order Ready', time: '08:00 AM' },
      { status: 'Driver Assigned', time: '09:00 AM' },
      { status: 'Picked Up', time: '10:00 AM' },
      { status: 'Delivered', time: '11:30 AM' }
    ]
  }
];

export interface TransportRoute {
  id: string;
  origin: string;
  destination: string;
  stops: number;
  distance: string;
  estimatedTime: string;
  vehicleId: string;
  driverId: string;
  status: 'Active' | 'Planned' | 'Completed';
}

export const transportRoutes: TransportRoute[] = [
  { id: 'RTE-MK-2045', origin: 'Coimbatore Godown', destination: 'Coimbatore', stops: 5, distance: '12 km', estimatedTime: '45 mins', vehicleId: 'MK-V-205', driverId: 'MK-D-201', status: 'Active' }
];

export interface TransportEmployee {
  id: string;
  name: string;
  role: 'Transport Officer' | 'Dispatch Coordinator' | 'Route Coordinator' | 'Fleet Manager' | 'Driver' | 'Delivery Supervisor';
  shift: 'Morning' | 'Afternoon' | 'Night';
  status: 'On Duty' | 'Off Duty' | 'On Leave';
  currentTask?: string;
}

export const transportEmployees: TransportEmployee[] = [
  { id: 'MK-T-101', name: 'Ranjith R', role: 'Transport Officer', shift: 'Morning', status: 'On Duty', currentTask: 'Overview' },
  { id: 'MK-T-102', name: 'Kumar S', role: 'Fleet Manager', shift: 'Morning', status: 'On Duty', currentTask: 'Vehicle Maintenance Audit' }
];

// --- Recruitment & Account Management Portal Mock Data ---

export interface Applicant {
  id: string;
  name: string;
  category: 'Hotel / Business' | 'Driver' | 'Vehicle Owner' | 'Employee';
  type?: string; // Hotel, Restaurant, Home Delivery Driver, etc.
  location: string;
  submittedDate: string;
  status: 'New' | 'Under Review' | 'Verification Pending' | 'Approved' | 'Rejected' | 'Account Creation Pending' | 'Account Created' | 'Active';
  assignedOfficer: string;
  contactEmail: string;
  contactPhone: string;
  documents: {
    name: string;
    type: string;
    status: 'Not Submitted' | 'Submitted' | 'Under Review' | 'Verified' | 'Rejected' | 'Resubmit Required';
    submittedDate?: string;
    verifiedBy?: string;
    verifiedDate?: string;
  }[];
  notes?: string;
}

export const applicants: Applicant[] = [
  {
    id: 'APP-HB-1001',
    name: 'Grand Royal Hotel',
    category: 'Hotel / Business',
    type: 'Hotel',
    location: 'Coimbatore',
    submittedDate: '12 Aug 2026',
    status: 'Verification Pending',
    assignedOfficer: 'MK-REC-01',
    contactEmail: 'admin@grandroyal.com',
    contactPhone: '+91 98765 43210',
    documents: [
      { name: 'Business Registration', type: 'Business Document', status: 'Verified', submittedDate: '12 Aug 2026', verifiedBy: 'MK-REC-01', verifiedDate: '13 Aug 2026' },
      { name: 'FSSAI License', type: 'Business Document', status: 'Under Review', submittedDate: '12 Aug 2026' },
      { name: 'GST Certificate', type: 'Tax Document', status: 'Submitted', submittedDate: '12 Aug 2026' }
    ],
    notes: 'Large scale requirement for vegetables and dairy.'
  },
  {
    id: 'APP-DR-2005',
    name: 'Suresh Kumar',
    category: 'Driver',
    type: 'Bulk Delivery',
    location: 'Chennai',
    submittedDate: '13 Aug 2026',
    status: 'New',
    assignedOfficer: 'MK-REC-02',
    contactEmail: 'suresh.k@email.com',
    contactPhone: '+91 91234 56789',
    documents: [
      { name: 'Driving License', type: 'Identity Document', status: 'Submitted', submittedDate: '13 Aug 2026' },
      { name: 'Aadhar Card', type: 'Identity Document', status: 'Submitted', submittedDate: '13 Aug 2026' }
    ]
  },
  {
    id: 'APP-VO-3012',
    name: 'Vijay Transport',
    category: 'Vehicle Owner',
    type: 'Mini Truck',
    location: 'Madurai',
    submittedDate: '10 Aug 2026',
    status: 'Approved',
    assignedOfficer: 'MK-REC-01',
    contactEmail: 'vijay@transport.com',
    contactPhone: '+91 94444 55555',
    documents: [
      { name: 'RC Book', type: 'Vehicle Document', status: 'Verified', submittedDate: '10 Aug 2026', verifiedBy: 'MK-REC-01', verifiedDate: '11 Aug 2026' },
      { name: 'Insurance', type: 'Vehicle Document', status: 'Verified', submittedDate: '10 Aug 2026', verifiedBy: 'MK-REC-01', verifiedDate: '11 Aug 2026' }
    ]
  },
  {
    id: 'APP-EMP-4008',
    name: 'Anjali Sharma',
    category: 'Employee',
    type: 'Operations Executive',
    location: 'Chennai Head Office',
    submittedDate: '14 Aug 2026',
    status: 'Under Review',
    assignedOfficer: 'MK-REC-03',
    contactEmail: 'anjali.s@email.com',
    contactPhone: '+91 98888 77777',
    documents: [
      { name: 'ID Proof', type: 'Identity Document', status: 'Submitted', submittedDate: '14 Aug 2026' },
      { name: 'Address Proof', type: 'Identity Document', status: 'Submitted', submittedDate: '14 Aug 2026' }
    ]
  }
];

export type AccountStatus = 
  | 'Pending Verification' 
  | 'Verified' 
  | 'Pending Approval' 
  | 'Active' 
  | 'Suspended' 
  | 'Inactive' 
  | 'Rejected';

export interface ManagedAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  category: 
    | 'Godown Manager'
    | 'Godown Employee'
    | 'Driver'
    | 'Transport Manager'
    | 'Vehicle Partner'
    | 'Hotel / Business Partner'
    | 'Office Employee'
    | 'Sales Employee'
    | 'Accounts Employee'
    | 'Recruitment Employee'
    | 'Other';
  department: 
    | 'Godown' 
    | 'Transport' 
    | 'Recruitment' 
    | 'Office' 
    | 'Accounts' 
    | 'Sales' 
    | 'Business';
  role: string;
  portal: string;
  location: string;
  createdDate: string;
  createdBy: string;
  status: AccountStatus;
  verificationStatus: 'Unverified' | 'Verified';
  joiningDate: string;
  permissions: string[];
}

export const managedAccounts: ManagedAccount[] = [
  { 
    id: 'MK-EMP-104', 
    name: 'Prakash Raj', 
    email: 'prakash.r@marutham.com',
    phone: '+91 98765 43210',
    category: 'Godown Manager', 
    department: 'Godown',
    role: 'Regional Manager', 
    portal: '/godown',
    location: 'Chennai', 
    createdDate: '10 Jul 2026', 
    createdBy: 'MK-REC-03',
    status: 'Active', 
    verificationStatus: 'Verified',
    joiningDate: '15 Jul 2026',
    permissions: ['manage_products', 'manage_inventory', 'process_orders']
  },
  { 
    id: 'MK-DRI-045', 
    name: 'Karthik Raja', 
    email: 'karthik.r@marutham.com',
    phone: '+91 98765 43211',
    category: 'Driver', 
    department: 'Transport',
    role: 'Delivery Executive', 
    portal: '/driver/dashboard',
    location: 'Coimbatore', 
    createdDate: '05 Aug 2026', 
    createdBy: 'MK-REC-01',
    status: 'Active',
    verificationStatus: 'Verified',
    joiningDate: '10 Aug 2026',
    permissions: ['view_deliveries', 'update_status', 'otp_entry']
  },
  { 
    id: 'MK-EMP-201', 
    name: 'Meena Iyer', 
    email: 'meena.i@marutham.com',
    phone: '+91 98765 43212',
    category: 'Recruitment Employee', 
    department: 'Recruitment',
    role: 'HR Specialist', 
    portal: '/recruitment',
    location: 'Head Office', 
    createdDate: '12 Aug 2026', 
    createdBy: 'MK-REC-03',
    status: 'Active',
    verificationStatus: 'Verified',
    joiningDate: '15 Aug 2026',
    permissions: ['create_accounts', 'verify_accounts', 'approve_accounts']
  },
  { 
    id: 'MK-EMP-106', 
    name: 'Suresh Kumar', 
    email: 'suresh.finance@maruthamkart.com',
    phone: '+91 98765 43213',
    category: 'Office Employee', 
    department: 'Office',
    role: 'Head of Finance', 
    portal: '/office/dashboard',
    location: 'Head Office', 
    createdDate: '12 Aug 2026', 
    createdBy: 'MK-REC-01',
    status: 'Active',
    verificationStatus: 'Verified',
    joiningDate: '15 Aug 2026',
    permissions: ['READ_FINANCE', 'APPROVE_EXPENSE', 'MANAGE_REPORTS', 'AUDIT_LOGS']
  }

];


export interface RecruitmentOfficer {
  id: string;
  name: string;
  region: string;
  assigned: number;
  pending: number;
  completed: number;
  status: 'Available' | 'Busy' | 'On Leave';
}

export const recruitmentOfficers: RecruitmentOfficer[] = [
  { id: 'MK-REC-01', name: 'Sundar C', region: 'Tamil Nadu North', assigned: 15, pending: 4, completed: 124, status: 'Available' },
  { id: 'MK-REC-02', name: 'Meena K', region: 'Tamil Nadu South', assigned: 12, pending: 8, completed: 98, status: 'Busy' },
  { id: 'MK-REC-03', name: 'Arjun V', region: 'Head Office', assigned: 20, pending: 5, completed: 156, status: 'Available' }
];

export const recruitmentAnalytics = {
  monthlyApplications: [120, 150, 140, 180, 210, 250],
  categories: [
    { name: 'Hotel / Business', count: 85, color: '#16803A' },
    { name: 'Driver', count: 120, color: '#22C55E' },
    { name: 'Vehicle Partner', count: 45, color: '#4ADE80' },
    { name: 'Employee', count: 30, color: '#86EFAC' }
  ],
  stats: {
    approvalRate: 72,
    avgVerificationTime: '3.2 Days',
    accountsCreatedMonth: 48
  }
};

export interface DeliveryOTP {
  orderId: string;
  otp: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
}

export const deliveryOTPs: Record<string, DeliveryOTP> = {};

export interface DeliveryConfirmation {
  orderId: string;
  customerName: string;
  deliveryTime: string;
  driverName: string;
  vehicleNumber: string;
  location: string;
  method: 'OTP';
  status: 'DELIVERED';
}

export const deliveryConfirmations: DeliveryConfirmation[] = [
  {
    orderId: 'MK-ORD-2044',
    customerName: 'Suresh Raina',
    deliveryTime: '14 Aug 2026, 10:15 AM',
    driverName: 'Karthik Raja',
    vehicleNumber: 'TN-38-BZ-4452',
    location: 'Peelamedu, Coimbatore',
    method: 'OTP',
    status: 'DELIVERED'
  }
];

export const auditLogs: any[] = [];




export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'AVAILABLE' | 'ON DELIVERY' | 'BREAK' | 'OFF DUTY' | 'UNAVAILABLE';
  vehicleId: string;
  rating: number;
  totalDeliveries: number;
  joinedDate: string;
}

export const drivers: DriverProfile[] = [
  {
    id: 'MK-DRI-1042',
    name: 'Arun Kumar',
    phone: '+91 98765 43210',
    email: 'arun.k@maruthamkart.com',
    licenseNumber: 'TN-37-2022-0004561',
    licenseExpiry: '15 Aug 2032',
    status: 'AVAILABLE',
    vehicleId: 'MK-VAN-023',
    rating: 4.8,
    totalDeliveries: 1240,
    joinedDate: '12 Jan 2024'
  }
];

export interface Vehicle {
  id: string;
  type: string;
  number: string;
  capacity: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'IN_USE';
  insuranceExpiry: string;
  fitnessExpiry: string;
  lastMaintenance: string;
}

export const vehicles: Vehicle[] = [
  {
    id: 'MK-VAN-023',
    type: 'Delivery Van',
    number: 'TN 37 CQ 4521',
    capacity: '1,500 kg',
    status: 'ACTIVE',
    insuranceExpiry: '10 Dec 2026',
    fitnessExpiry: '15 Jan 2027',
    lastMaintenance: '01 Aug 2026'
  }
];

export interface DriverDelivery {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  type: 'HOUSEHOLD' | 'BULK / HOTEL';
  weight: string;
  packageCount: number;
  pickupGodown: string;
  godownAddress: string;
  eta: string;
  status: 'ASSIGNED' | 'READY FOR PICKUP' | 'ARRIVED AT GODOWN' | 'LOADING' | 'PICKED UP' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'DELAYED' | 'FAILED';
  items: { name: string; qty: string }[];
  failureReason?: string;
  failureNotes?: string;
}

export const driverDeliveries: DriverDelivery[] = [
  {
    id: 'MK-ORD-2045',
    customerName: 'Arul Mozhi',
    address: '123, 4th Street, Adyar, Chennai - 600020',
    phone: '+91 94432 11223',
    type: 'HOUSEHOLD',
    weight: '12 kg',
    packageCount: 3,
    pickupGodown: 'Coimbatore Godown',
    godownAddress: 'Avinashi Road, Coimbatore',
    eta: '10:30 AM',
    status: 'ASSIGNED',
    items: [
      { name: 'Premium Ponni Rice', qty: '10 kg' },
      { name: 'Organic Wheat', qty: '2 kg' }
    ]
  },
  {
    id: 'MK-BULK-1032',
    customerName: 'Hotel ABC',
    address: 'Gandhipuram, Coimbatore - 641012',
    phone: '+91 422 2345678',
    type: 'BULK / HOTEL',
    weight: '850 kg',
    packageCount: 17,
    pickupGodown: 'Coimbatore Godown',
    godownAddress: 'Avinashi Road, Coimbatore',
    eta: '02:00 PM',
    status: 'ASSIGNED',
    items: [
      { name: 'Bulk Ponni Rice', qty: '500 kg' },
      { name: 'Bulk Wheat Flour', qty: '350 kg' }
    ]
  }
];
