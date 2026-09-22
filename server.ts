import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  UserModel,
  MenuItemModel,
  ZoneModel,
  CourierModel,
  CustomerModel,
  InventoryModel,
  CouponModel,
  OrderModel,
  RestaurantStatusModel,
  DayCloseModel,
} from './serverModels.ts';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'zuparo-secret-key-change-me';
const JWT_EXPIRES_IN = '7d';

app.use(express.json());

// In-memory data store
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'customer';
  password_hash: string;
  createdAt: string;
}

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  priceFoodora: number;
  priceFalatozz: number;
  available: boolean;
  recipe: Array<{ inventoryId: string; qty: number; unit?: string }>;
  image?: string;
}

// Unit conversion helper for inventory deduction and recipe management
function convertUnit(qty: number, fromUnit?: string, toUnit?: string): number {
  const q = Number(qty) || 0;
  if (q === 0) return 0;
  const from = (fromUnit || '').toLowerCase().trim();
  const to = (toUnit || '').toLowerCase().trim();
  if (!from || !to || from === to) return q;

  const weightToGrams: Record<string, number> = {
    kg: 1000,
    kilogramm: 1000,
    dkg: 10,
    dekagramm: 10,
    g: 1,
    gramm: 1,
  };

  if (weightToGrams[from] && weightToGrams[to]) {
    const inGrams = q * weightToGrams[from];
    return inGrams / weightToGrams[to];
  }

  const volumeToMl: Record<string, number> = {
    l: 1000,
    liter: 1000,
    dl: 100,
    deciliter: 100,
    cl: 10,
    ml: 1,
    milliliter: 1,
  };

  if (volumeToMl[from] && volumeToMl[to]) {
    const inMl = q * volumeToMl[from];
    return inMl / volumeToMl[to];
  }

  return q;
}

interface RestaurantStatus {
  isOpen: boolean;
  allowOrder247: boolean;
  customNotice: string;
  lastChangedAt: string;
}

interface Zone {
  id: string;
  zip: string;
  city: string;
  fee: number;
}

interface Courier {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  zip: string;
  city: string;
  street: string;
  floor: string;
  orderCount: number;
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
}

interface Coupon {
  id: string;
  code: string;
  kind: 'percent' | 'amount';
  value: number;
  active: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  zip: string;
  city: string;
  street: string;
  floor: string;
  type: 'delivery' | 'pickup' | 'dinein';
  payment: 'cash' | 'card' | 'online';
  channel: 'house' | 'foodora' | 'falatozz' | 'online';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountPct: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  note?: string;
  status: 'new' | 'in_progress' | 'courier' | 'delivered' | 'cancelled';
  courierId?: string | null;
  createdAt: string;
  userId?: string | null;
  isOnlineOrder?: boolean;
  source?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

interface DayClose {
  id: string;
  date: string;
  orders: number;
  revenue: number;
  byPayment: Record<string, number>;
  byChannel: Record<string, number>;
  byCourier: Array<{ name: string; orders: number; revenue: number }>;
  closedAt: string;
}

// Memory database (primary fast cache, synchronized with MongoDB when connected)
const users: Map<string, User> = new Map();
const menuItems: Map<string, MenuItem> = new Map();
const deliveryZones: Map<string, Zone> = new Map();
const couriers: Map<string, Courier> = new Map();
const customers: Map<string, Customer> = new Map();
const inventoryItems: Map<string, InventoryItem> = new Map();
const coupons: Map<string, Coupon> = new Map();
const orders: Map<string, Order> = new Map();
const dayCloses: DayClose[] = [];

// Restaurant manual Open/Closed and 0-24 order acceptance status
let restaurantStatus: RestaurantStatus = {
  isOpen: true,
  allowOrder247: true,
  customNotice: '0-24 órában fogadjuk a rendeléseket! Kiszállítás és átvétel zavartalan.',
  lastChangedAt: new Date().toISOString(),
};

// ================= MONGODB INTEGRATION & SYNC =================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zuparo';
let isMongoConnected = false;

// Timezone helper for Budapest / Hungary (midnight rollover)
function getBudapestDate(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest' }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

function getOrderBudapestDate(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest' }).format(d);
    }
  } catch {}
  return createdAt ? createdAt.split('T')[0] : '';
}

async function initMongoDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri && process.env.NODE_ENV !== 'production') {
    console.log('ℹ️ MONGODB_URI not configured in development environment. Using in-memory database with full local persistence.');
    return;
  }
  try {
    console.log(`[MongoDB] Connecting to MongoDB instance at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log('✅ [MongoDB] Connected to MongoDB successfully!');
    await syncMongoData();
  } catch (err: any) {
    console.warn(`⚠️ [MongoDB] Connection warning (${err?.message || 'timeout'}). Continuing with in-memory storage fallback.`);
    isMongoConnected = false;
  }
}

async function syncMongoData() {
  if (!isMongoConnected) return;
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('🌱 [MongoDB] Empty database detected. Seeding collections into MongoDB...');
      const uList = Array.from(users.values());
      if (uList.length) await UserModel.insertMany(uList);

      const mList = Array.from(menuItems.values());
      if (mList.length) await MenuItemModel.insertMany(mList);

      const zList = Array.from(deliveryZones.values());
      if (zList.length) await ZoneModel.insertMany(zList);

      const cList = Array.from(couriers.values());
      if (cList.length) await CourierModel.insertMany(cList);

      const iList = Array.from(inventoryItems.values());
      if (iList.length) await InventoryModel.insertMany(iList);

      const cpList = Array.from(coupons.values());
      if (cpList.length) await CouponModel.insertMany(cpList);

      const oList = Array.from(orders.values());
      if (oList.length) await OrderModel.insertMany(oList);

      await RestaurantStatusModel.findOneAndUpdate(
        { id: 'singleton_status' },
        { id: 'singleton_status', ...restaurantStatus },
        { upsert: true }
      );
      console.log('✅ [MongoDB] Initial data seeded to MongoDB successfully!');
    } else {
      console.log('📥 [MongoDB] Loading existing data from MongoDB into cache...');
      const [uDocs, mDocs, zDocs, cDocs, custDocs, iDocs, cpDocs, oDocs, dcDocs, stDoc] = await Promise.all([
        UserModel.find().lean(),
        MenuItemModel.find().lean(),
        ZoneModel.find().lean(),
        CourierModel.find().lean(),
        CustomerModel.find().lean(),
        InventoryModel.find().lean(),
        CouponModel.find().lean(),
        OrderModel.find().lean(),
        DayCloseModel.find().lean(),
        RestaurantStatusModel.findOne({ id: 'singleton_status' }).lean(),
      ]);

      if (uDocs.length) {
        users.clear();
        for (const u of uDocs) users.set(u.id, u as any);
      }
      if (mDocs.length) {
        menuItems.clear();
        for (const m of mDocs) menuItems.set(m.id, m as any);
      }
      if (zDocs.length) {
        deliveryZones.clear();
        for (const z of zDocs) deliveryZones.set(z.id, z as any);
      }
      if (cDocs.length) {
        couriers.clear();
        for (const c of cDocs) couriers.set(c.id, c as any);
      }
      if (custDocs.length) {
        customers.clear();
        for (const cu of custDocs) customers.set(cu.id, cu as any);
      }
      if (iDocs.length) {
        inventoryItems.clear();
        for (const i of iDocs) inventoryItems.set(i.id, i as any);
      }
      if (cpDocs.length) {
        coupons.clear();
        for (const cp of cpDocs) coupons.set(cp.id, cp as any);
      }
      if (oDocs.length) {
        orders.clear();
        for (const o of oDocs) orders.set(o.id, o as any);
      }
      if (dcDocs.length) {
        dayCloses.length = 0;
        dayCloses.push(...(dcDocs as any));
      }
      if (stDoc) {
        restaurantStatus = {
          isOpen: stDoc.isOpen,
          allowOrder247: stDoc.allowOrder247,
          customNotice: stDoc.customNotice,
          lastChangedAt: stDoc.lastChangedAt,
        };
      }
      console.log(`✅ [MongoDB] Loaded ${oDocs.length} orders and ${mDocs.length} menu items from MongoDB!`);
    }
  } catch (err) {
    console.error('MongoDB sync error:', err);
  }
}

// Seed initial data
function seedData() {
  // Admin user
  const adminId = crypto.randomUUID();
  users.set(adminId, {
    id: adminId,
    email: 'admin@zuparo.hu',
    name: 'Sári Roland',
    phone: '+36 30 123 4567',
    role: 'admin',
    password_hash: bcrypt.hashSync('admin123', 10),
    createdAt: new Date().toISOString(),
  });

  // Regular customer demo user
  const customerId = crypto.randomUUID();
  users.set(customerId, {
    id: customerId,
    email: 'vendeg@zuparo.hu',
    name: 'Teszt Vendég',
    phone: '+36 30 987 6543',
    role: 'customer',
    password_hash: bcrypt.hashSync('vendeg123', 10),
    createdAt: new Date().toISOString(),
  });

  // Zones
  const rawZones = [
    ['3734', 'Szuhogy', 500],
    ['3733', 'Rudabánya', 700],
    ['3600', 'Ózd', 900],
    ['3700', 'Kazincbarcika', 1200],
    ['3780', 'Edelény', 1000],
  ] as const;

  for (const [zip, city, fee] of rawZones) {
    const id = crypto.randomUUID();
    deliveryZones.set(id, { id, zip, city, fee });
  }

  // Couriers
  const rawCouriers = [
    ['Putnoki bálint', '+36 30 111 2222', true],
    ['Ruben', '+36 30 333 4444', true],
    ['ZSIGRAI BÁLINT', '+36 30 555 6666', true],
    ['Foodora / Wolt futár', '+36 30 777 8888', true],
    ['SANYI', '+36 30 999 0000', true],
  ] as const;

  const courierIds: string[] = [];
  for (const [name, phone, active] of rawCouriers) {
    const id = crypto.randomUUID();
    courierIds.push(id);
    couriers.set(id, { id, name, phone, active });
  }

  // Inventory
  const rawInv = [
    ['Mozzarella sajt', 'kg', 12, 5],
    ['Paradicsomszósz', 'l', 8, 3],
    ['Pizza tészta', 'db', 45, 20],
    ['Csirkemell', 'kg', 6, 4],
    ['Marhahús', 'kg', 3, 5],
    ['Hamburger zsemle', 'db', 30, 15],
    ['Coca-Cola 0,5l', 'db', 24, 12],
  ] as const;

  for (const [name, unit, stock, minStock] of rawInv) {
    const id = crypto.randomUUID();
    inventoryItems.set(id, { id, name, unit, stock, minStock });
  }

  // Menu
  const rawMenu = [
    ['pizzak', 'Margherita', 'Paradicsomszósz, mozzarella', 2190],
    ['pizzak', 'Sonkás', 'Paradicsomszósz, sonka, mozzarella', 2390],
    ['pizzak', 'Szalámis', 'Paradicsomszósz, szalámi, mozzarella', 2490],
    ['pizzak', 'Hawaii', 'Paradicsomszósz, sonka, ananász, mozzarella', 2490],
    ['pizzak', 'Négysajtos', 'Paradicsomszósz, négyféle sajt', 2590],
    ['pizzak', 'Diavolo', 'Paradicsomszósz, szalámi, chili, mozzarella', 2590],
    ['pizzak', 'BBQ Csirke', 'BBQ szósz, csirke, lilahagyma, mozzarella', 2690],
    ['pizzak', 'Tonhalas', 'Paradicsomszósz, tonhal, lilahagyma, mozzarella', 2690],
    ['pizzak', 'ZUPARO Special', 'Paradicsomszósz, sonka, szalámi, gomba, kukorica, mozzarella', 2890],
    ['hamburgerek', 'ZUPARO Burger menü', 'Marhahús, cheddar, friss zöldségek, ZUPARO szósz + hasáb + üdítő', 2890],
    ['hamburgerek', 'Cheeseburger', 'Marhahús, cheddar, saláta, uborka', 2190],
    ['hamburgerek', 'Dupla Burger', 'Dupla marhahús, dupla sajt, ZUPARO szósz', 2990],
    ['hamburgerek', 'Csirke Burger', 'Rántott csirke, saláta, majonéz', 2290],
    ['gyros', 'Gyros tál', 'Szaftos hús, friss saláta, hasábburgonya, öntet', 2490],
    ['gyros', 'Gyros pita', 'Pita, hús, zöldség, tzatziki', 1990],
    ['gyros', 'Csirke Gyros tál', 'Csirkehús, saláta, hasáb, öntet', 2390],
    ['tortillak', 'Csirkés tortilla', 'Grillezett csirke, zöldségek, szósz', 2390],
    ['tortillak', 'Marhás tortilla', 'Marhahús, saláta, cheddar, BBQ', 2490],
    ['tortillak', 'Vega tortilla', 'Zöldségek, hummusz, saláta', 1990],
    ['salatak', 'Cézár saláta', 'Csirke, jégsaláta, parmezán, cézár öntet', 2190],
    ['salatak', 'Görög saláta', 'Paradicsom, uborka, feta, olivabogyó', 1990],
    ['koretek', 'Hasábburgonya', 'Ropogósra sütve', 890],
    ['koretek', 'Édesburgonya', 'Sült édesburgonya', 1190],
    ['koretek', 'Rántott hagymakarika', '6 db', 990],
    ['desszertek', 'Somlói galuska', 'Klasszikus házi somlói', 1290],
    ['desszertek', 'Tiramisu', 'Olasz kávés desszert', 1490],
    ['italok', 'Coca-Cola 0,5l', '', 590],
    ['italok', 'Fuze Tea 0,5l', '', 590],
    ['italok', 'Ásványvíz 0,5l', '', 390],
    ['italok', 'Fanta 0,5l', '', 590],
  ] as const;

  const sampleImages: Record<string, string> = {
    'Margherita': 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
    'Sonkás': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    'ZUPARO Special': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80',
    'ZUPARO Burger menü': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    'Cheeseburger': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    'Gyros tál': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
    'Csirkés tortilla': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80',
    'Cézár saláta': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    'Somlói galuska': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    'Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
  };

  for (const [category, name, description, price] of rawMenu) {
    const id = crypto.randomUUID();
    menuItems.set(id, {
      id,
      category,
      name,
      description,
      price,
      priceFoodora: Math.round(price * 1.25),
      priceFalatozz: Math.round(price * 1.2),
      available: true,
      recipe: [],
      image: sampleImages[name] || '',
    });
  }

  // Pre-seed realistic recipes with units (g, ml, db)
  const invByName = new Map<string, string>();
  for (const [id, inv] of inventoryItems.entries()) {
    invByName.set(inv.name, id);
  }
  const mozzarellaId = invByName.get('Mozzarella sajt');
  const paradicsomId = invByName.get('Paradicsomszósz');
  const tesztaId = invByName.get('Pizza tészta');
  const marhaId = invByName.get('Marhahús');
  const csirkeId = invByName.get('Csirkemell');
  const zsemleId = invByName.get('Hamburger zsemle');
  const colaId = invByName.get('Coca-Cola 0,5l');

  for (const item of menuItems.values()) {
    if (item.name === 'Margherita' && mozzarellaId && paradicsomId && tesztaId) {
      item.recipe = [
        { inventoryId: tesztaId, qty: 1, unit: 'db' },
        { inventoryId: paradicsomId, qty: 80, unit: 'ml' },
        { inventoryId: mozzarellaId, qty: 250, unit: 'g' },
      ];
    } else if (item.name === 'Sonkás' && mozzarellaId && paradicsomId && tesztaId) {
      item.recipe = [
        { inventoryId: tesztaId, qty: 1, unit: 'db' },
        { inventoryId: paradicsomId, qty: 80, unit: 'ml' },
        { inventoryId: mozzarellaId, qty: 200, unit: 'g' },
      ];
    } else if (item.name === 'ZUPARO Special' && mozzarellaId && paradicsomId && tesztaId) {
      item.recipe = [
        { inventoryId: tesztaId, qty: 1, unit: 'db' },
        { inventoryId: paradicsomId, qty: 90, unit: 'ml' },
        { inventoryId: mozzarellaId, qty: 220, unit: 'g' },
      ];
    } else if (item.name === 'Cheeseburger' && zsemleId && marhaId && mozzarellaId) {
      item.recipe = [
        { inventoryId: zsemleId, qty: 1, unit: 'db' },
        { inventoryId: marhaId, qty: 150, unit: 'g' },
        { inventoryId: mozzarellaId, qty: 50, unit: 'g' },
      ];
    } else if (item.name === 'ZUPARO Burger menü' && zsemleId && marhaId && mozzarellaId && colaId) {
      item.recipe = [
        { inventoryId: zsemleId, qty: 1, unit: 'db' },
        { inventoryId: marhaId, qty: 180, unit: 'g' },
        { inventoryId: mozzarellaId, qty: 60, unit: 'g' },
        { inventoryId: colaId, qty: 1, unit: 'db' },
      ];
    } else if (item.name === 'Csirkés tortilla' && csirkeId) {
      item.recipe = [
        { inventoryId: csirkeId, qty: 150, unit: 'g' },
      ];
    } else if (item.name === 'Coca-Cola 0,5l' && colaId) {
      item.recipe = [
        { inventoryId: colaId, qty: 1, unit: 'db' },
      ];
    }
  }

  // Coupons
  const rawCoupons = [
    { code: 'ZUPARO10', kind: 'percent', value: 10, active: true },
    { code: 'NYITAS500', kind: 'amount', value: 500, active: true },
    { code: 'VIP20', kind: 'percent', value: 20, active: true },
  ] as const;

  for (const c of rawCoupons) {
    const id = crypto.randomUUID();
    coupons.set(id, { id, ...c });
  }

  // Customers
  const rawCustomers = [
    { name: 'Kovács Péter', phone: '+36 30 456 7890', zip: '3734', city: 'Szuhogy', street: 'Kossuth u. 12.', floor: '2/4', orderCount: 4 },
    { name: 'Nagy Anna', phone: '+36 20 234 5678', zip: '3733', city: 'Rudabánya', street: 'Petőfi út 8.', floor: '', orderCount: 2 },
    { name: 'Szabó Tamás', phone: '+36 70 890 1234', zip: '3600', city: 'Ózd', street: 'Béke tér 5.', floor: '1. em.', orderCount: 7 },
  ];

  for (const c of rawCustomers) {
    const id = crypto.randomUUID();
    customers.set(id, { id, ...c });
  }

  // Sample Orders
  const now = new Date();
  const sampleOrders: Order[] = [
    {
      id: 'ORD-2026-0125',
      customerName: 'Kovács Péter',
      phone: '+36 30 456 7890',
      zip: '3734',
      city: 'Szuhogy',
      street: 'Kossuth u. 12.',
      floor: '2/4',
      type: 'delivery',
      payment: 'card',
      channel: 'house',
      items: [
        { id: '1', name: 'ZUPARO Special', price: 2890, qty: 2 },
        { id: '2', name: 'Coca-Cola 0,5l', price: 590, qty: 2 },
      ],
      subtotal: 6960,
      deliveryFee: 500,
      discountPct: 0,
      discountAmount: 0,
      total: 7460,
      note: 'Csengő működik',
      status: 'delivered',
      courierId: courierIds[0],
      createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      userId: customerId,
    },
    {
      id: 'ORD-2026-0126',
      customerName: 'Nagy Anna',
      phone: '+36 20 234 5678',
      zip: '3733',
      city: 'Rudabánya',
      street: 'Petőfi út 8.',
      floor: '',
      type: 'delivery',
      payment: 'cash',
      channel: 'foodora',
      items: [
        { id: '3', name: 'ZUPARO Burger menü', price: 2890, qty: 1 },
        { id: '4', name: 'Somlói galuska', price: 1290, qty: 1 },
      ],
      subtotal: 4180,
      deliveryFee: 700,
      discountPct: 0,
      discountAmount: 0,
      total: 4880,
      note: 'Kapukód: 1478',
      status: 'courier',
      courierId: courierIds[1],
      createdAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      userId: null,
    },
    {
      id: 'ORD-2026-0127',
      customerName: 'Szabó Tamás',
      phone: '+36 70 890 1234',
      zip: '3600',
      city: 'Ózd',
      street: 'Béke tér 5.',
      floor: '1. em.',
      type: 'delivery',
      payment: 'online',
      channel: 'house',
      items: [
        { id: '5', name: 'Gyros tál', price: 2490, qty: 2 },
        { id: '6', name: 'Tiramisu', price: 1490, qty: 1 },
      ],
      subtotal: 6470,
      deliveryFee: 900,
      discountPct: 10,
      discountAmount: 647,
      couponCode: 'ZUPARO10',
      total: 6723,
      note: 'Kérjük gyorsan, ha lehet',
      status: 'in_progress',
      courierId: null,
      createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      userId: customerId,
    },
    {
      id: 'ORD-2026-0128',
      customerName: 'Bíró Zoltán',
      phone: '+36 30 777 8899',
      zip: '',
      city: 'Helyben',
      street: 'Asztal 4.',
      floor: '',
      type: 'dinein',
      payment: 'cash',
      channel: 'house',
      items: [
        { id: '7', name: 'Dupla Burger', price: 2990, qty: 1 },
        { id: '8', name: 'Hasábburgonya', price: 890, qty: 1 },
      ],
      subtotal: 3880,
      deliveryFee: 0,
      discountPct: 0,
      discountAmount: 0,
      total: 3880,
      note: 'Extra szósz',
      status: 'new',
      courierId: null,
      createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      userId: null,
    },
    {
      id: 'ORD-2026-0129',
      customerName: 'Horváth Gábor',
      phone: '+36 30 555 4433',
      zip: '3734',
      city: 'Szuhogy',
      street: 'Petőfi Sándor u. 14.',
      floor: '',
      type: 'delivery',
      payment: 'cash',
      channel: 'falatozz',
      items: [
        { id: '1', name: 'ZUPARO Special', price: 2890, qty: 1 },
        { id: '8', name: 'Hasábburgonya', price: 890, qty: 1 },
      ],
      subtotal: 3780,
      deliveryFee: 500,
      discountPct: 0,
      discountAmount: 0,
      total: 4280,
      note: 'Falatozz kupon érvényesítve',
      status: 'new',
      courierId: null,
      createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      userId: null,
    },
  ];

  for (const o of sampleOrders) {
    orders.set(o.id, o);
  }
}

seedData();

// Auth helper
function getAuthUser(req: Request): User | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = users.get(payload.sub);
    return user || null;
  } catch {
    return null;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Bejelentkezés szükséges' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Adminisztrátori jogosultság szükséges' });
  }
  (req as any).user = user;
  next();
}

// ================= API ROUTES =================

// Root status
app.get('/api', (req, res) => {
  res.json({ service: 'ZUPARO Ordering API', status: 'ok' });
});

// Auth
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, jelszó és név kitöltése kötelező' });
  }
  const cleanEmail = email.toLowerCase().trim();
  for (const u of users.values()) {
    if (u.email === cleanEmail) {
      return res.status(400).json({ error: 'Ez az email már regisztrálva van' });
    }
  }

  const id = crypto.randomUUID();
  const newUser: User = {
    id,
    email: cleanEmail,
    name,
    phone: phone || '',
    role: 'customer',
    password_hash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.set(id, newUser);

  const token = jwt.sign({ sub: id, role: newUser.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({
    token,
    user: { id, email: cleanEmail, name, phone: newUser.phone, role: newUser.role },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email és jelszó megadása kötelező' });
  }
  const cleanEmail = email.toLowerCase().trim();
  let foundUser: User | null = null;
  for (const u of users.values()) {
    if (u.email === cleanEmail) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser || !bcrypt.compareSync(password, foundUser.password_hash)) {
    return res.status(401).json({ error: 'Hibás email vagy jelszó' });
  }

  const token = jwt.sign({ sub: foundUser.id, role: foundUser.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({
    token,
    user: {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      phone: foundUser.phone,
      role: foundUser.role,
    },
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

// Restaurant Status (Manual Open/Closed and 0-24 ordering)
app.get('/api/restaurant/status', (req, res) => {
  res.json(restaurantStatus);
});

app.post('/api/restaurant/status', requireAdmin, (req, res) => {
  const { isOpen, allowOrder247, customNotice } = req.body;
  if (isOpen !== undefined) restaurantStatus.isOpen = Boolean(isOpen);
  if (allowOrder247 !== undefined) restaurantStatus.allowOrder247 = Boolean(allowOrder247);
  if (customNotice !== undefined) restaurantStatus.customNotice = String(customNotice);
  restaurantStatus.lastChangedAt = new Date().toISOString();
  res.json(restaurantStatus);
});

// Image upload support (accepts data URL or image url)
app.post('/api/upload/image', requireAdmin, (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Nincs megadva kép adat' });
  }
  res.json({ url: image });
});

// Menu
app.get('/api/menu', (req, res) => {
  res.json(Array.from(menuItems.values()));
});

app.post('/api/menu', requireAdmin, (req, res) => {
  const body = req.body;
  const id = crypto.randomUUID();
  const item: MenuItem = {
    id,
    category: body.category || 'egyeb',
    name: body.name || '',
    description: body.description || '',
    price: Number(body.price) || 0,
    priceFoodora: body.priceFoodora !== undefined ? Number(body.priceFoodora) : Math.round((Number(body.price) || 0) * 1.25),
    priceFalatozz: body.priceFalatozz !== undefined ? Number(body.priceFalatozz) : Math.round((Number(body.price) || 0) * 1.2),
    available: body.available !== undefined ? Boolean(body.available) : true,
    recipe: Array.isArray(body.recipe) ? body.recipe : [],
    image: body.image ? String(body.image) : '',
  };
  menuItems.set(id, item);
  res.json(item);
});

app.put('/api/menu/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const item = menuItems.get(id);
  if (!item) return res.status(404).json({ error: 'Nem található étel' });

  const updated: MenuItem = { ...item, ...req.body };
  if (req.body.image !== undefined) {
    updated.image = String(req.body.image || '');
  }
  menuItems.set(id, updated);
  res.json(updated);
});

app.delete('/api/menu/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = menuItems.delete(id);
  res.json({ deleted: deleted ? 1 : 0 });
});

// Zones
app.get('/api/zones', (req, res) => {
  res.json(Array.from(deliveryZones.values()));
});

app.post('/api/zones', requireAdmin, (req, res) => {
  const { zip, city, fee } = req.body;
  const id = crypto.randomUUID();
  const zone: Zone = { id, zip: String(zip || ''), city: String(city || ''), fee: Number(fee) || 0 };
  deliveryZones.set(id, zone);
  res.json(zone);
});

app.put('/api/zones/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const zone = deliveryZones.get(id);
  if (!zone) return res.status(404).json({ error: 'Nem található zóna' });

  const updated: Zone = { ...zone, ...req.body };
  deliveryZones.set(id, updated);
  res.json(updated);
});

app.delete('/api/zones/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = deliveryZones.delete(id);
  res.json({ deleted: deleted ? 1 : 0 });
});

// Couriers
app.get('/api/couriers', (req, res) => {
  res.json(Array.from(couriers.values()));
});

app.post('/api/couriers', requireAdmin, (req, res) => {
  const { name, phone, active } = req.body;
  const id = crypto.randomUUID();
  const courier: Courier = {
    id,
    name: String(name || ''),
    phone: String(phone || ''),
    active: active !== undefined ? Boolean(active) : true,
  };
  couriers.set(id, courier);
  res.json(courier);
});

app.put('/api/couriers/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const courier = couriers.get(id);
  if (!courier) return res.status(404).json({ error: 'Nem található futár' });

  const updated: Courier = { ...courier, ...req.body };
  couriers.set(id, updated);
  res.json(updated);
});

app.delete('/api/couriers/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = couriers.delete(id);
  res.json({ deleted: deleted ? 1 : 0 });
});

// Customers
app.get('/api/customers', requireAdmin, (req, res) => {
  res.json(Array.from(customers.values()));
});

app.delete('/api/customers/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = customers.delete(id);
  res.json({ deleted: deleted ? 1 : 0 });
});

// Inventory
app.get('/api/inventory', requireAdmin, (req, res) => {
  res.json(Array.from(inventoryItems.values()));
});

app.post('/api/inventory', requireAdmin, (req, res) => {
  const { name, unit, stock, minStock } = req.body;
  const id = crypto.randomUUID();
  const item: InventoryItem = {
    id,
    name: String(name || ''),
    unit: String(unit || 'db'),
    stock: Number(stock) || 0,
    minStock: Number(minStock) || 0,
  };
  inventoryItems.set(id, item);
  res.json(item);
});

app.put('/api/inventory/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const item = inventoryItems.get(id);
  if (!item) return res.status(404).json({ error: 'Nem található alapanyag' });

  const updated: InventoryItem = { ...item, ...req.body };
  inventoryItems.set(id, updated);
  res.json(updated);
});

app.delete('/api/inventory/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = inventoryItems.delete(id);
  res.json({ deleted: deleted ? 1 : 0 });
});

// Coupons
app.get('/api/coupons', (req, res) => {
  res.json(Array.from(coupons.values()));
});

app.post('/api/coupons', requireAdmin, (req, res) => {
  const { code, kind, value, active } = req.body;
  const id = crypto.randomUUID();
  const coupon: Coupon = {
    id,
    code: String(code || '').toUpperCase().trim(),
    kind: kind === 'amount' ? 'amount' : 'percent',
    value: Number(value) || 0,
    active: active !== undefined ? Boolean(active) : true,
  };
  coupons.set(id, coupon);
  res.json(coupon);
});

app.put('/api/coupons/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const coupon = coupons.get(id);
  if (!coupon) return res.status(404).json({ error: 'Nem található kupon' });

  const updated: Coupon = { ...coupon, ...req.body };
  if (req.body.code) updated.code = req.body.code.toUpperCase().trim();
  coupons.set(id, updated);
  res.json(updated);
});

app.delete('/api/coupons/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = coupons.delete(id);
  res.json({ deleted: deleted ? 1 : 0 });
});

app.post('/api/coupons/validate', (req, res) => {
  const code = String(req.body?.code || '').toUpperCase().trim();
  if (!code) return res.status(400).json({ error: 'Kód szükséges' });

  let match: Coupon | null = null;
  for (const c of coupons.values()) {
    if (c.code === code && c.active) {
      match = c;
      break;
    }
  }

  if (!match) {
    return res.status(404).json({ error: 'Érvénytelen vagy lejárt kuponkód' });
  }
  res.json(match);
});

// Orders
function generateNextOrderId(): string {
  const year = new Date().getFullYear();
  const count = orders.size + 125;
  return `ORD-${year}-${String(count).padStart(4, '0')}`;
}

app.get('/api/orders', requireAdmin, (req, res) => {
  const list = Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(list);
});

app.get('/api/orders/mine', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const list = Array.from(orders.values())
    .filter((o) => o.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

app.post('/api/orders', (req, res) => {
  const user = getAuthUser(req);
  const o = req.body;

  if (user?.role !== 'admin' && o.type === 'delivery' && o.subtotal < 2500 && o.channel === 'house') {
    return res.status(400).json({ error: 'A minimum rendelési összeg 2500 Ft (szállításnál)' });
  }

  const orderId = generateNextOrderId();
  const newOrder: Order = {
    ...o,
    id: orderId,
    status: 'new',
    courierId: o.courierId || null,
    createdAt: new Date().toISOString(),
    userId: user?.id || null,
  };
  orders.set(orderId, newOrder);

  // Consume inventory based on recipe and units
  try {
    if (Array.isArray(o.items)) {
      for (const it of o.items) {
        const menuItem = menuItems.get(it.id) || Array.from(menuItems.values()).find((m) => m.name === it.name);
        if (menuItem?.recipe && Array.isArray(menuItem.recipe)) {
          for (const r of menuItem.recipe) {
            const inv = inventoryItems.get(r.inventoryId);
            if (inv) {
              const recipeUnit = r.unit || inv.unit;
              const deductionInBase = convertUnit(r.qty || 0, recipeUnit, inv.unit);
              const totalDeduction = deductionInBase * (it.qty || 1);
              inv.stock = Math.max(0, Number((inv.stock - totalDeduction).toFixed(4)));
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Inventory error:', err);
  }

  // Upsert customer by phone
  if (o.phone) {
    let existingCust: Customer | null = null;
    for (const c of customers.values()) {
      if (c.phone === o.phone) {
        existingCust = c;
        break;
      }
    }
    if (existingCust) {
      existingCust.name = o.customerName || existingCust.name;
      existingCust.zip = o.zip || existingCust.zip;
      existingCust.city = o.city || existingCust.city;
      existingCust.street = o.street || existingCust.street;
      existingCust.floor = o.floor || existingCust.floor;
      existingCust.orderCount = (existingCust.orderCount || 0) + 1;
    } else {
      const custId = crypto.randomUUID();
      const newCust = {
        id: custId,
        name: o.customerName || 'Névtelen',
        phone: o.phone,
        zip: o.zip || '',
        city: o.city || '',
        street: o.street || '',
        floor: o.floor || '',
        orderCount: 1,
      };
      customers.set(custId, newCust);
      if (isMongoConnected) {
        CustomerModel.create(newCust).catch((e) => console.error(e));
      }
    }
  }

  if (isMongoConnected) {
    OrderModel.create(newOrder).catch((e) => console.error('MongoDB order save error:', e));
  }

  res.json(newOrder);
});

app.put('/api/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const order = orders.get(id);
  if (!order) return res.status(404).json({ error: 'Nem található rendelés' });

  // Inventory restore when cancelling an order (Sztornó)
  if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
    try {
      if (Array.isArray(order.items)) {
        for (const it of order.items) {
          const menuItem = menuItems.get(it.id) || Array.from(menuItems.values()).find((m) => m.name === it.name);
          if (menuItem?.recipe && Array.isArray(menuItem.recipe)) {
            for (const r of menuItem.recipe) {
              const inv = inventoryItems.get(r.inventoryId);
              if (inv) {
                const recipeUnit = r.unit || inv.unit;
                const returnInBase = convertUnit(r.qty || 0, recipeUnit, inv.unit);
                const totalReturn = returnInBase * (it.qty || 1);
                inv.stock = Number((inv.stock + totalReturn).toFixed(4));
                if (isMongoConnected) {
                  InventoryModel.findOneAndUpdate({ id: inv.id }, { stock: inv.stock }).catch((e) => console.error(e));
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Inventory restore error on cancel:', err);
    }
  }

  const updated: Order = {
    ...order,
    ...req.body,
    ...(req.body.status === 'cancelled' && {
      cancelledAt: order.cancelledAt || new Date().toISOString(),
      cancelReason: req.body.cancelReason || 'Adminisztrátori sztornó',
    }),
  };
  orders.set(id, updated);
  if (isMongoConnected) {
    OrderModel.findOneAndUpdate({ id }, updated, { upsert: true }).catch((e) => console.error(e));
  }
  res.json(updated);
});

app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const order = orders.get(id);
  if (!order) return res.status(404).json({ error: 'Nem található rendelés' });

  const deleted = orders.delete(id);
  if (isMongoConnected) {
    OrderModel.deleteOne({ id }).catch((e) => console.error(e));
  }
  res.json({ deleted: deleted ? 1 : 0 });
});

// Reports by Date - Budapest Local Time with Midnight Rollover
function getReportDataForDate(targetDateStr?: string) {
  let targetDate = targetDateStr;
  if (!targetDate) {
    targetDate = getBudapestDate();
  }

  // Find all orders for this day using Hungarian calendar day
  const dayOrders = Array.from(orders.values()).filter((o) => {
    const oDate = getOrderBudapestDate(o.createdAt);
    return oDate === targetDate;
  });

  const activeOrders = dayOrders.filter((o) => o.status !== 'cancelled');
  const cancelledOrders = dayOrders.filter((o) => o.status === 'cancelled');
  const cancelledRevenue = cancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  let revenue = 0;
  const byPayment: Record<string, number> = { cash: 0, card: 0, online: 0 };
  const byChannel: Record<string, number> = { house: 0, foodora: 0, falatozz: 0 };
  const byCourierMap: Record<string, { name: string; orders: number; revenue: number }> = {};

  for (const o of activeOrders) {
    revenue += o.total;
    byPayment[o.payment] = (byPayment[o.payment] || 0) + o.total;
    const ch = o.channel || 'house';
    byChannel[ch] = (byChannel[ch] || 0) + o.total;

    if (o.courierId) {
      const courier = couriers.get(o.courierId);
      const name = courier ? courier.name : 'Ismeretlen';
      if (!byCourierMap[o.courierId]) {
        byCourierMap[o.courierId] = { name, orders: 0, revenue: 0 };
      }
      byCourierMap[o.courierId].orders += 1;
      byCourierMap[o.courierId].revenue += o.total;
    }
  }

  // Check if archived closing exists for this date
  const existingClose = dayCloses.find((c) => c.date === targetDate);

  return {
    date: targetDate,
    currentBudapestDate: getBudapestDate(),
    orders: activeOrders.length,
    totalOrdersCount: dayOrders.length,
    cancelledOrdersCount: cancelledOrders.length,
    cancelledRevenue,
    revenue,
    byPayment,
    byChannel,
    byCourier: Object.values(byCourierMap),
    isClosed: Boolean(existingClose),
    closedAt: existingClose ? existingClose.closedAt : null,
    orderList: dayOrders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      phone: o.phone,
      total: o.total,
      payment: o.payment,
      channel: o.channel,
      type: o.type,
      status: o.status,
      createdAt: o.createdAt,
      itemsCount: o.items ? o.items.reduce((s, i) => s + (i.qty || 1), 0) : 0,
      cancelledAt: o.cancelledAt,
      cancelReason: o.cancelReason,
    })),
  };
}

app.get('/api/reports/day', requireAdmin, (req, res) => {
  const dateStr = typeof req.query.date === 'string' ? req.query.date : undefined;
  res.json(getReportDataForDate(dateStr));
});

app.get('/api/reports/today', requireAdmin, (req, res) => {
  res.json(getReportDataForDate());
});

app.get('/api/reports/date/:date', requireAdmin, (req, res) => {
  res.json(getReportDataForDate(req.params.date));
});

app.post('/api/reports/close-day', requireAdmin, (req, res) => {
  const targetDate = req.body?.date || getBudapestDate();
  const report = getReportDataForDate(targetDate);

  // Remove existing closing for the same date if re-closing
  const existingIdx = dayCloses.findIndex((c) => c.date === targetDate);
  if (existingIdx >= 0) {
    dayCloses.splice(existingIdx, 1);
  }

  const closeEntry: DayClose = {
    id: crypto.randomUUID(),
    date: report.date,
    orders: report.orders,
    revenue: report.revenue,
    byPayment: report.byPayment,
    byChannel: report.byChannel,
    byCourier: report.byCourier,
    closedAt: new Date().toISOString(),
  };
  dayCloses.unshift(closeEntry);
  if (isMongoConnected) {
    DayCloseModel.findOneAndUpdate({ date: targetDate }, closeEntry, { upsert: true }).catch((e) => console.error(e));
  }
  res.json(closeEntry);
});

app.get('/api/reports/history', requireAdmin, (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  if (q) {
    return res.json(dayCloses.filter((c) => c.date.includes(q)));
  }
  res.json(dayCloses);
});

app.get('/api/reports/courier/:courier_id', requireAdmin, (req, res) => {
  const { courier_id } = req.params;
  const todayBudapestDate = getBudapestDate();

  const courierOrders = Array.from(orders.values()).filter(
    (o) => o.courierId === courier_id && getOrderBudapestDate(o.createdAt) === todayBudapestDate
  );

  const delivered = courierOrders.filter((o) => o.status === 'delivered');
  const revenue = delivered.reduce((acc, cur) => acc + cur.total, 0);
  const cash = delivered.filter((o) => o.payment === 'cash').reduce((acc, cur) => acc + cur.total, 0);
  const card = delivered.filter((o) => o.payment === 'card').reduce((acc, cur) => acc + cur.total, 0);
  const online = delivered.filter((o) => o.payment === 'online').reduce((acc, cur) => acc + cur.total, 0);

  const courier = couriers.get(courier_id);

  res.json({
    courierId: courier_id,
    courierName: courier ? courier.name : null,
    orders: delivered.length,
    revenue,
    cash,
    card,
    online,
  });
});

app.get('/api/time', (req, res) => {
  const now = new Date();
  res.json({
    iso: now.toISOString(),
    budapestDate: getBudapestDate(now),
    budapestTime: now.toLocaleTimeString('hu-HU', { timeZone: 'Europe/Budapest' }),
  });
});

app.post('/api/seed', (req, res) => {
  seedData();
  res.json({
    seeded: {
      menu: menuItems.size,
      zones: deliveryZones.size,
      couriers: couriers.size,
      inventory: inventoryItems.size,
      admin: 'admin@zuparo.hu / admin123',
    },
  });
});

// Midnight rollover check (Europe/Budapest):
// Automatically runs every 30 seconds to archive previous day when midnight strikes
let lastCheckedDate = getBudapestDate();
setInterval(() => {
  try {
    const currentDate = getBudapestDate();
    if (currentDate !== lastCheckedDate) {
      console.log(`[Midnight Rollover] Budapest date turned from ${lastCheckedDate} to ${currentDate}!`);
      const prevDate = lastCheckedDate;
      lastCheckedDate = currentDate;

      // Auto-archive previous day closing if orders exist and not archived yet
      const alreadyClosed = dayCloses.some((c) => c.date === prevDate);
      if (!alreadyClosed) {
        const prevReport = getReportDataForDate(prevDate);
        if (prevReport.totalOrdersCount > 0) {
          const autoCloseEntry: DayClose = {
            id: crypto.randomUUID(),
            date: prevDate,
            orders: prevReport.orders,
            revenue: prevReport.revenue,
            byPayment: prevReport.byPayment,
            byChannel: prevReport.byChannel,
            byCourier: prevReport.byCourier,
            closedAt: new Date().toISOString(),
          };
          dayCloses.unshift(autoCloseEntry);
          if (isMongoConnected) {
            DayCloseModel.findOneAndUpdate({ date: prevDate }, autoCloseEntry, { upsert: true }).catch((e) => console.error(e));
          }
          console.log(`[Midnight Rollover] Successfully auto-archived closing for date: ${prevDate}`);
        }
      }
    }
  } catch (err) {
    console.error('Midnight rollover check error:', err);
  }
}, 30000);

// ================= VITE & SPA FALLBACK =================

async function startServer() {
  await initMongoDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
