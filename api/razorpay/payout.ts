'''import { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency, method, fund_account_id } = req.body;

  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER!,
      fund_account_id,
      amount,
      currency,
      mode: 'IMPS', // or NEFT, RTGS, UPI
      purpose: 'payout',
      queue_if_low_balance: true,
    });
    res.status(200).json(payout);
  } catch (error) {
    console.error('Razorpay payout failed:', error);
    res.status(500).json({ error: 'Failed to create Razorpay payout' });
  }
};
'''