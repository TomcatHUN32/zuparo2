// Unit conversion and formatting utilities for ZUPARO Inventory & Recipes

export const WEIGHT_TO_GRAMS = {
  kg: 1000,
  kilogramm: 1000,
  dkg: 10,
  dekagramm: 10,
  g: 1,
  gramm: 1,
};

export const VOLUME_TO_ML = {
  l: 1000,
  liter: 1000,
  dl: 100,
  deciliter: 100,
  cl: 10,
  ml: 1,
  milliliter: 1,
};

/**
 * Converts quantity between units of the same category (e.g. g -> kg, ml -> l).
 */
export function convertUnit(qty, fromUnit, toUnit) {
  const q = Number(qty) || 0;
  if (q === 0) return 0;
  const from = (fromUnit || '').toLowerCase().trim();
  const to = (toUnit || '').toLowerCase().trim();
  if (!from || !to || from === to) return q;

  // Weight check
  if (WEIGHT_TO_GRAMS[from] && WEIGHT_TO_GRAMS[to]) {
    const inGrams = q * WEIGHT_TO_GRAMS[from];
    return inGrams / WEIGHT_TO_GRAMS[to];
  }

  // Volume check
  if (VOLUME_TO_ML[from] && VOLUME_TO_ML[to]) {
    const inMl = q * VOLUME_TO_ML[from];
    return inMl / VOLUME_TO_ML[to];
  }

  // Same unit or piece (db)
  return q;
}

/**
 * Returns available units for recipe definition based on the inventory item's base unit.
 */
export function getRecipeUnitsForBaseUnit(baseUnit) {
  const b = (baseUnit || '').toLowerCase().trim();
  if (['kg', 'g', 'dkg'].includes(b)) {
    return [
      { id: 'g', label: 'gramm (g)' },
      { id: 'dkg', label: 'dekagramm (dkg)' },
      { id: 'kg', label: 'kilogramm (kg)' },
    ];
  }
  if (['l', 'dl', 'ml', 'cl'].includes(b)) {
    return [
      { id: 'ml', label: 'milliliter (ml)' },
      { id: 'dl', label: 'deciliter (dl)' },
      { id: 'l', label: 'liter (l)' },
    ];
  }
  return [
    { id: 'db', label: 'darab (db)' },
    { id: 'adag', label: 'adag' },
    { id: 'csomag', label: 'csomag' },
  ];
}

/**
 * Returns default recipe unit for an inventory base unit (e.g. 'g' for 'kg' so cooks can enter 250 g)
 */
export function getDefaultRecipeUnit(baseUnit) {
  const b = (baseUnit || '').toLowerCase().trim();
  if (['kg', 'g', 'dkg'].includes(b)) return 'g';
  if (['l', 'dl', 'ml', 'cl'].includes(b)) return 'ml';
  return 'db';
}

/**
 * Formats a stock quantity nicely with compound units if applicable (e.g., 12 kg 500 g).
 */
export function formatStockDisplay(stockVal, unit) {
  const num = Number(stockVal) || 0;
  const u = (unit || '').toLowerCase().trim();

  if (u === 'kg') {
    const kgPart = Math.floor(num);
    const gPart = Math.round((num - kgPart) * 1000);
    if (gPart === 0) return `${kgPart} kg`;
    if (kgPart === 0) return `${gPart} g`;
    return `${kgPart} kg ${gPart} g`;
  }

  if (u === 'l') {
    const lPart = Math.floor(num);
    const mlPart = Math.round((num - lPart) * 1000);
    if (mlPart === 0) return `${lPart} l`;
    if (lPart === 0) return `${mlPart} ml`;
    return `${lPart} l ${mlPart} ml`;
  }

  return `${num} ${unit || 'db'}`;
}

/**
 * Splits a decimal value into main (e.g. kg) and secondary (e.g. g)
 */
export function splitCompoundStock(stockVal, unit) {
  const num = Number(stockVal) || 0;
  const u = (unit || '').toLowerCase().trim();

  if (u === 'kg' || u === 'l') {
    const main = Math.floor(num);
    const sub = Math.round((num - main) * 1000);
    return { main, sub };
  }

  return { main: num, sub: 0 };
}

/**
 * Combines main (e.g. kg) and sub (e.g. g) into decimal main
 */
export function combineCompoundStock(main, sub, unit) {
  const m = Math.max(0, Number(main) || 0);
  const s = Math.max(0, Number(sub) || 0);
  const u = (unit || '').toLowerCase().trim();

  if (u === 'kg' || u === 'l') {
    return Number((m + (s / 1000)).toFixed(4));
  }

  return m;
}
