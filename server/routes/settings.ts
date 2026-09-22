import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { RestaurantStatusModel, ZoneModel, CouponModel } from '../../serverModels';

const router = Router();

// GET /api/settings/status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    let status = await RestaurantStatusModel.findOne({ id: 'singleton_status' });
    if (!status) {
      status = await RestaurantStatusModel.create({
        id: 'singleton_status',
        isOpen: true,
        allowOrder247: true,
        customNotice: '0-24 órában fogadjuk a rendeléseket! Kiszállítás és átvétel zavartalan.',
        packagingFeeEnabled: true,
        packagingFee: 200,
        drsFeeEnabled: true,
        drsFee: 50,
      });
    }
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba az állapot lekérésekor.' });
  }
});

// POST / PUT /api/settings/status
router.post('/status', async (req: Request, res: Response) => {
  try {
    const updated = await RestaurantStatusModel.findOneAndUpdate(
      { id: 'singleton_status' },
      { ...req.body, lastChangedAt: new Date().toISOString() },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a mentés során.' });
  }
});

// GET /api/settings/zones
router.get('/zones', async (_req: Request, res: Response) => {
  try {
    const zones = await ZoneModel.find({}).sort({ city: 1 });
    res.json(zones);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült lekérni a zónákat.' });
  }
});

// POST /api/settings/zones
router.post('/zones', async (req: Request, res: Response) => {
  try {
    const { city, fee, zip, minOrder } = req.body;
    const id = req.body.id || crypto.randomUUID();
    const zone = await ZoneModel.create({
      id,
      city,
      fee: Number(fee) || 0,
      zip: zip || '',
      minOrder: Number(minOrder) || 0,
    });
    res.json(zone);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a zóna mentésekor.' });
  }
});

// GET /api/settings/coupons
router.get('/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await CouponModel.find({}).sort({ code: 1 });
    res.json(coupons);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült lekérni a kuponokat.' });
  }
});

// GET /api/settings/db-status
router.get('/db-status', async (_req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;
  let collections: any[] = [];
  if (isConnected && mongoose.connection.db) {
    try {
      collections = await mongoose.connection.db.listCollections().toArray();
    } catch {}
  }
  res.json({
    connected: isConnected,
    databaseName: mongoose.connection.name || 'szesztestverek',
    collectionsCount: collections.length,
    collections: collections.map((c) => c.name),
  });
});

export default router;
