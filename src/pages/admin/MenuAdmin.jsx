import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { CATEGORIES, formatFt, LOGO_URL } from '../../mock/mockData';
import { Plus, Trash2, Pencil, Check, X, ChefHat, Upload, Link as LinkIcon, Image as ImageIcon, Scale, ArrowRight, Package, Recycle } from 'lucide-react';
import { toast } from 'sonner';
import { convertUnit, getRecipeUnitsForBaseUnit, getDefaultRecipeUnit } from '../../utils/units';

const empty = {
  name: '',
  description: '',
  price: '',
  priceFoodora: '',
  priceFalatozz: '',
  packagingFee: '',
  drsFeeEnabled: false,
  category: 'pizzak',
  image: '',
};

const MenuAdmin = () => {
  const { menu, inventory, addMenuItem, updateMenuItem, deleteMenuItem } = useData();
  const [cat, setCat] = useState('pizzak');
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [ed, setEd] = useState(empty);
  const [recipeFor, setRecipeFor] = useState(null); // menu item id
  const [imageMode, setImageMode] = useState('pc'); // 'pc' | 'url'
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return toast.error('Csak képfájl tölthető fel (JPG, PNG, WebP)!');
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      if (isEdit) {
        setEd((prev) => ({ ...prev, image: base64 }));
      } else {
        setDraft((prev) => ({ ...prev, image: base64 }));
      }
      toast.success('Kép sikeresen kiválasztva a számítógépről!');
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!draft.name || !draft.price) return toast.error('Név és ár kötelező');
    await addMenuItem({
      ...draft,
      price: Number(draft.price),
      priceFoodora: draft.priceFoodora ? Number(draft.priceFoodora) : null,
      priceFalatozz: draft.priceFalatozz ? Number(draft.priceFalatozz) : null,
      packagingFee: draft.packagingFee !== '' ? Math.max(0, Number(draft.packagingFee) || 0) : 0,
      drsFeeEnabled: Boolean(draft.drsFeeEnabled),
      image: draft.image || '',
      recipe: [],
    });
    setDraft({ ...empty, category: cat });
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Termék hozzáadva');
  };

  const saveEdit = async (id) => {
    await updateMenuItem(id, {
      name: ed.name,
      description: ed.description,
      price: Number(ed.price),
      priceFoodora: ed.priceFoodora ? Number(ed.priceFoodora) : null,
      priceFalatozz: ed.priceFalatozz ? Number(ed.priceFalatozz) : null,
      packagingFee: ed.packagingFee !== '' && ed.packagingFee !== null && ed.packagingFee !== undefined ? Math.max(0, Number(ed.packagingFee) || 0) : 0,
      drsFeeEnabled: Boolean(ed.drsFeeEnabled),
      image: ed.image || '',
    });
    setEditing(null);
    toast.success('Mentve');
  };

  const items = menu.filter((m) => m.category === cat);
  const recipeItem = menu.find((m) => m.id === recipeFor);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => { setCat(c.id); setDraft({ ...empty, category: c.id }); }}
            className={`px-3 py-1.5 rounded-md text-sm border font-medium transition-colors ${
              cat === c.id ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* New Food Item Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900 mb-3 flex items-center justify-between">
          <span>Új termék hozzáadása</span>
          <span className="text-xs font-normal text-neutral-500">Kategória: <b className="text-neutral-900">{CATEGORIES.find((c) => c.id === cat)?.name}</b></span>
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
            <input
              placeholder="Étel neve (pl. Hawaii Pizza)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="col-span-1 sm:col-span-2 md:col-span-3 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              placeholder="Leírás / hozzávalók (pl. sonka, ananász...)"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="col-span-1 sm:col-span-2 md:col-span-5 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              placeholder="Házi ár (Ft)"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              className="col-span-1 md:col-span-1 px-2.5 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              placeholder="Foodora (Ft)"
              value={draft.priceFoodora}
              onChange={(e) => setDraft({ ...draft, priceFoodora: e.target.value })}
              className="col-span-1 md:col-span-1 px-2.5 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              placeholder="Falatozz (Ft)"
              value={draft.priceFalatozz}
              onChange={(e) => setDraft({ ...draft, priceFalatozz: e.target.value })}
              className="col-span-1 md:col-span-1 px-2.5 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={submit}
              className="col-span-1 md:col-span-1 px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm font-bold inline-flex items-center justify-center gap-1 hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <Plus size={16} /> Mentés
            </button>
          </div>

          {/* Packaging fee and DRS toggle row */}
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Packaging fee input */}
              <div className="flex items-center gap-2">
                <Package size={15} className="text-amber-600" />
                <label className="text-xs font-semibold text-neutral-700">Csomagolási díj:</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    placeholder="pl. 150"
                    value={draft.packagingFee}
                    onChange={(e) => setDraft({ ...draft, packagingFee: e.target.value })}
                    className="w-24 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-l-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                  />
                  <span className="px-2 py-1.5 text-xs bg-neutral-200 border border-l-0 border-neutral-300 rounded-r-md text-neutral-600 font-medium">
                    Ft
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400">(üresen 0 Ft)</span>
              </div>

              {/* 50 Ft DRS fee toggle */}
              <div className="flex items-center gap-2">
                <Recycle size={15} className="text-emerald-600" />
                <label className="text-xs font-semibold text-neutral-700">50 Ft DRS díj:</label>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, drsFeeEnabled: !draft.drsFeeEnabled })}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-all border ${
                    draft.drsFeeEnabled
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${draft.drsFeeEnabled ? 'bg-white animate-pulse' : 'bg-neutral-400'}`} />
                  {draft.drsFeeEnabled ? 'BEKAPCSOLVA (+50 Ft DRS)' : 'KIKAPCSOLVA (Nincs DRS)'}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500">
              * A rendelés leadásakor tételenként számolódik
            </div>
          </div>

          {/* Image Upload Row (PC file or URL) */}
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-neutral-700 inline-flex items-center gap-1.5">
                <ImageIcon size={14} className="text-amber-600" />
                Étel képe:
              </span>
              <div className="inline-flex rounded-md border border-neutral-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setImageMode('pc')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors inline-flex items-center gap-1 ${
                    imageMode === 'pc' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Upload size={12} /> Fájl a PC-ről
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors inline-flex items-center gap-1 ${
                    imageMode === 'url' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <LinkIcon size={12} /> Kép URL
                </button>
              </div>

              {imageMode === 'pc' ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false)}
                    className="text-xs text-neutral-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                  />
                </div>
              ) : (
                <input
                  type="url"
                  placeholder="https://pelda.hu/etel-fotok/pizza.jpg"
                  value={draft.image}
                  onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                  className="w-72 px-3 py-1 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Thumbnail Preview */}
            {draft.image && (
              <div className="flex items-center gap-2">
                <img
                  src={draft.image}
                  alt="Előnézet"
                  className="h-10 w-14 object-cover rounded-md border border-neutral-300 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...draft, image: '' });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 underline font-medium"
                >
                  Kép törlése
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 text-xs text-neutral-500">
          Foodora és Falatozz ár üresen hagyva automatikusan kalkulálódik a házi árból. Feltölthetsz képet a gépedről (fájlként), vagy beilleszthetsz közvetlen internetes URL-t is.
        </div>
      </div>

      {/* Menu items table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
              <tr>
                <th className="py-2.5 px-4 text-left">Fotó</th>
                <th className="py-2.5 px-4 text-left">Név</th>
                <th className="py-2.5 px-4 text-left">Leírás</th>
                <th className="py-2.5 px-4 text-right">Házi</th>
                <th className="py-2.5 px-4 text-right">Foodora</th>
                <th className="py-2.5 px-4 text-right">Falatozz</th>
                <th className="py-2.5 px-4 text-center">Csomagolás</th>
                <th className="py-2.5 px-4 text-center">50 Ft DRS</th>
                <th className="py-2.5 px-4 text-center">Recept</th>
                <th className="py-2.5 px-4 text-right">Elérhető</th>
                <th className="py-2.5 px-4 text-right">Művelet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((m) => editing === m.id ? (
                <tr key={m.id} className="bg-amber-50/50">
                  <td className="py-3 px-4">
                    <div className="space-y-1.5">
                      <img
                        src={ed.image || LOGO_URL}
                        alt=""
                        className="h-10 w-12 object-cover rounded border border-neutral-200"
                      />
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, true)}
                        className="hidden"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="text-[10px] text-neutral-700 bg-white border border-neutral-300 rounded px-1.5 py-0.5 hover:bg-neutral-50"
                        >
                          PC Fájl
                        </button>
                        <input
                          type="text"
                          placeholder="vagy URL..."
                          value={ed.image || ''}
                          onChange={(e) => setEd({ ...ed, image: e.target.value })}
                          className="text-[10px] w-20 px-1 py-0.5 border rounded bg-white"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      value={ed.name}
                      onChange={(e) => setEd({ ...ed, name: e.target.value })}
                      className="w-full px-2 py-1 border rounded bg-white"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      value={ed.description}
                      onChange={(e) => setEd({ ...ed, description: e.target.value })}
                      className="w-full px-2 py-1 border rounded bg-white"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <input
                      type="number"
                      value={ed.price}
                      onChange={(e) => setEd({ ...ed, price: e.target.value })}
                      className="w-20 px-2 py-1 border rounded text-right bg-white"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <input
                      type="number"
                      value={ed.priceFoodora ?? ''}
                      onChange={(e) => setEd({ ...ed, priceFoodora: e.target.value })}
                      className="w-20 px-2 py-1 border rounded text-right bg-white"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <input
                      type="number"
                      value={ed.priceFalatozz ?? ''}
                      onChange={(e) => setEd({ ...ed, priceFalatozz: e.target.value })}
                      className="w-20 px-2 py-1 border rounded text-right bg-white"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="0 Ft"
                        value={ed.packagingFee ?? ''}
                        onChange={(e) => setEd({ ...ed, packagingFee: e.target.value })}
                        className="w-16 px-1.5 py-1 border rounded text-right bg-white text-xs"
                      />
                      <span className="text-[11px] text-neutral-500">Ft</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setEd({ ...ed, drsFeeEnabled: !ed.drsFeeEnabled })}
                      className={`text-xs px-2.5 py-1 rounded-full border font-semibold inline-flex items-center gap-1 transition-colors ${
                        ed.drsFeeEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                      }`}
                    >
                      <Recycle size={12} /> {ed.drsFeeEnabled ? '50 Ft' : 'Ki'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center text-neutral-400">—</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => saveEdit(m.id)}
                      className="h-8 w-8 rounded-md bg-emerald-600 text-white inline-flex items-center justify-center mr-1 hover:bg-emerald-700 shadow-xs"
                      title="Mentés"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="h-8 w-8 rounded-md border border-neutral-300 text-neutral-600 inline-flex items-center justify-center hover:bg-white"
                      title="Mégse"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={m.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-2.5 px-4">
                    <img
                      src={m.image || LOGO_URL}
                      alt={m.name}
                      className="h-10 w-12 object-cover rounded-md border border-neutral-200 shadow-2xs bg-neutral-100"
                      onError={(e) => { e.currentTarget.src = LOGO_URL; }}
                    />
                  </td>
                  <td className="py-2.5 px-4 font-bold text-neutral-900">{m.name}</td>
                  <td className="py-2.5 px-4 text-neutral-600 max-w-xs truncate">{m.description}</td>
                  <td className="py-2.5 px-4 text-right font-extrabold text-neutral-900">{formatFt(m.price)}</td>
                  <td className="py-2.5 px-4 text-right text-neutral-700 font-medium">
                    {m.priceFoodora ? formatFt(m.priceFoodora) : <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="py-2.5 px-4 text-right text-neutral-700 font-medium">
                    {m.priceFalatozz ? formatFt(m.priceFalatozz) : <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="py-2.5 px-4 text-center text-xs text-neutral-700 font-medium">
                    {m.packagingFee > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                        <Package size={11} /> {formatFt(m.packagingFee)}
                      </span>
                    ) : (
                      <span className="text-neutral-400">0 Ft</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => updateMenuItem(m.id, { drsFeeEnabled: !m.drsFeeEnabled })}
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold inline-flex items-center gap-1 transition-colors ${
                        m.drsFeeEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:text-neutral-600'
                      }`}
                      title="Kattintással ki/be kapcsolható a termék 50 Ft-os DRS díja"
                    >
                      <Recycle size={11} /> {m.drsFeeEnabled ? '50 Ft' : 'Nincs'}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => setRecipeFor(m.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                        (m.recipe || []).length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                      }`}
                    >
                      <ChefHat size={12} /> {(m.recipe || []).length > 0 ? `${(m.recipe || []).length} alapanyag` : 'Recept'}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => updateMenuItem(m.id, { available: !m.available })}
                      className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                        m.available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                      }`}
                    >
                      {m.available ? 'Elérhető' : 'Nem'}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditing(m.id);
                        setEd({
                          ...m,
                          priceFoodora: m.priceFoodora || '',
                          priceFalatozz: m.priceFalatozz || '',
                          packagingFee: m.packagingFee ?? '',
                          drsFeeEnabled: Boolean(m.drsFeeEnabled),
                          image: m.image || '',
                        });
                      }}
                      className="h-8 w-8 rounded-md border border-neutral-200 text-neutral-500 inline-flex items-center justify-center mr-1 hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Biztosan törlöd a(z) ${m.name} tételt?`)) return;
                        await deleteMenuItem(m.id);
                        toast.success('Termék törölve');
                      }}
                      className="h-8 w-8 rounded-md border border-neutral-200 text-rose-500 inline-flex items-center justify-center hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-500">
                    Nincs termék ebben a kategóriában.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {recipeItem && (
        <RecipeModal
          item={recipeItem}
          inventory={inventory}
          onClose={() => setRecipeFor(null)}
          onSave={async (recipe) => { await updateMenuItem(recipeItem.id, { recipe }); toast.success('Recept mentve'); setRecipeFor(null); }}
        />
      )}
    </div>
  );
};

const RecipeModal = ({ item, inventory, onClose, onSave }) => {
  const [rows, setRows] = useState(() => (item.recipe || []).map((r) => {
    const inv = inventory.find((i) => i.id === r.inventoryId);
    return {
      inventoryId: r.inventoryId,
      qty: r.qty !== undefined ? Number(r.qty) : 1,
      unit: r.unit || getDefaultRecipeUnit(inv?.unit),
    };
  }));

  const initialInvId = inventory[0]?.id || '';
  const initialBaseUnit = inventory[0]?.unit || 'db';

  const [pick, setPick] = useState({
    inventoryId: initialInvId,
    qty: getDefaultRecipeUnit(initialBaseUnit) === 'g' ? 200 : getDefaultRecipeUnit(initialBaseUnit) === 'ml' ? 80 : 1,
    unit: getDefaultRecipeUnit(initialBaseUnit),
  });

  const handlePickInvChange = (id) => {
    const inv = inventory.find((i) => i.id === id);
    const defUnit = getDefaultRecipeUnit(inv?.unit);
    setPick({
      inventoryId: id,
      qty: defUnit === 'g' ? 200 : defUnit === 'ml' ? 80 : 1,
      unit: defUnit,
    });
  };

  const addRow = () => {
    if (!pick.inventoryId || !pick.qty) return toast.error('Válassz alapanyagot és mennyiséget');
    if (rows.find((r) => r.inventoryId === pick.inventoryId)) return toast.error('Ez az alapanyag már szerepel a receptben');
    setRows([...rows, { inventoryId: pick.inventoryId, qty: Number(pick.qty), unit: pick.unit }]);
    const nextInv = inventory.find((i) => !rows.some((r) => r.inventoryId === i.id) && i.id !== pick.inventoryId) || inventory[0];
    if (nextInv) {
      handlePickInvChange(nextInv.id);
    }
  };

  const setRowQty = (id, val) => {
    setRows(rows.map((r) => (r.inventoryId === id ? { ...r, qty: Number(val) } : r)));
  };

  const setRowUnit = (id, unit) => {
    setRows(rows.map((r) => (r.inventoryId === id ? { ...r, unit } : r)));
  };

  const removeRow = (id) => {
    setRows(rows.filter((r) => r.inventoryId !== id));
  };

  const currentPickInv = inventory.find((i) => i.id === pick.inventoryId);
  const pickAvailableUnits = getRecipeUnitsForBaseUnit(currentPickInv?.unit);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Recept és alapanyag normák</div>
            <h3 className="text-lg font-extrabold text-neutral-900 inline-flex items-center gap-2">
              <ChefHat size={20} className="text-amber-500" /> {item.name}
            </h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-full border border-neutral-200 text-neutral-500 flex items-center justify-center hover:bg-neutral-100">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Add item control bar */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-2">
            <div className="text-xs font-bold text-neutral-700 flex items-center justify-between">
              <span>Alapanyag hozzáadása a recepthez:</span>
              <span className="text-[11px] font-normal text-neutral-500">Add meg, hány gramm, dl, vagy darab kell egy adaghoz</span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <select
                value={pick.inventoryId}
                onChange={(e) => handlePickInvChange(e.target.value)}
                className="col-span-12 sm:col-span-6 px-3 py-2 rounded-lg border border-neutral-300 text-sm bg-white font-medium"
              >
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} (készlet egysége: {inv.unit})
                  </option>
                ))}
                {inventory.length === 0 && <option value="">Nincs alapanyag – vedd fel a Készlet menüben</option>}
              </select>

              <div className="col-span-8 sm:col-span-4 flex items-center gap-1.5">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={pick.qty}
                  onChange={(e) => setPick({ ...pick, qty: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm bg-white font-bold text-right"
                  placeholder="Mennyiség"
                />
                <select
                  value={pick.unit}
                  onChange={(e) => setPick({ ...pick, unit: e.target.value })}
                  className="px-2.5 py-2 rounded-lg border border-neutral-300 text-xs bg-white font-semibold shrink-0"
                >
                  {pickAvailableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={addRow}
                className="col-span-4 sm:col-span-2 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1 shadow-xs transition-colors"
              >
                <Plus size={14} /> Hozzáad
              </button>
            </div>

            {currentPickInv && (
              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 pt-1">
                <span>Levonás ebből a készletből:</span>
                <span className="font-bold text-neutral-800">
                  {convertUnit(pick.qty || 0, pick.unit, currentPickInv.unit)} {currentPickInv.unit}
                </span>
                <span>/ adag</span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-xs">
                <tr>
                  <th className="py-2.5 px-3 text-left">Alapanyag</th>
                  <th className="py-2.5 px-3 text-right">Mennyiség / adag</th>
                  <th className="py-2.5 px-3 text-left">Mértékegység</th>
                  <th className="py-2.5 px-3 text-right">Fogyás a készletből</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((r) => {
                  const inv = inventory.find((i) => i.id === r.inventoryId);
                  const availableUnits = getRecipeUnitsForBaseUnit(inv?.unit);
                  const baseDeduction = convertUnit(r.qty || 0, r.unit || inv?.unit, inv?.unit || 'db');

                  return (
                    <tr key={r.inventoryId} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-3 font-bold text-neutral-900">
                        {inv?.name || 'Ismeretlen alapanyag'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={r.qty}
                          onChange={(e) => setRowQty(r.inventoryId, e.target.value)}
                          className="w-24 px-2 py-1 border border-neutral-200 rounded-md text-right font-bold bg-white focus:border-neutral-900"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        <select
                          value={r.unit}
                          onChange={(e) => setRowUnit(r.inventoryId, e.target.value)}
                          className="px-2 py-1 rounded-md border border-neutral-200 text-xs bg-white font-medium"
                        >
                          {availableUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.id}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-neutral-600">
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-semibold border border-amber-200">
                          {baseDeduction} {inv?.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => removeRow(r.inventoryId)}
                          className="h-7 w-7 rounded-md border border-neutral-200 text-rose-500 inline-flex items-center justify-center hover:bg-rose-50 transition-colors"
                          title="Törlés a receptből"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-neutral-400">
                      Még nincs recept beállítva ehhez az ételhez. Válassz ki alapanyagokat a fenti űrlapon.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            💡 <strong>Hogyan működik a fogyás?</strong> Amikor leadnak vagy felveszel egy rendelést ebből az ételből (pl. 2 db pizza), a rendszer a fenti recept alapján automatikusan levonja a megfelelő grammokat/darabokat a raktárkészletből.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-2 bg-neutral-50/50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-white">
            Mégsem
          </button>
          <button
            onClick={() => onSave(rows)}
            className="px-5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs"
          >
            <Check size={15} /> Recept mentése ({rows.length} alapanyag)
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuAdmin;
