import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatFt } from '../../mock/mockData';
import {
  Minus,
  Plus,
  Trash2,
  MapPin,
  Banknote,
  CreditCard,
  Send,
  Tag,
  CheckCircle2,
  Bike,
  ShoppingBag,
  Store,
  User,
  Phone,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const MIN_ORDER = 2500;

const Checkout = () => {
  const { cart, subtotal, setQty, remove, clear } = useCart();
  const { zones, getZoneFee, addOrder, validateCoupon, restaurantStatus } = useData();
  const { user } = useAuth();
  const nav = useNavigate();

  // Fulfillment type: 'delivery' (Kiszállítás) | 'pickup' (Elvitel) | 'dinein' (Helyben)
  const [orderType, setOrderType] = useState('delivery');

  const [custName, setCustName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [tableOrNote, setTableOrNote] = useState('');
  const [addr, setAddr] = useState({
    zip: zones[0]?.zip || '',
    city: zones[0]?.city || '',
    street: '',
    floor: '',
    note: ''
  });
  const [payment, setPayment] = useState('cash');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [busy, setBusy] = useState(false);

  // Delivery fee is only charged on delivery
  const deliveryFee = orderType === 'delivery' ? getZoneFee(addr.zip) : 0;

  // Packaging fee calculation
  const hasItemPackaging = cart.some((item) => item.packagingFee !== undefined && item.packagingFee !== null);
  const packagingFee = (restaurantStatus?.packagingFeeEnabled !== false && cart.length > 0)
    ? (hasItemPackaging
        ? cart.reduce((sum, item) => sum + (Number(item.packagingFee) || 0) * (item.qty || 1), 0)
        : (Number(restaurantStatus?.packagingFee) || 200))
    : 0;

  // DRS fee (50 Ft) calculation
  const drsItemCount = cart.reduce((sum, item) => {
    let hasDrs = false;
    if (item.drsFeeEnabled !== undefined && item.drsFeeEnabled !== null) {
      hasDrs = Boolean(item.drsFeeEnabled);
    } else {
      hasDrs = item.category === 'italok' ||
        /\b(0[,.]\d+l|doboz|palack|cola|fanta|tea|víz|sör|üdítő|pepsi|sprite|red bull|hell)\b/i.test(item.name || '');
    }
    return sum + (hasDrs ? item.qty : 0);
  }, 0);

  const drsFee = (restaurantStatus?.drsFeeEnabled !== false && drsItemCount > 0)
    ? drsItemCount * (Number(restaurantStatus?.drsFee) || 50)
    : 0;

  let discountAmount = 0;
  if (couponApplied) {
    discountAmount = couponApplied.kind === 'percent'
      ? Math.round(subtotal * couponApplied.value / 100)
      : Math.min(subtotal, couponApplied.value);
  }

  const total = Math.max(0, subtotal - discountAmount + deliveryFee + packagingFee + drsFee);

  // Minimum order is only enforced for home delivery
  const belowMin = orderType === 'delivery' && subtotal < MIN_ORDER;

  const applyCoupon = async () => {
    try {
      const c = await validateCoupon(coupon);
      setCouponApplied(c);
      toast.success(`Kupon aktív: ${c.code}`);
    } catch (e) {
      setCouponApplied(null);
      toast.error(e.response?.data?.detail || 'Érvénytelen kupon');
    }
  };

  const submit = async () => {
    if (cart.length === 0) return toast.error('A kosár üres');

    if (orderType === 'delivery') {
      if (belowMin) return toast.error(`Minimum rendelési összeg házhozszállítás esetén: ${formatFt(MIN_ORDER)}`);
      if (!custName.trim()) return toast.error('Add meg a neved a kiszállításhoz!');
      if (!phone.trim()) return toast.error('Add meg a telefonszámod!');
      if (!addr.zip || !addr.street.trim()) return toast.error('A szállítási cím (utca, házszám) hiányos!');
    } else if (orderType === 'pickup') {
      if (!custName.trim()) return toast.error('Elvitelhez kérjük, add meg a neved!');
      if (!phone.trim()) return toast.error('Elvitelhez kérjük, add meg a telefonszámod!');
    } else if (orderType === 'dinein') {
      // Helyben fogyasztás: nem szükséges semmilyen adatot megadni!
    }

    setBusy(true);
    try {
      const finalName = orderType === 'dinein'
        ? (custName.trim() || 'Helyben fogyasztás')
        : (custName.trim() || (user?.name || 'Vendég'));

      const finalPhone = orderType === 'dinein'
        ? (phone.trim() || '')
        : phone.trim();

      const finalStreet = orderType === 'delivery'
        ? addr.street.trim()
        : (orderType === 'pickup' ? 'Elvitel az étteremben' : 'Helyben fogyasztás');

      const finalNote = orderType === 'dinein'
        ? (tableOrNote ? `Asztal/Megjegyzés: ${tableOrNote}` : 'Helyben fogyasztás')
        : (orderType === 'pickup' ? (addr.note || 'Elvitel') : addr.note);

      const o = await addOrder({
        customerName: finalName,
        phone: finalPhone,
        zip: orderType === 'delivery' ? addr.zip : '',
        city: orderType === 'delivery' ? addr.city : '',
        street: finalStreet,
        floor: orderType === 'delivery' ? addr.floor : '',
        type: orderType,
        payment,
        channel: 'online',
        isOnlineOrder: true,
        source: 'web',
        items: cart.map((c) => ({ ...c, note: '' })),
        subtotal,
        deliveryFee,
        packagingFee,
        drsFee,
        discountPct: couponApplied?.kind === 'percent' ? couponApplied.value : 0,
        discountAmount,
        couponCode: couponApplied?.code || '',
        total,
        note: finalNote,
      });

      toast.success(`Rendelés leadva: #${o.id}. Köszönjük!`);
      clear();
      nav('/');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Rendelés hiba');
    } finally {
      setBusy(false);
    }
  };

  if (cart.length === 0) return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="font-display text-4xl font-black text-white">A kosarad üres</div>
      <p className="mt-3 text-neutral-400">Menj az étlapra és válassz valami finomat!</p>
      <button onClick={() => nav('/etlap')} className="mt-6 gold-gradient text-black font-bold px-6 py-3 rounded-full cursor-pointer">
        Étlap megnyitása
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-7 space-y-6">
        <h1 className="font-display text-3xl font-black text-white tracking-wide">RENDELÉS LEADÁSA</h1>

        {/* 1. Fulfillment Type Selection */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-[#d4af37]">1.</span> Fogyasztás / Átvétel módja
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setOrderType('delivery')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                orderType === 'delivery'
                  ? 'gold-gradient text-black font-bold border-transparent shadow-md'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
              }`}
            >
              <Bike size={22} />
              <span className="text-xs sm:text-sm font-bold">Kiszállítás</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('pickup')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                orderType === 'pickup'
                  ? 'gold-gradient text-black font-bold border-transparent shadow-md'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
              }`}
            >
              <ShoppingBag size={22} />
              <span className="text-xs sm:text-sm font-bold">Elvitel</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('dinein')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                orderType === 'dinein'
                  ? 'gold-gradient text-black font-bold border-transparent shadow-md'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
              }`}
            >
              <Store size={22} />
              <span className="text-xs sm:text-sm font-bold">Helyben</span>
            </button>
          </div>
        </div>

        {/* 2. Customer & Delivery Info depending on orderType */}
        {orderType === 'delivery' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 animate-in fade-in">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="text-[#d4af37]">2.</span> Szállítási adatok & Cím
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 block">Neved *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-neutral-500" />
                  <input
                    placeholder="Teljes név"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="dark-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 block">Telefonszámod *</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-3.5 text-neutral-500" />
                  <input
                    placeholder="+36 30 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="dark-input pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800 space-y-3">
              <label className="text-xs text-neutral-400 font-semibold block">Cím adatok *</label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={addr.zip}
                  onChange={(e) => {
                    const z = zones.find((zz) => zz.zip === e.target.value);
                    setAddr({ ...addr, zip: e.target.value, city: z ? z.city : addr.city });
                  }}
                  className="dark-input"
                >
                  {zones.map((z) => <option key={z.id} value={z.zip}>{z.zip} ({z.city})</option>)}
                </select>
                <input value={addr.city} readOnly className="dark-input opacity-80" />
              </div>

              <input
                placeholder="Utca, házszám *"
                value={addr.street}
                onChange={(e) => setAddr({ ...addr, street: e.target.value })}
                className="dark-input"
              />

              <input
                placeholder="Emelet / ajtó / kapucsengő (opcionális)"
                value={addr.floor}
                onChange={(e) => setAddr({ ...addr, floor: e.target.value })}
                className="dark-input"
              />

              <textarea
                rows={2}
                placeholder="Megjegyzés a futárnak (pl. zöld kapu)"
                value={addr.note}
                onChange={(e) => setAddr({ ...addr, note: e.target.value })}
                className="dark-input"
              />
            </div>
          </div>
        )}

        {orderType === 'pickup' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 animate-in fade-in">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="text-[#d4af37]">2.</span> Átvevő adatai (Csak név és telefonszám)
            </h3>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
              <ShoppingBag size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Elviteles rendelés:</strong> Cím megadása nem szükséges, nincs szállítási költség! Csak a neved és telefonszámod kérjük, hogy az elkészült rendelést átvehesd az étteremben.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 block">Neved *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-neutral-500" />
                  <input
                    placeholder="Kovács Béla"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="dark-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 block">Telefonszámod *</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-3.5 text-neutral-500" />
                  <input
                    placeholder="+36 30 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="dark-input pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-semibold mb-1 block">Megjegyzés az elvitelhez (opcionális)</label>
              <textarea
                rows={2}
                placeholder="Pl.: Körülbelül 25 perc múlva érkezem érte..."
                value={addr.note}
                onChange={(e) => setAddr({ ...addr, note: e.target.value })}
                className="dark-input"
              />
            </div>
          </div>
        )}

        {orderType === 'dinein' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 animate-in fade-in">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="text-[#d4af37]">2.</span> Helyben fogyasztás
            </h3>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-200 flex items-start gap-3">
              <Store size={22} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-base">Helyben fogyasztás – Nincs szükség adatokra!</div>
                <div className="mt-1 text-xs text-emerald-300">
                  Rendelésed közvetlenül bekerül a konyhára. Nem kell megadnod címet vagy személyes adatot, csak nyomd meg a rendelés leadása gombot!
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 block">Asztalszám vagy Név (nem kötelező)</label>
                <input
                  placeholder="pl. 4-es asztal vagy Zoli"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="dark-input"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 block">Egyéb kérés a konyhának (opcionális)</label>
                <input
                  placeholder="pl. sok szalvétával kérjük"
                  value={tableOrNote}
                  onChange={(e) => setTableOrNote(e.target.value)}
                  className="dark-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Payment Method */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-[#d4af37]">3.</span> Fizetés módja
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <PayBtn
              active={payment === 'cash'}
              onClick={() => setPayment('cash')}
              icon={Banknote}
              label={orderType === 'delivery' ? 'Készpénz futárnál' : 'Készpénz a pultnál'}
            />
            <PayBtn
              active={payment === 'card'}
              onClick={() => setPayment('card')}
              icon={CreditCard}
              label={orderType === 'delivery' ? 'Bankkártya futárnál' : 'Bankkártya a pultnál'}
            />
          </div>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="col-span-12 md:col-span-5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sticky top-24">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">Kosár összegzés</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 font-semibold">
              {orderType === 'delivery' ? '🛵 Kiszállítás' : orderType === 'pickup' ? '🛍️ Elvitel' : '🍽️ Helyben'}
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {cart.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-1 border border-neutral-800 rounded-md">
                  <button onClick={() => setQty(c.id, c.qty - 1)} className="h-8 w-8 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer"><Minus size={14} /></button>
                  <div className="w-6 text-center text-sm font-semibold text-white">{c.qty}</div>
                  <button onClick={() => setQty(c.id, c.qty + 1)} className="h-8 w-8 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer"><Plus size={14} /></button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                </div>
                <div className="text-sm font-semibold text-white whitespace-nowrap">{formatFt(c.price * c.qty)}</div>
                <button onClick={() => remove(c.id)} className="h-7 w-7 rounded-md text-neutral-500 hover:text-rose-400 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-3 flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">
            <Tag size={14} className="text-neutral-500" />
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Kuponkód"
              className="flex-1 bg-transparent focus:outline-none text-sm text-white"
            />
            <button onClick={applyCoupon} className="text-xs px-3 py-1.5 rounded-md gold-gradient text-black font-bold cursor-pointer">
              Beváltás
            </button>
          </div>
          {couponApplied && (
            <div className="mt-2 text-xs text-emerald-300 inline-flex items-center gap-2">
              <CheckCircle2 size={12} /> {couponApplied.code} • {couponApplied.kind === 'percent' ? `${couponApplied.value}%` : formatFt(couponApplied.value)} kedvezmény
            </div>
          )}

          {/* Fee Breakdown */}
          <div className="mt-4 space-y-1 text-sm border-t border-neutral-800 pt-3">
            <Row label="Részösszeg" value={formatFt(subtotal)} />
            {discountAmount > 0 && <Row label="Kedvezmény" value={`- ${formatFt(discountAmount)}`} />}
            <Row
              label="Szállítási díj"
              value={orderType === 'delivery' ? (deliveryFee > 0 ? formatFt(deliveryFee) : 'Ingyenes') : '0 Ft (Nincs szállítás)'}
            />
            {packagingFee > 0 && <Row label="Csomagolási díj" value={formatFt(packagingFee)} />}
            {drsFee > 0 && <Row label="DRS visszaváltási díj" value={formatFt(drsFee)} />}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-800">
              <div className="text-lg font-extrabold text-white">ÖSSZESEN</div>
              <div className="text-2xl gold-text-gradient font-extrabold">{formatFt(total)}</div>
            </div>
          </div>

          {belowMin && (
            <div className="mt-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-md px-3 py-2">
              Minimum rendelés házhozszállítás esetén {formatFt(MIN_ORDER)}. Még {formatFt(MIN_ORDER - subtotal)} szükséges (vagy válassz Elvitelt / Helyben fogyasztást).
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy || belowMin}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all cursor-pointer ${
              belowMin
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'gold-gradient text-black hover:brightness-105 shadow-md'
            }`}
          >
            <Send size={16} />
            {busy ? 'Küldés...' : 'Rendelés leadása'}
          </button>
        </div>
      </div>

      <style>{`.dark-input { width:100%; padding: 0.75rem; border-radius: 0.5rem; background:#0a0a0a; border:1px solid #262626; color:#fff; outline:none; }
        .dark-input:focus { border-color:#d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); }`}</style>
    </div>
  );
};

const PayBtn = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
      active ? 'gold-gradient text-black border-transparent font-bold shadow-xs' : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:border-[#d4af37]'
    }`}
  >
    <Icon size={16} /> {label}
  </button>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between text-neutral-300">
    <div>{label}</div>
    <div className="font-semibold text-white">{value}</div>
  </div>
);

export default Checkout;
