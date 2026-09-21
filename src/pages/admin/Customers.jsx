import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { User, Phone, MapPin, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const Customers = () => {
  const { customers, deleteCustomer, orders } = useData();
  const [q, setQ] = useState('');
  const filtered = customers.filter((c) => (c.name + ' ' + c.phone + ' ' + c.city).toLowerCase().includes(q.toLowerCase()));
  const count = (phone) => orders.filter((o) => o.phone === phone).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-neutral-900 inline-flex items-center gap-2"><User size={18} /> Vevők</h3>
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keresés név, telefon, település..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b border-neutral-200">
                <th className="py-2 pr-4">Név</th>
                <th className="py-2 pr-4">Telefonszám</th>
                <th className="py-2 pr-4">Cím</th>
                <th className="py-2 pr-4">Rendelések</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 pr-4 font-semibold text-neutral-900">{c.name}</td>
                  <td className="py-3 pr-4 text-neutral-600"><span className="inline-flex items-center gap-1"><Phone size={12} /> {c.phone}</span></td>
                  <td className="py-3 pr-4 text-neutral-600"><span className="inline-flex items-center gap-1"><MapPin size={12} /> {c.zip} {c.city}, {c.street}</span></td>
                  <td className="py-3 pr-4 text-neutral-600">{count(c.phone) || c.orderCount || 0}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => { deleteCustomer(c.id); toast.success('Vevő törölve'); }} className="h-8 w-8 rounded-md border border-neutral-200 text-rose-500 inline-flex items-center justify-center hover:bg-rose-50"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-neutral-500">Nincs vevő.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
