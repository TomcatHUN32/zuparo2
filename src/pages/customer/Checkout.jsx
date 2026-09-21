import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatFt } from '../../mock/mockData';
import { Minus, Plus, Trash2, MapPin, Banknote, CreditCard, Send, Tag, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const MIN_ORDER = 2500;

const Checkout = () => {
  const { cart, subtotal, setQty, remove, clear } = useCart();
  const { zones, getZoneFee, addOrder, validateCoupon } = useData();
  const { user } = useAuth();
  const nav = useNavigate();

  const [addr, setAddr] = useState({ zip: zones[0]?.zip || '', city: zones[0]?.city || '', street: '', floor: '', note: '' });
  const [payment, setPayment] = useState('cash');
  const [phone, setPhone] = useState(user?.phone || '');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [busy, setBusy] = useState(false);

  const deliveryFee = getZoneFee(addr.zip);
  let discountAmount = 0;
  if (couponApplied) discountAmount = couponApplied.kind === 'percent' ? Math.round(subtotal * couponApplied.value / 100) : Math.min(subtotal, couponApplied.value);
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);
  const belowMin = subtotal < MIN_ORDER;

  const applyCoupon = async () => {
    try { const c = await validateCoupon(coupon); setCouponApplied(c); toast.success(`Kupon aktív: ${c.code}`); }
    catch (e) { setCouponApplied(null); toast.error(e.response?.data?.detail || 'Érvénytelen kupon'); }
  };

  const submit = async () => {
    if (belowMin) return toast.error(`Minimum rendelés ${formatFt(MIN_ORDER)}`);
    if (!phone) return toast.error('Add meg a telefonszámod');
    if (!addr.zip || !addr.street) return toast.error('A cím hiányos');
    setBusy(true);
    try {
      const o = await addOrder({
        customerName: user.name, phone,
        zip: addr.zip, city: addr.city, street: addr.street, floor: addr.floor,
        type: 'delivery', payment, channel: 'house',
        items: cart.map((c) => ({ ...c, note: '' })),
        subtotal, deliveryFee,
        discountPct: couponApplied?.kind === 'percent' ? couponApplied.value : 0,
        discountAmount,
        couponCode: couponApplied?.code || '',
        total, note: addr.note,
      });
      toast.success(`Rendelés leadva: ${o.id}. Hamarosan felvesszük veled a kapcsolatot!`);
      clear();
      nav('/');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Rendelés hiba');
    } finally { setBusy(false); }
  };

  if (cart.length === 0) return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="font-display text-4xl font-black text-white">A kosarad üres</div>
      <p className="mt-3 text-neutral-400">Menj az étlapra és válassz valami finomat!</p>
      <button onClick={() => nav('/etlap')} className="mt-6 gold-gradient text-black font-bold px-6 py-3 rounded-full">Étlap megnyitása</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-7 space-y-5">
        <h1 className="font-display text-3xl font-black text-white">RENDELÉS LEADÁSA</h1>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h3 className="font-bold text-white mb-3 inline-flex items-center gap-2"><MapPin size={16} className="text-[#d4af37]" /> Szállítási cím</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={addr.zip} onChange={(e) => { const z = zones.find((zz) => zz.zip === e.target.value); setAddr({ ...addr, zip: e.target.value, city: z ? z.city : addr.city }); }} className="dark-input">
              {zones.map((z) => <option key={z.id} value={z.zip}>{z.zip}</option>)}
            </select>
            <input value={addr.city} readOnly className="dark-input opacity-80" />
          </div>
          <input placeholder="Utca, házszám" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} className="dark-input mt-3" />
          <input placeholder="Emelet / ajtó / kapucsengő" value={addr.floor} onChange={(e) => setAddr({ ...addr, floor: e.target.value })} className="dark-input mt-3" />
          <input placeholder="Telefonszám" value={phone} onChange={(e) => setPhone(e.target.value)} className="dark-input mt-3" />
          <textarea rows={2} placeholder="Megjegyzés a futárnak" value={addr.note} onChange={(e) => setAddr({ ...addr, note: e.target.value })} className="dark-input mt-3" />
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h3 className="font-bold text-white mb-3">Fizetés módja</h3>
          <div className="grid grid-cols-2 gap-3">
            <PayBtn active={payment === 'cash'} onClick={() => setPayment('cash')} icon={Banknote} label="Készpénz futárnál" />
            <PayBtn active={payment === 'card'} onClick={() => setPayment('card')} icon={CreditCard} label="Bankkártya futárnál" />
          </div>
        </div>
      </div>
      <div className="col-span-12 md:col-span-5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sticky top-24">
          <h3 className="font-bold text-white mb-3">Kosár</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {cart.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-1 border border-neutral-800 rounded-md">
                  <button onClick={() => setQty(c.id, c.qty - 1)} className="h-8 w-8 flex items-center justify-center text-neutral-300"><Minus size={14} /></button>
                  <div className="w-6 text-center text-sm font-semibold text-white">{c.qty}</div>
                  <button onClick={() => setQty(c.id, c.qty + 1)} className="h-8 w-8 flex items-center justify-center text-neutral-300"><Plus size={14} /></button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                </div>
                <div className="text-sm font-semibold text-white whitespace-nowrap">{formatFt(c.price * c.qty)}</div>
                <button onClick={() => remove(c.id)} className="h-7 w-7 rounded-md text-neutral-500 hover:text-rose-400"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">
            <Tag size={14} className="text-neutral-500" />
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Kuponkód" className="flex-1 bg-transparent focus:outline-none text-sm text-white" />
            <button onClick={applyCoupon} className="text-xs px-3 py-1.5 rounded-md gold-gradient text-black font-bold">Beváltás</button>
          </div>
          {couponApplied && (
            <div className="mt-2 text-xs text-emerald-300 inline-flex items-center gap-2"><CheckCircle2 size={12} /> {couponApplied.code} • {couponApplied.kind === 'percent' ? `${couponApplied.value}%` : formatFt(couponApplied.value)} kedvezmény</div>
          )}
          <div className="mt-4 space-y-1 text-sm">
            <Row label="Részösszeg" value={formatFt(subtotal)} />
            {discountAmount > 0 && <Row label="Kedvezmény" value={`- ${formatFt(discountAmount)}`} />}
            <Row label="Szállítási díj" value={formatFt(deliveryFee)} />
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-800">
              <div className="text-lg font-extrabold text-white">ÖSSZESEN</div>
              <div className="text-2xl gold-text-gradient font-extrabold">{formatFt(total)}</div>
            </div>
          </div>
          {belowMin && (
            <div className="mt-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-md px-3 py-2">
              Minimum rendelés {formatFt(MIN_ORDER)}. Még {formatFt(MIN_ORDER - subtotal)} szükséges.
            </div>
          )}
          <button onClick={submit} disabled={busy || belowMin} className={`mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg font-bold ${belowMin ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'gold-gradient text-black hover:brightness-105'}`}>
            <Send size={16} /> {busy ? 'Küldés...' : 'Rendelés leadása'}
          </button>
        </div>
      </div>
      <style>{`.dark-input { width:100%; padding: 0.75rem; border-radius: 0.5rem; background:#0a0a0a; border:1px solid #262626; color:#fff; outline:none; }
        .dark-input:focus { border-color:#d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); }`}</style>
    </div>
  );
};

const PayBtn = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium ${active ? 'gold-gradient text-black border-transparent' : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:border-[#d4af37]'}`}><Icon size={16} /> {label}</button>
);
const Row = ({ label, value }) => (
  <div className="flex items-center justify-between text-neutral-300"><div>{label}</div><div className="font-semibold text-white">{value}</div></div>
);

export default Checkout;
