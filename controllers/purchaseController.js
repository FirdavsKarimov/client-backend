import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Service from '../models/Service.js';
import axios from 'axios';

// @desc    Get all purchases of current user
// @route   GET /api/v1/purchases
// @access  Private
 const getPurchases = asyncHandler(async (req, res) => {
  const purchases = await Transaction.find({
    user: req.user._id,
    type: 'purchase',
  }).sort('-createdAt');
  res.json({ success: true, count: purchases.length, data: purchases });
});

// @desc    Create a purchase (direct, without cart)
// @route   POST /api/v1/purchases
// @access  Private
 const createPurchase = asyncHandler(async (req, res) => {
  const { serviceId } = req.body;
  const user = await User.findById(req.user._id);

  const service = await Service.findById(serviceId);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  if (user.balance < service.price) {
    res.status(400);
    throw new Error('Insufficient balance');
  }

  let providerResponse;
  if (service.provider === '711') {
    const { data } = await axios.get(`https://api.711.so/order/buy`, {
      params: {
        apiKey: process.env.PROVIDER_711_API_KEY,
        country: service.providerData.country,
        package: service.providerData.packageType,
      },
    });
    providerResponse = data;
  } else {
    res.status(400);
    throw new Error('Provider not supported');
  }

  user.balance -= service.price;
  await user.save();

  const tx = await Transaction.create({
    user: user._id,
    amount: -service.price,
    type: 'purchase',
    status: 'completed',
    serviceDetails: {
      provider: service.provider,
      serviceId,
      providerResponse,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Service purchased',
    transactionId: tx._id,
    service: providerResponse,
  });
});

// @desc    Get details of a specific purchase
// @route   GET /api/v1/purchases/:id
// @access  Private
 const getPurchaseDetails = asyncHandler(async (req, res) => {
  const purchase = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
    type: 'purchase',
  });

  if (!purchase) {
    res.status(404);
    throw new Error('Purchase not found');
  }

  res.json({
    success: true,
    data: purchase,
  });
});

// @desc    Extend a 711 purchase
// @route   POST /api/v1/purchases/extend/:id
// @access  Private
 const extendPurchase = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
    type: 'purchase',
    status: 'completed',
  });

  if (!tx || tx.serviceDetails.provider !== '711') {
    res.status(404);
    throw new Error('Purchase not found or extension not supported');
  }

  const service = await Service.findById(tx.serviceDetails.serviceId);
  const extensionPrice = service.price;

  if (req.user.balance < extensionPrice) {
    res.status(400);
    throw new Error('Insufficient balance');
  }

  const { data } = await axios.get(`https://api.711.so/order/extend`, {
    params: {
      apiKey: process.env.PROVIDER_711_API_KEY,
      order: tx.serviceDetails.providerResponse.orderId,
    },
  });

  req.user.balance -= extensionPrice;
  await req.user.save();

  const extensionTx = await Transaction.create({
    user: req.user._id,
    amount: -extensionPrice,
    type: 'extension',
    status: 'completed',
    serviceDetails: {
      provider: '711',
      originalTx: tx._id,
      providerResponse: data,
    },
  });

  res.json({
    success: true,
    message: 'Service extended',
    transaction: extensionTx,
  });
});

// @desc    Get traffic for a 711 purchase
// @route   GET /api/v1/purchases/traffic/:id
// @access  Private
 const getPurchaseTraffic = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
    type: 'purchase',
  });

  if (!tx || tx.serviceDetails.provider !== '711') {
    res.status(404);
    throw new Error('Purchase not found or traffic check not supported');
  }

  const { data } = await axios.get(`https://api.711.so/order/traffic`, {
    params: {
      apiKey: process.env.PROVIDER_711_API_KEY,
      order: tx.serviceDetails.providerResponse.orderId,
    },
  });

  res.json({
    success: true,
    traffic: data.trafficRemaining,
  });
});

// @desc    Cancel a purchase
// @route   DELETE /api/v1/purchases/:id
// @access  Private
 const cancelPurchase = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
    type: 'purchase',
    status: 'completed',
  });

  if (!tx) {
    res.status(404);
    throw new Error('Purchase not found or already cancelled');
  }

  const refundAmount = Math.abs(tx.amount);
  await User.findByIdAndUpdate(tx.user, {
    $inc: { balance: refundAmount },
  });

  tx.status = 'cancelled';
  await tx.save();

  res.json({
    success: true,
    message: 'Purchase cancelled and refunded',
    refundAmount,
  });
});

export {
  getPurchases,
  createPurchase,
  getPurchaseDetails,
  extendPurchase,
  getPurchaseTraffic,
  cancelPurchase,
};