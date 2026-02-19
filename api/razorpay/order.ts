'''
import { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency, notes } = req.body;

  try {
    const order = await razorpay.orders.create({ amount, currency, notes });
    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};
'''