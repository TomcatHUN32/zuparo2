import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { CouponModel } from '../../serverModels';

const router = Router();

// GET /api/coupons
router.get('/', async (_req: Request, res: Response) => {
  try {
    const coupons = await CouponModel.find({}).sort({ code: 1 });
    res.json(coupons);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kuponok lekérésekor.' });
  }
});

// POST /api/coupons/validate
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Kuponkód megadása kötelező.' });
    const coupon = await CouponModel.findOne({
      code: String(code).toUpperCase().trim(),
      active: true,
    });
    if (!coupon) return res.status(404).json({ error: 'Érvénytelen vagy lejárt kuponkód.' });

    let discountAmount = 0;
    const sub = Number(subtotal) || 0;
    if (coupon.kind === 'percent') {
      discountAmount = Math.round((sub * coupon.value) / 100);
    } else {
      discountAmount = Math.min(sub, coupon.value);
    }

    res.json({
      valid: true,
      code: coupon.code,
      kind: coupon.kind,
      value: coupon.value,
      discountAmount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kupon ellenőrzésekor.' });
  }
});

// POST /api/coupons
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, kind, value, active } = req.body;
    if (!code || value === undefined) return res.status(400).json({ error: 'Kód és érték kötelező.' });
    const coupon = await CouponModel.create({
      id: req.body.id || crypto.randomUUID(),
      code: String(code).toUpperCase().trim(),
      kind: kind || 'percent',
      value: Number(value) || 0,
      active: active !== false,
    });
    res.json(coupon);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a kupon létrehozásakor.' });
  }
});

// DELETE /api/coupons/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await CouponModel.findOneAndDelete({ id });
    res.json({ success: true, message: 'Kupon törölve.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a törléskor.' });
  }
});

export default router;
