import asyncHandler from 'express-async-handler';
import axios from 'axios';

// @desc    Buy 711 service
// @route   POST /api/v1/provider/711/buy
// @access  Private
export const buy711Service = asyncHandler(async (req, res) => {
  const { country, packageType } = req.body;

  const { data } = await axios.get(`https://api.711.so/order/buy`, {
    params: {
      apiKey: process.env.PROVIDER_711_API_KEY,
      country,
      package: packageType,
    },
  });

  res.status(200).json(data);
});

// @desc    Extend 711 service
// @route   POST /api/v1/provider/711/extend
// @access  Private
export const extend711Service = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const { data } = await axios.get(`https://api.711.so/order/extend`, {
    params: {
      apiKey: process.env.PROVIDER_711_API_KEY,
      order: orderId,
    },
  });

  res.status(200).json(data);
});

// @desc    Get 711 traffic
// @route   GET /api/v1/provider/711/traffic
// @access  Private
export const get711Traffic = asyncHandler(async (req, res) => {
  const { orderId } = req.query;

  const { data } = await axios.get(`https://api.711.so/order/traffic`, {
    params: {
      apiKey: process.env.PROVIDER_711_API_KEY,
      order: orderId,
    },
  });

  res.status(200).json(data);
});