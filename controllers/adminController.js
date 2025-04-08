import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc    Get a specific user by ID
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update a user's balance
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
const updateUserBalance = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.params.id);

  if (user) {
    user.balance = amount;
    const updatedUser = await user.save();
    res.json({
      message: 'Balance updated successfully',
      balance: updatedUser.balance,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all transactions
// @route   GET /api/v1/admin/transactions
// @access  Private/Admin
const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({}).populate('user', 'username');
  res.json(transactions);
});

export { getAllUsers, getUserDetails, updateUserBalance, getAllTransactions };