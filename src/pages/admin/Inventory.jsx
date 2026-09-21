import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, Pencil, Check, X, Package, AlertTriangle, Scale, ArrowDownUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatStockDisplay, splitCompoundStock, combineCompoundStock } from '../../utils/units';

const Inventory = () => {
  const { inventory, addInventory, updateInventory, deleteInventory } = useData();

  // Draft state for new inventory item
  const [draft, setDraft] = useState({
    name: '',
    unit: 'kg',
    mainStock: 10,
    subStock: 0,
    minStock: 3,
  });

  // Inline editing
  const [editingId, setEditingId] = useState(null);
  const [ed, setEd] = useState({ name: '', unit: 'kg', mainStock: 0, subStock: 0, minStock: 0 });

  // Quick adjust modal/state
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustType, setAdjustType] = useState('add'); // 'add' | 'subtract'
  const [adjustMain, setAdjustMain] = useState(0);
  const [adjustSub, setAdjustSub] = useState(0);

  const startEdit = (item) => {
    setEditingId(item.id);
    const { main, sub } = splitCompoundStock(item.stock, item.unit);
    setEd({
      name: item.name,
      unit: item.unit,
      mainStock: main,
      subStock: sub,
      minStock: item.minStock,
    });
  };

  const saveEdit = (id) => {
    if (!ed.name.trim()) return toast.error('Név megadása kötelező');
    const finalStock = combineCompoundStock(ed.mainStock, ed.subStock, ed.unit);
    updateInventory(id, {
      name: ed.name.trim(),
      unit: ed.unit,
      stock: finalStock,
      minStock: Number(ed.minStock) || 0,
    });
    setEditingId(null);
    toast.success('Készlet tétel sikeresen frissítve!');
  };

  const submitNew = () => {
    if (!draft.name.trim()) return toast.error('Név megadása kötelező');
    const finalStock = combineCompoundStock(draft.mainStock, draft.subStock, draft.unit);
    addInventory({
      name: draft.name.trim(),
      unit: draft.unit,
      stock: finalStock,
      minStock: Number(draft.minStock) || 0,
    });
    setDraft({
      name: '',
      unit: 'kg',
      mainStock: 10,
      subStock: 0,
      minStock: 3,
    });
    toast.success('Alapanyag sikeresen felvéve a készletbe!');
  };

  const handleQuickAdjust = () => {
    if (!adjustItem) return;
    const adjustAmount = combineCompoundStock(adjustMain, adjustSub, adjustItem.unit);
    if (adjustAmount <= 0) return toast.error('Adj meg 0-nál nagyobb mennyiséget');

    let newStock = adjustItem.stock;
    if (adjustType === 'add') {
      newStock = Number((adjustItem.stock + adjustAmount).toFixed(4));
    } else {
      newStock = Math.max(0, Number((adjustItem.stock - adjustAmount).toFixed(4)));
    }

    updateInventory(adjustItem.id, {
      ...adjustItem,
      stock: newStock,
    });

    toast.success(
      adjustType === 'add'
        ? `Sikeres bevételezés: +${formatStockDisplay(adjustAmount, adjustItem.unit)}`
        : `Sikeres levonás: -${formatStockDisplay(adjustAmount, adjustItem.unit)}`
    );
    setAdjustItem(null);
    setAdjustMain(0);
    setAdjustSub(0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 flex items-center gap-2">
            <Package size={24} className="text-neutral-900" /> Készlet & Alapanyag Nyilvántartás
          </h2>
          <p className="text-sm text-neutral-600">
            Készletfelvitel kg és gramm, liter és ml, vagy darab szerint. A rendelések receptjei automatikusan innen vonódnak le.
          </p>
        </div>
      </div>

      {/* Add new item card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6 shadow-2xs">
        <h3 className="text-base font-bold text-neutral-900 mb-3 inline-flex items-center gap-2">
          <Plus size={18} className="text-emerald-600" /> Új alapanyag felvitele
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Name */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-neutral-600 mb-1">Alapanyag megnevezése</label>
            <input
              placeholder="pl. Mozzarella sajt, Marhahús..."
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-medium focus:border-neutral-900"
            />
          </div>

          {/* Unit selection */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-600 mb-1">Fő mértékegység</label>
            <select
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-semibold focus:border-neutral-900"
            >
              <option value="kg">kg (kilogramm & gramm)</option>
              <option value="l">l (liter & milliliter)</option>
              <option value="db">db (darab)</option>
            </select>
          </div>

          {/* Compound Stock Inputs (kg + g / l + ml / db) */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              {draft.unit === 'kg' && 'Készlet (kg és gramm)'}
              {draft.unit === 'l' && 'Készlet (liter és ml)'}
              {draft.unit === 'db' && 'Készlet (darabszám)'}
            </label>
            {draft.unit === 'kg' ? (
              <div className="flex items-center gap-1.5">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="kg"
                    value={draft.mainStock}
                    onChange={(e) => setDraft({ ...draft, mainStock: e.target.value })}
                    className="w-full px-2.5 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-7"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-neutral-400 font-semibold">kg</span>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="g"
                    value={draft.subStock}
                    onChange={(e) => setDraft({ ...draft, subStock: e.target.value })}
                    className="w-full px-2.5 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-6"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-neutral-400 font-semibold">g</span>
                </div>
              </div>
            ) : draft.unit === 'l' ? (
              <div className="flex items-center gap-1.5">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="l"
                    value={draft.mainStock}
                    onChange={(e) => setDraft({ ...draft, mainStock: e.target.value })}
                    className="w-full px-2.5 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-6"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-neutral-400 font-semibold">l</span>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="ml"
                    value={draft.subStock}
                    onChange={(e) => setDraft({ ...draft, subStock: e.target.value })}
                    className="w-full px-2.5 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-7"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-neutral-400 font-semibold">ml</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="db"
                  value={draft.mainStock}
                  onChange={(e) => setDraft({ ...draft, mainStock: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-8"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-neutral-400 font-semibold">db</span>
              </div>
            )}
          </div>

          {/* Min Stock */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-neutral-600 mb-1" title="Alacsony készlet riasztási szint">Min.</label>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={draft.minStock}
              onChange={(e) => setDraft({ ...draft, minStock: e.target.value })}
              className="w-full px-2.5 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-semibold text-right"
            />
          </div>

          {/* Submit */}
          <div className="sm:col-span-2">
            <button
              onClick={submitNew}
              className="w-full px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus size={15} /> Felvitel
            </button>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left font-bold">Alapanyag neve</th>
                <th className="py-3 px-4 text-center font-bold">Egység</th>
                <th className="py-3 px-4 text-right font-bold">Aktuális készlet</th>
                <th className="py-3 px-4 text-right font-bold">Min. szint</th>
                <th className="py-3 px-4 text-center font-bold">Státusz</th>
                <th className="py-3 px-4 text-right font-bold">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {inventory.map((item) => {
                const isEditing = editingId === item.id;
                const isLow = item.stock < item.minStock;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-amber-50/40 border-b border-neutral-200">
                      <td className="py-3 px-4">
                        <input
                          value={ed.name}
                          onChange={(e) => setEd({ ...ed, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white text-sm font-bold"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={ed.unit}
                          onChange={(e) => setEd({ ...ed, unit: e.target.value })}
                          className="px-2 py-1.5 border border-neutral-300 rounded-lg bg-white text-xs font-semibold"
                        >
                          <option value="kg">kg</option>
                          <option value="l">l</option>
                          <option value="db">db</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ed.unit === 'kg' ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={ed.mainStock}
                              onChange={(e) => setEd({ ...ed, mainStock: e.target.value })}
                              className="w-16 px-2 py-1 border border-neutral-300 rounded text-right text-xs font-bold"
                            />
                            <span className="text-xs text-neutral-500">kg</span>
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={ed.subStock}
                              onChange={(e) => setEd({ ...ed, subStock: e.target.value })}
                              className="w-16 px-2 py-1 border border-neutral-300 rounded text-right text-xs font-bold"
                            />
                            <span className="text-xs text-neutral-500">g</span>
                          </div>
                        ) : ed.unit === 'l' ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={ed.mainStock}
                              onChange={(e) => setEd({ ...ed, mainStock: e.target.value })}
                              className="w-16 px-2 py-1 border border-neutral-300 rounded text-right text-xs font-bold"
                            />
                            <span className="text-xs text-neutral-500">l</span>
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={ed.subStock}
                              onChange={(e) => setEd({ ...ed, subStock: e.target.value })}
                              className="w-16 px-2 py-1 border border-neutral-300 rounded text-right text-xs font-bold"
                            />
                            <span className="text-xs text-neutral-500">ml</span>
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={ed.mainStock}
                            onChange={(e) => setEd({ ...ed, mainStock: e.target.value })}
                            className="w-20 px-2 py-1 border border-neutral-300 rounded text-right text-xs font-bold"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={ed.minStock}
                          onChange={(e) => setEd({ ...ed, minStock: e.target.value })}
                          className="w-16 px-2 py-1 border border-neutral-300 rounded text-right text-xs font-bold"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs text-neutral-400">Szerkesztés</span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center justify-center mr-1 text-xs font-bold gap-1 shadow-xs"
                        >
                          <Check size={14} /> Mentés
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="h-8 px-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-100 inline-flex items-center justify-center text-xs font-medium"
                        >
                          <X size={14} /> Mégse
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-mono text-xs font-semibold">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-extrabold text-neutral-900 text-sm">
                        {formatStockDisplay(item.stock, item.unit)}
                      </div>
                      {(item.unit === 'kg' || item.unit === 'l') && (
                        <div className="text-[11px] font-mono text-neutral-400">
                          (= {item.stock} {item.unit})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600 font-semibold">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                          <AlertTriangle size={12} /> Alacsony
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          Rendben
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {/* Quick Adjust Button */}
                      <button
                        onClick={() => {
                          setAdjustItem(item);
                          setAdjustType('add');
                          setAdjustMain(0);
                          setAdjustSub(0);
                        }}
                        className="h-8 px-2.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 inline-flex items-center justify-center mr-1 text-xs font-semibold gap-1 transition-colors"
                        title="Gyors bevételezés vagy levonás"
                      >
                        <ArrowDownUp size={13} className="text-neutral-500" /> +/- Készlet
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => startEdit(item)}
                        className="h-8 w-8 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 inline-flex items-center justify-center mr-1 transition-colors"
                        title="Szerkesztés"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Biztosan törlöd a(z) ${item.name} alapanyagot?`)) {
                            deleteInventory(item.id);
                            toast.success('Alapanyag törölve');
                          }
                        }}
                        className="h-8 w-8 rounded-lg border border-neutral-200 text-rose-500 hover:bg-rose-50 transition-colors inline-flex items-center justify-center"
                        title="Törlés"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    Még nincs alapanyag a készletben. Vedd fel a legfontosabbakat a fenti űrlapon.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Adjust Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setAdjustItem(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Készletmozgás rögzítése</span>
                <h3 className="text-lg font-black text-neutral-900">{adjustItem.name}</h3>
              </div>
              <button onClick={() => setAdjustItem(null)} className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex rounded-lg bg-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    adjustType === 'add' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  + Bevételezés (Érkezett áru)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    adjustType === 'subtract' ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  - Levonás / Selejt / Korrekció
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">
                  Mozgatandó mennyiség ({adjustItem.unit === 'kg' ? 'kg és gramm' : adjustItem.unit === 'l' ? 'liter és ml' : 'darab'}):
                </label>
                {adjustItem.unit === 'kg' ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={adjustMain}
                        onChange={(e) => setAdjustMain(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-8"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-neutral-400">kg</span>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        max="999"
                        placeholder="0"
                        value={adjustSub}
                        onChange={(e) => setAdjustSub(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-8"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-neutral-400">g</span>
                    </div>
                  </div>
                ) : adjustItem.unit === 'l' ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={adjustMain}
                        onChange={(e) => setAdjustMain(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-8"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-neutral-400">l</span>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        max="999"
                        placeholder="0"
                        value={adjustSub}
                        onChange={(e) => setAdjustSub(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-8"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-neutral-400">ml</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={adjustMain}
                      onChange={(e) => setAdjustMain(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-right pr-8"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-neutral-400">db</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 text-xs text-neutral-600 flex justify-between">
                <span>Jelenlegi készlet:</span>
                <span className="font-bold text-neutral-900">{formatStockDisplay(adjustItem.stock, adjustItem.unit)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setAdjustItem(null)}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleQuickAdjust}
                className="px-5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs"
              >
                Rögzítés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
