import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { CATEGORIES as INITIAL_CATEGORIES, formatFt, LOGO_URL } from '../../mock/mockData';
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChefHat,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Scale,
  ArrowRight,
  Package,
  Recycle,
  FolderPlus,
  Settings2,
  Folder,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CheckSquare,
  Square,
  CheckCheck
} from 'lucide-react';
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

const normalizeCatMatch = (itemCat, targetCatId, allCategories = []) => {
  if (!itemCat || !targetCatId) return false;
  if (targetCatId === 'all') return true;
  const ic = String(itemCat).toLowerCase().trim();
  const tc = String(targetCatId).toLowerCase().trim();
  if (ic === tc) return true;
  if (Array.isArray(allCategories) && allCategories.length > 0) {
    const catObj = allCategories.find((c) => c?.id?.toLowerCase() === tc || c?.name?.toLowerCase() === tc);
    if (catObj) {
      if (ic === catObj.id?.toLowerCase() || ic === catObj.name?.toLowerCase()) return true;
    }
  }
  const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (stripAccents(ic) === stripAccents(tc)) return true;
  return false;
};

const MenuAdmin = () => {
  const {
    menu,
    inventory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    batchUpdateAvailability,
    batchDeleteMenuItems,
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  } = useData();
  const currentCategories = Array.isArray(categories) ? categories : [];
  const [cat, setCat] = useState('all');
  const [draft, setDraft] = useState(() => ({ ...empty, category: currentCategories[0]?.id || 'egyeb' }));
  const [editing, setEditing] = useState(null);
  const [ed, setEd] = useState(empty);
  const [recipeFor, setRecipeFor] = useState(null); // menu item id
  const [imageMode, setImageMode] = useState('pc'); // 'pc' | 'url'
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Category Management State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) return toast.error('Kérjük, add meg a kategória nevét!');
    setCatLoading(true);
    try {
      const created = await addCategory({ name: newCatName.trim() });
      setNewCatName('');
      setCat(created.id);
      setDraft((prev) => ({ ...prev, category: created.id }));
      toast.success(`"${created.name}" kategória sikeresen létrehozva!`);
    } catch (err) {
      toast.error('Hiba a kategória létrehozásakor');
    } finally {
      setCatLoading(false);
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editingCatName.trim()) return toast.error('A kategória neve nem lehet üres!');
    setCatLoading(true);
    try {
      await updateCategory(id, { name: editingCatName.trim() });
      setEditingCatId(null);
      setEditingCatName('');
      toast.success('Kategória sikeresen átnevezve!');
    } catch (err) {
      toast.error('Hiba a kategória módosításakor');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    const dishesInCat = menu.filter((m) =>
      normalizeCatMatch(m.category, id, allCategories) ||
      normalizeCatMatch(m.category, name, allCategories)
    );
    let confirmMsg = `Biztosan törölni szeretnéd a(z) "${name}" kategóriát?`;
    if (dishesInCat.length > 0) {
      confirmMsg = `Figyelem! Ebben a kategóriában (${name}) jelenleg ${dishesInCat.length} db étel van!\n\nBiztosan törlöd a kategóriát?`;
    }
    if (!window.confirm(confirmMsg)) return;

    setCatLoading(true);
    try {
      await deleteCategory(id, name);
      // Clean up local menu items that had this category
      menu.forEach((m) => {
        if (
          normalizeCatMatch(m.category, id, allCategories) ||
          normalizeCatMatch(m.category, name, allCategories)
        ) {
          updateMenuItem(m.id, { category: 'egyeb' }).catch(() => {});
        }
      });
      if (cat === id || cat === name) {
        setCat('all');
        setDraft((prev) => ({ ...prev, category: '' }));
      }
      toast.success(`"${name}" kategória sikeresen törölve.`);
    } catch (err) {
      console.error('Delete category error:', err);
      toast.error('Hiba a kategória törlésekor');
    } finally {
      setCatLoading(false);
    }
  };

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
      category: ed.category || cat,
      image: ed.image || '',
    });
    setEditing(null);
    toast.success('Mentve');
  };

  // Combine defined categories with any categories present on menu items
  const allCategories = React.useMemo(() => {
    const list = [...currentCategories];
    const seenIds = new Set(list.map((c) => c.id.toLowerCase()));
    const seenNames = new Set(list.map((c) => c.name.toLowerCase()));
    menu.forEach((m) => {
      if (m.category && !seenIds.has(m.category.toLowerCase()) && !seenNames.has(m.category.toLowerCase())) {
        seenIds.add(m.category.toLowerCase());
        list.push({ id: m.category, name: m.category });
      }
    });
    return list;
  }, [currentCategories, menu]);

  const isCatMatch = (itemCat, targetCatId) => normalizeCatMatch(itemCat, targetCatId, allCategories);

  const items = menu.filter((m) => cat === 'all' ? true : isCatMatch(m.category, cat));
  const recipeItem = menu.find((m) => m.id === recipeFor);

  // Multi-selection state & batch action handlers
  const [selectedIds, setSelectedIds] = useState([]);

  const isAllSelected = items.length > 0 && items.every((m) => selectedIds.includes(m.id));
  const isSomeSelected = items.some((m) => selectedIds.includes(m.id)) && !isAllSelected;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const visibleSet = new Set(items.map((m) => m.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const newSelected = new Set([...selectedIds, ...items.map((m) => m.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  const handleBatchAvailability = async (available) => {
    if (selectedIds.length === 0) return;
    try {
      await batchUpdateAvailability(selectedIds, available);
      toast.success(
        available
          ? `${selectedIds.length} db étel elérhetővé téve!`
          : `${selectedIds.length} db étel nem elérhetőként (elfogyottként) beállítva!`
      );
    } catch (e) {
      console.error(e);
      toast.error('Hiba az állapot módosításakor');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Biztosan törölni szeretnéd a kijelölt ${selectedIds.length} db tételt?`)) return;
    try {
      await batchDeleteMenuItems(selectedIds);
      setSelectedIds([]);
      toast.success('Kijelölt ételek sikeresen törölve.');
    } catch (e) {
      console.error(e);
      toast.error('Hiba a kijelölt ételek törlésekor');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Category selector & Management Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Folder className="text-amber-500" size={18} />
            <h2 className="text-sm font-bold text-neutral-900 tracking-wide">ÉTLAP KATEGÓRIÁK</h2>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-semibold">
              {allCategories.length} kategória • {menu.length} étel összesen
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <Settings2 size={14} />
              Kategóriák kezelése (Új / Szerkesztés / Törlés)
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Összes étel tab */}
          <button
            type="button"
            onClick={() => setCat('all')}
            className={`group px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-2 ${
              cat === 'all'
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs ring-2 ring-neutral-400/30'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
            }`}
          >
            <span>🌟 Összes étel</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                cat === 'all' ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-neutral-600 group-hover:bg-neutral-300'
              }`}
            >
              {menu.length}
            </span>
          </button>

          {allCategories.map((c) => {
            const count = menu.filter((m) => isCatMatch(m.category, c.id)).length;
            const isSelected = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCat(c.id);
                  setDraft((prev) => ({ ...prev, category: c.id }));
                }}
                className={`group px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-200 text-neutral-600 group-hover:bg-neutral-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 inline-flex items-center gap-1 transition-all"
          >
            <Plus size={13} />
            Új kategória
          </button>
        </div>
      </div>

      {/* New Food Item Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900 mb-3 flex items-center justify-between">
          <span>Új termék hozzáadása</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-neutral-500">Célkategória:</span>
            <select
              value={draft.category || cat}
              onChange={(e) => {
                setDraft({ ...draft, category: e.target.value });
                setCat(e.target.value);
              }}
              className="text-xs font-bold text-neutral-900 bg-neutral-100 border border-neutral-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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

      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg border border-neutral-800 flex flex-wrap items-center justify-between gap-3 sticky top-4 z-40 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold text-sm border border-amber-500/30">
              {selectedIds.length}
            </div>
            <div>
              <div className="font-bold text-sm text-white">{selectedIds.length} db étel kijelölve</div>
              <div className="text-[11px] text-neutral-400">Csoportos elérhetőség / műveletek:</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBatchAvailability(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 size={15} />
              Elérhetővé tétel ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={() => handleBatchAvailability(false)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <XCircle size={15} />
              Elfogyott / Nem elérhető ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-rose-400 border border-neutral-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kijelölt ételek végleges törlése"
            >
              <Trash2 size={14} />
              Törlés
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X size={14} />
              Mégse
            </button>
          </div>
        </div>
      )}

      {/* Menu items table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300 cursor-pointer accent-amber-500"
                    title={isAllSelected ? 'Kijelölés megszüntetése' : 'Összes kijelölése ezen a listán'}
                  />
                </th>
                <th className="py-2.5 px-4 text-left">Fotó</th>
                <th className="py-2.5 px-4 text-left">Név</th>
                <th className="py-2.5 px-4 text-left">Leírás</th>
                <th className="py-2.5 px-4 text-right">Házi</th>
                <th className="py-2.5 px-4 text-right">Foodora</th>
                <th className="py-2.5 px-4 text-right">Falatozz</th>
                <th className="py-2.5 px-4 text-center">Csomagolás</th>
                <th className="py-2.5 px-4 text-center">50 Ft DRS</th>
                <th className="py-2.5 px-4 text-center">Recept</th>
                <th className="py-2.5 px-4 text-right">Elérhetőség</th>
                <th className="py-2.5 px-4 text-right">Művelet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((m) => editing === m.id ? (
                <tr key={m.id} className="bg-amber-50/50">
                  <td className="py-3 px-3 text-center"></td>
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
                      className="w-full px-2 py-1 border rounded bg-white font-medium"
                    />
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[10px] text-neutral-400 font-medium">Kategória:</span>
                      <select
                        value={ed.category || cat}
                        onChange={(e) => setEd({ ...ed, category: e.target.value })}
                        className="text-[11px] px-1.5 py-0.5 border rounded bg-white text-neutral-700 font-semibold"
                      >
                        {allCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
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
                <tr
                  key={m.id}
                  className={`transition-colors ${
                    selectedIds.includes(m.id)
                      ? 'bg-amber-50/80 hover:bg-amber-100/70'
                      : m.available === false
                      ? 'bg-neutral-50/60 opacity-75 hover:bg-neutral-100/60'
                      : 'hover:bg-neutral-50/80'
                  }`}
                >
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300 cursor-pointer accent-amber-500"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <img
                      src={m.image || LOGO_URL}
                      alt={m.name}
                      className={`h-10 w-12 object-cover rounded-md border border-neutral-200 shadow-2xs bg-neutral-100 ${
                        m.available === false ? 'grayscale' : ''
                      }`}
                      onError={(e) => { e.currentTarget.src = LOGO_URL; }}
                    />
                  </td>
                  <td className="py-2.5 px-4 font-bold text-neutral-900">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={m.available === false ? 'line-through text-neutral-500' : ''}>
                        {m.name}
                      </span>
                      {m.available === false && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wide inline-flex items-center gap-0.5">
                          <AlertCircle size={10} /> Elfogyott
                        </span>
                      )}
                    </div>
                    {cat === 'all' && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {allCategories.find((c) => isCatMatch(m.category, c.id))?.name || m.category}
                      </span>
                    )}
                  </td>
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
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
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
                      className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 cursor-pointer ${
                        (m.recipe || []).length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                      }`}
                    >
                      <ChefHat size={12} /> {(m.recipe || []).length > 0 ? `${(m.recipe || []).length} alapanyag` : 'Recept'}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const nextAvail = !m.available;
                        updateMenuItem(m.id, { available: nextAvail });
                        toast.success(nextAvail ? `"${m.name}" elérhetővé téve` : `"${m.name}" elfogyottként megjelölve`);
                      }}
                      className={`text-xs px-3 py-1 rounded-full border font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                        m.available
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                      }`}
                      title={m.available ? 'Kattints ide, ha elfogyott!' : 'Kattints ide, ha újra rendelhető!'}
                    >
                      <span className={`w-2 h-2 rounded-full ${m.available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {m.available ? 'Elérhető' : 'Elfogyott'}
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
                  <td colSpan={12} className="py-12 text-center text-neutral-500">
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

      {showCategoryModal && (
        <CategoryModal
          categories={currentCategories}
          allCategories={allCategories}
          menu={menu}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCatId(null);
            setEditingCatName('');
          }}
          newCatName={newCatName}
          setNewCatName={setNewCatName}
          onCreateCategory={handleCreateCategory}
          editingCatId={editingCatId}
          setEditingCatId={setEditingCatId}
          editingCatName={editingCatName}
          setEditingCatName={setEditingCatName}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          loading={catLoading}
        />
      )}
    </div>
  );
};

const CategoryModal = ({
  categories,
  allCategories = [],
  menu,
  onClose,
  newCatName,
  setNewCatName,
  onCreateCategory,
  editingCatId,
  setEditingCatId,
  editingCatName,
  setEditingCatName,
  onUpdateCategory,
  onDeleteCategory,
  loading,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings2 className="text-amber-400" size={20} />
            <div>
              <h3 className="font-bold text-base text-white">Kategóriák kezelése</h3>
              <p className="text-xs text-neutral-400">Új létrehozása, szerkesztése vagy törlése</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white h-8 w-8 rounded-lg flex items-center justify-center hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Create new category */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
              <FolderPlus size={14} className="text-amber-700" />
              Új kategória létrehozása
            </h4>
            <form onSubmit={onCreateCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="Pl. Hamburgerek, Levesek, Saláták..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={loading || !newCatName.trim()}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Létrehozás
              </button>
            </form>
          </div>

          {/* List of categories */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Meglévő kategóriák ({categories.length})
            </h4>

            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
              {categories.map((c, idx) => {
                const catId = c.id || c._id || c.name;
                const dishCount = menu.filter((m) =>
                  normalizeCatMatch(m.category, catId, allCategories) ||
                  normalizeCatMatch(m.category, c.name, allCategories)
                ).length;
                const isEditing = editingCatId === catId;

                return (
                  <div key={catId || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors">
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onUpdateCategory(catId);
                            if (e.key === 'Escape') setEditingCatId(null);
                          }}
                          autoFocus
                          className="flex-1 px-2.5 py-1 text-sm border border-amber-400 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateCategory(catId)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                          title="Mentés"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="p-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-md transition-colors"
                          title="Mégse"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-semibold text-sm text-neutral-900 truncate">
                            {c.name}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-neutral-100 text-neutral-600">
                            {dishCount} db étel
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(catId);
                              setEditingCatName(c.name);
                            }}
                            className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-colors"
                            title="Átnevezés"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(catId, c.name)}
                            className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                            title="Kategória törlése"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Kész / Bezárás
          </button>
        </div>
      </div>
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
