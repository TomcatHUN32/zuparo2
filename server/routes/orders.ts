import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { OrderModel, CustomerModel, ZoneModel, RestaurantStatusModel } from '../../serverModels';

const router = Router();

// GET /api/orders
router.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await OrderModel.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült lekérni a rendeléseket.' });
  }
});

// POST /api/orders
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      phone,
      zip,
      city,
      street,
      floor,
      type,
      payment,
      channel,
      items,
      subtotal,
      deliveryFee,
      packagingFee,
      drsFee,
      discountPct,
      discountAmount,
      couponCode,
      total,
      note,
      userId,
      isOnlineOrder,
      isCredit,
    } = req.body || {};

    if (!customerName || !items || !items.length) {
      return res.status(400).json({ error: 'Név és legalább egy tétel megadása kötelező.' });
    }

    const id = req.body.id || `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const order = await OrderModel.create({
      id,
      customerName: customerName.trim(),
      phone: (phone || '').trim(),
      zip: (zip || '').trim(),
      city: (city || '').trim(),
      street: (street || '').trim(),
      floor: (floor || '').trim(),
      type: type || 'delivery',
      payment: payment || 'cash',
      channel: channel || 'house',
      items,
      subtotal: Number(subtotal) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      packagingFee: Number(packagingFee) || 0,
      drsFee: Number(drsFee) || 0,
      discountPct: Number(discountPct) || 0,
      discountAmount: Number(discountAmount) || 0,
      couponCode: couponCode || '',
      total: Number(total) || 0,
      note: note || '',
      status: 'new',
      courierId: null,
      createdAt: new Date().toISOString(),
      userId: userId || null,
      isOnlineOrder: Boolean(isOnlineOrder),
      isCredit: Boolean(isCredit),
      creditSettled: false,
      source: isOnlineOrder ? 'online' : 'pos',
    });

    // Auto update / save customer
    if (phone) {
      try {
        const cleanPhone = phone.trim();
        const existing = await CustomerModel.findOne({ phone: cleanPhone });
        if (existing) {
          existing.orderCount = (existing.orderCount || 1) + 1;
          existing.name = customerName;
          if (city) existing.city = city;
          if (street) existing.street = street;
          await existing.save();
        } else {
          await CustomerModel.create({
            id: crypto.randomUUID(),
            name: customerName,
            phone: cleanPhone,
            zip: zip || '',
            city: city || '',
            street: street || '',
            floor: floor || '',
            orderCount: 1,
          });
        }
      } catch (err) {
        console.error('Customer upsert error:', err);
      }
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nem sikerült rögzíteni a rendelést.' });
  }
});

// PATCH / PUT /api/orders/:id/status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, courierId } = req.body;
    const updateData: any = { status };
    if (courierId !== undefined) updateData.courierId = courierId;
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date().toISOString();
      updateData.cancelReason = req.body.cancelReason || '';
    }

    const order = await OrderModel.findOneAndUpdate({ id }, updateData, { new: true });
    if (!order) return res.status(404).json({ error: 'Rendelés nem található.' });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a státusz módosításakor.' });
  }
});

export default router;
