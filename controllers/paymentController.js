import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import axios from 'axios';
import crypto from 'crypto';

const generateCryptomusSignature = (data) => {
  const signString = `${JSON.stringify(data)}${process.env.CRYPTOMUS_API_KEY}`;
  return crypto.createHash('md5').update(signString).digest('hex');
};

const verifyCryptomusWebhook = (signature, data) => {
  const generatedSignature = generateCryptomusSignature(data);
  return generatedSignature === signature;
};

// @desc    Create payment (top-up)
// @route   POST /api/v1/payments
// @access  Private
const createPayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.user._id);

  if (amount < 5.0) {
    res.status(400);
    throw new Error('Minimum top-up amount is $5.00');
  }

  const paymentData = {
    amount: amount.toFixed(2),
    currency: 'USD',
    order_id: `topup_${Date.now()}`,
    url_return: `${process.env.BASE_URL}/balance`,
    url_callback: `${process.env.BASE_URL}/api/v1/payments/webhook`,
    lifetime: 1800,
    merchant: process.env.CRYPTOMUS_MERCHANT_ID,
  };

  const signature = generateCryptomusSignature(paymentData);

  const { data } = await axios.post(
    'https://api.cryptomus.com/v1/payment',
    paymentData,
    {
      headers: {
        'Content-Type': 'application/json',
        'Sign': signature,
        'Merchant': process.env.CRYPTOMUS_MERCHANT_ID,
      },
    }
  );

  const transaction = await Transaction.create({
    user: user._id,
    amount: data.result.amount,
    type: 'topup',
    status: 'pending',
    providerData: data.result,
  });

  res.status(201).json({
    paymentUrl: data.result.url,
    transactionId: transaction._id,
  });
});

// @desc    Handle Cryptomus webhook
// @route   POST /api/v1/payments/webhook
// @access  Public
const handleCryptomusWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['sign'];

  if (!verifyCryptomusWebhook(signature, req.body)) {
    res.status(403);
    throw new Error('Invalid webhook signature');
  }

  const { status, uuid } = req.body;
  const transaction = await Transaction.findOne({ 'providerData.uuid': uuid });

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  if (status === 'paid') {
    await User.findByIdAndUpdate(transaction.user, {
      $inc: { balance: transaction.amount },
    });
    transaction.status = 'completed';
  } else {
    transaction.status = 'failed';
  }

  await transaction.save();
  res.sendStatus(200);
});

// @desc    Handle payment callback
// @route   GET /api/v1/payments/callback
// @access  Public
const handlePaymentCallback = asyncHandler(async (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/balance`);
});

export { createPayment, handleCryptomusWebhook, handlePaymentCallback };