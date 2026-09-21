import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatFt } from '../../mock/mockData';
import {
  Bike,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
  CheckSquare,
  Square,
  StopCircle,
  RotateCcw,
  Plus,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const Couriers = () => {
  const { couriers, orders, updateOrder } = useData();
  const [selectedIds, setSelectedIds] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [viewArchived, setViewArchived] = useState(false);
  const [expandedCouriers, setExpandedCouriers] = useState({});

  // 15 másodpercenként frissülő idő a "mennyi ideje van bent a cím" számlálóhoz
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Időszámítás: Mennyi ideje van bent a cím
  const getElapsedTime = (createdAt) => {
    if (!createdAt) return { text: 'N/A', mins: 0, badgeClass: 'bg-neutral-100 text-neutral-600' };
    const orderTime = new Date(createdAt).getTime();
    const diffMs = Math.max(0, now.getTime() - orderTime);
    const mins = Math.floor(diffMs / (1000 * 60));

    if (mins < 1) {
      return {
        text: '< 1 perce bent',
        mins,
        badgeClass: 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300',
      };
    }
    if (mins < 20) {
      return {
        text: `${mins} perce van bent`,
        mins,
        badgeClass: 'bg-sky-100 text-sky-800 font-bold border border-sky-300',
      };
    }
    if (mins < 40) {
      return {
        text: `⚠️ ${mins} perce van bent`,
        mins,
        badgeClass: 'bg-amber-100 text-amber-900 font-extrabold border border-amber-300',
      };
    }
    if (mins < 60) {
      return {
        text: `🔥 ${mins} perce van bent (Sürgős!)`,
        mins,
        badgeClass: 'bg-rose-100 text-rose-800 font-black border border-rose-300 animate-pulse',
      };
    }
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return {
      text: `🚨 ${hours} óra ${remMins} perce bent!`,
      mins,
      badgeClass: 'bg-rose-200 text-rose-900 font-black border border-rose-400',
    };
  };

  // Kiszállításos rendelések (aktív és nem sztornózott)
  const deliveryOrders = useMemo(() => {
    return orders.filter((o) => o.type === 'delivery' && o.status !== 'cancelled');
  }, [orders]);

  // Kiosztásra váró címek (nincs futárhoz rendelve és még nincs kiszállítva)
  const unassignedOrders = useMemo(() => {
    return deliveryOrders
      .filter((o) => !o.courierId && o.status !== 'delivered')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [deliveryOrders]);

  // Már futárhoz kiosztott és még aktív címek futáronként csoportosítva
  const courierOrdersMap = useMemo(() => {
    const map = {};
    couriers.forEach((c) => {
      map[c.id] = {
        active: [],
        deliveredToday: [],
      };
    });

    deliveryOrders.forEach((o) => {
      if (o.courierId && map[o.courierId]) {
        if (o.status === 'delivered') {
          map[o.courierId].deliveredToday.push(o);
        } else {
          map[o.courierId].active.push(o);
        }
      }
    });

    return map;
  }, [couriers, deliveryOrders]);

  // Összesített számok
  const stats = useMemo(() => {
    const waitingCount = unassignedOrders.length;
    const onRouteCount = deliveryOrders.filter((o) => o.status === 'on_route').length;
    const deliveredCount = deliveryOrders.filter((o) => o.status === 'delivered').length;
    const assignedNotRouteCount = deliveryOrders.filter((o) => o.courierId && o.status !== 'on_route' && o.status !== 'delivered').length;
    return { waitingCount, onRouteCount, deliveredCount, assignedNotRouteCount };
  }, [unassignedOrders, deliveryOrders]);

  // Pipálás / Kijelölés
  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selectedIds.length === unassignedOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unassignedOrders.map((o) => o.id));
    }
  };

  // Kiosztás a kiválasztott futárhoz
  const assignToCourier = async (courier) => {
    if (selectedIds.length === 0) {
      toast.error('Jelölj ki legalább egy címet pipálással a bal oldalon!');
      return;
    }
    try {
      for (const id of selectedIds) {
        await updateOrder(id, { courierId: courier.id, status: 'courier' });
      }
      toast.success(`${selectedIds.length} db cím kiosztva: ${courier.name} futárnak! 🛵`);
      setSelectedIds([]);
      // Automatikusan kinyitjuk a futár kártyáját
      setExpandedCouriers((prev) => ({ ...prev, [courier.id]: true }));
    } catch (err) {
      console.error('Assign error:', err);
    }
  };

  // Futár műveletek egyedi címekre
  const handleStart = async (order) => {
    try {
      await updateOrder(order.id, { status: 'on_route' });
      toast.success(`${order.id} elindult! 🛵`);
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStop = async (order) => {
    try {
      await updateOrder(order.id, { status: 'delivered' });
      toast.success(`${order.id} megállt (kiszállítva)! 🛑`);
    } catch (err) {
      console.error('Stop error:', err);
    }
  };

  const handleRestart = async (order) => {
    try {
      await updateOrder(order.id, { status: 'on_route' });
      toast.success(`${order.id} újra úton van! 🛵`);
    } catch (err) {
      console.error('Restart error:', err);
    }
  };

  const handleUnassign = async (order) => {
    try {
      await updateOrder(order.id, { courierId: null, status: 'new' });
      toast.success(`${order.id} visszakerült a kiosztandó címek közé.`);
    } catch (err) {
      console.error('Unassign error:', err);
    }
  };

  // Futár csoportos műveletek
  const handleCourierStartAll = async (courierId) => {
    const list = courierOrdersMap[courierId]?.active || [];
    const toStart = list.filter((o) => o.status !== 'on_route');
    if (toStart.length === 0) return;
    try {
      for (const o of toStart) {
        await updateOrder(o.id, { status: 'on_route' });
      }
      toast.success(`${toStart.length} db cím elindult! 🛵`);
    } catch (err) {
      console.error('Start all error:', err);
    }
  };

  const handleCourierStopAll = async (courierId) => {
    const list = courierOrdersMap[courierId]?.active || [];
    if (list.length === 0) return;
    try {
      for (const o of list) {
        await updateOrder(o.id, { status: 'delivered' });
      }
      toast.success(`${list.length} db cím megállt (kiszállítva)! 🛑`);
    } catch (err) {
      console.error('Stop all error:', err);
    }
  };

  const toggleCourierExpand = (courierId) => {
    setExpandedCouriers((prev) => ({
      ...prev,
      [courierId]: !prev[courierId],
    }));
  };

  return (
    <div className="bg-[#E5EAEF] min-h-[calc(100vh-64px)] p-3 sm:p-6 font-sans">
      <div className="max-w-[1550px] mx-auto space-y-4">
        {/* Felső információs fejléc & gombok */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bike className="text-slate-800" size={20} />
              Futár címkiosztás és követés
            </h1>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Kiosztásra vár: <b>{stats.waitingCount}</b>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                Kiosztva (indulásra vár): <b>{stats.assignedNotRouteCount}</b>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                🛵 Úton (Elindult): <b>{stats.onRouteCount}</b>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                🛑 Megállt (Kiszállítva): <b>{stats.deliveredCount}</b>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewArchived(!viewArchived)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all inline-flex items-center gap-1.5 ${
                viewArchived
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FileCheck size={14} />
              {viewArchived ? 'Vissza a kiosztáshoz' : `Kiszállított címek (${stats.deliveredCount})`}
            </button>
          </div>
        </div>

        {/* Kijelölési értesítő sáv, ha van bepipált cím */}
        {selectedIds.length > 0 && !viewArchived && (
          <div className="bg-amber-500 text-white px-4 py-2.5 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} />
              <span>
                <b>{selectedIds.length} db</b> cím kijelölve! Kattints a jobb oldalon a kívánt futár melletti zöld gombra a kiosztáshoz.
              </span>
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs transition-colors"
            >
              Kijelölés törlése
            </button>
          </div>
        )}

        {/* KÉT OSZLOPOS ELRENDEZÉS: CÍMEK (Bal) és FUTÁROK (Jobb) - EXACT SCREENSHOT STRUCTURE */}
        {!viewArchived ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* BAL OLDALI OSZLOP: CÍMEK */}
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-slate-800 text-sm font-bold tracking-tight">Címek</h2>
                {unassignedOrders.length > 0 && (
                  <button
                    onClick={selectAll}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 bg-white/70 px-2 py-1 rounded-md border border-slate-200"
                  >
                    {selectedIds.length === unassignedOrders.length ? (
                      <>
                        <CheckSquare size={13} className="text-emerald-600" /> Mind feloldása
                      </>
                    ) : (
                      <>
                        <Square size={13} /> Mind kijelölése ({unassignedOrders.length})
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Ha nincs kiosztatlan cím: Pontosan a képernyőképnek megfelelő megjelenés! */}
              {unassignedOrders.length === 0 ? (
                <div className="bg-white rounded-lg p-7 text-center shadow-xs border border-slate-200/80 text-slate-700 text-sm font-medium">
                  Jelenleg minden cím ki van osztva.
                </div>
              ) : (
                /* Kiosztandó címek listája */
                <div className="space-y-2">
                  {unassignedOrders.map((order) => {
                    const elapsed = getElapsedTime(order.createdAt);
                    const isSelected = selectedIds.includes(order.id);
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.city}, ${order.street}`)}`;

                    return (
                      <div
                        key={order.id}
                        onClick={() => toggleSelect(order.id)}
                        className={`bg-white rounded-lg border p-3.5 shadow-2xs transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Bal oldal: Pipa + CÍM + Időbélyeg */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(order.id);
                            }}
                            className="mt-0.5 text-slate-700 hover:text-slate-900 focus:outline-none"
                          >
                            {isSelected ? (
                              <CheckSquare size={20} className="text-amber-500 fill-amber-100" />
                            ) : (
                              <Square size={20} className="text-slate-400" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            {/* Cím bal oldalon, kiemelten */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                                {order.city}, {order.street}
                              </span>
                              {order.floor && (
                                <span className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                  {order.floor}
                                </span>
                              )}
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-400 hover:text-blue-600 p-0.5"
                                title="Megnyitás Google Térképen"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </div>

                            {/* Időbélyeg: Mennyi ideje van bent a cím */}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full ${elapsed.badgeClass}`}>
                                <Clock size={11} className="inline mr-1 -mt-0.5" />
                                {elapsed.text}
                              </span>
                              <span className="text-[11px] text-slate-400">#{order.id}</span>
                            </div>

                            {order.note && (
                              <div className="text-xs text-amber-800 bg-amber-50/80 px-2 py-1 rounded border border-amber-200 mt-1.5 line-clamp-1">
                                📝 {order.note}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Jobb oldal: NÉV + Telefon + Összeg + Csatorna */}
                        <div className="text-right shrink-0 border-l border-slate-100 pl-3">
                          <div className="font-bold text-slate-900 text-sm truncate max-w-[140px] sm:max-w-[180px]">
                            {order.customerName}
                          </div>
                          {order.phone && (
                            <a
                              href={`tel:${order.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-slate-500 hover:text-slate-800 block"
                            >
                              {order.phone}
                            </a>
                          )}
                          <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                            {formatFt(order.total)}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {order.channel === 'foodora' && (
                              <span className="text-[10px] bg-[#D70F64] text-white px-1.5 py-0.5 rounded font-black">
                                Foodora
                              </span>
                            )}
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium capitalize">
                              {order.payment === 'cash' ? 'Készpénz' : order.payment === 'card' ? 'Bankkártya' : 'Online'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* JOBB OLDALI OSZLOP: FUTÁROK */}
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-slate-800 text-sm font-bold tracking-tight">Futárok</h2>
                <span className="text-xs text-slate-500 font-medium">{couriers.length} futár</span>
              </div>

              {/* Futárok listája - Exact screenshot matching white rows */}
              <div className="space-y-2">
                {couriers.map((courier) => {
                  const assignedData = courierOrdersMap[courier.id] || { active: [], deliveredToday: [] };
                  const activeList = assignedData.active;
                  const onRouteCount = activeList.filter((o) => o.status === 'on_route').length;
                  const isExpanded = expandedCouriers[courier.id] ?? true;

                  return (
                    <div
                      key={courier.id}
                      className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                    >
                      {/* Futár fejléc sor */}
                      <div className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2">
                        {/* Bal oldal: Futár neve ponttal, mint a képernyőképen */}
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleCourierExpand(courier.id)}
                        >
                          <span className="h-2 w-2 rounded-full bg-slate-700 shrink-0"></span>
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            {courier.name}
                          </span>
                          {courier.phone && (
                            <span className="text-xs text-slate-400 hidden sm:inline">
                              ({courier.phone})
                            </span>
                          )}
                        </div>

                        {/* Jobb oldal: Címek száma & Akciógombok */}
                        <div className="flex items-center gap-2">
                          {/* Ha van kijelölt cím bal oldalon: Kiemelt KIOSZTÁS gomb ehhez a futárhoz! */}
                          {selectedIds.length > 0 ? (
                            <button
                              onClick={() => assignToCourier(courier)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 animate-pulse"
                              title="Kijelölt címek hozzárendelése"
                            >
                              <Plus size={14} />
                              Kiosztás ide ({selectedIds.length})
                            </button>
                          ) : (
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                activeList.length > 0
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {activeList.length} cím {onRouteCount > 0 ? `(${onRouteCount} úton)` : ''}
                            </span>
                          )}

                          {/* Futár szintű csoportos indítás/megállítás ha vannak aktív címei */}
                          {activeList.length > 0 && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCourierStartAll(courier.id)}
                                className="text-[11px] bg-slate-900 text-white hover:bg-black font-semibold px-2 py-1 rounded transition-colors"
                                title="Minden kiosztott cím elindítása útnak"
                              >
                                🛵 Mind elindult
                              </button>
                              <button
                                onClick={() => handleCourierStopAll(courier.id)}
                                className="text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold px-2 py-1 rounded transition-colors"
                                title="Minden cím megállítása (kiszállítva)"
                              >
                                🛑 Mind megállt
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => toggleCourierExpand(courier.id)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Ha ki van nyitva és vannak hozzárendelt aktív címek: Címek listája */}
                      {isExpanded && activeList.length > 0 && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-1.5">
                          {activeList.map((order) => {
                            const elapsed = getElapsedTime(order.createdAt);
                            const isOnRoute = order.status === 'on_route';
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.city}, ${order.street}`)}`;

                            return (
                              <div
                                key={order.id}
                                className="bg-white rounded-md border border-slate-200 p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2"
                              >
                                {/* Bal oldalt a cím & ideje van bent */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {order.city}, {order.street}
                                    </span>
                                    {order.floor && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                                        {order.floor}
                                      </span>
                                    )}
                                    <a
                                      href={mapsUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-slate-400 hover:text-blue-600 p-0.5"
                                      title="Google Térkép"
                                    >
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${elapsed.badgeClass}`}>
                                      {elapsed.text}
                                    </span>
                                    <span className="text-[10px] text-slate-400">#{order.id}</span>
                                    {isOnRoute ? (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                        🛵 Úton
                                      </span>
                                    ) : (
                                      <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-1.5 py-0.2 rounded">
                                        Kiosztva
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Jobb oldalt a név, összeg és akció gombok (Elindult / Megállt) */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right pr-1">
                                    <div className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                                      {order.customerName}
                                    </div>
                                    <div className="text-[11px] font-extrabold text-slate-700">
                                      {formatFt(order.total)}
                                    </div>
                                  </div>

                                  {/* MŰVELET GOMBOK: Elindult & Megállt */}
                                  <div className="flex items-center gap-1">
                                    {!isOnRoute ? (
                                      <button
                                        onClick={() => handleStart(order)}
                                        className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-2.5 py-1.5 rounded shadow-2xs transition-colors inline-flex items-center gap-1"
                                      >
                                        <span>🛵 Elindult</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleStop(order)}
                                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3 py-1.5 rounded shadow-2xs transition-colors inline-flex items-center gap-1"
                                      >
                                        <span>🛑 Megállt</span>
                                      </button>
                                    )}

                                    {/* Közvetlen megállítás lehetőség ha el se indult */}
                                    {!isOnRoute && (
                                      <button
                                        onClick={() => handleStop(order)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1.5 rounded transition-colors"
                                        title="Megállt (kiszállítva)"
                                      >
                                        🛑 Megállt
                                      </button>
                                    )}

                                    {/* Visszavonás gomb, ha rossz futárhoz lett adva */}
                                    <button
                                      onClick={() => handleUnassign(order)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                      title="Kiosztás visszavonása"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* KISZÁLLÍTOTT (MEGÁLLT) CÍMEK NÉZET */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <StopCircle size={18} className="text-slate-700" />
                  Ma kiszállított (megállt) címek ({deliveryOrders.filter((o) => o.status === 'delivered').length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  A mai napon sikeresen kiszállított rendelések listája.
                </p>
              </div>
              <button
                onClick={() => setViewArchived(false)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 bg-slate-100 rounded-lg"
              >
                Vissza a kiosztáshoz
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {deliveryOrders
                .filter((o) => o.status === 'delivered')
                .map((order) => {
                  const courier = couriers.find((c) => c.id === order.courierId);
                  return (
                    <div key={order.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {order.city}, {order.street} {order.floor ? `(${order.floor})` : ''}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          #{order.id} • {order.customerName} ({order.phone}) • {formatFt(order.total)} •{' '}
                          <span className="font-semibold text-slate-700">Futár: {courier?.name || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                          ✅ Kiszállítva
                        </span>
                        <button
                          onClick={() => handleRestart(order)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors"
                          title="Rendelés újbóli elindítása"
                        >
                          <RotateCcw size={12} /> Újraindítás
                        </button>
                      </div>
                    </div>
                  );
                })}
              {deliveryOrders.filter((o) => o.status === 'delivered').length === 0 && (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Még nincs kiszállított cím a mai napon.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Couriers;
