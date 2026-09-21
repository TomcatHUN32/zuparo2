import React from 'react';
import { Phone, MapPin, Navigation, Facebook, Clock, ArrowRight } from 'lucide-react';

const Contact = () => {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('3734 Szuhogy, József Attila utca 76.')}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center space-y-2">
        <div className="font-script text-2xl sm:text-3xl text-[#d4af37]">Elérhetőségek</div>
        <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-wide">KAPCSOLAT</h1>
        <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto">
          Fordulj hozzánk bizalommal telefonon vagy látogass el hozzánk személyesen!
        </p>
      </div>

      <div className="mt-10 max-w-xl mx-auto space-y-4">
        {/* Main Phone Card */}
        <a
          href="tel:06307282289"
          className="group block rounded-2xl border border-neutral-800 bg-neutral-900/90 hover:border-[#d4af37] p-6 sm:p-7 transition-all shadow-lg hover:shadow-[#d4af37]/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl border border-[#d4af37]/40 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:scale-105 transition-transform">
                <Phone size={26} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">Telefonszám (Közvetlen hívás)</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-0.5 group-hover:text-[#d4af37] transition-colors">
                  06 30 728 2289
                </div>
              </div>
            </div>
            <ArrowRight size={20} className="text-neutral-500 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all" />
          </div>
        </a>

        {/* Address Card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-7 space-y-4 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl border border-[#d4af37]/40 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] shrink-0">
              <MapPin size={26} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">Címünk</div>
              <div className="text-lg sm:text-xl font-bold text-white mt-0.5 leading-snug">
                3734 Szuhogy, József Attila utca 76.
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                ZUPARO Pizza & Burger Bar
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 transition-colors"
            >
              <Navigation size={14} className="text-[#d4af37]" /> Megnyitás Google Térképen
            </a>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Clock size={14} /> Rendelés & Nyitvatartás: 0–24 óra
            </div>
          </div>
        </div>

        {/* Facebook link card */}
        <a
          href="https://www.facebook.com/profile.php?id=61585460005367"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:border-blue-500/50 p-5 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Facebook size={20} />
            </div>
            <div>
              <div className="text-xs text-neutral-400">Kövess minket a közösségi médián</div>
              <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                Hivatalos Facebook oldalunk
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-neutral-400 group-hover:text-white transition-colors">
            Megtekintés →
          </span>
        </a>
      </div>
    </div>
  );
};

export default Contact;
