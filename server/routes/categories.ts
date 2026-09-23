import { Router, Request, Response } from 'express';
import { CategoryModel } from '../../serverModels';

const router = Router();

// Default fallback categories
const DEFAULT_CATEGORIES = [
  { id: 'hazias', name: 'Házias ételek', icon: 'Utensils', order: 1 },
  { id: 'sultek', name: 'Sültek', icon: 'Beef', order: 2 },
  { id: 'pizzak', name: 'Pizza', icon: 'Pizza', order: 3 },
  { id: 'italok', name: 'Italok', icon: 'CupSoda', order: 4 },
  { id: 'hamburgerek', name: 'Hamburgerek', icon: 'Beef', order: 5 },
  { id: 'desszertek', name: 'Desszertek', icon: 'CakeSlice', order: 6 },
];

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    let cats = await CategoryModel.find({}).sort({ order: 1, name: 1 });
    if (!cats || cats.length === 0) {
      // Seed default categories
      await CategoryModel.insertMany(DEFAULT_CATEGORIES).catch(() => {});
      cats = await CategoryModel.find({}).sort({ order: 1, name: 1 });
    }
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategóriák lekérésekor.' });
  }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, id, icon, order } = req.body || {};
    if (!name) return res.status(400).json({ error: 'A kategória neve kötelező!' });
    
    // Auto generate clean slug id if not provided
    const catId = (id || name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

    const existing = await CategoryModel.findOne({ id: catId });
    if (existing) {
      return res.status(400).json({ error: `Ilyen azonosítójú kategória (${catId}) már létezik!` });
    }

    const newCat = await CategoryModel.create({
      id: catId,
      name: name.trim(),
      icon: icon || 'Utensils',
      order: Number(order) || 0,
    });
    res.json(newCat);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategória létrehozásakor.' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, icon, order } = req.body || {};
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (icon) updateData.icon = icon;
    if (order !== undefined) updateData.order = Number(order);

    const updated = await CategoryModel.findOneAndUpdate({ id }, updateData, { new: true });
    if (!updated) return res.status(404).json({ error: 'Kategória nem található.' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategória módosításakor.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await CategoryModel.findOneAndDelete({ id });
    if (!deleted) return res.status(404).json({ error: 'Kategória nem található.' });
    res.json({ success: true, message: 'Kategória törölve.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategória törlésekor.' });
  }
});

export default router;
