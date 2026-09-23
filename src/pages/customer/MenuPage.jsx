import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useCart } from '../../context/CartContext';
import { CATEGORIES, formatFt, LOGO_URL } from '../../mock/mockData';
import { Search, Plus, Heart, ShoppingCart, XCircle, Slash } from 'lucide-react';
import { toast } from 'sonner';

const MIN_ORDER = 2500;

const MenuPage = () => {
  const { menu, restaurantStatus, categories } = useData();
  const { add, count, subtotal } = useCart();
  const nav = useNavigate();
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  // Dynamic categories collected from database categories + active menu items
  const dynamicCategories = React.useMemo(() => {
    const list = [{ id: 'all', name: 'Összes étel' }];
    const seen = new Set(['all']);

    // 1. Categories from database / context
    if (Array.isArray(categories) && categories.length > 0) {
      categories.forEach((c) => {
        if (c && c.name) {
          const lowerId = (c.id || '').toLowerCase();
          const lowerName = c.name.toLowerCase();
          if (!seen.has(lowerId) && !seen.has(lowerName)) {
            seen.add(lowerId);
            seen.add(lowerName);
            list.push({ id: c.id || c.name, name: c.name });
          }
        }
      });
    }

    // 2. Categories found in actual menu items
    menu.forEach((m) => {
      if (m.category) {
        const lower = m.category.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          list.push({ id: m.category, name: m.category });
        }
      }
    });

    // 3. Only keep categories that either have dishes in the menu, or is 'all'
    const availableCategories = list.filter((c) => {
      if (c.id === 'all') return true;
      return menu.some((m) => {
        const ic = String(m.category || '').toLowerCase().trim();
        const tc = String(c.id || '').toLowerCase().trim();
        const tn = String(c.name || '').toLowerCase().trim();
        return ic === tc || ic === tn;
      });
    });

    return availableCategories.length > 1 ? availableCategories : list;
  }, [menu, categories]);

  const normalizeCatMatch = (itemCat, targetCatId) => {
    if (!itemCat || !targetCatId || targetCatId === 'all') return true;
    const ic = String(itemCat).toLowerCase().trim();
    const tc = String(targetCatId).toLowerCase().trim();
    if (ic === tc) return true;
    const catObj = dynamicCategories.find((c) => c.id.toLowerCase() === tc || c.name.toLowerCase() === tc);
    if (catObj) {
      if (ic === catObj.id.toLowerCase() || ic === catObj.name.toLowerCase()) return true;
    }
    const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (stripAccents(ic) === stripAccents(tc)) return true;
    return false;
  };

  const items = menu.filter((m) => {
    const matchCat = normalizeCatMatch(m.category, cat);
    const matchQuery = q ? (m.name + ' ' + (m.description || '')).toLowerCase().includes(q.toLowerCase()) : true;
    return matchCat && matchQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32">
      {/* Restaurant Status Banner if manual closed */}
      {restaurantStatus && !restaurantStatus.isOpen && !restaurantStatus.alwaysOpen24 && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-200 text-sm flex items-center justify-between">
          <span>⚠️ Az étterem pillanatnyilag szünetelteti a rendelések fogadását: <b>{restaurantStatus.manualCloseReason || 'Nyitás hamarosan'}</b></span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="font-script text-2xl text-[#d4af37]">Mindig jó falat</div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white">ÉTLAP</h1>
          <div className="text-xs text-neutral-400 mt-1">
            Minimum rendelési összeg: <span className="text-[#d4af37] font-semibold">{formatFt(MIN_ORDER)}</span>
            {restaurantStatus?.alwaysOpen24 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold inline-block">
                ⚡ 0-24 Rendelésfelvétel
              </span>
            )}
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keresés az ételek között..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-white placeholder:text-neutral-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {dynamicCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`px-4 py-2 rounded-full text-sm border transition-all ${
              cat === c.id ? 'gold-gradient text-black border-transparent font-bold shadow-md' : 'bg-neutral-900 text-neutral-200 border-neutral-800 hover:border-[#d4af37]'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((m) => {
          const isSoldOut = m.available === false;
          return (
            <div
              key={m.id}
              className={`rounded-2xl border bg-neutral-900 overflow-hidden flex flex-col justify-between transition-all ${
                isSoldOut
                  ? 'border-neutral-800/80 opacity-90'
                  : 'border-neutral-800 card-hover hover:border-[#d4af37]'
              }`}
            >
              <div>
                <div className="h-44 bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={m.image || LOGO_URL}
                    className={`transition-transform duration-300 ${
                      m.image ? "w-full h-full object-cover" : "h-20 opacity-70"
                    } ${isSoldOut ? "grayscale opacity-50" : "hover:scale-105"}`}
                    alt={m.name}
                    onError={(e) => {
                      e.currentTarget.src = LOGO_URL;
                      e.currentTarget.className = "h-20 opacity-70";
                    }}
                  />

                  {/* Sold out badge */}
                  {isSoldOut && (
                    <div className="absolute top-3 left-3 bg-rose-600 text-white font-black text-[11px] px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg flex items-center gap-1">
                      <XCircle size={13} />
                      <span>Elfogyott</span>
                    </div>
                  )}

                  <button
                    onClick={() => toast.success(`Kedvencekhez adva: ${m.name}`)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-xs border border-neutral-700 text-white flex items-center justify-center hover:text-rose-400 transition-colors"
                  >
                    <Heart size={14} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`font-bold text-base ${isSoldOut ? 'text-neutral-300' : 'text-white'}`}>
                      {m.name}
                    </div>
                    {isSoldOut && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        Elfogyott
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{m.description}</div>
                </div>
              </div>
              <div className="p-4 pt-0 mt-2 flex items-center justify-between border-t border-neutral-800/60 pt-3">
                <div className={`font-extrabold text-lg ${isSoldOut ? 'text-neutral-500 line-through' : 'gold-text-gradient'}`}>
                  {formatFt(m.price)}
                </div>
                {isSoldOut ? (
                  <button
                    disabled
                    className="h-9 px-4 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs font-bold inline-flex items-center gap-1.5 cursor-not-allowed opacity-75"
                    title="Ez az étel jelenleg elfogyott, nem rendelhető"
                  >
                    <Slash size={13} /> Elfogyott
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      add(m);
                      toast.success(`${m.name} kosárba téve`);
                    }}
                    className="h-9 px-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} /> Kosárba
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="col-span-full text-center text-neutral-500 py-16">Nincs találat.</div>}
      </div>

      {count > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 border border-[#d4af37] rounded-full shadow-2xl px-3 py-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center"><ShoppingCart size={18} /></div>
          <div className="pr-2">
            <div className="text-xs text-neutral-400">Kosár ({count})</div>
            <div className="gold-text-gradient font-extrabold">{formatFt(subtotal)}</div>
          </div>
          <button onClick={() => nav('/rendeles')} className="gold-gradient text-black font-bold px-5 py-2.5 rounded-full">Tovább →</button>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
