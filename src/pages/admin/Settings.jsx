import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { formatFt } from '../../mock/mockData';
import {
  MapPin,
  Bike,
  Ticket,
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ArrowRight,
  FileArchive,
  BadgeCheck,
  Search,
  Calendar,
  Printer,
  RefreshCw,
  CheckCircle2,
  Clock,
  Eye,
  History,
  Package,
  Recycle,
  Database,
  Server,
  AlertTriangle,
  UploadCloud,
  DownloadCloud,
  Terminal,
  Copy,
  ExternalLink,
  Upload,
  FolderSync,
  FileJson,
  FileSpreadsheet,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL : '') + '/api';

const TABS = [
  { id: 'status', label: 'Nyitvatartás & Díjak', icon: Clock },
  { id: 'zones', label: 'Szállítási területek', icon: MapPin },
  { id: 'couriers', label: 'Futárok kezelése', icon: Bike },
  { id: 'coupons', label: 'Kuponkódok', icon: Ticket },
  { id: 'dayclose', label: 'Napi zárás', icon: ClipboardList },
  { id: 'courierclose', label: 'Futár zárás', icon: BadgeCheck },
  { id: 'database', label: 'Adatbázis & MongoDB', icon: Database },
];

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'status';
  const [tab, setTab] = useState(initialTab);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab && qTab !== tab) {
      setTab(qTab);
    }
  }, [searchParams]);

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
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
      {tab === 'database' && <DatabaseTab />}
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
  const { currentBudapestDate, orders } = useData();
  const todayStr = currentBudapestDate || new Date().toISOString().split('T')[0];
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
  }, [orders]);

  // When midnight arrives and currentBudapestDate updates, automatically jump to the new day
  useEffect(() => {
    if (currentBudapestDate && currentBudapestDate !== selectedDate) {
      setSelectedDate(currentBudapestDate);
      loadDateReport(currentBudapestDate);
    }
  }, [currentBudapestDate]);

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
            <Stat label={`Teljesített (${selectedDate})`} value={`${rep.orders} db`} />
            <Stat label="Nettó napi forgalom" value={formatFt(rep.revenue)} />
            <Stat label="Készpénzes forgalom" value={formatFt(rep.byPayment?.cash || 0)} />
            <Stat label="Kártya + Online forgalom" value={formatFt((rep.byPayment?.card || 0) + (rep.byPayment?.online || 0))} />
          </div>

          {(rep.cancelledOrdersCount || 0) > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-rose-800">
              <span className="font-semibold">
                ⚠️ Ezen a napon <strong>{rep.cancelledOrdersCount} db</strong> rendelés lett sztornózva (összesen <strong>{formatFt(rep.cancelledRevenue || 0)}</strong> értékben).
              </span>
              <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-rose-200 font-bold text-rose-700">
                Levonva a nettó forgalomból
              </span>
            </div>
          )}

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

// ---------------- Restaurant Status & Fees Tab ----------------
const StatusTab = () => {
  const { restaurantStatus, updateRestaurantStatus } = useData();
  const [isOpen, setIsOpen] = useState(restaurantStatus?.isOpen ?? true);
  const [alwaysOpen24, setAlwaysOpen24] = useState(restaurantStatus?.alwaysOpen24 ?? true);
  const [reason, setReason] = useState(restaurantStatus?.manualCloseReason || '');
  const [packagingFeeEnabled, setPackagingFeeEnabled] = useState(restaurantStatus?.packagingFeeEnabled ?? true);
  const [packagingFee, setPackagingFee] = useState(restaurantStatus?.packagingFee ?? 200);
  const [drsFeeEnabled, setDrsFeeEnabled] = useState(restaurantStatus?.drsFeeEnabled ?? true);
  const [drsFee, setDrsFee] = useState(restaurantStatus?.drsFee ?? 50);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantStatus) {
      setIsOpen(restaurantStatus.isOpen ?? true);
      setAlwaysOpen24(restaurantStatus.alwaysOpen24 ?? true);
      setReason(restaurantStatus.manualCloseReason || '');
      setPackagingFeeEnabled(restaurantStatus.packagingFeeEnabled ?? true);
      setPackagingFee(restaurantStatus.packagingFee ?? 200);
      setDrsFeeEnabled(restaurantStatus.drsFeeEnabled ?? true);
      setDrsFee(restaurantStatus.drsFee ?? 50);
    }
  }, [restaurantStatus]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateRestaurantStatus({
        isOpen,
        alwaysOpen24,
        manualCloseReason: isOpen ? '' : reason,
        packagingFeeEnabled,
        packagingFee: Number(packagingFee) || 0,
        drsFeeEnabled,
        drsFee: Number(drsFee) || 50,
      });
      toast.success('Beállítások és díjak sikeresen elmentve!');
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

      {/* Packaging & DRS Fees Box */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
        <div className="border-b border-neutral-100 pb-3">
          <h4 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Package size={18} className="text-amber-600" />
            Csomagolási díj és DRS (Visszaváltási díj) beállítása
          </h4>
          <p className="text-xs text-neutral-500 mt-1">
            Ezek a tételek automatikusan felszámításra kerülnek az online webshopban és a telefonos (POS) felületen is, valamint a blokkon külön sorban jelennek meg.
          </p>
        </div>

        {/* Packaging Fee Setting */}
        <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                📦 Csomagolási díj felszámítása
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Ha be van kapcsolva, a megadott forint összeg hozzáadódik a rendeléshez elvitelnél és házhozszállításnál.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={packagingFeeEnabled}
                onChange={(e) => setPackagingFeeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {packagingFeeEnabled && (
            <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-neutral-700 whitespace-nowrap">
                Csomagolási díj összege (Ft):
              </label>
              <div className="relative w-40">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={packagingFee}
                  onChange={(e) => setPackagingFee(e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-2 pr-8 text-sm font-bold border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-bold">Ft</span>
              </div>
              <span className="text-xs text-neutral-500">
                (Alapértelmezett: 200 Ft / rendelés, bármikor módosítható)
              </span>
            </div>
          )}
        </div>

        {/* DRS Fee Setting */}
        <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Recycle size={16} className="text-emerald-600" /> DRS visszaváltási díj (50 Ft)
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Kötelező visszaváltási díjas termékek (dobozos üdítők, PET palackok, stb.) esetén felszámított jogszabályi díj (50 Ft / palack). Itt bármikor globálisan ki-be kapcsolhatod.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={drsFeeEnabled}
                onChange={(e) => setDrsFeeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {drsFeeEnabled && (
            <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-neutral-700 whitespace-nowrap">
                DRS díj összege:
              </label>
              <div className="relative w-36">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={drsFee}
                  onChange={(e) => setDrsFee(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 pr-8 text-sm font-bold border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-bold">Ft</span>
              </div>
              <span className="text-xs text-emerald-700 font-medium">
                (A törvényi előírás szerint 50 Ft / palack)
              </span>
            </div>
          )}
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
            <Check size={16} /> Beállítások és díjak mentése
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- Database & MongoDB ----------------
const DatabaseTab = () => {
  const [status, setStatus] = useState(null);
  const [inspectData, setInspectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [customUri, setCustomUri] = useState('');

  // Legacy Migrator state
  const [selectedSourceCol, setSelectedSourceCol] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState('menu');
  const [migrateOverwrite, setMigrateOverwrite] = useState(false);

  // File / JSON Import state
  const [importTarget, setImportTarget] = useState('menu');
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [fileParsedCount, setFileParsedCount] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/system/db-status`);
      setStatus(res.data);
      if (!customUri && res.data?.uri) {
        setCustomUri(res.data.uri);
      }
      if (res.data?.isMongoConnected) {
        fetchInspect();
      }
    } catch (err) {
      toast.error('Nem sikerült lekérni az adatbázis állapotát.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInspect = async () => {
    try {
      const res = await axios.get(`${API}/system/db-inspect`);
      setInspectData(res.data);
      if (res.data?.collections?.length && !selectedSourceCol) {
        // pick first non-standard collection if available
        const nonStandard = res.data.collections.find(c => !['users', 'menuitems', 'zones', 'couriers', 'inventories', 'coupons', 'orders', 'customers', 'daycloses', 'restaurantstatuses'].includes(c.name));
        setSelectedSourceCol(nonStandard ? nonStandard.name : res.data.collections[0].name);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async (overrideUri) => {
    try {
      setActionLoading(true);
      const uriToTest = overrideUri || customUri;
      toast.info('Csatlakozás a MongoDB-hez...', { duration: 3000 });
      const res = await axios.post(`${API}/system/db-reconnect`, { uri: uriToTest });
      if (res.data?.success) {
        toast.success(`Sikeres kapcsolat a MongoDB-hez! (${res.data.dbName})`);
      } else {
        toast.error(`Nem sikerült kapcsolódni: ${res.data?.error || 'Ismeretlen hiba'}`);
      }
      await fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hiba történt a csatlakozási kísérlet során.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePushAll = async () => {
    if (!window.confirm('Biztosan ki szeretnéd másolni az összes memóriában lévő étlapot, rendelést és készletet a MongoDB-be?')) return;
    try {
      setActionLoading(true);
      const res = await axios.post(`${API}/system/db-push-all`);
      toast.success(res.data?.message || 'Sikeres mentés a MongoDB-be!');
      await fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sikertelen mentés.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePullAll = async () => {
    if (!window.confirm('Figyelem: Ez felülírja a memóriában lévő állapotot a MongoDB-ben tárolt verzióval. Folytatod?')) return;
    try {
      setActionLoading(true);
      const res = await axios.post(`${API}/system/db-pull-all`);
      toast.success(res.data?.message || 'Sikeres betöltés MongoDB-ből!');
      await fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sikertelen betöltés.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!selectedSourceCol) {
      toast.error('Válassz ki egy forrás kollekciót!');
      return;
    }
    if (!window.confirm(`Biztosan át szeretnéd emelni az adatokat a(z) "${selectedSourceCol}" kollekcióból a "${selectedTargetType}" modulba?`)) return;

    try {
      setActionLoading(true);
      const res = await axios.post(`${API}/system/db-migrate-collection`, {
        sourceCollection: selectedSourceCol,
        targetType: selectedTargetType,
        overwrite: migrateOverwrite,
      });
      toast.success(res.data?.message || 'Sikeres átemelés!');
      await fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hiba történt az átemeléskor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMigrateLegacyAll = async () => {
    if (!window.confirm('Biztosan be szeretnéd tölteni a régi Szesztestvérek adatbázis adatait (termékek, városok, felhasználók, rendelések, kuponok)?')) return;
    try {
      setActionLoading(true);
      const res = await axios.post(`${API}/system/migrate-legacy-szesztestverek`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Sikeres átemelés a régi adatbázisból!');
        await fetchStatus();
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error(res.data?.error || 'Sikertelen átemelés.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hiba történt a régi rendszer átemelése során.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadDefaults = async () => {
    if (!window.confirm('Betöltöd a Szesztestvérek 15 autentikus ételét és italát, a szállítási településeket (Szuhogy, Rudabánya, Alsótelekes, stb.) és a kuponokat?')) return;
    try {
      setActionLoading(true);
      const res = await axios.post(`${API}/system/load-szesztestverek-defaults`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Szesztestvérek adatok sikeresen betöltve!');
        await fetchStatus();
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error(res.data?.error || 'Hiba a betöltéskor.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hiba a betöltéskor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') return;

      try {
        if (file.name.endsWith('.json') || content.trim().startsWith('[') || content.trim().startsWith('{')) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : (parsed.items || parsed.data || [parsed]);
          setJsonInput(JSON.stringify(list, null, 2));
          setFileParsedCount(list.length);
          toast.success(`${list.length} elem beolvasva a JSON fájlból!`);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parser
          const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 1) {
            const headers = lines[0].split(/[;,]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
            const list = [];
            for (let i = 1; i < lines.length; i++) {
              const vals = lines[i].split(/[;,]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
              const obj = {};
              headers.forEach((h, idx) => {
                obj[h] = vals[idx] !== undefined ? vals[idx] : '';
              });
              list.push(obj);
            }
            setJsonInput(JSON.stringify(list, null, 2));
            setFileParsedCount(list.length);
            toast.success(`${list.length} sor beolvasva a CSV fájlból!`);
          }
        }
      } catch (err) {
        toast.error('Nem sikerült feldolgozni a fájlt. Ellenőrizd a formátumot!');
      }
    };
    reader.readAsText(file);
  };

  const handleDirectImport = async () => {
    if (!jsonInput.trim()) {
      toast.error('Illessz be vagy tölts fel adatot az importáláshoz!');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.data || [parsed]);
      if (!items.length) {
        toast.error('Az adathalmaz üres.');
        return;
      }

      setActionLoading(true);
      const res = await axios.post(`${API}/system/import-json`, {
        targetType: importTarget,
        items,
        overwrite: importOverwrite,
      });

      toast.success(res.data?.message || 'Sikeres importálás!');
      setJsonInput('');
      setFileParsedCount(null);
      await fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Érvénytelen JSON formátum!');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Parancs a vágólapra másolva!');
  };

  const isConnected = Boolean(status?.isMongoConnected);

  const collections = [
    { key: 'menuItems', label: 'Étlap termékek', mongo: status?.mongoCounts?.menuItems || 0, memory: status?.memoryCounts?.menuItems || 0 },
    { key: 'orders', label: 'Rendelések', mongo: status?.mongoCounts?.orders || 0, memory: status?.memoryCounts?.orders || 0 },
    { key: 'inventory', label: 'Raktárkészlet', mongo: status?.mongoCounts?.inventory || 0, memory: status?.memoryCounts?.inventory || 0 },
    { key: 'users', label: 'Felhasználók', mongo: status?.mongoCounts?.users || 0, memory: status?.memoryCounts?.users || 0 },
    { key: 'zones', label: 'Szállítási zónák', mongo: status?.mongoCounts?.zones || 0, memory: status?.memoryCounts?.zones || 0 },
    { key: 'couriers', label: 'Futárok', mongo: status?.mongoCounts?.couriers || 0, memory: status?.memoryCounts?.couriers || 0 },
    { key: 'coupons', label: 'Kuponkódok', mongo: status?.mongoCounts?.coupons || 0, memory: status?.memoryCounts?.coupons || 0 },
    { key: 'dayCloses', label: 'Napi pénztárzárások', mongo: status?.mongoCounts?.dayCloses || 0, memory: status?.memoryCounts?.dayCloses || 0 },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Status Hero Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isConnected
          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
          : 'bg-rose-50/70 border-rose-300 text-rose-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl ${isConnected ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'} shadow-md shrink-0`}>
              <Database size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isConnected ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200/80 text-rose-900'
                }`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
                  {isConnected ? 'MongoDB Kapcsolat Aktív' : 'MongoDB Offline (Memória mód)'}
                </span>
                <span className="text-xs text-neutral-500 font-mono">
                  Állapot: {status?.readyStateText || 'Betöltés...'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-2">
                {isConnected
                  ? `Csatlakoztatva a "${status?.databaseName || 'szesztestverek'}" adatbázishoz`
                  : 'A szerver jelenleg a beépített memóriát használja'}
              </h2>
              <p className="text-xs sm:text-sm mt-1 text-neutral-600">
                {isConnected
                  ? 'Minden rendelés, étlap módosítás és készletváltozás közvetlenül és azonnal a MongoDB-be mentődik.'
                  : 'Az adatok működnek a memóriában, de a szerver újraindításakor nem maradnak meg, amíg a MongoDB nem fut.'}
              </p>
            </div>
          </div>
          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={() => handleReconnect()}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-xs inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} />
              Újratesztelés
            </button>
          </div>
        </div>

        {/* Detailed Error message if offline */}
        {!isConnected && status?.mongoLastError && (
          <div className="mt-4 p-4 rounded-xl bg-white border border-rose-200 text-rose-900 text-xs sm:text-sm shadow-xs">
            <div className="font-bold flex items-center gap-1.5 text-rose-700 mb-1">
              <AlertTriangle size={16} /> Kapcsolódási hiba részletei:
            </div>
            <code className="block bg-rose-50 p-2.5 rounded-lg font-mono text-xs text-rose-800 border border-rose-100 break-all">
              {status.mongoLastError}
            </code>
            <p className="mt-2 text-neutral-700 text-xs leading-relaxed">
              💡 <strong>Mit jelent ez?</strong> A háttérben futó Node.js szerver nem érte el a MongoDB démont a <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">{status?.uri || 'mongodb://127.0.0.1:27017/szesztestverek'}</code> címen.
            </p>
          </div>
        )}
      </div>

      {/* Szesztestvérek Legacy System & Authentic Menu Quick-Actions */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                Szesztestvérek Régi Rendszer &amp; Étlap Átemelés
              </h3>
              <p className="text-xs text-neutral-600">
                Egyetlen kattintással átemelheted a régi adatbázisod kollekcióit, vagy feltöltheted az autentikus étlapot és szállítási zónákat.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/80 p-4 rounded-xl border border-amber-200/80 flex flex-col justify-between">
            <div>
              <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <FolderSync size={16} className="text-amber-600" />
                Régi MongoDB Kollekciók Teljes Átemelése
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Kiolvassa a korábbi <code className="bg-amber-100/60 px-1 py-0.5 rounded font-mono text-[11px]">products</code> (ételek), <code className="bg-amber-100/60 px-1 py-0.5 rounded font-mono text-[11px]">cities</code> (települések), <code className="bg-amber-100/60 px-1 py-0.5 rounded font-mono text-[11px]">users</code> és <code className="bg-amber-100/60 px-1 py-0.5 rounded font-mono text-[11px]">orders</code> kollekciókat és közvetlenül átemeli őket.
              </p>
            </div>
            <button
              onClick={handleMigrateLegacyAll}
              disabled={actionLoading}
              className="mt-3 w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <FolderSync size={14} />
              {actionLoading ? 'Átemelés folyamatban...' : 'Régi adatbázis átemelése most'}
            </button>
          </div>

          <div className="bg-white/80 p-4 rounded-xl border border-amber-200/80 flex flex-col justify-between">
            <div>
              <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Utensils size={16} className="text-orange-600" />
                Autentikus Szesztestvérek Étlap &amp; Zónák Betöltése
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Azonnal betölti a 15 valódi Szesztestvérek ételt és italt (pörköltek, sültek, pizzák, árak, csomagolási díjak) és a Szuhogy környéki szállítási zónákat. <strong>Nem kell semmit kézzel felvinned!</strong>
              </p>
            </div>
            <button
              onClick={handleLoadDefaults}
              disabled={actionLoading}
              className="mt-3 w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles size={14} />
              {actionLoading ? 'Betöltés...' : 'Autentikus adatok betöltése (Azonnali indítás)'}
            </button>
          </div>
        </div>
      </div>

      {/* MongoDB Quick-Fix / Troubleshooting Terminal Commands */}
      {!isConnected && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-base font-bold text-neutral-900">
            <Terminal size={20} className="text-amber-500" />
            <span>Hogyan indítsd el a MongoDB-t a szervereden?</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600">
            A konfigurációdban megadott URI: <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800">mongodb://127.0.0.1:27017/szesztestverek</code>.
            Futtasd a megfelelő parancsot a szervereden (SSH terminálban), majd kattints fent az <strong>„Újratesztelés”</strong> gombra:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-neutral-950 text-neutral-100 rounded-xl font-mono text-xs flex items-center justify-between gap-3">
              <div>
                <span className="text-neutral-500 select-none"># 1. MongoDB szolgáltatás elindítása Linuxon (Ubuntu/Debian):</span>
                <div className="text-emerald-400 font-bold mt-0.5">sudo systemctl start mongod</div>
              </div>
              <button
                onClick={() => copyToClipboard('sudo systemctl start mongod')}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title="Másolás"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="p-3 bg-neutral-950 text-neutral-100 rounded-xl font-mono text-xs flex items-center justify-between gap-3">
              <div>
                <span className="text-neutral-500 select-none"># 2. Automatikus indítás beállítása szerver újrainduláskor:</span>
                <div className="text-emerald-400 font-bold mt-0.5">sudo systemctl enable mongod</div>
              </div>
              <button
                onClick={() => copyToClipboard('sudo systemctl enable mongod')}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title="Másolás"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="p-3 bg-neutral-950 text-neutral-100 rounded-xl font-mono text-xs flex items-center justify-between gap-3">
              <div>
                <span className="text-neutral-500 select-none"># 3. Vagy ha Dockerben futtatod a MongoDB-t:</span>
                <div className="text-emerald-400 font-bold mt-0.5">docker run -d -p 27017:27017 --name szesztestverek-mongo mongo:latest</div>
              </div>
              <button
                onClick={() => copyToClipboard('docker run -d -p 27017:27017 --name szesztestverek-mongo mongo:latest')}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title="Másolás"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status & Collections Breakdown */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
              <Server size={18} className="text-neutral-700" />
              Adatbázis Kollekciók &amp; Szinkronizáció
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Hány elem található a MongoDB adatbázisban és hány a memóriában.
            </p>
          </div>
          {isConnected && (
            <div className="flex gap-2">
              <button
                onClick={handlePushAll}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Memóriában lévő adatok beírása a MongoDB-be"
              >
                <UploadCloud size={14} /> Memória &rarr; MongoDB mentés
              </button>
              <button
                onClick={handlePullAll}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Adatok újratöltése a MongoDB-ből"
              >
                <DownloadCloud size={14} /> MongoDB &rarr; Memória frissítés
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-5 text-left">Kollekció neve</th>
                <th className="py-3 px-5 text-center">MongoDB rekordok</th>
                <th className="py-3 px-5 text-center">Memóriában</th>
                <th className="py-3 px-5 text-right">Állapot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {collections.map((col) => {
                const inSync = isConnected ? col.mongo === col.memory : false;
                return (
                  <tr key={col.key} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-5 font-semibold text-neutral-900">{col.label}</td>
                    <td className="py-3 px-5 text-center font-mono font-bold text-neutral-800">
                      {isConnected ? col.mongo : '—'}
                    </td>
                    <td className="py-3 px-5 text-center font-mono text-neutral-600">
                      {col.memory}
                    </td>
                    <td className="py-3 px-5 text-right">
                      {isConnected ? (
                        inSync ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 size={13} /> Szinkronban
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            Különbözet ({col.memory - col.mongo})
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                          Csak memóriában
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legacy DB Collection Migrator */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
              <FolderSync size={18} className="text-amber-500" />
              Régi rendszer adatainak átemelése meglévő MongoDB kollekcióból
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ha a régi rendszeredből származó adatok már a MongoDB-ben vannak egy korábbi kollekcióban (pl. <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">products</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">termekek</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">etlap</code> vagy <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">rendelesek</code>), innen egy kattintással átmigrálhatod őket!
            </p>
          </div>
          {isConnected && (
            <button
              onClick={fetchInspect}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <RefreshCw size={12} /> Kollekciók frissítése
            </button>
          )}
        </div>

        {isConnected ? (
          inspectData?.collections?.length ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-neutral-500 py-1">Észlelt kollekciók a(z) <strong>{inspectData.currentDatabase}</strong> adatbázisban:</span>
                {inspectData.collections.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedSourceCol(c.name)}
                    className={`px-2.5 py-1 rounded-lg border font-mono transition-all ${
                      selectedSourceCol === c.name
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {c.name} <span className="text-[10px] opacity-75 font-sans">({c.count} db)</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Forrás kollekció:</label>
                  <select
                    value={selectedSourceCol}
                    onChange={(e) => setSelectedSourceCol(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="">-- Válassz kollekciót --</option>
                    {inspectData.collections.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.count} rekord)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Cél modul:</label>
                  <select
                    value={selectedTargetType}
                    onChange={(e) => setSelectedTargetType(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="menu">Étlap termékek (Menu)</option>
                    <option value="customers">Vevők (Customers)</option>
                    <option value="inventory">Raktárkészlet (Inventory)</option>
                    <option value="couriers">Futárok (Couriers)</option>
                    <option value="zones">Szállítási zónák (Zones)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleMigrate}
                    disabled={actionLoading || !selectedSourceCol}
                    className="w-full py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-xs inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    <FolderSync size={15} />
                    Adatok átemelése
                  </button>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={migrateOverwrite}
                  onChange={(e) => setMigrateOverwrite(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span>Jelenlegi adatok törlése a cél modulból és teljes felülírás a régivel (ajánlott, ha le akarod cserélni a mintákat)</span>
              </label>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">
              Nincsenek még kollekciók a csatlakoztatott adatbázisban.
            </p>
          )
        ) : (
          <p className="text-xs text-rose-600">
            A kollekciók listázásához és átemeléséhez először csatlakoznia kell a MongoDB-nek (lásd feljebb).
          </p>
        )}
      </div>

      {/* JSON / CSV File or Text Importer */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-xs">
        <div className="border-b border-neutral-100 pb-3">
          <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
            <Upload size={18} className="text-emerald-600" />
            Fájl importálása (JSON vagy CSV fájl a régi rendszerből)
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Ha a régi rendszeredből exportáltál egy JSON vagy CSV fájlt, töltsd fel ide vagy másold be a tartalmát! A rendszer automatikusan betölti és elmenti. <strong>Nem kell semmit kézzel újra felvinned!</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Melyik modulba importálsz?</label>
            <select
              value={importTarget}
              onChange={(e) => setImportTarget(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="menu">Étlap termékek (Név, ár, kategória, leírás)</option>
              <option value="customers">Vevők (Név, telefonszám, cím)</option>
              <option value="inventory">Raktárkészlet (Alapanyagok, mennyiség, mértékegység)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Fájl kiválasztása (.json vagy .csv):</label>
            <input
              type="file"
              accept=".json,.csv,application/json,text/csv"
              onChange={handleFileUpload}
              className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-neutral-700">
              Vagy illeszd be közvetlenül a JSON vagy CSV szöveget:
            </label>
            {fileParsedCount !== null && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                ✓ {fileParsedCount} elem felismerve
              </span>
            )}
          </div>
          <textarea
            rows={4}
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              try {
                const p = JSON.parse(e.target.value);
                setFileParsedCount(Array.isArray(p) ? p.length : 1);
              } catch {
                setFileParsedCount(null);
              }
            }}
            placeholder='Példa: [{"name": "Sajtos Pizza", "price": 2690, "category": "Pizzák"}, ...]'
            className="w-full p-3 font-mono text-xs border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={importOverwrite}
              onChange={(e) => setImportOverwrite(e.target.checked)}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span>Mintaadatok törlése és teljes lecserélése a feltöltött adatokra</span>
          </label>

          <button
            onClick={handleDirectImport}
            disabled={actionLoading || !jsonInput.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0"
          >
            <Upload size={16} />
            Importálás és Mentés
          </button>
        </div>
      </div>

      {/* Custom Connection String Tester */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-base text-neutral-900">
          MongoDB Kapcsolati URL tesztelése és módosítása
        </h3>
        <p className="text-xs text-neutral-500">
          Ha felhős MongoDB-t (pl. MongoDB Atlas) vagy más porton futó adatbázist használsz, itt azonnal letesztelheted:
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customUri}
            onChange={(e) => setCustomUri(e.target.value)}
            placeholder="mongodb://127.0.0.1:27017/szesztestverek"
            className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button
            onClick={() => handleReconnect(customUri)}
            disabled={actionLoading || !customUri}
            className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-xs inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0"
          >
            <Check size={16} />
            Csatlakozás &amp; Mentés
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
