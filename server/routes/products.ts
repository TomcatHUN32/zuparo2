import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { MenuItemModel } from '../../serverModels';

const router = Router();

// GET /api/products
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await MenuItemModel.find({}).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült lekérni a termékeket.' });
  }
});

// POST /api/products
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category, price, description, packagingFee, drsFeeEnabled, available, image } = req.body || {};
    if (!name || !price) {
      return res.status(400).json({ error: 'Név és ár megadása kötelező.' });
    }

    const id = req.body.id || crypto.randomUUID();
    const item = await MenuItemModel.create({
      id,
      name: name.trim(),
      category: category || 'Főételek',
      price: Number(price) || 0,
      description: description || '',
      packagingFee: Number(packagingFee) || 0,
      drsFeeEnabled: Boolean(drsFeeEnabled),
      available: available !== false,
      image: image || '',
      priceFoodora: Number(req.body.priceFoodora) || Number(price) || 0,
      priceFalatozz: Number(req.body.priceFalatozz) || Number(price) || 0,
      recipe: req.body.recipe || [],
    });

    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült létrehozni a terméket.' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await MenuItemModel.findOneAndUpdate({ id }, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Termék nem található.' });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a módosítás során.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await MenuItemModel.findOneAndDelete({ id });
    if (!item) return res.status(404).json({ error: 'Termék nem található.' });
    res.json({ success: true, message: 'Termék törölve.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a törlés során.' });
  }
});

export default router;
