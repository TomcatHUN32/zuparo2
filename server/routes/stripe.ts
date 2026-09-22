import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/stripe/config
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
  });
});

// POST /api/stripe/create-payment-intent
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'huf' } = req.body;
    if (!process.env.STRIPE_SECRET_KEY) {
      // In development or if Stripe is not configured yet, return a safe simulated client secret
      return res.json({
        clientSecret: `simulated_secret_${Date.now()}`,
        simulated: true,
        message: 'Stripe API kulcs nincs beállítva, teszt fizetés engedélyezve.',
      });
    }

    // Lazy load Stripe dynamically if package is available
    let stripeInstance: any = null;
    try {
      const stripePkg = await (Function('m', 'return import(m)')('stripe'));
      const StripeClass = stripePkg.default || stripePkg;
      stripeInstance = new StripeClass(process.env.STRIPE_SECRET_KEY);
    } catch {
      return res.json({
        clientSecret: `simulated_secret_${Date.now()}`,
        simulated: true,
        message: 'Stripe csomag nem található a szerveren, szimulált fizetés aktív.',
      });
    }

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(Number(amount)),
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hiba a fizetési tranzakció indításakor.' });
  }
});

export default router;
