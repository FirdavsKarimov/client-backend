import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import axios from 'axios';
import crypto from 'crypto';

// Cryptomus имзосини яратиш
const generateCryptomusSignature = (data, apiKey) => {
  // JSON.stringify билан объектни строкага айлантириш
  const jsonString = JSON.stringify(data);
  // API калитини қўшиш
  const signString = `${jsonString}${apiKey}`;
  // md5 хэшини яратиш
  const hash = crypto.createHash('md5').update(signString).digest('hex');
  return hash;
};

// @desc    Get user balance
// @route   GET /api/v1/balance
// @access  Private
export const getBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('balance').lean();
  res.json({
    success: true,
    balance: user.balance,
  });
});

// @desc    Create topup request
// @route   POST /api/v1/balance
// @access  Private
export const createTopup = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!amount || amount < 5) {
    res.status(400);
    throw new Error('Minimum topup amount is $5');
  }

  // .env файлдан маълумотларни текшириш
  const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
  const apiKey = process.env.CRYPTOMUS_API_KEY;
  if (!merchantId || !apiKey) {
    res.status(500);
    throw new Error('Server configuration error: Missing Cryptomus credentials');
  }

  const paymentData = {
    amount: amount.toString(), // Cryptomus строка кутади
    currency: 'USD',
    order_id: `topup_${Date.now()}_${user._id}`,
    url_callback: `${process.env.BASE_URL}/api/v1/balance/webhook`,
    url_return: `${process.env.FRONTEND_URL}/balance`,
    merchant: merchantId,
  };

  // Дебаг учун маълумотларни чиқариш
  console.log('Payment Data:', paymentData);
  console.log('Merchant ID:', merchantId);
  console.log('API Key:', apiKey);

  // Имзо яратиш
  const signature = generateCryptomusSignature(paymentData, apiKey);
  console.log('Generated Signature:', signature);

  try {
    const { data } = await axios.post(
      'https://api.cryptomus.com/v1/payment',
      paymentData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Sign': signature,
          'Merchant': merchantId,
        },
      }
    );

    const transaction = await Transaction.create({
      user: user._id,
      amount: parseFloat(data.result.amount),
      type: 'topup',
      status: 'pending',
      providerData: data.result,
    });

    res.status(201).json({
      success: true,
      paymentUrl: data.result.url,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Axios Error Details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    res.status(error.response?.status || 500);
    throw new Error(
      error.response?.data?.message || 'Failed to create topup request'
    );
  }
});

// @desc    Get transaction history
// @route   GET /api/v1/balance/history
// @access  Private
export const getTransactionHistory = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id })
    .sort('-createdAt')
    .lean();
  res.json({
    success: true,
    count: transactions.length,
    data: transactions,
  });
});

// @desc    Handle Cryptomus webhook
// @route   POST /api/v1/balance/webhook
// @access  Public
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['sign'];
  const payload = req.body;

  const generatedSignature = generateCryptomusSignature(payload, process.env.CRYPTOMUS_API_KEY);
  if (generatedSignature !== signature) {
    res.status(403);
    throw new Error('Invalid signature');
  }

  const transaction = await Transaction.findOne({
    'providerData.uuid': payload.uuid,
  });

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  if (payload.status === 'paid') {
    await User.findByIdAndUpdate(
      transaction.user,
      { $inc: { balance: transaction.amount } },
      { new: true }
    );
    transaction.status = 'completed';
  } else {
    transaction.status = 'failed';
  }

  await transaction.save();
  res.sendStatus(200);
});