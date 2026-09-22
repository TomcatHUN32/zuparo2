import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ToppingModel } from '../../serverModels';

const router = Router();

// GET /api/toppings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const toppings = await ToppingModel.find({}).sort({ name: 1 });
    res.json(toppings);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a feltétek lekérésekor.' });
  }
});

// POST /api/toppings
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, price, category, available } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Feltét neve kötelező.' });
    const topping = await ToppingModel.create({
      id: req.body.id || crypto.randomUUID(),
      name,
      price: Number(price) || 0,
      category: category || 'Feltétek',
      available: available !== false,
    });
    res.json(topping);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a feltét mentésekor.' });
  }
});

// PUT /api/toppings/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topping = await ToppingModel.findOneAndUpdate({ id }, req.body, { new: true });
    if (!topping) return res.status(404).json({ error: 'Feltét nem található.' });
    res.json(topping);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a módosításkor.' });
  }
});

// DELETE /api/toppings/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topping = await ToppingModel.findOneAndDelete({ id });
    if (!topping) return res.status(404).json({ error: 'Feltét nem található.' });
    res.json({ success: true, message: 'Feltét törölve.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a törléskor.' });
  }
});

export default router;
