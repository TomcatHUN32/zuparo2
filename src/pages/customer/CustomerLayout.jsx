import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../../mock/mockData';
import { Search, ShoppingCart, Facebook, Heart, LogIn, LogOut, User, Menu, X, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useCart } from '../../context/CartContext';

const NAV = [
  { to: '/', label: 'Főoldal', end: true },
  { to: '/etlap', label: 'Étlap' },
  { to: '/rolunk', label: 'Rólunk' },
  { to: '/szallitas', label: 'Szállítás' },
  { to: '/kapcsolat', label: 'Kapcsolat' },
];

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const { restaurantStatus } = useData();
  const { count } = useCart();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOpen = restaurantStatus?.isOpen ?? true;
  const is24h = restaurantStatus?.alwaysOpen24 ?? true;

  return (
    <div className="zuparo-dark min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* 0-24 / Status Announcement Bar */}
      <div className={`text-xs py-1 px-4 text-center font-medium border-b flex items-center justify-center gap-2 ${
        isOpen
          ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300'
          : 'bg-rose-950/80 border-rose-800/60 text-rose-300'
      }`}>
        <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
        {isOpen ? (
          <span>
            {is24h ? '⚡ 0-24 ÓRÁS RENDELÉSFELVÉTEL: Éjjel-nappal szállítunk!' : '🟢 Nyitva vagyunk, szeretettel várjuk rendelésed!'}
          </span>
        ) : (
          <span>
            🔴 Éttermünk jelenleg zárva tart {restaurantStatus?.manualCloseReason ? `(${restaurantStatus.manualCloseReason})` : ''}
          </span>
        )}
      </div>

      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
            <img
              src={LOGO_URL}
              alt="ZUPARO FOOD & MORE"
              className="h-11 w-11 sm:h-13 sm:w-13 object-contain transition-transform group-hover:scale-105"
            />
            <div className="leading-none">
              <div className="text-xl sm:text-2xl font-black tracking-wider gold-text-gradient">ZUPARO</div>
              <div className="text-[8px] sm:text-[9px] tracking-[0.35em] text-neutral-400 font-semibold">FOOD &amp; MORE</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 justify-center gap-7">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `text-sm font-semibold tracking-wide transition-colors ${
                    isActive ? 'text-white border-b-2 border-[#d4af37] pb-1 font-bold' : 'text-neutral-300 hover:text-white'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' && (
                  <Link
                    to="/admin/uj-rendeles"
                    className="text-xs gold-gradient text-black font-extrabold px-3 py-1.5 rounded-full shadow-xs hover:brightness-110"
                  >
                    POS ADMIN
                  </Link>
                )}
                <div className="hidden sm:flex items-center gap-2 pr-2 pl-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900">
                  <div className="h-6 w-6 rounded-full bg-[#d4af37] text-black flex items-center justify-center font-bold text-xs">
                    {(user.name || 'V').charAt(0)}
                  </div>
                  <div className="text-xs text-neutral-200 max-w-[90px] truncate">{user.name}</div>
                </div>
                <button
                  onClick={() => { logout(); nav('/'); }}
                  title="Kilépés"
                  className="h-9 w-9 rounded-full border border-neutral-800 text-neutral-300 hover:text-rose-400 hover:border-rose-400 flex items-center justify-center"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/belepes"
                  className="text-xs sm:text-sm px-3.5 py-1.5 rounded-full border border-neutral-800 text-neutral-200 hover:border-[#d4af37] inline-flex items-center gap-1.5"
                >
                  <LogIn size={13} /> Belépés
                </Link>
                <Link
                  to="/regisztracio"
                  className="text-xs sm:text-sm gold-gradient text-black font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-xs"
                >
                  <User size={13} /> Regisztráció
                </Link>
              </div>
            )}

            {/* Shopping Cart Button */}
            <Link
              to="/etlap"
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-neutral-800 text-neutral-200 flex items-center justify-center hover:border-[#d4af37] transition-colors"
              title="Kosár / Étlap"
            >
              <ShoppingCart size={17} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {count}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 rounded-full border border-neutral-800 text-neutral-200 flex items-center justify-center hover:text-white"
              aria-label="Menü megnyitása"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-neutral-900/95 border-b border-neutral-800 px-4 py-4 space-y-2">
            <nav className="flex flex-col space-y-2">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive ? 'bg-[#d4af37] text-black font-bold' : 'text-neutral-200 hover:bg-neutral-800'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>

            {!user && (
              <div className="pt-3 border-t border-neutral-800 flex gap-2">
                <Link
                  to="/belepes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-lg border border-neutral-700 text-xs font-semibold"
                >
                  Belépés
                </Link>
                <Link
                  to="/regisztracio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-lg gold-gradient text-black font-bold text-xs"
                >
                  Regisztráció
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-neutral-900 bg-neutral-950 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between text-center md:text-left">
            <Link to="/" className="flex items-center gap-2">
              <img src={LOGO_URL} className="h-8 w-8 object-contain" alt="" />
              <span className="gold-text-gradient font-extrabold tracking-wider text-lg">ZUPARO</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-neutral-400">
              <Link to="/" className="hover:text-white transition-colors">Főoldal</Link>
              <Link to="/etlap" className="hover:text-white transition-colors">Étlap</Link>
              <Link to="/rolunk" className="hover:text-white transition-colors">Rólunk</Link>
              <Link to="/szallitas" className="hover:text-white transition-colors">Szállítás</Link>
              <Link to="/kapcsolat" className="hover:text-white transition-colors">Kapcsolat</Link>
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61585460005367"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-[#d4af37] border border-neutral-800 transition-colors text-xs font-semibold"
                title="ZUPARO Facebook oldal"
              >
                <Facebook size={16} className="text-blue-500" />
                <span>Facebook</span>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
            <div className="inline-flex items-center gap-1.5 text-neutral-400">
              <MapPin size={13} className="text-[#d4af37]" />
              <span>3734 Szuhogy, József Attila utca 76.</span>
              <span className="hidden sm:inline">• Nyitvatartás: 0–24 óra</span>
            </div>
            <div className="font-script text-base text-neutral-300 inline-flex items-center gap-2">
              Te megkívánod. Mi elkészítjük. Mi elvisszük. <Heart size={14} className="text-[#d4af37]" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
