import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../../serverModels';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'szesztestverek_jwt_secret_production_key_2026';
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, jelszó és név megadása kötelező.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'Ez az email cím már regisztrálva van.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = crypto.randomUUID();

    const user = await UserModel.create({
      id,
      email: cleanEmail,
      name: name.trim(),
      phone: (phone || '').trim(),
      role: 'customer',
      password_hash,
      createdAt: new Date().toISOString(),
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a regisztráció során.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email és jelszó szükséges.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Hibás email cím vagy jelszó.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Hibás email cím vagy jelszó.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a bejelentkezés során.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Nincs token megadva.' });
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findOne({ id: decoded.id });
    if (!user) return res.status(404).json({ error: 'Felhasználó nem található.' });
    res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role });
  } catch (err) {
    res.status(401).json({ error: 'Érvénytelen token.' });
  }
});

export default router;
