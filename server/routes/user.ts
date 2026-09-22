import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, OrderModel } from '../../serverModels';

const router = Router();

// GET /api/user/profile/:id
router.get('/profile/:id', async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findOne({ id: req.params.id }).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'Felhasználó nem található.' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a profil lekérésekor.' });
  }
});

// PUT /api/user/profile/:id
router.put('/profile/:id', async (req: Request, res: Response) => {
  try {
    const { name, phone, password } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    const user = await UserModel.findOneAndUpdate({ id: req.params.id }, updateData, { new: true }).select(
      '-password_hash'
    );
    if (!user) return res.status(404).json({ error: 'Felhasználó nem található.' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a módosításkor.' });
  }
});

// GET /api/user/orders/:userId
router.get('/orders/:userId', async (req: Request, res: Response) => {
  try {
    const orders = await OrderModel.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a korábbi rendelések lekérésekor.' });
  }
});

export default router;
