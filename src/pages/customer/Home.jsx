import React from 'react';
import { Link } from 'react-router-dom';
import { LOGO_URL, CATEGORIES, formatFt } from '../../mock/mockData';
import { useData } from '../../context/DataContext';
import { useCart } from '../../context/CartContext';
import { Clock, Bike, Heart, ArrowRight, MapPin, Phone, Flame, Pizza, Beef, Utensils, Wheat, Salad, Popcorn, CakeSlice, CupSoda, Plus } from 'lucide-react';
import { toast } from 'sonner';

const ICONS = { Pizza, Beef, Utensils, Wheat, Salad, Popcorn, CakeSlice, CupSoda };

const Home = () => {
  const { menu, restaurantStatus } = useData();
  const { add } = useCart();
  const featured = [
    menu.find((m) => m.name === 'Margherita'),
    menu.find((m) => m.name === 'ZUPARO Burger menü'),
    menu.find((m) => m.name === 'Gyros tál'),
    menu.find((m) => m.name === 'Csirkés tortilla'),
  ].filter(Boolean);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 500px at 70% 30%, rgba(212,175,55,0.18), transparent 60%), linear-gradient(180deg, #0a0a0a 0%, #0a0a0a 60%, #0f0f10 100%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-14 sm:pb-20 grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 md:col-span-6 text-center md:text-left">
            <div className="font-script text-2xl sm:text-3xl md:text-4xl text-[#d4af37]">Mindig jó falat</div>
            <h1 className="mt-2 sm:mt-3 font-display text-4xl sm:text-5xl md:text-7xl font-black leading-[0.95]">
              <span className="text-white">ÉJJEL‑NAPPAL</span><br />
              <span className="gold-text-gradient">VELED VAGYUNK!</span>
            </h1>
            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6">
              <IconBlock icon={Clock} title={restaurantStatus?.alwaysOpen24 ? '0–24' : 'NYITVA'} sub="RENDELHETŐ" />
              <IconBlock icon={Bike} title="GYORS" sub="KISZÁLLÍTÁS" />
              <IconBlock icon={Heart} title="MINŐSÉGI" sub="ÉTELEK" />
            </div>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <Link to="/etlap" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 gold-gradient text-black font-extrabold tracking-wider px-8 py-3.5 sm:py-4 rounded-full shadow-[0_10px_30px_-10px_rgba(212,175,55,0.6)] hover:brightness-105 transition-all">
                RENDELJ MOST <span className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-black text-[#d4af37] flex items-center justify-center"><ArrowRight size={15} /></span>
              </Link>
            </div>
            <div className="mt-4 sm:mt-6 font-script text-base sm:text-lg text-neutral-300">Te megkívánod. Mi elkészítjük. Mi elvisszük. <Heart size={14} className="inline text-[#d4af37]" /></div>
          </div>
          <div className="col-span-12 md:col-span-6 flex justify-center">
            <div className="relative max-w-[340px] sm:max-w-[420px] md:max-w-none">
              <img src="https://images.unsplash.com/photo-1669717879542-65eb286d1b23?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxwaXp6YSUyMGNoZWVzZSUyMHB1bGwlMjBkYXJrfGVufDB8fHx8MTc4OTk5ODQ4NHww&ixlib=rb-4.1.0&q=85" alt="ZUPARO Pizza" className="h-[280px] sm:h-[380px] md:h-[460px] w-auto object-cover rounded-3xl drop-shadow-[0_30px_60px_rgba(212,175,55,0.35)]" />
              <div className="absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-4 bg-neutral-900 border border-neutral-800 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 shadow-2xl">
                <Flame size={20} className="text-[#d4af37]" />
                <div className="leading-tight text-[11px] sm:text-xs text-neutral-400"><div>FRISSEN.</div><div>SZAFTOSAN.</div><div>NEKED.</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-2 sm:-mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3">
          {CATEGORIES.slice(0, 8).map((c, i) => {
            const Icon = ICONS[c.icon] || Utensils;
            return (
              <Link key={c.id} to="/etlap" className={`rounded-2xl border p-3 sm:p-4 flex flex-col items-center justify-center text-center card-hover transition-all ${i === 0 ? 'border-[#d4af37] bg-neutral-900' : 'border-neutral-800 bg-neutral-900/60 hover:border-[#d4af37]'}`}>
                <Icon size={24} className={i === 0 ? 'text-[#d4af37]' : 'text-neutral-300'} />
                <div className={`mt-1.5 text-[11px] tracking-[0.15em] font-semibold truncate w-full ${i === 0 ? 'text-[#d4af37]' : 'text-neutral-300'}`}>{c.name.toUpperCase()}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <div className="text-[10px] sm:text-xs tracking-[0.35em] text-neutral-500">LEGNÉPSZERŰBB ÉTELEINK</div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white mt-1">A VENDÉGEINK KEDVENCEI</h2>
          </div>
          <Link to="/etlap" className="text-sm text-[#d4af37] hover:underline inline-flex items-center gap-1 font-semibold">Összes étel megtekintése <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {featured.map((m, i) => (
            <div key={m.id} className="relative rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden card-hover hover:border-[#d4af37] flex flex-col justify-between">
              <div>
                <div className="h-44 bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={m.image || LOGO_URL}
                    className={m.image ? "w-full h-full object-cover" : "h-20 object-contain opacity-70"}
                    alt={m.name}
                    onError={(e) => { e.currentTarget.src = LOGO_URL; e.currentTarget.className = "h-20 object-contain opacity-70"; }}
                  />
                  {i === 0 && <span className="absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded gold-gradient text-black">TOP</span>}
                  {i === 1 && <span className="absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded bg-rose-500 text-white">ÚJ</span>}
                  <button
                    onClick={() => toast.success(`Kedvencekhez adva: ${m.name}`)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-xs border border-neutral-700 text-white flex items-center justify-center hover:text-rose-400"
                  >
                    <Heart size={14} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="font-bold text-white text-base">{m.name}</div>
                  <div className="text-xs text-neutral-400 mt-1 line-clamp-2">{m.description}</div>
                </div>
              </div>
              <div className="p-4 pt-0 flex items-center justify-between border-t border-neutral-800/60 pt-3">
                <div className="gold-text-gradient font-extrabold text-base">{formatFt(m.price)}</div>
                <button
                  onClick={() => {
                    add({ id: m.id, name: m.name, price: m.price });
                    toast.success(`${m.name} kosárba téve`);
                  }}
                  className="h-8 w-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                  title="Kosárba"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 mb-16">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          <InfoCol icon={Bike} title={restaurantStatus?.alwaysOpen24 ? '0–24 KISZÁLLÍTÁS' : 'GYORS KISZÁLLÍTÁS'} sub={restaurantStatus?.alwaysOpen24 ? 'Éjjel-nappal rendelhetsz!' : 'Frissen kiszállítva'} />
          <InfoCol icon={MapPin} title="ELLENŐRIZD" sub="A szállítási területed" cta={{ to: '/szallitas', label: 'Cím megadása' }} />
          <InfoCol icon={Phone} title="RENDELÉS TELEFONON IS" sub="06 30 728 2289" />
        </div>
      </section>
    </div>
  );
};

const IconBlock = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-full border border-neutral-700 flex items-center justify-center shrink-0"><Icon size={18} className="text-neutral-200" /></div>
    <div className="text-left"><div className="font-extrabold text-white leading-tight">{title}</div><div className="text-[10px] tracking-[0.25em] text-neutral-400">{sub}</div></div>
  </div>
);
const InfoCol = ({ icon: Icon, title, sub, cta }) => (
  <div className="p-5 sm:p-6 flex items-center gap-4">
    <div className="h-12 w-12 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0"><Icon size={22} className="text-[#d4af37]" /></div>
    <div>
      <div className="font-extrabold text-white text-sm sm:text-base">{title}</div>
      <div className="text-xs text-neutral-400">{sub}</div>
      {cta && <Link to={cta.to} className="text-xs text-[#d4af37] font-semibold hover:underline inline-flex items-center gap-1 mt-1">{cta.label} <ArrowRight size={11} /></Link>}
    </div>
  </div>
);

export default Home;
