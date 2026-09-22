import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'customer';
  password_hash: string;
  createdAt: string;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  password_hash: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Menu Item Schema
export interface IMenuItem extends Document {
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
  packagingFee?: number;
  drsFeeEnabled?: boolean;
}

const MenuItemSchema = new Schema<IMenuItem>({
  id: { type: String, required: true, unique: true, index: true },
  category: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  priceFoodora: { type: Number, required: true },
  priceFalatozz: { type: Number, required: true },
  available: { type: Boolean, default: true },
  recipe: [{ inventoryId: String, qty: Number, unit: String }],
  image: { type: String, default: '' },
  packagingFee: { type: Number, default: 0 },
  drsFeeEnabled: { type: Boolean, default: false },
});

export const MenuItemModel = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);

// Zone Schema
export interface IZone extends Document {
  id: string;
  zip: string;
  city: string;
  fee: number;
}

const ZoneSchema = new Schema<IZone>({
  id: { type: String, required: true, unique: true },
  zip: { type: String, required: true },
  city: { type: String, required: true },
  fee: { type: Number, required: true },
});

export const ZoneModel = mongoose.models.Zone || mongoose.model<IZone>('Zone', ZoneSchema);

// Courier Schema
export interface ICourier extends Document {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

const CourierSchema = new Schema<ICourier>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  active: { type: Boolean, default: true },
});

export const CourierModel = mongoose.models.Courier || mongoose.model<ICourier>('Courier', CourierSchema);

// Customer Schema
export interface ICustomer extends Document {
  id: string;
  name: string;
  phone: string;
  zip: string;
  city: string;
  street: string;
  floor: string;
  orderCount: number;
}

const CustomerSchema = new Schema<ICustomer>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  zip: { type: String, default: '' },
  city: { type: String, default: '' },
  street: { type: String, default: '' },
  floor: { type: String, default: '' },
  orderCount: { type: Number, default: 1 },
});

export const CustomerModel = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

// Inventory Schema
export interface IInventoryItem extends Document {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
}

const InventorySchema = new Schema<IInventoryItem>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  unit: { type: String, default: 'db' },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
});

export const InventoryModel = mongoose.models.Inventory || mongoose.model<IInventoryItem>('Inventory', InventorySchema);

// Coupon Schema
export interface ICoupon extends Document {
  id: string;
  code: string;
  kind: 'percent' | 'amount';
  value: number;
  active: boolean;
}

const CouponSchema = new Schema<ICoupon>({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  kind: { type: String, enum: ['percent', 'amount'], default: 'percent' },
  value: { type: Number, required: true },
  active: { type: Boolean, default: true },
});

export const CouponModel = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

// Order Schema
export interface IOrder extends Document {
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
  items: Array<{ id: string; name: string; price: number; qty: number; note?: string }>;
  subtotal: number;
  deliveryFee: number;
  packagingFee?: number;
  drsFee?: number;
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

const OrderSchema = new Schema<IOrder>({
  id: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, required: true },
  phone: { type: String, default: '' },
  zip: { type: String, default: '' },
  city: { type: String, default: '' },
  street: { type: String, default: '' },
  floor: { type: String, default: '' },
  type: { type: String, enum: ['delivery', 'pickup', 'dinein'], default: 'delivery' },
  payment: { type: String, enum: ['cash', 'card', 'online'], default: 'cash' },
  channel: { type: String, enum: ['house', 'foodora', 'falatozz', 'online'], default: 'house' },
  items: [
    {
      id: String,
      name: String,
      price: Number,
      qty: Number,
      note: String,
    },
  ],
  subtotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  packagingFee: { type: Number, default: 0 },
  drsFee: { type: Number, default: 0 },
  discountPct: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  total: { type: Number, default: 0 },
  note: { type: String, default: '' },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'courier', 'delivered', 'cancelled'],
    default: 'new',
    index: true,
  },
  courierId: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString(), index: true },
  userId: { type: String, default: null },
  isOnlineOrder: { type: Boolean, default: false },
  source: { type: String, default: 'pos' },
  cancelledAt: { type: String, default: null },
  cancelReason: { type: String, default: '' },
});

export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

// Day Close Schema
export interface IDayClose extends Document {
  id: string;
  date: string;
  orders: number;
  revenue: number;
  byPayment: Record<string, number>;
  byChannel: Record<string, number>;
  byCourier: Array<{ name: string; orders: number; revenue: number }>;
  closedAt: string;
}

const DayCloseSchema = new Schema<IDayClose>({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true, unique: true, index: true },
  orders: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  byPayment: { type: Schema.Types.Mixed, default: {} },
  byChannel: { type: Schema.Types.Mixed, default: {} },
  byCourier: [
    {
      name: String,
      orders: Number,
      revenue: Number,
    },
  ],
  closedAt: { type: String, default: () => new Date().toISOString() },
});

export const DayCloseModel = mongoose.models.DayClose || mongoose.model<IDayClose>('DayClose', DayCloseSchema);

// Restaurant Status Schema
export interface IRestaurantStatus extends Document {
  id: string;
  isOpen: boolean;
  allowOrder247: boolean;
  customNotice: string;
  manualCloseReason?: string;
  packagingFeeEnabled: boolean;
  packagingFee: number;
  drsFeeEnabled: boolean;
  drsFee: number;
  lastChangedAt: string;
}

const RestaurantStatusSchema = new Schema<IRestaurantStatus>({
  id: { type: String, default: 'singleton_status', unique: true },
  isOpen: { type: Boolean, default: true },
  allowOrder247: { type: Boolean, default: true },
  customNotice: { type: String, default: '0-24 órában fogadjuk a rendeléseket! Kiszállítás és átvétel zavartalan.' },
  manualCloseReason: { type: String, default: '' },
  packagingFeeEnabled: { type: Boolean, default: true },
  packagingFee: { type: Number, default: 200 },
  drsFeeEnabled: { type: Boolean, default: true },
  drsFee: { type: Number, default: 50 },
  lastChangedAt: { type: String, default: () => new Date().toISOString() },
});

export const RestaurantStatusModel =
  mongoose.models.RestaurantStatus ||
  mongoose.model<IRestaurantStatus>('RestaurantStatus', RestaurantStatusSchema);
