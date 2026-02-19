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

  const { amount, currency, method, userId, fund_account_id } = req.body;

  try {
    // In a real application, you would first create a contact and a fund account for the user.
    // For this example, we'll assume a fund account ID is passed directly.

    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER!, // Your business account number
      fund_account_id: fund_account_id,
      amount: amount, // Amount in smallest currency unit (e.g., paise)
      currency: currency,
      mode: 'IMPS', // Can be IMPS, NEFT, RTGS, or UPI
      purpose: 'payout',
      queue_if_low_balance: true,
      narration: `Lingua Solutions India - Withdrawal for user ${userId}`,
    });

    res.status(200).json(payout);
  } catch (error) {
    console.error('Razorpay payout failed:', error);
    res.status(500).json({ error: 'Failed to create Razorpay payout' });
  }
};
'''