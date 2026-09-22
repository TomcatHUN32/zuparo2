import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutList, PlusCircle, Bike, Users, UtensilsCrossed, Boxes, BarChart3, Settings as SettingsIcon, Search, LogOut, Volume2, VolumeX, Bell, Menu, X, Clock, Power, ShieldAlert, Database } from 'lucide-react';
import { LOGO_URL } from '../../mock/mockData';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL : '') + '/api';

const NAV = [
  { to: '/admin/rendelesek', label: 'Rendelések', icon: LayoutList },
  { to: '/admin/uj-rendeles', label: 'Új rendelés', icon: PlusCircle },
  { to: '/admin/futarok', label: 'Futárok', icon: Bike },
  { to: '/admin/vevok', label: 'Vevők', icon: Users },
  { to: '/admin/etlap', label: 'Étlap', icon: UtensilsCrossed },
  { to: '/admin/keszlet', label: 'Készlet', icon: Boxes },
  { to: '/admin/statisztika', label: 'Statisztika', icon: BarChart3 },
  { to: '/admin/beallitasok', label: 'Beállítások', icon: SettingsIcon },
];

const PAGE_META = {
  '/admin/rendelesek': { title: 'Rendelések', subtitle: 'Nyomon követheted az összes befutott rendelést.' },
  '/admin/uj-rendeles': { title: 'Telefonos rendelés felvétele', subtitle: 'Vedd fel a vendég adatait, add hozzá a termékeket, majd zárd le a rendelést.' },
  '/admin/futarok': { title: 'Futárok', subtitle: 'Kezeld a futárok listáját és oszd szét a címeket.' },
  '/admin/vevok': { title: 'Vevők', subtitle: 'Visszatérő vendégeid adatai egy helyen.' },
  '/admin/etlap': { title: 'Étlap', subtitle: 'Termékek, házi / Foodora / Falatozz árakkal és ételfotókkal.' },
  '/admin/keszlet': { title: 'Készlet', subtitle: 'Kövesd nyomon az alapanyagok mennyiségét.' },
  '/admin/statisztika': { title: 'Statisztika', subtitle: 'Áttekintő számok az üzlet teljesítményéről.' },
  '/admin/beallitasok': { title: 'Beállítások', subtitle: 'Nyitvatartás (0-24), szállítási területek, futárok, napi és futár zárás.' },
};

const AdminLayout = () => {
  const location = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { soundMuted, toggleSoundMute, testSound, restaurantStatus, updateRestaurantStatus } = useData();
  const meta = PAGE_META[location.pathname] || { title: 'ZUPARO Admin', subtitle: '' };
  const [now, setNow] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [reasonInput, setReasonInput] = useState(restaurantStatus?.manualCloseReason || '');
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const fetchDb = async () => {
      try {
        const res = await axios.get(`${API}/system/db-status`);
        setDbStatus(res.data);
      } catch (e) {}
    };
    fetchDb();
    const interval = setInterval(fetchDb, 15000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const weekday = now.toLocaleDateString('hu-HU', { weekday: 'long' });
  const wCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  const doLogout = () => { logout(); nav('/belepes', { replace: true }); };

  const handleToggleOpenClose = async () => {
    const nextIsOpen = !restaurantStatus?.isOpen;
    await updateRestaurantStatus({
      isOpen: nextIsOpen,
      manualCloseReason: nextIsOpen ? '' : (reasonInput || 'Manuálisan zárva az admin által')
    });
    setStatusModalOpen(false);
    toast.success(nextIsOpen ? 'Étterem megnyitva! Rendelések fogadása engedélyezve.' : 'Étterem lezárva! Rendelések fogadása szünetel.');
  };

  const handleToggle24h = async () => {
    const next24 = !restaurantStatus?.alwaysOpen24;
    await updateRestaurantStatus({ alwaysOpen24: next24 });
    toast.success(next24 ? '0-24 Non-stop rendelésfelvétel bekapcsolva!' : 'Normál nyitvatartási rend beállítva.');
  };

  const navContent = (
    <>
      <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="ZUPARO" className="h-12 w-12 object-contain rounded-md bg-black/40 p-1" />
          <div>
            <div className="text-2xl font-extrabold tracking-wide gold-text-gradient">ZUPARO</div>
            <div className="text-[10px] tracking-[0.3em] text-neutral-400">POS &amp; ADMIN</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-neutral-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${restaurantStatus?.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{restaurantStatus?.isOpen ? 'Étterem NYITVA' : 'Étterem ZÁRVA'}</span>
          </div>
          <button
            onClick={() => setStatusModalOpen(true)}
            className="text-[11px] text-[#d4af37] underline hover:text-white"
          >
            Módosítás
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
          <Bell size={12} className={soundMuted ? 'text-neutral-500' : 'animate-bounce text-amber-400'} />
          <span>Hangjelzés: {soundMuted ? 'Némítva' : 'Aktív'}</span>
        </div>
        <button
          onClick={() => { setSidebarOpen(false); nav('/admin/beallitasok?tab=database'); }}
          className="w-full flex items-center justify-between text-[11px] text-neutral-300 hover:text-white transition-colors pt-1 border-t border-neutral-800/80"
          title="Ugrás a MongoDB beállításokhoz"
        >
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dbStatus?.isMongoConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>DB: {dbStatus?.isMongoConnected ? 'MongoDB aktív' : 'Memória mód'}</span>
          </span>
          <span className="text-[10px] text-amber-400 underline">Kezelés</span>
        </button>
        <div className="text-[10px] text-neutral-500">v1.2.0 • Szuhogy</div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-neutral-100 text-neutral-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-neutral-950 text-neutral-100 flex-col sticky top-0 h-screen shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-neutral-950 text-neutral-100 flex flex-col h-full z-10 shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-8 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              aria-label="Menü megnyitása"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">{meta.title}</h1>
              {meta.subtitle && <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 hidden sm:block">{meta.subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-4">
            {/* Quick Open/Close Status Indicator Button */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatusModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs ${
                  restaurantStatus?.isOpen
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                }`}
                title="Kattints a nyitás/zárás váltásához"
              >
                <Power size={13} className={restaurantStatus?.isOpen ? 'text-emerald-600' : 'text-rose-600'} />
                <span>{restaurantStatus?.isOpen ? 'NYITVA' : 'ZÁRVA'}</span>
              </button>

              {/* Quick 0-24 Toggle Pill */}
              <button
                onClick={handleToggle24h}
                className={`hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs ${
                  restaurantStatus?.alwaysOpen24
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
                }`}
                title="0-24 órás nyitvatartás kapcsolása"
              >
                <Clock size={12} className={restaurantStatus?.alwaysOpen24 ? 'text-amber-600' : 'text-neutral-500'} />
                <span>{restaurantStatus?.alwaysOpen24 ? '0-24 AKTÍV' : '0-24 KIKAPCSOLVA'}</span>
              </button>

              {/* DB Status Indicator Button */}
              <button
                onClick={() => nav('/admin/beallitasok?tab=database')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs ${
                  dbStatus?.isMongoConnected
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                }`}
                title="Kattints az Adatbázis & MongoDB beállítások és diagnosztika megnyitásához"
              >
                <Database size={13} className={dbStatus?.isMongoConnected ? 'text-emerald-600' : 'text-rose-600'} />
                <span>{dbStatus?.isMongoConnected ? 'MongoDB' : 'Memória (DB offline)'}</span>
              </button>
            </div>

            {/* Audio Alert Control */}
            <div className="flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-full px-2.5 sm:px-3 py-1.5 transition-colors">
              <button
                onClick={toggleSoundMute}
                title={soundMuted ? 'Hangjelzés bekapcsolása' : 'Hangjelzés némítása'}
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800"
              >
                {soundMuted ? (
                  <>
                    <VolumeX size={15} className="text-rose-500" />
                    <span className="text-rose-600 font-medium hidden sm:inline">Némítva</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Volume2 size={15} className="text-emerald-600" />
                    <span className="text-neutral-900 hidden sm:inline">Hang</span>
                  </>
                )}
              </button>
              <button
                onClick={testSound}
                title="Hangjelzés tesztelése (kattints a kipróbáláshoz)"
                className="ml-1 pl-2 border-l border-neutral-300 text-neutral-600 hover:text-amber-600 text-xs font-bold flex items-center gap-1"
              >
                <Bell size={11} /> <span className="hidden sm:inline">Teszt</span>
              </button>
            </div>

            {/* Current Time (hidden on tiny screens) */}
            <div className="text-right hidden md:block">
              <div className="text-xs sm:text-sm font-semibold text-neutral-900">{dateStr} {timeStr}</div>
              <div className="text-[11px] text-neutral-500">{wCap}</div>
            </div>

            {/* User & Logout */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-neutral-200">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                {initial}
              </div>
              <div className="hidden xl:block">
                <div className="text-xs font-semibold text-neutral-900 truncate max-w-[90px]">{user?.name}</div>
                <div className="text-[10px] text-neutral-500">Üzletvezető</div>
              </div>
              <button
                onClick={doLogout}
                title="Kilépés"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-neutral-200 text-neutral-500 hover:text-rose-500 hover:border-rose-200 inline-flex items-center justify-center"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Quick Status Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Power size={18} className="text-[#d4af37]" /> Étterem nyitvatartási állapota
              </h3>
              <button onClick={() => setStatusModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-4 rounded-xl border flex items-center justify-between bg-neutral-50">
                <div>
                  <div className="font-bold text-sm text-neutral-900">Jelenlegi állapot:</div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    {restaurantStatus?.isOpen ? '🟢 Nyitva - a vásárlók leadhatnak rendelést' : '🔴 Zárva - rendelésfelvétel szüneteltetve'}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${restaurantStatus?.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {restaurantStatus?.isOpen ? 'NYITVA' : 'ZÁRVA'}
                </span>
              </div>

              {!restaurantStatus?.isOpen && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Zárva tartás oka (megjelenik a vendégeknek):</label>
                  <input
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="Pl. Karbantartás, technikai szünet, rendezvény..."
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-amber-900">0-24 Non-stop rendelési lehetőség</div>
                  <div className="text-[11px] text-amber-700">Éjjel-nappal bármikor leadható rendelés</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(restaurantStatus?.alwaysOpen24)}
                  onChange={handleToggle24h}
                  className="h-4 w-4 rounded accent-amber-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-neutral-200">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Mégse
              </button>
              <button
                onClick={handleToggleOpenClose}
                className={`flex-1 py-2 rounded-lg text-sm font-bold text-white transition-colors ${
                  restaurantStatus?.isOpen ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {restaurantStatus?.isOpen ? 'Étterem bezárása' : 'Étterem megnyitása'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
