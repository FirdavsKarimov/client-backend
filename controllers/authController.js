import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const userExists = await User.findOne({ username });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    username,
    password,
  });

  res.status(201).json({
    _id: user._id,
    username: user.username,
    balance: user.balance,
    token: generateToken(user._id),
  });
});

// @desc    Authenticate a user
// @route   POST /api/v1/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      balance: user.balance,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Create a guest user
// @route   POST /api/v1/auth/guest
// @access  Public
const createGuest = asyncHandler(async (req, res) => {
  const guest = await User.create({
    username: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    password: null,
    balance: 0,
    isGuest: true,
  });

  res.status(201).json({
    _id: guest._id,
    username: guest.username,
    balance: guest.balance,
    token: generateToken(guest._id),
  });
});

export { registerUser, authUser, createGuest };