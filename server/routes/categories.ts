import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { CategoryModel, MenuItemModel } from '../../serverModels';

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
    const cats = await CategoryModel.find({}).sort({ order: 1, name: 1 }).lean();
    
    // Also discover any category that exists on menu items (e.g. Hamburger, Gyros Tálak/Pita, Üdítők, Lángos, Köret, Box, egyeb)
    const existingCatKeys = new Set(
      cats.flatMap((c: any) => [
        (c.id || '').toLowerCase().trim(),
        (c.name || '').toLowerCase().trim(),
      ]).filter(Boolean)
    );

    const discoveredCategories: string[] = [];
    try {
      const distinctMenuItems = await MenuItemModel.distinct('category').catch(() => []);
      discoveredCategories.push(...distinctMenuItems);
    } catch {}

    if (mongoose.connection?.db) {
      try {
        const distinctProducts = await mongoose.connection.db.collection('products').distinct('category').catch(() => []);
        discoveredCategories.push(...distinctProducts);
      } catch {}
    }

    // Auto-register any category used in products that is not yet in CategoryModel
    for (const rawCat of discoveredCategories) {
      if (!rawCat || typeof rawCat !== 'string') continue;
      const trimmed = rawCat.trim();
      if (!trimmed || trimmed === 'all') continue;
      const lower = trimmed.toLowerCase();
      if (!existingCatKeys.has(lower)) {
        existingCatKeys.add(lower);
        // create clean slug id
        const slugId = trimmed
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') || `cat-${Date.now()}`;
        
        let icon = 'Utensils';
        if (lower.includes('hamburg')) icon = 'Beef';
        else if (lower.includes('gyros') || lower.includes('pita')) icon = 'Utensils';
        else if (lower.includes('udit') || lower.includes('ital')) icon = 'CupSoda';
        else if (lower.includes('langos')) icon = 'Flame';
        else if (lower.includes('koret') || lower.includes('salat')) icon = 'Salad';
        else if (lower.includes('box')) icon = 'Package';
        else if (lower.includes('pizza')) icon = 'Pizza';
        else if (lower.includes('desszert') || lower.includes('edess')) icon = 'CakeSlice';

        try {
          const created = await CategoryModel.findOneAndUpdate(
            { $or: [{ id: slugId }, { name: trimmed }] },
            { id: slugId, name: trimmed, icon, order: cats.length + 10 },
            { upsert: true, new: true }
          ).lean();

          if (created) {
            cats.push(created);
          }
        } catch (e) {
          console.warn('Error auto-registering category:', trimmed, e);
        }
      }
    }

    const mapped = (cats || []).map((c: any) => ({
      ...c,
      id: c.id || c._id?.toString(),
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategóriák lekérésekor.' });
  }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, id, icon, order } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'A kategória neve kötelező!' });

    // Auto generate clean slug id if not provided
    const catId = (id || name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

    const newCat = await CategoryModel.findOneAndUpdate(
      {
        $or: [
          { id: catId },
          { name: new RegExp('^' + name.trim() + '$', 'i') }
        ]
      },
      {
        id: catId,
        name: name.trim(),
        icon: icon || 'Utensils',
        order: Number(order) || 0,
      },
      { upsert: true, new: true }
    );

    res.json({
      ...(newCat.toObject ? newCat.toObject() : newCat),
      id: newCat.id || catId,
    });
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

    const orConditions: any[] = [
      { id: id },
      { id: id.toLowerCase() },
      { name: id },
      { name: new RegExp('^' + id + '$', 'i') },
    ];
    if (mongoose.isValidObjectId(id)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
    }

    let updated = await CategoryModel.findOneAndUpdate(
      { $or: orConditions },
      updateData,
      { new: true }
    );

    if (!updated) {
      updated = await CategoryModel.create({
        id,
        name: name ? name.trim() : id,
        icon: icon || 'Utensils',
        order: Number(order) || 0,
      });
    }

    if (name) {
      const newName = name.trim();
      const oldKeys = [id, decodeURIComponent(id), updated?.name].filter(Boolean);
      await MenuItemModel.updateMany(
        { category: { $in: oldKeys } },
        { $set: { category: newName } }
      ).catch(() => {});
      if (mongoose.connection?.db) {
        await mongoose.connection.db.collection('products').updateMany(
          { category: { $in: oldKeys } },
          { $set: { category: newName } }
        ).catch(() => {});
      }
    }

    res.json({
      ...(updated.toObject ? updated.toObject() : updated),
      id: updated.id || id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategória módosításakor.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    const orConditions: any[] = [
      { id: id },
      { id: decodedId },
      { id: id.toLowerCase() },
      { id: decodedId.toLowerCase() },
      { name: id },
      { name: decodedId },
      { name: new RegExp('^' + decodedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
    ];
    if (mongoose.isValidObjectId(id)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
    }

    await CategoryModel.deleteMany({ $or: orConditions }).catch(() => {});

    if (mongoose.connection?.db) {
      await mongoose.connection.db.collection('categories').deleteMany({ $or: orConditions }).catch(() => {});
      // Also update any dishes in products so they don't resurrect the deleted category
      await mongoose.connection.db.collection('products').updateMany(
        {
          $or: [
            { category: id },
            { category: decodedId },
            { category: new RegExp('^' + decodedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
          ]
        },
        { $set: { category: 'egyeb' } }
      ).catch(() => {});
    }

    // Always succeed idempotently: deleting a non-existing item is already satisfied!
    res.json({ success: true, message: 'Kategória törölve.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategória törlésekor.' });
  }
});

export default router;
