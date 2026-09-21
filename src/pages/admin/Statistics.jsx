import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatFt } from '../../mock/mockData';
import { ShoppingBag, DollarSign, TrendingUp, Users } from 'lucide-react';

const Statistics = () => {
  const { orders, customers } = useData();
  const totals = useMemo(() => {
    const delivered = orders.filter((o) => o.status !== 'cancelled');
    const revenue = delivered.reduce((s, o) => s + (o.total || 0), 0);
    const avg = delivered.length ? Math.round(revenue / delivered.length) : 0;
    return { count: delivered.length, revenue, avg };
  }, [orders]);

  const byType = useMemo(() => {
    const t = { delivery: 0, pickup: 0, dinein: 0 };
    orders.forEach((o) => { t[o.type] = (t[o.type] || 0) + 1; });
    return t;
  }, [orders]);

  const topItems = useMemo(() => {
    const m = new Map();
    orders.forEach((o) => o.items.forEach((it) => m.set(it.name, (m.get(it.name) || 0) + it.qty)));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [orders]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={ShoppingBag} label="Rendelések" value={totals.count} />
        <Stat icon={DollarSign} label="Bevétel" value={formatFt(totals.revenue)} />
        <Stat icon={TrendingUp} label="Átlag kosár" value={formatFt(totals.avg)} />
        <Stat icon={Users} label="Vevők" value={customers.length} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Rendelés típusok</h3>
          <div className="space-y-3">
            <TypeBar label="Kiszállítás" value={byType.delivery} total={orders.length} color="bg-neutral-900" />
            <TypeBar label="Elvitel" value={byType.pickup} total={orders.length} color="bg-amber-500" />
            <TypeBar label="Helyben" value={byType.dinein} total={orders.length} color="bg-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-base font-bold text-neutral-900 mb-4">TOP termékek</h3>
          <ul className="space-y-2">
            {topItems.map(([n, c]) => (
              <li key={n} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{n}</span>
                <span className="font-semibold text-neutral-900">{c} db</span>
              </li>
            ))}
            {topItems.length === 0 && <div className="text-sm text-neutral-500">Még nincs adat.</div>}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-xl border border-neutral-200 p-5">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center"><Icon size={18} /></div>
      <div>
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="text-xl font-extrabold text-neutral-900">{value}</div>
      </div>
    </div>
  </div>
);
const TypeBar = ({ label, value, total, color }) => {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-neutral-700">{label}</span>
        <span className="font-semibold text-neutral-900">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default Statistics;
