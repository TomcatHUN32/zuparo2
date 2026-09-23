import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { CategoryModel, MenuItemModel } from '../../serverModels';

const router = Router();

// Schema to permanently remember deleted categories so auto-discovery NEVER resurrects them!
const DeletedCategorySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  deletedAt: { type: Date, default: Date.now },
});
const DeletedCategoryModel = mongoose.models.DeletedCategory || mongoose.model('DeletedCategory', DeletedCategorySchema);
const inMemoryDeletedCategories = new Set<string>();
let inMemoryCategories: any[] = [
  { id: 'hamburgerek', name: 'Hamburgerek', icon: 'Beef', order: 1 },
  { id: 'gyros-talak-pita', name: 'Gyros Tálak/Pita', icon: 'Utensils', order: 2 },
  { id: 'langos', name: 'Lángos', icon: 'Flame', order: 3 },
  { id: 'uditok', name: 'Üdítők', icon: 'CupSoda', order: 4 },
  { id: 'box', name: 'Box', icon: 'Package', order: 5 },
  { id: 'koret', name: 'Köret', icon: 'Salad', order: 6 },
];

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const isMongo = mongoose.connection.readyState === 1;
    let cats: any[] = [];

    if (isMongo) {
      cats = await CategoryModel.find({}).sort({ order: 1, name: 1 }).lean().catch(() => []);
    } else {
      cats = inMemoryCategories.map(c => ({ ...c }));
    }
    
    // Load permanently deleted categories
    const deletedKeys = new Set<string>(inMemoryDeletedCategories);
    if (isMongo) {
      try {
        const deletedDocs = await DeletedCategoryModel.find().lean();
        deletedDocs.forEach((d: any) => {
          if (d?.key) deletedKeys.add(String(d.key).toLowerCase().trim());
        });
      } catch {}
    }

    // Exclude any deleted categories from result
    const activeCats = cats.filter((c: any) => {
      const idKey = (c.id || '').toLowerCase().trim();
      const nameKey = (c.name || '').toLowerCase().trim();
      return !deletedKeys.has(idKey) && !deletedKeys.has(nameKey);
    });

    const existingCatKeys = new Set(
      activeCats.flatMap((c: any) => [
        (c.id || '').toLowerCase().trim(),
        (c.name || '').toLowerCase().trim(),
      ]).filter(Boolean)
    );

    const discoveredCategories: string[] = [];
    if (isMongo) {
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
    }

    // Auto-register only categories that are NOT marked as deleted
    for (const rawCat of discoveredCategories) {
      if (!rawCat || typeof rawCat !== 'string') continue;
      const trimmed = rawCat.trim();
      if (!trimmed || trimmed === 'all') continue;
      const lower = trimmed.toLowerCase();
      // CRITICAL: NEVER auto-register a category that was deleted by the user!
      if (deletedKeys.has(lower)) continue;

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

        const newCatDoc = { id: slugId, name: trimmed, icon, order: activeCats.length + 10 };

        if (isMongo) {
          try {
            const created = await CategoryModel.findOneAndUpdate(
              { $or: [{ id: slugId }, { name: trimmed }] },
              newCatDoc,
              { upsert: true, new: true }
            ).lean();

            if (created) {
              activeCats.push(created);
            }
          } catch (e) {
            console.warn('Error auto-registering category:', trimmed, e);
          }
        } else {
          activeCats.push(newCatDoc);
          inMemoryCategories.push(newCatDoc);
        }
      }
    }

    const mapped = (activeCats || []).map((c: any) => ({
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

    const newCatData = {
      id: catId,
      name: name.trim(),
      icon: icon || 'Utensils',
      order: Number(order) || 0,
    };

    const isMongo = mongoose.connection.readyState === 1;
    if (isMongo) {
      const newCat = await CategoryModel.findOneAndUpdate(
        {
          $or: [
            { id: catId },
            { name: new RegExp('^' + name.trim() + '$', 'i') }
          ]
        },
        newCatData,
        { upsert: true, new: true }
      );
      res.json({
        ...(newCat.toObject ? newCat.toObject() : newCat),
        id: newCat.id || catId,
      });
    } else {
      const idx = inMemoryCategories.findIndex(c => c.id === catId || c.name.toLowerCase() === name.trim().toLowerCase());
      if (idx >= 0) {
        inMemoryCategories[idx] = { ...inMemoryCategories[idx], ...newCatData };
      } else {
        inMemoryCategories.push(newCatData);
      }
      res.json(newCatData);
    }
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

    const isMongo = mongoose.connection.readyState === 1;
    if (isMongo) {
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
    } else {
      const idx = inMemoryCategories.findIndex(c => c.id === id || c.name === id);
      if (idx >= 0) {
        inMemoryCategories[idx] = { ...inMemoryCategories[idx], ...updateData };
      }
      res.json({ id, ...updateData });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategória módosításakor.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    const lowerId = id.toLowerCase().trim();
    const lowerDecoded = decodedId.toLowerCase().trim();

    // 1. Permanently record as deleted so auto-discovery NEVER resurrects it!
    inMemoryDeletedCategories.add(lowerId);
    inMemoryDeletedCategories.add(lowerDecoded);
    inMemoryCategories = inMemoryCategories.filter(
      c => c.id !== id && c.id !== decodedId && c.name?.toLowerCase() !== lowerId && c.name?.toLowerCase() !== lowerDecoded
    );

    const isMongo = mongoose.connection.readyState === 1;
    if (isMongo) {
      try {
        await DeletedCategoryModel.findOneAndUpdate(
          { key: lowerId },
          { key: lowerId, deletedAt: new Date() },
          { upsert: true }
        );
        if (lowerDecoded !== lowerId) {
          await DeletedCategoryModel.findOneAndUpdate(
            { key: lowerDecoded },
            { key: lowerDecoded, deletedAt: new Date() },
            { upsert: true }
          );
        }
      } catch {}

      const orConditions: any[] = [
        { id: id },
        { id: decodedId },
        { id: lowerId },
        { id: lowerDecoded },
        { name: id },
        { name: decodedId },
        { name: new RegExp('^' + decodedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
      ];
      if (mongoose.isValidObjectId(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }

      // 2. Remove from CategoryModel & categories collection
      await CategoryModel.deleteMany({ $or: orConditions }).catch(() => {});
      if (mongoose.connection?.db) {
        await mongoose.connection.db.collection('categories').deleteMany({ $or: orConditions }).catch(() => {});
      }

      // 3. Handle dishes belonging to this category
      const deleteDishes = req.query.deleteDishes === 'true';
      const moveToParam = req.query.moveTo ? String(req.query.moveTo).trim() : '';

      if (deleteDishes) {
        await MenuItemModel.deleteMany({
          $or: orConditions.map((c) => ({ category: c.id || c.name || c.key }))
        }).catch(() => {});
        if (mongoose.connection?.db) {
          await mongoose.connection.db.collection('products').deleteMany({
            $or: orConditions.map((c) => ({ category: c.id || c.name || c.key }))
          }).catch(() => {});
        }
      } else {
        // Find fallback category (which must NOT be the one being deleted)
        let targetCat = moveToParam;
        if (!targetCat) {
          const otherCat = await CategoryModel.findOne({
            $and: [
              { id: { $nin: [id, decodedId, lowerId, lowerDecoded] } },
              { name: { $nin: [id, decodedId, lowerId, lowerDecoded] } },
            ]
          }).lean();
          targetCat = (otherCat as any)?.name || (otherCat as any)?.id || '';
        }

        if (targetCat) {
          await MenuItemModel.updateMany(
            {
              $or: orConditions.map((c) => ({ category: c.id || c.name || c.key }))
            },
            { $set: { category: targetCat } }
          ).catch(() => {});

          if (mongoose.connection?.db) {
            await mongoose.connection.db.collection('products').updateMany(
              {
                $or: orConditions.map((c) => ({ category: c.id || c.name || c.key }))
              },
              { $set: { category: targetCat } }
            ).catch(() => {});
          }
        }
      }
    }

    res.json({ success: true, message: 'Kategória sikeresen törölve.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kategória törlésekor.' });
  }
});

export default router;
