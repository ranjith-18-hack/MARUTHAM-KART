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
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
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
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
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
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
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
    image: 'https://images.unsplash.com/photo-1550583724-12760b82ba20?auto=format&fit=crop&q=80&w=600',
    farmer: farmers[0]!,
    description: 'Pure A2 milk from native cow breeds. Delivered within 4 hours of milking.',
    qualityInfo: 'Zero Adulteration, Chilled Delivery',
    harvestDate: 'Daily Fresh',
    deliveryEstimate: 'Today, within 2 hours'
  },
  {
    id: 'p5',
    name: 'Hybrid Country Tomatoes',
    category: 'Vegetables',
    price: 35,
    unit: 'kg',
    availability: 'Available',
    availableQty: 80,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600',
    farmer: farmers[1]!,
    description: 'Juicy, vine-ripened tomatoes grown using sustainable practices.',
    qualityInfo: 'Hand-picked, Firm Texture',
    harvestDate: 'Yesterday',
    deliveryEstimate: 'Today, by 8 PM'
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

export const b2bProducts: B2BProduct[] = [
  {
    id: products[0]!.id,
    name: products[0]!.name,
    category: products[0]!.category,
    price: products[0]!.price,
    unit: products[0]!.unit,
    availability: products[0]!.availability,
    availableQty: products[0]!.availableQty,
    rating: products[0]!.rating,
    image: products[0]!.image,
    farmer: products[0]!.farmer,
    description: products[0]!.description,
    qualityInfo: products[0]!.qualityInfo,
    harvestDate: products[0]!.harvestDate,
    deliveryEstimate: products[0]!.deliveryEstimate,
    minBulkQty: 100,
    priceTiers: [
      { min: 1, max: 99, price: 64 },
      { min: 100, max: 499, price: 61 },
      { min: 500, max: 'plus', price: 58 }
    ]
  },
  {
    id: products[1]!.id,
    name: products[1]!.name,
    category: products[1]!.category,
    price: products[1]!.price,
    unit: products[1]!.unit,
    availability: products[1]!.availability,
    availableQty: products[1]!.availableQty,
    rating: products[1]!.rating,
    image: products[1]!.image,
    farmer: products[1]!.farmer,
    description: products[1]!.description,
    qualityInfo: products[1]!.qualityInfo,
    harvestDate: products[1]!.harvestDate,
    deliveryEstimate: products[1]!.deliveryEstimate,
    minBulkQty: 50,
    priceTiers: [
      { min: 1, max: 49, price: 42 },
      { min: 50, max: 199, price: 39 },
      { min: 200, max: 'plus', price: 36 }
    ]
  },
  {
    id: products[2]!.id,
    name: products[2]!.name,
    category: products[2]!.category,
    price: products[2]!.price,
    unit: products[2]!.unit,
    availability: products[2]!.availability,
    availableQty: products[2]!.availableQty,
    rating: products[2]!.rating,
    image: products[2]!.image,
    farmer: products[2]!.farmer,
    description: products[2]!.description,
    qualityInfo: products[2]!.qualityInfo,
    harvestDate: products[2]!.harvestDate,
    deliveryEstimate: products[2]!.deliveryEstimate,
    minBulkQty: 25,
    priceTiers: [
      { min: 1, max: 24, price: 55 },
      { min: 25, max: 99, price: 52 },
      { min: 100, max: 'plus', price: 48 }
    ]
  }
];

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

export const inventoryItems: InventoryItem[] = [
  { 
    id: 'INV-001', 
    productId: 'p1',
    productName: 'Premium Ponni Rice', 
    batchId: 'BATCH-MK-1024', 
    totalStock: 500, 
    reservedStock: 150, 
    availableStock: 350, 
    minThreshold: 100,
    unit: 'kg', 
    storageZone: 'Zone A', 
    status: 'Healthy',
    lastUpdated: '15 Aug 2026, 10:30 AM',
    sellingPrice: 65,
    purchasePrice: 52,
    supplier: 'Muthu Kumar',
    category: 'Rice & Grains',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
    description: 'Traditional Ponni rice aged for 12 months for perfect texture and aroma.'
  },
  { 
    id: 'INV-002', 
    productId: 'p2',
    productName: 'Organic Whole Wheat', 
    batchId: 'BATCH-MK-1025', 
    totalStock: 300, 
    reservedStock: 0, 
    availableStock: 300, 
    minThreshold: 50,
    unit: 'kg', 
    storageZone: 'Zone B', 
    status: 'Healthy',
    lastUpdated: '14 Aug 2026, 04:15 PM',
    sellingPrice: 42,
    purchasePrice: 35,
    supplier: 'Lakshmi Devi',
    category: 'Wheat',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
    description: '100% organic whole wheat, rich in fiber and nutrients.'
  },
  { 
    id: 'INV-003', 
    productId: 'p4',
    productName: 'Farm Fresh A2 Milk', 
    batchId: 'BATCH-MK-MILK-204', 
    totalStock: 100, 
    reservedStock: 40, 
    availableStock: 60, 
    minThreshold: 80,
    unit: 'L', 
    storageZone: 'Zone F', 
    status: 'Low Stock',
    lastUpdated: '15 Aug 2026, 11:00 AM',
    sellingPrice: 78,
    purchasePrice: 65,
    supplier: 'Muthu Kumar',
    category: 'Milk & Dairy',
    image: 'https://images.unsplash.com/photo-1550583724-12760b82ba20?auto=format&fit=crop&q=80&w=600',
    description: 'Pure A2 milk from native cow breeds.'
  }
];

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
