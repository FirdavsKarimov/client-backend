import asyncHandler from 'express-async-handler';
import axios from 'axios';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Service from '../models/Service.js';

// @desc    Buy ProxySeller service
// @route   POST /api/v1/provider/proxyseller/buy
// @access  Private
export const buyProxySellerService = asyncHandler(async (req, res) => {
  const { serviceId } = req.body;
  const user = await User.findById(req.user._id);

  const service = await Service.findById(serviceId);
  if (!service || service.provider !== 'proxyseller') {
    res.status(404);
    throw new Error('Service not found or not a ProxySeller service');
  }

  if (user.balance < service.price) {
    res.status(400);
    throw new Error('Insufficient balance');
  }

  const { data } = await axios.post(
    'https://api.proxyseller.com/v1/order',
    {
      api_key: process.env.PROXYSELLER_API_KEY,
      type: service.providerData.type || 'http',
      country: service.providerData.country || 'US',
      quantity: 1,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  user.balance -= service.price;
  await user.save();

  const tx = await Transaction.create({
    user: user._id,
    amount: -service.price,
    type: 'purchase',
    status: 'completed',
    serviceDetails: {
      provider: 'proxyseller',
      serviceId,
      providerResponse: data,
    },
  });

  res.status(201).json({
    success: true,
    message: 'ProxySeller service purchased',
    transactionId: tx._id,
    service: data,
  });
});

// @desc    Extend ProxySeller service
// @route   POST /api/v1/provider/proxyseller/extend
// @access  Private
export const extendProxySellerService = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const user = await User.findById(req.user._id);

  const tx = await Transaction.findOne({
    'serviceDetails.provider': 'proxyseller',
    'serviceDetails.providerResponse.order_id': orderId,
    user: req.user._id,
  });

  if (!tx) {
    res.status(404);
    throw new Error('ProxySeller order not found');
  }

  const service = await Service.findById(tx.serviceDetails.serviceId);
  const extensionPrice = service.price;

  if (user.balance < extensionPrice) {
    res.status(400);
    throw new Error('Insufficient balance');
  }

  const { data } = await axios.post(
    'https://api.proxyseller.com/v1/order/extend',
    {
      api_key: process.env.PROXYSELLER_API_KEY,
      order_id: orderId,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  user.balance -= extensionPrice;
  await user.save();

  const extensionTx = await Transaction.create({
    user: user._id,
    amount: -extensionPrice,
    type: 'extension',
    status: 'completed',
    serviceDetails: {
      provider: 'proxyseller',
      originalTx: tx._id,
      providerResponse: data,
    },
  });

  res.json({
    success: true,
    message: 'ProxySeller service extended',
    transaction: extensionTx,
  });
});

// @desc    Get ProxySeller traffic or status
// @route   GET /api/v1/provider/proxyseller/traffic
// @access  Private
export const getProxySellerTraffic = asyncHandler(async (req, res) => {
  const { orderId } = req.query;

  const tx = await Transaction.findOne({
    'serviceDetails.provider': 'proxyseller',
    'serviceDetails.providerResponse.order_id': orderId,
    user: req.user._id,
  });

  if (!tx) {
    res.status(404);
    throw new Error('ProxySeller order not found');
  }

  const { data } = await axios.get(
    'https://api.proxyseller.com/v1/order/status',
    {
      params: {
        api_key: process.env.PROXYSELLER_API_KEY,
        order_id: orderId,
      },
    }
  );

  res.json({
    success: true,
    status: data.status,
    traffic: data.traffic || 'N/A',
  });
});