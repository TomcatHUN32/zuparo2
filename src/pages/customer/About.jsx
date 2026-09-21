import React from 'react';
import { Heart, Award, Utensils } from 'lucide-react';
import { LOGO_URL } from '../../mock/mockData';

const About = () => (
  <div className="max-w-5xl mx-auto px-6 py-16">
    <div className="text-center">
      <img src={LOGO_URL} alt="" className="h-24 mx-auto" />
      <div className="font-script text-2xl text-[#d4af37] mt-3">Mindig jó falat</div>
      <h1 className="font-display text-4xl md:text-5xl font-black text-white mt-2">RÓLUNK</h1>
      <p className="mt-5 text-neutral-300 max-w-2xl mx-auto leading-relaxed">A ZUPARO Food &amp; More egy családi származású étterem, ahol a friss alapanyagok, a hagyományos receptek és a modern konyha találkoznak. Éjjel-nappal elérhetők vagyunk, hogy bármikor kiszolgálhassunk téged.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
      <Feature icon={Utensils} title="Friss alapanyagok" text="Napi beszállítások helyi termelőktől." />
      <Feature icon={Award} title="Minőségi ételek" text="Széles választék, egyensúlyos ízek." />
      <Feature icon={Heart} title="Vendégközpontú" text="Családias hangulat és gyors kiszolgálás." />
    </div>
  </div>
);
const Feature = ({ icon: Icon, title, text }) => (
  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center hover:border-[#d4af37] card-hover">
    <div className="h-12 w-12 mx-auto rounded-full border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]"><Icon size={22} /></div>
    <div className="mt-3 font-extrabold text-white">{title}</div>
    <div className="text-sm text-neutral-400 mt-1">{text}</div>
  </div>
);
export default About;
