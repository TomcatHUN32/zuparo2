// Mock data for Szesztestvérek (Szuhogy) ordering platform

// Official Szesztestvérek / Restaurant logo asset
export const LOGO_URL = '/logo.png';

export const CATEGORIES = [
  { id: 'hazias', name: 'Házias ételek', icon: 'Utensils' },
  { id: 'sultek', name: 'Sültek', icon: 'Beef' },
  { id: 'pizzak', name: 'Pizza', icon: 'Pizza' },
  { id: 'italok', name: 'Italok', icon: 'CupSoda' },
  { id: 'hamburgerek', name: 'Hamburgerek', icon: 'Beef' },
  { id: 'desszertek', name: 'Desszertek', icon: 'CakeSlice' },
];

export const INITIAL_MENU = [
  // Házias ételek
  {
    id: 'm-szesz-1',
    category: 'hazias',
    name: 'Sertéspörkölt galuskával',
    description: 'Házias sertéspörkölt friss galuskával és savanyúsággal',
    price: 2800,
    packagingFee: 150,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-2',
    category: 'hazias',
    name: 'Csirkepaprikás nokedlivel',
    description: 'Klasszikus csirkepaprikás tejfölös nokedlivel',
    price: 2600,
    packagingFee: 150,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-3',
    category: 'hazias',
    name: 'Töltött káposzta',
    description: 'Hagyományos szabolcsi töltött káposzta tejföllel',
    price: 2400,
    packagingFee: 120,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  },
  // Sültek
  {
    id: 'm-szesz-4',
    category: 'sultek',
    name: 'Rántott csirkecomb',
    description: 'Ropogós rántott csirkecomb aranybarna sült burgonyával',
    price: 2900,
    packagingFee: 180,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-5',
    category: 'sultek',
    name: 'Rántott sertésszelet',
    description: 'Rántott sertésszelet petrezselymes burgonyával',
    price: 3000,
    packagingFee: 180,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-6',
    category: 'sultek',
    name: 'Grill csirkemell',
    description: 'Fűszeres grill csirkemell friss kevert salátával',
    price: 2700,
    packagingFee: 150,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
  },
  // Pizzák
  {
    id: 'm-szesz-7',
    category: 'pizzak',
    name: 'Margherita pizza',
    description: 'Klasszikus paradicsomszósz, mozzarella, bazsalikom',
    price: 2200,
    packagingFee: 200,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-8',
    category: 'pizzak',
    name: 'Szalámis pizza',
    description: 'Pikáns szalámi, paradicsomszósz, mozzarella',
    price: 2500,
    packagingFee: 200,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-9',
    category: 'pizzak',
    name: 'Sonkás-gombás pizza',
    description: 'Sonka, csiperkegomba, mozzarella, paradicsomszósz',
    price: 2600,
    packagingFee: 200,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-10',
    category: 'pizzak',
    name: 'Hawaii pizza',
    description: 'Sonka, édes ananász, mozzarella, paradicsomszósz',
    price: 2500,
    packagingFee: 200,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-11',
    category: 'pizzak',
    name: 'BBQ csirkés pizza',
    description: 'Füstös BBQ szósz, pirított csirkemell, lilahagyma, sajt',
    price: 2800,
    packagingFee: 200,
    drsFeeEnabled: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80',
  },
  // Italok
  {
    id: 'm-szesz-12',
    category: 'italok',
    name: 'Coca-Cola 0.5L',
    description: 'Hideg, frissítő Coca-Cola 0.5 literes',
    price: 550,
    packagingFee: 50,
    drsFeeEnabled: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-13',
    category: 'italok',
    name: 'Sprite 0.5L',
    description: 'Frissítő citrom-lime ízű üdítőital 0.5L',
    price: 550,
    packagingFee: 50,
    drsFeeEnabled: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-14',
    category: 'italok',
    name: 'Heineken 0.5L',
    description: 'Minőségi világos sör 0.5 literes',
    price: 750,
    packagingFee: 50,
    drsFeeEnabled: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1618886614638-80e3c153d31a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm-szesz-15',
    category: 'italok',
    name: 'Ásványvíz 0.5L',
    description: 'Szénsavas vagy szénsavmentes ásványvíz 0.5L',
    price: 400,
    packagingFee: 50,
    drsFeeEnabled: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=600&q=80',
  },
];

export const INITIAL_DELIVERY_ZONES = [
  { id: 'z1', zip: '3734', city: 'Szuhogy', fee: 0, minOrder: 0 },
  { id: 'z2', zip: '3733', city: 'Rudabánya', fee: 500, minOrder: 6000 },
  { id: 'z3', zip: '3735', city: 'Alsótelekes', fee: 700, minOrder: 7000 },
  { id: 'z4', zip: '3780', city: 'Edelény', fee: 1000, minOrder: 8000 },
  { id: 'z5', zip: '3700', city: 'Kazincbarcika', fee: 1200, minOrder: 10000 },
];

export const INITIAL_COURIERS = [
  { id: 'c1', name: 'Futár János', phone: '+36 30 987 6543', active: true },
  { id: 'c2', name: 'Sanyi', phone: '+36 30 999 0000', active: true },
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
