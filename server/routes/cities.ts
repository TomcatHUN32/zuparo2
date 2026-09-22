import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ZoneModel, CityModel } from '../../serverModels';

const router = Router();

// GET /api/cities
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Try ZoneModel first, fallback to CityModel
    let zones = await ZoneModel.find({}).sort({ city: 1 });
    if (!zones.length) {
      const cities = await CityModel.find({}).sort({ name: 1 });
      if (cities.length) {
        return res.json(
          cities.map((c) => ({
            id: c.id,
            city: c.name,
            name: c.name,
            fee: c.deliveryFee,
            deliveryFee: c.deliveryFee,
            zip: c.zip || '',
            minOrder: c.minOrder || 0,
          }))
        );
      }
    }
    res.json(
      zones.map((z) => ({
        id: z.id,
        city: z.city,
        name: z.city,
        fee: z.fee,
        deliveryFee: z.fee,
        zip: z.zip || '',
        minOrder: z.minOrder || 0,
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a települések lekérésekor.' });
  }
});

// POST /api/cities
router.post('/', async (req: Request, res: Response) => {
  try {
    const name = req.body.name || req.body.city;
    const fee = Number(req.body.deliveryFee !== undefined ? req.body.deliveryFee : req.body.fee) || 0;
    const zip = req.body.zip || '';
    const minOrder = Number(req.body.minOrder) || 0;
    const id = req.body.id || crypto.randomUUID();

    const zone = await ZoneModel.create({
      id,
      city: name,
      fee,
      zip,
      minOrder,
    });

    // Also sync to legacy CityModel
    try {
      await CityModel.create({
        id,
        name,
        deliveryFee: fee,
        zip,
        minOrder,
        active: true,
      });
    } catch {}

    res.json(zone);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a település mentésekor.' });
  }
});

// DELETE /api/cities/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ZoneModel.findOneAndDelete({ id });
    await CityModel.findOneAndDelete({ id });
    res.json({ success: true, message: 'Település törölve.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a törléskor.' });
  }
});

export default router;
