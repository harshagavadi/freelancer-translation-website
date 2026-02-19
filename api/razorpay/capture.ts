'''import { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLATFORM_ACCOUNT_ID = process.env.RAZORPAY_PLATFORM_ACCOUNT_ID!;

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { payment_id, order_id, signature, amount, commission } = req.body;

  // 1. Verify Signature
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  if (generated_signature !== signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    // 2. Capture Payment
    await razorpay.payments.capture(payment_id, amount, 'INR');

    // 3. Transfer Commission (if applicable)
    if (commission > 0) {
      await razorpay.payments.transfer(payment_id, {
        transfers: [
          {
            account: PLATFORM_ACCOUNT_ID,
            amount: commission,
            currency: 'INR',
            notes: {
              type: 'platform_commission',
            },
          },
        ],
      });
    }

    res.status(200).json({ status: 'captured' });
  } catch (error) {
    console.error('Razorpay payment capture failed:', error);
    res.status(500).json({ error: 'Payment capture failed' });
  }
};
'''