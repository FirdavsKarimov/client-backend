import axios from 'axios';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const cryptomysHeaders = {
  'Content-Type': 'application/json',
  'X-API-Key': process.env.CRYPTOMYS_API_KEY
};

export const getBalance = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ balance: user.balance });
};

export const createTopup = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    const tx = await Transaction.create({
      user: user._id,
      amount,
      type: 'topup',
      status: 'pending'
    });

    const { data } = await axios.post(
      'https://api.cryptomys.com/v1/payments',
      {
        amount,
        currency: 'USD',
        callback_url: `${process.env.BASE_URL}/api/webhooks/cryptomys`,
        metadata: { txId: tx._id }
      },
      { headers: cryptomysHeaders }
    );

    await Transaction.updateOne(
      { _id: tx._id },
      { providerId: data.id, status: 'processing' }
    );

    res.json({ paymentUrl: data.payment_url });
    
  } catch (err) {
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['x-cryptomys-signature'];
  const payload = req.body;

  if (!verifySignature(sig, payload)) {
    return res.status(400).send('Invalid signature');
  }

  const tx = await Transaction.findById(payload.metadata.txId);
  if (!tx) return res.status(404).send('Transaction not found');

  if (payload.status === 'confirmed') {
    await User.updateOne(
      { _id: tx.user },
      { $inc: { balance: tx.amount } }
    );
    tx.status = 'completed';
  } else {
    tx.status = 'failed';
  }

  await tx.save();
  res.sendStatus(200);
};