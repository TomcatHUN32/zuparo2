import React, { useMemo, useState } from 'react';
import { Search, MapPin, Bike, ShoppingBag, Store, Banknote, CreditCard, Trash2, Minus, Plus, Percent, CheckCircle2, Printer, Save, Send, Clock, Users, Home, Globe, Tag } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CATEGORIES, formatFt } from '../../mock/mockData';
import { KitchenTicketModal } from '../../components/KitchenTicketModal';
import { toast } from 'sonner';

const MIN_ORDER = 2500;
const CHANNELS = [
  { id: 'house', label: 'Házi', icon: Home },
  { id: 'foodora', label: 'Foodora', icon: Globe },
  { id: 'falatozz', label: 'Falatozz', icon: Globe },
];

const priceForChannel = (m, channel) => {
  if (channel === 'foodora') return m.priceFoodora || m.price;
  if (channel === 'falatozz') return m.priceFalatozz || m.price;
  return m.price;
};

const NewOrder = () => {
  const { menu, zones, couriers, customers, addOrder, validateCoupon, getZoneFee, restaurantStatus, categories } = useData();
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [address, setAddress] = useState({ zip: '3734', city: 'Szuhogy', street: '', floor: '', note: '' });
  const [orderType, setOrderType] = useState('delivery');
  const [payment, setPayment] = useState('cash');
  const [channel, setChannel] = useState('house');
  const [foodoraFee, setFoodoraFee] = useState(0);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [manualDiscount, setManualDiscount] = useState({ kind: 'percent', value: 0 });
  const [internalNote, setInternalNote] = useState('');
  const [showReturning, setShowReturning] = useState(false);
  const [previewOrder, setPreviewOrder] = useState(null);

  // Manual packaging fee override or default from restaurantStatus (or sum of item-level fees if specified)
  const [packagingFeeInput, setPackagingFeeInput] = useState(null);
  const hasItemPackaging = cart.some((item) => item.packagingFee !== undefined && item.packagingFee !== null);
  const defaultPackagingCalc = hasItemPackaging
    ? cart.reduce((sum, item) => sum + (Number(item.packagingFee) || 0) * (item.qty || 1), 0)
    : (Number(restaurantStatus?.packagingFee) || 200);

  const packagingFee = packagingFeeInput !== null
    ? Math.max(0, Number(packagingFeeInput) || 0)
    : ((restaurantStatus?.packagingFeeEnabled !== false && cart.length > 0)
        ? defaultPackagingCalc
        : 0);

  // DRS toggleable on/off and override
  const [drsEnabledManual, setDrsEnabledManual] = useState(null);
  const isDrsActive = drsEnabledManual !== null
    ? drsEnabledManual
    : (restaurantStatus?.drsFeeEnabled !== false);

  const drsCount = cart.reduce((sum, item) => {
    let hasDrs = false;
    if (item.drsFeeEnabled !== undefined && item.drsFeeEnabled !== null) {
      hasDrs = Boolean(item.drsFeeEnabled);
    } else {
      hasDrs = item.category === 'italok' ||
        /\b(0[,.]\d+l|doboz|palack|cola|fanta|tea|víz|sör|üdítő|pepsi|sprite|red bull|hell)\b/i.test(item.name || '');
    }
    return sum + (hasDrs ? item.qty : 0);
  }, 0);

  const drsFee = (isDrsActive && drsCount > 0)
    ? drsCount * (Number(restaurantStatus?.drsFee) || 50)
    : 0;

  const allCategories = useMemo(() => {
    const list = [{ id: 'all', name: 'Összes termék' }];
    const seen = new Set(['all']);
    const sourceCats = categories && categories.length > 0 ? categories : CATEGORIES;
    sourceCats.forEach((c) => {
      seen.add(c.id.toLowerCase());
      list.push({ id: c.id, name: c.name });
    });
    menu.forEach((m) => {
      if (m.category && !seen.has(m.category.toLowerCase())) {
        seen.add(m.category.toLowerCase());
        list.push({ id: m.category, name: m.category });
      }
    });
    return list;
  }, [categories, menu]);

  const normalizeCatMatch = (itemCat, targetCatId) => {
    if (!itemCat || !targetCatId || targetCatId === 'all') return true;
    const ic = String(itemCat).toLowerCase().trim();
    const tc = String(targetCatId).toLowerCase().trim();
    if (ic === tc) return true;
    const catObj = allCategories.find((c) => c.id.toLowerCase() === tc || c.name.toLowerCase() === tc);
    if (catObj) {
      if (ic === catObj.id.toLowerCase() || ic === catObj.name.toLowerCase()) return true;
    }
    const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (stripAccents(ic) === stripAccents(tc)) return true;
    return false;
  };

  const filtered = useMemo(() => menu.filter((m) =>
    normalizeCatMatch(m.category, activeCat) &&
    (search ? (m.name + ' ' + (m.description || '')).toLowerCase().includes(search.toLowerCase()) : true)
  ), [menu, activeCat, search, allCategories]);

  const addToCart = (m) => {
    const price = priceForChannel(m, channel);
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === m.id && !c.note);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1, price }; return copy; }
      return [...prev, {
        id: m.id,
        name: m.name,
        category: m.category,
        price,
        qty: 1,
        note: '',
        packagingFee: m.packagingFee,
        drsFeeEnabled: m.drsFeeEnabled,
      }];
    });
  };
  const updateQty = (i, delta) => setCart((prev) => prev.map((c, idx) => idx === i ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  const removeItem = (i) => setCart((prev) => prev.filter((_, idx) => idx !== i));
  const setItemNote = (i, note) => setCart((prev) => prev.map((c, idx) => idx === i ? { ...c, note } : c));

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const deliveryFee = orderType === 'delivery'
    ? (channel === 'foodora' ? Number(foodoraFee || 0) : getZoneFee(address.zip))
    : 0;
  let couponDiscount = 0;
  if (couponApplied) {
    if (couponApplied.kind === 'percent') couponDiscount = Math.round(subtotal * couponApplied.value / 100);
    else couponDiscount = Math.min(subtotal, couponApplied.value);
  }
  const manualVal = Math.max(0, Number(manualDiscount.value || 0));
  const manualAmount = manualDiscount.kind === 'percent'
    ? Math.round(subtotal * Math.min(100, manualVal) / 100)
    : Math.min(subtotal, manualVal);
  const discountAmount = Math.min(subtotal, couponDiscount + manualAmount);
  const total = Math.max(0, subtotal - discountAmount + deliveryFee + packagingFee + drsFee);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const c = await validateCoupon(coupon);
      setCouponApplied(c);
      toast.success(`Kupon aktív: ${c.code}`);
    } catch (e) {
      setCouponApplied(null);
      toast.error(e.response?.data?.detail || 'Érvénytelen kupon');
    }
  };

  const pickReturning = (c) => {
    setCustomer({ name: c.name, phone: c.phone });
    setAddress({ zip: c.zip, city: c.city, street: c.street, floor: c.floor || '', note: '' });
    setShowReturning(false);
    toast.success(`${c.name} adatai betöltve`);
  };
  const clearAll = () => {
    setCart([]);
    setCouponApplied(null);
    setCoupon('');
    setManualDiscount({ kind: 'percent', value: 0 });
    setPackagingFeeInput(null);
    setDrsEnabledManual(null);
    toast.info('Kosár ürítve');
  };

  const submitOrder = async () => {
    if (!customer.name || !customer.phone) return toast.error('Kérlek add meg a vendég adatait');
    if (cart.length === 0) return toast.error('A kosár üres');
    if (orderType === 'delivery' && (!address.zip || !address.street)) return toast.error('A szállítási cím hiányos');
    try {
      const o = await addOrder({
        customerName: customer.name, phone: customer.phone,
        zip: address.zip, city: address.city, street: address.street, floor: address.floor,
        type: orderType, payment, channel,
        items: cart, subtotal, deliveryFee,
        packagingFee,
        drsFee,
        discountPct: (couponApplied?.kind === 'percent' ? couponApplied.value : 0) + (manualDiscount.kind === 'percent' ? Math.min(100, manualVal) : 0),
        discountAmount,
        couponCode: couponApplied?.code || '',
        total, note: internalNote,
      });
      toast.success(`Rendelés elküldve: ${o.id}`);
      setCart([]); setCouponApplied(null); setCoupon(''); setManualDiscount({ kind: 'percent', value: 0 }); setInternalNote('');
      setPackagingFeeInput(null); setDrsEnabledManual(null);
      setCustomer({ name: '', phone: '' }); setAddress({ zip: '3734', city: 'Szuhogy', street: '', floor: '', note: '' });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hiba a rendelés mentésekor');
    }
  };

  const activeCouriers = couriers.filter((c) => c.active);

  return (
    <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="col-span-1 lg:col-span-4 space-y-6">
        <Card title={<><span className="text-neutral-400 mr-2">1.</span>Vevő adatai</>} action={
          <button onClick={() => setShowReturning((v) => !v)} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200">
            <Users size={14} /> Visszatérő vendég <Search size={14} />
          </button>
        }>
          {showReturning && (
            <div className="mb-3 max-h-56 overflow-y-auto rounded-lg border border-neutral-200 divide-y">
              {customers.map((c) => (
                <button key={c.id} onClick={() => pickReturning(c)} className="w-full text-left px-3 py-2 hover:bg-neutral-50">
                  <div className="text-sm font-medium text-neutral-900">{c.name}</div>
                  <div className="text-xs text-neutral-500">{c.phone} • {c.zip} {c.city}</div>
                </button>
              ))}
              {customers.length === 0 && <div className="text-sm text-neutral-500 px-3 py-3">Nincs korábbi vendég.</div>}
            </div>
          )}
          <Field label="Név *"><input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="input" placeholder="Kiss Ádám" /></Field>
          <Field label="Telefonszám *"><input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="input" placeholder="+36 70 123 4567" /></Field>
        </Card>

        <Card title={<><span className="text-neutral-400 mr-2">2.</span>Szállítási cím</>} action={
          <button className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200"><MapPin size={14} /> Térképen</button>
        }>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Irányítószám *">
              <input value={address.zip} onChange={(e) => {
                const zip = e.target.value; const z = zones.find((zz) => zz.zip === zip);
                setAddress({ ...address, zip, city: z ? z.city : address.city });
              }} className="input" />
            </Field>
            <Field label="Település *">
              <select value={address.city} onChange={(e) => {
                const city = e.target.value; const z = zones.find((zz) => zz.city === city);
                setAddress({ ...address, city, zip: z ? z.zip : address.zip });
              }} className="input">
                {zones.map((z) => <option key={z.id} value={z.city}>{z.city}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Utca, házszám *"><input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="input" placeholder="Kossuth Lajos utca 15." /></Field>
          <Field label="Emelet / ajtó / kapucsengő"><input value={address.floor} onChange={(e) => setAddress({ ...address, floor: e.target.value })} className="input" placeholder="Földszint, kapu" /></Field>
          <Field label="Megjegyzés a futárnak"><input value={address.note} onChange={(e) => setAddress({ ...address, note: e.target.value })} className="input" placeholder="Csengő nem működik..." /></Field>
        </Card>

        <Card title={<><span className="text-neutral-400 mr-2">3.</span>Rendelés típusa</>}>
          <div className="grid grid-cols-3 gap-3">
            <TypeButton active={orderType === 'delivery'} onClick={() => setOrderType('delivery')} icon={Bike} label="Kiszállítás" />
            <TypeButton active={orderType === 'pickup'} onClick={() => setOrderType('pickup')} icon={ShoppingBag} label="Elvitel" />
            <TypeButton active={orderType === 'dinein'} onClick={() => setOrderType('dinein')} icon={Store} label="Helyben" />
          </div>
        </Card>

        <Card title={<><span className="text-neutral-400 mr-2">4.</span>Rendelés forrása & ár</>}>
          <div className="grid grid-cols-3 gap-3">
            {CHANNELS.map((c) => (
              <TypeButton key={c.id} active={channel === c.id} onClick={() => { setChannel(c.id); setCart((prev) => prev.map((it) => { const m = menu.find((x) => x.id === it.id); return m ? { ...it, price: priceForChannel(m, c.id) } : it; })); if (c.id !== 'foodora') setFoodoraFee(0); if (c.id !== 'house') setPayment('online'); else setPayment('cash'); }} icon={c.icon} label={c.label} />
            ))}
          </div>
          {channel === 'foodora' && (
            <div className="mt-3">
              <div className="text-xs text-neutral-500 mb-1">Foodora szállítási díj (kézi)</div>
              <input type="number" value={foodoraFee} onChange={(e) => setFoodoraFee(e.target.value)} className="input" placeholder="pl. 690" />
            </div>
          )}
        </Card>

        <Card title={<><span className="text-neutral-400 mr-2">5.</span>Fizetés módja</>}>
          <div className="grid grid-cols-3 gap-3">
            <TypeButton active={payment === 'cash'} onClick={() => setPayment('cash')} icon={Banknote} label="Készpénz" />
            <TypeButton active={payment === 'card'} onClick={() => setPayment('card')} icon={CreditCard} label="Bankkártya" />
            <TypeButton active={payment === 'online'} onClick={() => setPayment('online')} icon={Globe} label="Online fizetve" />
          </div>
        </Card>
      </div>

      <div className="col-span-1 lg:col-span-4">
        <Card title={<><span className="text-neutral-400 mr-2">6.</span>Termékek</>}>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Termék keresése..." className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2">
            {allCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap border transition-all ${
                  activeCat === c.id
                    ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filtered.map((m) => {
              const price = priceForChannel(m, channel);
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 card-hover">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-neutral-900 truncate">{m.name}</div>
                    {m.description && <div className="text-xs text-neutral-500 truncate">{m.description}</div>}
                  </div>
                  <div className="text-sm font-semibold text-neutral-900 whitespace-nowrap">{formatFt(price)}</div>
                  <button onClick={() => addToCart(m)} className="h-9 w-9 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center"><Plus size={16} /></button>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-sm text-neutral-500 py-8 text-center">Nincs találat.</div>}
          </div>
        </Card>
      </div>

      <div className="col-span-1 lg:col-span-4 space-y-6">
        <Card title={<><span className="text-neutral-400 mr-2">7.</span>Rendelés kosár</>} action={
          <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"><Trash2 size={14} /> Kosár ürítése</button>
        }>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {cart.map((c, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white">
                  <button onClick={() => updateQty(i, -1)} className="h-8 w-8 flex items-center justify-center text-neutral-600 hover:text-neutral-900"><Minus size={14} /></button>
                  <div className="w-6 text-center text-sm font-semibold">{c.qty}</div>
                  <button onClick={() => updateQty(i, +1)} className="h-8 w-8 flex items-center justify-center text-neutral-600 hover:text-neutral-900"><Plus size={14} /></button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-neutral-900 truncate">{c.name}</div>
                  <input value={c.note} onChange={(e) => setItemNote(i, e.target.value)} placeholder="Megjegyzés (extra sajt...)" className="mt-1 text-xs w-full bg-transparent focus:outline-none text-neutral-500 placeholder:text-neutral-400" />
                </div>
                <div className="text-sm font-semibold text-neutral-900 whitespace-nowrap">{formatFt(c.price * c.qty)}</div>
                <button onClick={() => removeItem(i)} className="h-8 w-8 flex items-center justify-center text-neutral-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            ))}
            {cart.length === 0 && <div className="text-sm text-neutral-500 py-8 text-center">A kosár még üres.</div>}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">
              <Percent size={16} className="text-neutral-500" />
              <div className="text-sm text-neutral-700 flex-1">Kézi kedvezmény</div>
              <div className="inline-flex rounded-md border border-neutral-300 overflow-hidden">
                <button type="button" onClick={() => setManualDiscount({ ...manualDiscount, kind: 'percent' })} className={`px-2 py-1 text-xs font-semibold ${manualDiscount.kind === 'percent' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600'}`}>%</button>
                <button type="button" onClick={() => setManualDiscount({ ...manualDiscount, kind: 'amount' })} className={`px-2 py-1 text-xs font-semibold border-l border-neutral-300 ${manualDiscount.kind === 'amount' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600'}`}>Ft</button>
              </div>
              <input type="number" min={0} value={manualDiscount.value} onChange={(e) => setManualDiscount({ ...manualDiscount, value: e.target.value })} className="w-20 text-right bg-white border border-neutral-200 rounded px-2 py-1 text-sm" placeholder="0" />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">
              <Tag size={16} className="text-neutral-500" />
              <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Kuponkód" className="flex-1 bg-transparent focus:outline-none text-sm" />
              <button onClick={applyCoupon} className="text-xs px-3 py-1.5 rounded-md bg-neutral-900 text-white">Beváltás</button>
            </div>
            {couponApplied && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 inline-flex items-center gap-2">
                <CheckCircle2 size={12} /> {couponApplied.code} • {couponApplied.kind === 'percent' ? `${couponApplied.value}%` : formatFt(couponApplied.value)} kedvezmény
                <button onClick={() => { setCouponApplied(null); setCoupon(''); }} className="ml-2 text-emerald-800/60 hover:text-emerald-900">✕</button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <Row label="Részösszeg" value={formatFt(subtotal)} />
            {discountAmount > 0 && <Row label={couponApplied && manualAmount > 0 ? 'Kedvezmény (kupon + kézi)' : couponApplied ? `Kupon ${couponApplied.code}` : `Kézi kedvezmény ${manualDiscount.kind === 'percent' ? `(${manualVal}%)` : ''}`} value={`- ${formatFt(discountAmount)}`} />}
            {orderType === 'delivery' && channel === 'foodora' && (
              <div className="flex items-center justify-between">
                <div className="text-neutral-600 inline-flex items-center gap-2"><Globe size={14} className="text-neutral-500" /> Foodora szállítási díj</div>
                <div className="flex items-center gap-1">
                  <input type="number" value={foodoraFee} onChange={(e) => setFoodoraFee(e.target.value)} placeholder="0" className="w-24 text-right border border-neutral-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
                  <span className="text-neutral-500">Ft</span>
                </div>
              </div>
            )}
            {orderType === 'delivery' && channel !== 'foodora' && <Row label="Kiszállítási díj" value={formatFt(deliveryFee)} />}

            {/* Packaging fee row with manual edit */}
            <div className="flex items-center justify-between py-1 border-t border-neutral-100">
              <div className="text-neutral-700 font-medium inline-flex items-center gap-1.5">
                <span>📦 Csomagolási díj</span>
                <button
                  type="button"
                  onClick={() => setPackagingFeeInput(packagingFee > 0 ? 0 : (restaurantStatus?.packagingFee || 200))}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 underline"
                >
                  {packagingFee > 0 ? 'Kikapcsolás' : 'Bekapcsolás'}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={packagingFee}
                  onChange={(e) => setPackagingFeeInput(Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 text-right font-bold border border-neutral-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                />
                <span className="text-xs text-neutral-500 font-semibold">Ft</span>
              </div>
            </div>

            {/* DRS Fee row with toggle (50 Ft) */}
            <div className="flex items-center justify-between py-1 border-t border-neutral-100">
              <div className="text-neutral-700 font-medium inline-flex items-center gap-2">
                <span>♻️ DRS visszaváltási díj (50 Ft)</span>
                <span className="text-[11px] text-neutral-400">({drsCount} tétel)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrsEnabledManual(!isDrsActive)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                    isDrsActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                  }`}
                >
                  {isDrsActive ? 'BE (50 Ft)' : 'KI'}
                </button>
                <span className="font-bold text-neutral-900 text-xs w-16 text-right">
                  {formatFt(drsFee)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-200">
              <div className="text-lg font-extrabold text-neutral-900">ÖSSZESEN:</div>
              <div className="text-2xl font-extrabold text-neutral-900">{formatFt(total)}</div>
            </div>
          </div>

          <button onClick={submitOrder} className="mt-4 w-full inline-flex items-center justify-center gap-2 font-semibold py-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white">
            <CheckCircle2 size={18} /> Rendelés véglegesítése
          </button>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => {
                if (cart.length === 0) return toast.error('A kosár még üres!');
                setPreviewOrder({
                  id: 'PISZKOZAT',
                  customerName: customer.name || 'Vendég',
                  phone: customer.phone,
                  zip: address.zip, city: address.city, street: address.street, floor: address.floor,
                  type: orderType, payment, channel,
                  items: cart, subtotal, deliveryFee, packagingFee, drsFee, discountAmount, total,
                  note: internalNote,
                  couponCode: couponApplied?.code,
                  createdAt: new Date().toISOString(),
                });
              }}
              className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-amber-500/40 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-sm transition-colors"
            >
              <Printer size={16} /> Konyha blokk / Nyugta
            </button>
            <button onClick={() => toast.info('Rendelés mentve piszkozatként')} className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-sm"><Save size={16} /> Rendelés mentése</button>
          </div>
        </Card>

        <div>
          <label className="text-sm text-neutral-600">Belső megjegyzés (nem látszik a futárnak)</label>
          <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={3} placeholder="Pl. extra szósz, allergia, stb..." className="mt-1 w-full rounded-lg bg-white border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
      </div>

      <div className="col-span-12 grid grid-cols-3 gap-4 mt-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center"><Clock size={18} /></div>
          <div>
            <div className="text-xs text-neutral-500">Várható elkészítési idő</div>
            <div className="text-lg font-bold text-neutral-900">25–35 perc</div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 col-span-2">
          <div className="text-xs text-neutral-500 mb-2">Elérhető futárok ({activeCouriers.length})</div>
          <div className="flex flex-wrap gap-4">
            {activeCouriers.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{c.name}</div>
                  <div className="text-xs text-neutral-500">Szabad</div>
                </div>
              </div>
            ))}
            {activeCouriers.length === 0 && <div className="text-sm text-neutral-500">Nincs aktuálisan elérhető futár.</div>}
          </div>
        </div>
      </div>
      <div className="col-span-12">
        <button onClick={submitOrder} className="w-full inline-flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white"><Send size={18} /> Rendelés elküldése a konyhára</button>
      </div>

      {/* Kitchen Ticket Modal for Preview / Printing */}
      <KitchenTicketModal
        order={previewOrder}
        isOpen={Boolean(previewOrder)}
        onClose={() => setPreviewOrder(null)}
      />

      <style>{`.input { width:100%; padding:0.55rem 0.75rem; border:1px solid #e5e7eb; border-radius:0.5rem; font-size:0.875rem; background:#fff; outline:none; }
        .input:focus { border-color:#171717; box-shadow: 0 0 0 3px rgba(23,23,23,0.08); }`}</style>
    </div>
  );
};

const Card = ({ title, action, children }) => (
  <section className="bg-white rounded-xl border border-neutral-200 p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-neutral-900">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);
const Field = ({ label, children }) => (
  <div className="mt-3">
    <div className="text-xs text-neutral-500 mb-1">{label}</div>
    {children}
  </div>
);
const TypeButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium ${active ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'}`}>
    <Icon size={16} /> {label}
  </button>
);
const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <div className="text-neutral-600">{label}</div>
    <div className="font-semibold text-neutral-900">{value}</div>
  </div>
);

export default NewOrder;
