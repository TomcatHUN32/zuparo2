import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ReviewModel } from '../../serverModels';

const router = Router();

// GET /api/reviews
router.get('/', async (_req: Request, res: Response) => {
  try {
    const reviews = await ReviewModel.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba az értékelések lekérésekor.' });
  }
});

// POST /api/reviews
router.post('/', async (req: Request, res: Response) => {
  try {
    const { orderId, userId, userName, rating, comment } = req.body || {};
    const review = await ReviewModel.create({
      id: req.body.id || crypto.randomUUID(),
      orderId: orderId || null,
      userId: userId || null,
      userName: userName || 'Vendég',
      rating: Number(rating) || 5,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    });
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba az értékelés mentésekor.' });
  }
});

export default router;
