import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { CourierModel, CustomerModel, InventoryModel, DayCloseModel, OrderModel } from '../../serverModels';

const router = Router();

// Couriers
router.get('/couriers', async (_req: Request, res: Response) => {
  try {
    const couriers = await CourierModel.find({});
    res.json(couriers);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült lekérni a futárokat.' });
  }
});

router.post('/couriers', async (req: Request, res: Response) => {
  try {
    const courier = await CourierModel.create({
      id: req.body.id || crypto.randomUUID(),
      name: req.body.name,
      phone: req.body.phone || '',
      active: req.body.active !== false,
    });
    res.json(courier);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a futár mentésekor.' });
  }
});

// Customers
router.get('/customers', async (_req: Request, res: Response) => {
  try {
    const customers = await CustomerModel.find({}).sort({ orderCount: -1 });
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült lekérni a vendégeket.' });
  }
});

// Inventory
router.get('/inventory', async (_req: Request, res: Response) => {
  try {
    const items = await InventoryModel.find({});
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült lekérni a raktárt.' });
  }
});

// Day close
router.get('/day-close', async (_req: Request, res: Response) => {
  try {
    const closes = await DayCloseModel.find({}).sort({ date: -1 });
    res.json(closes);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült lekérni a zárásokat.' });
  }
});

export default router;
