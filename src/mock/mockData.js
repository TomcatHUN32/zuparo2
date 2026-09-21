// Mock data for ZUPARO ordering platform

export const LOGO_URL = 'https://customer-assets-v7afamib.emergentagent.net/job_order-app-65/artifacts/zepx2s3q_cbb74501-e7c5-4d95-89c4-9894f9fa66a5-Picsart-BackgroundRemover.png';

export const CATEGORIES = [
  { id: 'pizzak', name: 'Pizzák', icon: 'Pizza' },
  { id: 'hamburgerek', name: 'Hamburgerek', icon: 'Beef' },
  { id: 'gyros', name: 'Gyros', icon: 'Utensils' },
  { id: 'tortillak', name: 'Tortillák', icon: 'Wheat' },
  { id: 'salatak', name: 'Saláták', icon: 'Salad' },
  { id: 'koretek', name: 'Köretek', icon: 'Popcorn' },
  { id: 'desszertek', name: 'Desszertek', icon: 'CakeSlice' },
  { id: 'italok', name: 'Italok', icon: 'CupSoda' },
];

export const INITIAL_MENU = [
  // Pizzák
  { id: 'm1', category: 'pizzak', name: 'Margherita', description: 'Paradicsomszósz, mozzarella', price: 2190, available: true },
  { id: 'm2', category: 'pizzak', name: 'Sonkás', description: 'Paradicsomszósz, sonka, mozzarella', price: 2390, available: true },
  { id: 'm3', category: 'pizzak', name: 'Szalámis', description: 'Paradicsomszósz, szalámi, mozzarella', price: 2490, available: true },
  { id: 'm4', category: 'pizzak', name: 'Hawaii', description: 'Paradicsomszósz, sonka, ananász, mozzarella', price: 2490, available: true },
  { id: 'm5', category: 'pizzak', name: 'Négysajtos', description: 'Paradicsomszósz, négyféle sajt', price: 2590, available: true },
  { id: 'm6', category: 'pizzak', name: 'Diavolo', description: 'Paradicsomszósz, szalámi, chili, mozzarella', price: 2590, available: true },
  { id: 'm7', category: 'pizzak', name: 'BBQ Csirke', description: 'BBQ szósz, csirke, lilahagyma, mozzarella', price: 2690, available: true },
  { id: 'm8', category: 'pizzak', name: 'Tonhalas', description: 'Paradicsomszósz, tonhal, lilahagyma, mozzarella', price: 2690, available: true },
  { id: 'm9', category: 'pizzak', name: 'ZUPARO Special', description: 'Paradicsomszósz, sonka, szalámi, gomba, kukorica, mozzarella', price: 2890, available: true },
  // Hamburgerek
  { id: 'h1', category: 'hamburgerek', name: 'ZUPARO Burger menü', description: 'Marhahús, cheddar, friss zöldségek, ZUPARO szósz + hasáb + üdítő', price: 2890, available: true },
  { id: 'h2', category: 'hamburgerek', name: 'Cheeseburger', description: 'Marhahús, cheddar, saláta, uborka', price: 2190, available: true },
  { id: 'h3', category: 'hamburgerek', name: 'Dupla Burger', description: 'Dupla marhahús, dupla sajt, ZUPARO szósz', price: 2990, available: true },
  { id: 'h4', category: 'hamburgerek', name: 'Csirke Burger', description: 'Rántott csirke, saláta, majonéz', price: 2290, available: true },
  // Gyros
  { id: 'g1', category: 'gyros', name: 'Gyros tál', description: 'Szaftos hús, friss saláta, hasábburgonya, öntet', price: 2490, available: true },
  { id: 'g2', category: 'gyros', name: 'Gyros pita', description: 'Pita, hús, zöldség, tzatziki', price: 1990, available: true },
  { id: 'g3', category: 'gyros', name: 'Csirke Gyros tál', description: 'Csirkehús, saláta, hasáb, öntet', price: 2390, available: true },
  // Tortillák
  { id: 't1', category: 'tortillak', name: 'Csirkés tortilla', description: 'Grillezett csirke, zöldségek, szósz', price: 2390, available: true },
  { id: 't2', category: 'tortillak', name: 'Marhás tortilla', description: 'Marhahús, saláta, cheddar, BBQ', price: 2490, available: true },
  { id: 't3', category: 'tortillak', name: 'Vega tortilla', description: 'Zöldségek, hummusz, saláta', price: 1990, available: true },
  // Saláták
  { id: 's1', category: 'salatak', name: 'Cézár saláta', description: 'Csirke, jégsaláta, parmezán, cézár öntet', price: 2190, available: true },
  { id: 's2', category: 'salatak', name: 'Görög saláta', description: 'Paradicsom, uborka, feta, olivabogyó', price: 1990, available: true },
  // Köretek
  { id: 'k1', category: 'koretek', name: 'Hasábburgonya', description: 'Ropogósra sütve', price: 890, available: true },
  { id: 'k2', category: 'koretek', name: 'Édesburgonya', description: 'Sült édesburgonya', price: 1190, available: true },
  { id: 'k3', category: 'koretek', name: 'Rántott hagymakarika', description: '6 db', price: 990, available: true },
  // Desszertek
  { id: 'd1', category: 'desszertek', name: 'Somlói galuska', description: 'Klasszikus házi somlói', price: 1290, available: true },
  { id: 'd2', category: 'desszertek', name: 'Tiramisu', description: 'Olasz kávés desszert', price: 1490, available: true },
  // Italok
  { id: 'i1', category: 'italok', name: 'Coca-Cola 0,5l', description: '', price: 590, available: true },
  { id: 'i2', category: 'italok', name: 'Fuze Tea 0,5l', description: '', price: 590, available: true },
  { id: 'i3', category: 'italok', name: 'Ásványvíz 0,5l', description: '', price: 390, available: true },
  { id: 'i4', category: 'italok', name: 'Fanta 0,5l', description: '', price: 590, available: true },
];

export const INITIAL_DELIVERY_ZONES = [
  { id: 'z1', zip: '3734', city: 'Szuhogy', fee: 500 },
  { id: 'z2', zip: '3733', city: 'Rudabánya', fee: 700 },
  { id: 'z3', zip: '3600', city: 'Ózd', fee: 900 },
  { id: 'z4', zip: '3700', city: 'Kazincbarcika', fee: 1200 },
  { id: 'z5', zip: '3780', city: 'Edelény', fee: 1000 },
];

export const INITIAL_COURIERS = [
  { id: 'c1', name: 'Dávid', phone: '+36 30 111 2222', active: true },
  { id: 'c2', name: 'Márk', phone: '+36 30 333 4444', active: true },
  { id: 'c3', name: 'Tamás', phone: '+36 30 555 6666', active: false },
];

export const INITIAL_CUSTOMERS = [
  { id: 'cu1', name: 'Kiss Ádám', phone: '+36 70 123 4567', zip: '3734', city: 'Szuhogy', street: 'Kossuth Lajos utca 15.', floor: 'Földszint, kapu', orderCount: 12 },
  { id: 'cu2', name: 'Nagy Éva', phone: '+36 20 987 6543', zip: '3734', city: 'Szuhogy', street: 'Petőfi utca 3.', floor: '1. emelet', orderCount: 5 },
  { id: 'cu3', name: 'Szabó Péter', phone: '+36 30 555 1212', zip: '3733', city: 'Rudabánya', street: 'Fő út 22.', floor: '', orderCount: 8 },
  { id: 'cu4', name: 'Kovács Anna', phone: '+36 70 222 3333', zip: '3600', city: 'Ózd', street: 'Béke utca 10.', floor: '2. emelet 4.', orderCount: 3 },
];

export const INITIAL_INVENTORY = [
  { id: 'inv1', name: 'Mozzarella sajt', unit: 'kg', stock: 12, minStock: 5 },
  { id: 'inv2', name: 'Paradicsomszósz', unit: 'l', stock: 8, minStock: 3 },
  { id: 'inv3', name: 'Pizza tészta', unit: 'db', stock: 45, minStock: 20 },
  { id: 'inv4', name: 'Csirkemell', unit: 'kg', stock: 6, minStock: 4 },
  { id: 'inv5', name: 'Marhahús', unit: 'kg', stock: 3, minStock: 5 },
  { id: 'inv6', name: 'Hamburger zsemle', unit: 'db', stock: 30, minStock: 15 },
  { id: 'inv7', name: 'Coca-Cola 0,5l', unit: 'db', stock: 24, minStock: 12 },
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-2026-0125',
    customerName: 'Kiss Ádám',
    phone: '+36 70 123 4567',
    zip: '3734', city: 'Szuhogy', street: 'Kossuth Lajos utca 15.', floor: 'Földszint',
    type: 'delivery', payment: 'cash',
    items: [
      { id: 'h1', name: 'ZUPARO Burger menü', price: 2890, qty: 1, note: 'Extra cheddar' },
      { id: 'g1', name: 'Gyros tál', price: 2490, qty: 1, note: '' },
    ],
    subtotal: 5380, deliveryFee: 500, total: 5880,
    courierId: 'c1', status: 'delivered',
    createdAt: '2026-01-21T18:12:00',
    note: '',
  },
  {
    id: 'ORD-2026-0126',
    customerName: 'Nagy Éva',
    phone: '+36 20 987 6543',
    zip: '3734', city: 'Szuhogy', street: 'Petőfi utca 3.', floor: '1. emelet',
    type: 'delivery', payment: 'card',
    items: [
      { id: 'm1', name: 'Margherita', price: 2190, qty: 2, note: '' },
      { id: 'i1', name: 'Coca-Cola 0,5l', price: 590, qty: 2, note: '' },
    ],
    subtotal: 5560, deliveryFee: 500, total: 6060,
    courierId: 'c2', status: 'on_route',
    createdAt: '2026-01-21T19:30:00',
    note: '',
  },
  {
    id: 'ORD-2026-0127',
    customerName: 'Szabó Péter',
    phone: '+36 30 555 1212',
    zip: '3733', city: 'Rudabánya', street: 'Fő út 22.', floor: '',
    type: 'delivery', payment: 'cash',
    items: [
      { id: 'm9', name: 'ZUPARO Special', price: 2890, qty: 1, note: '' },
    ],
    subtotal: 2890, deliveryFee: 700, total: 3590,
    courierId: null, status: 'preparing',
    createdAt: '2026-01-21T19:55:00',
    note: 'Csengő nem működik',
  },
  {
    id: 'ORD-2026-0128',
    customerName: 'Kovács Anna',
    phone: '+36 70 222 3333',
    zip: '3600', city: 'Ózd', street: 'Béke utca 10.', floor: '2. em. 4.',
    type: 'pickup', payment: 'cash',
    items: [
      { id: 't1', name: 'Csirkés tortilla', price: 2390, qty: 2, note: '' },
    ],
    subtotal: 4780, deliveryFee: 0, total: 4780,
    courierId: null, status: 'new',
    createdAt: '2026-01-21T20:15:00',
    note: '',
  },
];

export const STATUS_LABELS = {
  new: { label: 'Új', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  preparing: { label: 'Új', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ready: { label: 'Új', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  on_route: { label: 'Elindult', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  delivered: { label: 'Megérkezett', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Sztornó', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export const RESTAURANT_INFO = {
  name: 'ZUPARO Pizza & Burger Bar',
  address: '3734 Szuhogy, József Attila utca 76.',
  zip: '3734',
  city: 'Szuhogy',
  street: 'József Attila utca 76.',
  phone: '+36 30 123 4567',
  email: 'info@zuparo.hu',
  facebook: 'https://www.facebook.com/profile.php?id=61585460005367',
};

export const formatFt = (n) => `${(n || 0).toLocaleString('hu-HU')} Ft`;
