import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatFt } from '../../mock/mockData';
import { MapPin, Search, CheckCircle2, XCircle } from 'lucide-react';

const Delivery = () => {
  const { zones } = useData();
  const [zip, setZip] = useState('');
  const found = zones.find((z) => z.zip === zip.trim());
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center">
        <div className="font-script text-2xl text-[#d4af37]">Szállítás</div>
        <h1 className="font-display text-4xl md:text-5xl font-black text-white">SZÁLLÍTÁSI TERÜLETEK</h1>
        <p className="mt-4 text-neutral-400">Ellenőrizd, hogy szállítunk-e a te területedre és mennyi a díj.</p>
      </div>
      <div className="mt-8 max-w-xl mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <label className="text-sm text-neutral-300">Irányítószám</label>
        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Pl. 3734" className="w-full pl-9 pr-3 py-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
          </div>
          <button className="gold-gradient text-black font-bold px-5 rounded-lg inline-flex items-center gap-2"><Search size={16} /> Ellenőrzés</button>
        </div>
        {zip && (
          <div className="mt-4 p-4 rounded-lg border border-neutral-800">
            {found ? (
              <div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" /> <div><div className="text-white font-semibold">Szállítunk ide: {found.city}</div><div className="text-sm text-neutral-400">Szállítási díj: <span className="gold-text-gradient font-bold">{formatFt(found.fee)}</span></div></div></div>
            ) : (
              <div className="flex items-center gap-3"><XCircle className="text-rose-400" /> <div className="text-neutral-200">Sajnos ide még nem szállítunk.</div></div>
            )}
          </div>
        )}
      </div>
      <div className="mt-10">
        <h3 className="text-white font-bold mb-3">Szállítási zonák és díjak</h3>
        <div className="rounded-2xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr><th className="py-2 px-4 text-left">Irányítószám</th><th className="py-2 px-4 text-left">Település</th><th className="py-2 px-4 text-right">Szállítási díj</th></tr>
            </thead>
            <tbody className="bg-neutral-950">
              {zones.map((z) => (
                <tr key={z.id} className="border-t border-neutral-800">
                  <td className="py-3 px-4 text-white">{z.zip}</td>
                  <td className="py-3 px-4 text-neutral-300">{z.city}</td>
                  <td className="py-3 px-4 text-right gold-text-gradient font-bold">{formatFt(z.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Delivery;
