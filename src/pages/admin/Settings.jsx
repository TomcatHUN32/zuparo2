import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatFt } from '../../mock/mockData';
import { MapPin, Bike, Ticket, ClipboardList, Plus, Trash2, Pencil, Check, X, ArrowRight, FileArchive, BadgeCheck, Search, Calendar, Printer, RefreshCw, CheckCircle2, Clock, Eye, History } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL : '') + '/api';

const TABS = [
  { id: 'status', label: 'Nyitvatartás & 0-24', icon: Clock },
  { id: 'zones', label: 'Szállítási területek', icon: MapPin },
  { id: 'couriers', label: 'Futárok kezelése', icon: Bike },
  { id: 'coupons', label: 'Kuponkódok', icon: Ticket },
  { id: 'dayclose', label: 'Napi zárás', icon: ClipboardList },
  { id: 'courierclose', label: 'Futár zárás', icon: BadgeCheck },
];

const Settings = () => {
  const [tab, setTab] = useState('status');
  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors ${
              tab === t.id ? 'bg-neutral-900 text-white shadow-xs' : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'status' && <StatusTab />}
      {tab === 'zones' && <ZonesTab />}
      {tab === 'couriers' && <CouriersTab />}
      {tab === 'coupons' && <CouponsTab />}
      {tab === 'dayclose' && <DayCloseTab />}
      {tab === 'courierclose' && <CourierCloseTab />}
    </div>
  );
};

// ---------------- Zones ----------------
const ZonesTab = () => {
  const { zones, addZone, updateZone, deleteZone } = useData();
  const [draft, setDraft] = useState({ zip: '', city: '', fee: 500 });
  const [editing, setEditing] = useState(null);
  const [ed, setEd] = useState({});
  const submit = async () => {
    if (!draft.zip || !draft.city) return toast.error('Irányítószám és település kötelező');
    await addZone({ ...draft, fee: Number(draft.fee) });
    setDraft({ zip: '', city: '', fee: 500 }); toast.success('Zóna hozzáadva');
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-base font-bold text-neutral-900 mb-3 inline-flex items-center gap-2"><MapPin size={18} /> Új szállítási zóna</h3>
        <div className="grid grid-cols-12 gap-3">
          <input placeholder="Irányítószám" value={draft.zip} onChange={(e) => setDraft({ ...draft, zip: e.target.value })} className="col-span-3 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
          <input placeholder="Település" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="col-span-5 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
          <input type="number" placeholder="Szállítási díj (Ft)" value={draft.fee} onChange={(e) => setDraft({ ...draft, fee: e.target.value })} className="col-span-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
          <button onClick={submit} className="col-span-2 px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm inline-flex items-center justify-center gap-1 hover:bg-neutral-800"><Plus size={14} /> Hozzáadás</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
            <tr><th className="py-2 px-4 text-left">Irányítószám</th><th className="py-2 px-4 text-left">Település</th><th className="py-2 px-4 text-right">Szállítási díj</th><th></th></tr>
          </thead>
          <tbody>
            {zones.map((z) => editing === z.id ? (
              <tr key={z.id} className="bg-neutral-50 border-b border-neutral-100">
                <td className="py-2 px-4"><input value={ed.zip} onChange={(e) => setEd({ ...ed, zip: e.target.value })} className="w-24 px-2 py-1 border rounded" /></td>
                <td className="py-2 px-4"><input value={ed.city} onChange={(e) => setEd({ ...ed, city: e.target.value })} className="w-full px-2 py-1 border rounded" /></td>
                <td className="py-2 px-4 text-right"><input type="number" value={ed.fee} onChange={(e) => setEd({ ...ed, fee: e.target.value })} className="w-24 px-2 py-1 border rounded text-right" /></td>
                <td className="py-2 px-4 text-right whitespace-nowrap">
                  <button onClick={async () => { await updateZone(z.id, { ...ed, fee: Number(ed.fee) }); setEditing(null); toast.success('Mentve'); }} className="h-8 w-8 rounded-md bg-emerald-600 text-white inline-flex items-center justify-center mr-1"><Check size={14} /></button>
                  <button onClick={() => setEditing(null)} className="h-8 w-8 rounded-md border border-neutral-200 text-neutral-500 inline-flex items-center justify-center"><X size={14} /></button>
                </td>
              </tr>
            ) : (
              <tr key={z.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-2 px-4 font-semibold text-neutral-900">{z.zip}</td>
                <td className="py-2 px-4 text-neutral-700">{z.city}</td>
                <td className="py-2 px-4 text-right font-semibold">{formatFt(z.fee)}</td>
                <td className="py-2 px-4 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing(z.id); setEd(z); }} className="h-8 w-8 rounded-md border border-neutral-200 text-neutral-500 inline-flex items-center justify-center mr-1 hover:bg-neutral-50"><Pencil size={14} /></button>
                  <button onClick={async () => { await deleteZone(z.id); toast.success('Törölve'); }} className="h-8 w-8 rounded-md border border-neutral-200 text-rose-500 inline-flex items-center justify-center hover:bg-rose-50"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {zones.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-neutral-500">Még nincs zóna.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------- Couriers ----------------
const CouriersTab = () => {
  const { couriers, addCourier, updateCourier, deleteCourier } = useData();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');

  const submit = async () => {
    if (!newName.trim()) return toast.error('Add meg a nevet');
    await addCourier({ name: newName.trim(), phone: '' });
    setNewName(''); toast.success('Futár hozzáadva');
  };
  const saveEdit = async (id) => { await updateCourier(id, { name: editName.trim() || 'Névtelen' }); setEditing(null); toast.success('Mentve'); };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-base font-bold text-neutral-900 mb-3 inline-flex items-center gap-2"><Bike size={18} /> Futárok</h3>
        <div className="flex gap-2 mb-4">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Új futár neve..." className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" onKeyDown={(e) => e.key === 'Enter' && submit()} />
          <button onClick={submit} className="px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm inline-flex items-center gap-1 hover:bg-neutral-800"><Plus size={14} /> Hozzáadás</button>
        </div>
        <div className="space-y-2">
          {couriers.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200">
              <div className="h-10 w-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold">{c.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                {editing === c.id ? (
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)} className="w-full px-2 py-1 rounded border border-neutral-300 text-sm" />
                ) : (<div className="text-sm font-semibold text-neutral-900">{c.name}</div>)}
                <div className="text-xs text-neutral-500 inline-flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${c.active ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                  {c.active ? 'Aktív' : 'Inaktív'}
                </div>
              </div>
              <button onClick={() => updateCourier(c.id, { active: !c.active })} className="text-xs px-2 py-1 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50">{c.active ? 'Kikapcs' : 'Bekapcs'}</button>
              {editing === c.id ? (
                <>
                  <button onClick={() => saveEdit(c.id)} className="h-8 w-8 rounded-md bg-emerald-600 text-white flex items-center justify-center"><Check size={14} /></button>
                  <button onClick={() => setEditing(null)} className="h-8 w-8 rounded-md border border-neutral-200 text-neutral-500 flex items-center justify-center"><X size={14} /></button>
                </>
              ) : (
                <button onClick={() => { setEditing(c.id); setEditName(c.name); }} className="h-8 w-8 rounded-md border border-neutral-200 text-neutral-500 flex items-center justify-center hover:bg-neutral-50"><Pencil size={14} /></button>
              )}
              <button onClick={async () => { await deleteCourier(c.id); toast.success('Futár törölve'); }} className="h-8 w-8 rounded-md border border-neutral-200 text-rose-500 flex items-center justify-center hover:bg-rose-50"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------- Coupons ----------------
const CouponsTab = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useData();
  const [draft, setDraft] = useState({ code: '', kind: 'percent', value: 10, active: true });
  const submit = async () => {
    if (!draft.code) return toast.error('Kód szükséges');
    await addCoupon({ ...draft, code: draft.code.toUpperCase(), value: Number(draft.value) });
    setDraft({ code: '', kind: 'percent', value: 10, active: true }); toast.success('Kupon hozzáadva');
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-base font-bold text-neutral-900 mb-3 inline-flex items-center gap-2"><Ticket size={18} /> Új kupon</h3>
        <div className="grid grid-cols-12 gap-3">
          <input placeholder="Kód (pl. ZUPARO10)" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} className="col-span-4 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} className="col-span-3 px-3 py-2 border border-neutral-200 rounded-lg text-sm">
            <option value="percent">Százalékos (%)</option>
            <option value="amount">Fix összeg (Ft)</option>
          </select>
          <input type="number" placeholder="Érték" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} className="col-span-3 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
          <button onClick={submit} className="col-span-2 px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm inline-flex items-center justify-center gap-1 hover:bg-neutral-800"><Plus size={14} /> Létrehozás</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
            <tr><th className="py-2 px-4 text-left">Kód</th><th className="py-2 px-4 text-left">Típus</th><th className="py-2 px-4 text-right">Érték</th><th className="py-2 px-4">Állapot</th><th></th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-2 px-4 font-semibold text-neutral-900">{c.code}</td>
                <td className="py-2 px-4 text-neutral-700">{c.kind === 'percent' ? 'Százalékos' : 'Fix összeg'}</td>
                <td className="py-2 px-4 text-right font-semibold">{c.kind === 'percent' ? `${c.value}%` : formatFt(c.value)}</td>
                <td className="py-2 px-4">
                  <button onClick={() => updateCoupon(c.id, { active: !c.active })} className={`text-xs px-2 py-1 rounded-full border ${c.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{c.active ? 'Aktív' : 'Inaktív'}</button>
                </td>
                <td className="py-2 px-4 text-right">
                  <button onClick={async () => { await deleteCoupon(c.id); toast.success('Törölve'); }} className="h-8 w-8 rounded-md border border-neutral-200 text-rose-500 inline-flex items-center justify-center hover:bg-rose-50"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-neutral-500">Még nincs kupon.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------- Day close ----------------
const DayCloseTab = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [rep, setRep] = useState(null);
  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDateReport = async (dateStr) => {
    setLoading(true);
    try {
      const url = dateStr ? `${API}/reports/day?date=${encodeURIComponent(dateStr)}` : `${API}/reports/today`;
      const { data } = await axios.get(url);
      setRep(data);
      const h = await axios.get(`${API}/reports/history`).then((r) => r.data);
      setHistory(h);
    } catch (e) {
      toast.error('Nem sikerült a napi zárási adatok betöltése');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDateReport(selectedDate);
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    loadDateReport(date);
  };

  const close = async () => {
    try {
      await axios.post(`${API}/reports/close-day`, { date: selectedDate });
      toast.success(`A(z) ${selectedDate} napi zárás sikeresen archiválva!`);
      loadDateReport(selectedDate);
    } catch (e) {
      toast.error('Hiba történt a zárás archiválásakor');
    }
  };

  const printDayClose = () => {
    window.print();
  };

  const isToday = selectedDate === todayStr;
  const isArchived = history.some((h) => h.date === selectedDate);
  const archivedInfo = history.find((h) => h.date === selectedDate);

  const filteredHistory = history.filter((h) =>
    h.date.includes(historySearch) ||
    String(h.revenue).includes(historySearch) ||
    String(h.orders).includes(historySearch)
  );

  return (
    <div className="space-y-6">
      {/* Date Search & Quick Filter Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Calendar size={18} className="text-neutral-700" />
              Napi zárás keresése dátum szerint
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Válaszd ki a naptárból vagy a gyorsgombokkal a keresett napot, hogy megtekintsd a forgalmat és a zárást.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick date buttons */}
            {[
              { label: 'Ma', days: 0 },
              { label: 'Tegnap', days: 1 },
              { label: '2 napja', days: 2 },
              { label: '3 napja', days: 3 },
            ].map(({ label, days }) => {
              const d = new Date();
              d.setDate(d.getDate() - days);
              const dateVal = d.toISOString().split('T')[0];
              const active = selectedDate === dateVal;
              return (
                <button
                  key={label}
                  onClick={() => handleDateChange(dateVal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date input and actions */}
        <div className="flex flex-wrap items-center gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-700">Dátum kiválasztása:</span>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
          <button
            onClick={() => loadDateReport(selectedDate)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Lekérés
          </button>

          {rep && (
            <button
              onClick={printDayClose}
              className="ml-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer size={15} />
              Napi zárás nyomtatása (80mm)
            </button>
          )}
        </div>

        {/* Status notice */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Kiválasztott nap:</span>
            <span className="font-bold text-neutral-900 text-sm">
              {selectedDate} ({new Date(selectedDate).toLocaleDateString('hu-HU', { weekday: 'long' })})
            </span>
          </div>
          <div>
            {isArchived ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-200 font-semibold">
                <CheckCircle2 size={13} />
                Archivált zárás {archivedInfo?.closedAt ? `(${new Date(archivedInfo.closedAt).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })})` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-amber-800 bg-amber-50 border border-amber-200 font-semibold">
                <Clock size={13} />
                {isToday ? 'Mai aktív forgalom (még nem zárt)' : 'Nem archivált nap'}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10 bg-white rounded-xl border border-neutral-200 text-neutral-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-neutral-400" />
          Napi zárási adatok betöltése ({selectedDate})...
        </div>
      )}

      {!loading && rep && (
        <>
          {/* Main KPI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label={`Rendelések (${selectedDate})`} value={`${rep.orders} db`} />
            <Stat label="Napi forgalom" value={formatFt(rep.revenue)} />
            <Stat label="Készpénzes forgalom" value={formatFt(rep.byPayment?.cash || 0)} />
            <Stat label="Kártya + Online forgalom" value={formatFt((rep.byPayment?.card || 0) + (rep.byPayment?.online || 0))} />
          </div>

          {/* Detailed breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Channel */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
              <h3 className="font-bold text-neutral-900 mb-3 flex items-center justify-between">
                <span>Bevétel csatorna szerint</span>
                <span className="text-xs font-normal text-neutral-500">{selectedDate}</span>
              </h3>
              <ul className="space-y-2 text-sm divide-y divide-neutral-100">
                {Object.entries(rep.byChannel || {}).map(([k, v]) => (
                  <li key={k} className="flex justify-between pt-2 first:pt-0">
                    <span className="capitalize text-neutral-700">
                      {k === 'house' ? 'Házi / Telefonos' : k === 'online' ? 'Online webáruház' : k === 'foodora' ? 'Foodora' : k === 'falatozz' ? 'Falatozz.hu' : k}
                    </span>
                    <span className="font-bold text-neutral-900">{formatFt(v)}</span>
                  </li>
                ))}
                {Object.keys(rep.byChannel || {}).length === 0 && <li className="text-neutral-500 py-3 text-center">Nincs forgalmi adat erre a napra.</li>}
              </ul>
            </div>

            {/* By Couriers */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
              <h3 className="font-bold text-neutral-900 mb-3 flex items-center justify-between">
                <span>Futárok bontása és elszámolása</span>
                <span className="text-xs font-normal text-neutral-500">{selectedDate}</span>
              </h3>
              <ul className="space-y-2 text-sm divide-y divide-neutral-100">
                {(rep.byCourier || []).map((c, i) => (
                  <li key={i} className="flex justify-between items-center pt-2 first:pt-0">
                    <div>
                      <div className="font-semibold text-neutral-900">{c.name}</div>
                      <div className="text-xs text-neutral-500">{c.orders} db teljesített kiszállítás</div>
                    </div>
                    <span className="font-bold text-neutral-900 text-base">{formatFt(c.revenue)}</span>
                  </li>
                ))}
                {(rep.byCourier || []).length === 0 && <li className="text-neutral-500 py-3 text-center">Nincs futáradat erre a napra.</li>}
              </ul>
            </div>
          </div>

          {/* Additional breakdown: Discounts & Delivery fees */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-center justify-between gap-4 text-sm shadow-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-neutral-500 text-xs block">Összes szállítási díj:</span>
                <span className="font-bold text-neutral-900">{formatFt(rep.deliveryFeesTotal || 0)}</span>
              </div>
              <div>
                <span className="text-neutral-500 text-xs block">Kiadott kedvezmények:</span>
                <span className="font-bold text-rose-600">{formatFt(rep.discountsTotal || 0)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={printDayClose}
                className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Printer size={15} /> Nyomtatás
              </button>
              <button
                onClick={close}
                className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow-xs transition-colors"
              >
                <FileArchive size={16} />
                {isArchived ? 'Zárás újraarchiválása' : 'Napi zárás véglegesítése & archiválása'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* History table with search */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <History size={18} className="text-neutral-700" />
              Archivált zárási előzmények
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Korábbi lezárt napok listája. Kattints a "Megtekintés" gombra a részletek betöltéséhez.
            </p>
          </div>
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Keresés dátumra (pl. 2026-09)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-neutral-500 bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3 text-left font-semibold">Dátum</th>
                <th className="py-2.5 px-3 text-right font-semibold">Rendelések</th>
                <th className="py-2.5 px-3 text-right font-semibold">Napi forgalom</th>
                <th className="py-2.5 px-3 text-right font-semibold">Archiválva ekkor</th>
                <th className="py-2.5 px-3 text-right font-semibold">Művelet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredHistory.map((h) => {
                const isCurrent = h.date === selectedDate;
                return (
                  <tr key={h.id} className={`hover:bg-neutral-50 transition-colors ${isCurrent ? 'bg-amber-50/60' : ''}`}>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-neutral-900 flex items-center gap-2">
                        {h.date}
                        {isCurrent && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">Kiválasztva</span>}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(h.date).toLocaleDateString('hu-HU', { weekday: 'long' })}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">{h.orders} db</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-neutral-900">{formatFt(h.revenue)}</td>
                    <td className="py-2.5 px-3 text-right text-xs text-neutral-500">
                      {new Date(h.closedAt).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          handleDateChange(h.date);
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800 border border-neutral-200 transition-colors"
                      >
                        <Eye size={12} /> Megtekintés
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 text-sm">
                    {historySearch ? 'Nincs találat a keresési feltételre.' : 'Még nincs archivált napi zárás.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden 80mm Printable Day Close Slip */}
      {rep && (
        <div id="day-close-print-area" className="hidden font-mono text-xs text-black">
          <div className="text-center pb-2 border-b border-black">
            <div className="text-base font-extrabold tracking-widest">ZUPARO FOOD &amp; MORE</div>
            <div className="text-[11px]">3734 Szuhogy, Dózsa György út 1.</div>
            <div className="text-[11px]">Tel: +36 (30) 123-4567</div>
            <div className="mt-2 text-sm font-extrabold uppercase tracking-wider">*** NAPI ZÁRÁSI JELENTÉS ***</div>
            <div className="text-[12px] font-bold mt-1">Zárt nap: {rep.date}</div>
            <div className="text-[10px]">Nyomtatva: {new Date().toLocaleString('hu-HU')}</div>
          </div>

          <div className="py-2 border-b border-black space-y-1">
            <div className="flex justify-between font-extrabold text-sm">
              <span>ÖSSZES FORGALOM:</span>
              <span>{formatFt(rep.revenue)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Rendelések száma:</span>
              <span className="font-bold">{rep.orders} db</span>
            </div>
          </div>

          <div className="py-2 border-b border-black space-y-1">
            <div className="font-bold text-[11px] uppercase underline">Fizetési módok:</div>
            <div className="flex justify-between">
              <span>Készpénz:</span>
              <span className="font-bold">{formatFt(rep.byPayment?.cash || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bankkártya (futárnál):</span>
              <span className="font-bold">{formatFt(rep.byPayment?.card || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Online fizetve (webshop):</span>
              <span className="font-bold">{formatFt(rep.byPayment?.online || 0)}</span>
            </div>
          </div>

          <div className="py-2 border-b border-black space-y-1">
            <div className="font-bold text-[11px] uppercase underline">Csatornák / Források:</div>
            {Object.entries(rep.byChannel || {}).map(([ch, sum]) => (
              <div key={ch} className="flex justify-between">
                <span className="capitalize">{ch === 'house' ? 'Házi / Telefonos' : ch === 'online' ? 'Online webshop' : ch}:</span>
                <span>{formatFt(sum)}</span>
              </div>
            ))}
          </div>

          <div className="py-2 border-b border-black space-y-1">
            <div className="font-bold text-[11px] uppercase underline">Futárok elszámolása:</div>
            {(rep.byCourier || []).map((c, i) => (
              <div key={i} className="flex justify-between">
                <span>{c.name} ({c.orders} db):</span>
                <span className="font-bold">{formatFt(c.revenue)}</span>
              </div>
            ))}
            {(rep.byCourier || []).length === 0 && <div className="text-[10px] italic">Nincs futáradat.</div>}
          </div>

          <div className="pt-3 text-center text-[10px] space-y-1">
            <div>--- NAPI ZÁRÁS VÉGE ---</div>
            <div className="pt-4">Pénztáros / Üzletvezető aláírása:</div>
            <div className="pt-4">...................................................</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------- Courier close ----------------
const CourierCloseTab = () => {
  const { couriers } = useData();
  const [reports, setReports] = useState({});
  useEffect(() => {
    (async () => {
      const map = {};
      for (const c of couriers) {
        try { map[c.id] = await axios.get(`${API}/reports/courier/${c.id}`).then((r) => r.data); }
        catch { map[c.id] = null; }
      }
      setReports(map);
    })();
  }, [couriers]);
  return (
    <div className="grid grid-cols-2 gap-6">
      {couriers.map((c) => {
        const r = reports[c.id];
        return (
          <div key={c.id} className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-bold text-neutral-900">{c.name}</div>
                <div className="text-xs text-neutral-500">Mai zárás</div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full border ${c.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{c.active ? 'Aktív' : 'Inaktív'}</div>
            </div>
            {!r && <div className="text-neutral-500 text-sm">Betöltés...</div>}
            {r && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Kiszállítva" value={`${r.orders} db`} sm />
                <Stat label="Bevétel" value={formatFt(r.revenue)} sm />
                <Stat label="Készpénz" value={formatFt(r.cash)} sm />
                <Stat label="Kártya + online" value={formatFt(r.card + r.online)} sm />
              </div>
            )}
          </div>
        );
      })}
      {couriers.length === 0 && <div className="col-span-2 text-neutral-500 text-center py-16">Nincs futár.</div>}
    </div>
  );
};

// ---------------- Restaurant Status & 0-24 Tab ----------------
const StatusTab = () => {
  const { restaurantStatus, updateRestaurantStatus } = useData();
  const [isOpen, setIsOpen] = useState(restaurantStatus?.isOpen ?? true);
  const [alwaysOpen24, setAlwaysOpen24] = useState(restaurantStatus?.alwaysOpen24 ?? true);
  const [reason, setReason] = useState(restaurantStatus?.manualCloseReason || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantStatus) {
      setIsOpen(restaurantStatus.isOpen ?? true);
      setAlwaysOpen24(restaurantStatus.alwaysOpen24 ?? true);
      setReason(restaurantStatus.manualCloseReason || '');
    }
  }, [restaurantStatus]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateRestaurantStatus({
        isOpen,
        alwaysOpen24,
        manualCloseReason: isOpen ? '' : reason,
      });
      toast.success('Nyitvatartási beállítások sikeresen elmentve!');
    } catch (e) {
      toast.error('Hiba történt a mentéskor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Live Status Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isOpen
          ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-300'
          : 'bg-gradient-to-br from-rose-50 to-white border-rose-300'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isOpen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              <Clock size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-full ${isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                <h3 className="text-xl font-bold text-neutral-900">
                  {isOpen ? 'Étterem állapota: NYITVA' : 'Étterem állapota: ZÁRVA'}
                </h3>
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {isOpen
                  ? (alwaysOpen24 ? '0-24 Non-stop rendelésfelvétel aktív. A vendégek a nap 24 órájában adhatnak le rendelést.' : 'Rendelésfelvétel aktív a nyitvatartási idő alatt.')
                  : `Rendelésfelvétel szünetel: ${reason || 'Manuálisan zárva az üzletvezető által'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all ${
                isOpen ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isOpen ? 'Étterem bezárása most' : 'Étterem kinyitása'}
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
        <h4 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3">
          Rendelési és nyitvatartási opciók
        </h4>

        {/* 0-24 Toggle Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/70">
          <div>
            <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              ⚡ 0-24 Órás Non-Stop rendelési lehetőség
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Ha be van kapcsolva, a rendszer a nap 24 órájában engedélyezi a webes és online rendelések leadását, és kiemelt 0-24 jelvényt jelenít meg a vásárlóknak.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={alwaysOpen24}
              onChange={(e) => setAlwaysOpen24(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#d4af37]"></div>
          </label>
        </div>

        {/* Manual Open/Close Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/70">
          <div>
            <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              🔒 Manuális nyitás / zárás vezérlés
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Bármikor azonnal leállíthatod a rendelések fogadását (pl. túlterhelt konyha, vihar, technikai szünet vagy ünnepi rendezvény miatt).
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Reason when closed */}
        {!isOpen && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
            <label className="block text-xs font-bold text-neutral-800">
              Zárvatartás oka / vásárlói értesítés:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Pl. Konyhai technikai szünet miatt a rendelésfelvétel ma 18:00-ig szünetel."
              className="w-full px-3 py-2 text-sm border border-rose-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[11px] text-neutral-500">
              Ez az üzenet kiemelten jelenik meg a vásárlói felületen és az étlapon.
            </p>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold shadow-md transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={16} /> Mentés és alkalmazás
          </button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, sm }) => (
  <div className={`rounded-xl border border-neutral-200 bg-white ${sm ? 'p-3' : 'p-5'}`}>
    <div className="text-xs text-neutral-500">{label}</div>
    <div className={`font-extrabold text-neutral-900 ${sm ? 'text-lg' : 'text-2xl'}`}>{value}</div>
  </div>
);

export default Settings;
