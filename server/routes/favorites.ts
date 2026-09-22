import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { FavoriteModel, MenuItemModel } from '../../serverModels';

const router = Router();

// GET /api/favorites/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const favorites = await FavoriteModel.find({ userId });
    const productIds = favorites.map((f) => f.productId);
    const products = await MenuItemModel.find({ id: { $in: productIds } });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kedvencek lekérésekor.' });
  }
});

// POST /api/favorites
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId és productId kötelező.' });

    const existing = await FavoriteModel.findOne({ userId, productId });
    if (existing) {
      return res.json({ success: true, message: 'Már a kedvencek között van.', favorite: existing });
    }

    const favorite = await FavoriteModel.create({
      id: crypto.randomUUID(),
      userId,
      productId,
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, favorite });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kedvenc mentésekor.' });
  }
});

// DELETE /api/favorites/:userId/:productId
router.delete('/:userId/:productId', async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.params;
    await FavoriteModel.findOneAndDelete({ userId, productId });
    res.json({ success: true, message: 'Eltávolítva a kedvencekből.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba az eltávolításkor.' });
  }
});

export default router;
