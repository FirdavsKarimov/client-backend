import asyncHandler from 'express-async-handler';
import Cart from '../models/Cart.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import axios from 'axios';

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
export const addToCart = asyncHandler(async (req, res) => {
  const { serviceId, quantity = 1 } = req.body;
  const userId = req.user._id;

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  const service = await Service.findById(serviceId);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  const existingItem = cart.items.find(
    (item) => item.service.toString() === serviceId
  );
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ service: serviceId, quantity });
  }

  await cart.save();
  res.status(201).json({ success: true, cart });
});

// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.service'
  );
  if (!cart) {
    return res.json({ success: true, cart: { items: [] } });
  }
  res.json({ success: true, cart });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId
  );
  await cart.save();
  res.json({ success: true, cart });
});

// @desc    Checkout cart
// @route   POST /api/v1/cart/checkout
// @access  Private
export const checkoutCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.service'
  );

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + item.service.price * item.quantity,
    0
  );

  if (user.balance < totalAmount) {
    res.status(400);
    throw new Error('Insufficient balance');
  }

  const transactions = [];
  for (const item of cart.items) {
    const service = item.service;
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

    user.balance -= service.price * item.quantity;
    const tx = await Transaction.create({
      user: user._id,
      amount: -(service.price * item.quantity),
      type: 'purchase',
      status: 'completed',
      serviceDetails: {
        provider: service.provider,
        serviceId: service._id,
        providerResponse,
      },
    });
    transactions.push(tx);
  }

  await user.save();
  await Cart.deleteOne({ user: req.user._id });

  res.json({
    success: true,
    message: 'Checkout completed',
    transactions,
  });
});