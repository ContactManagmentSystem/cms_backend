const Payment = require("../models/payment");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");
const { isValidObjectId } = require("../utils/is_valid_id");

// Create Payment
exports.createPayment = tryCatch(async (req, res) => {
  const { platform, platformUserName, accountNumber } = req.body;

  console.log(platform)
  console.log(platformUserName);
  console.log(accountNumber);
  
  if (!req.userId) return sendResponse(res, 400, null, "User ID is required.");
  if (!platform || !platformUserName || !accountNumber) {
    return sendResponse(res, 400, null, "All fields are required.");
  }

  const existing = await Payment.findOne({
    platform,
    accountNumber,
    ownerId: req.userId,
  }).lean();

  if (existing) {
    return sendResponse(
      res,
      400,
      null,
      "This payment method is already added under your account."
    );
  }

  const payment = await Payment.create({
    platform,
    platformUserName,
    accountNumber,
    ownerId: req.userId,
  });

  return sendResponse(res, 201, payment, "Payment method added successfully.");
});

// Get all payments of current admin
exports.getPayments = tryCatch(async (req, res) => {
  const payments = await Payment.find({ ownerId: req.userId })
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, payments);
});

// Update payment
exports.updatePayment = tryCatch(async (req, res) => {
  const { id } = req.params;
  const { platform, platformUserName, accountNumber } = req.body;

  const validation = await isValidObjectId(id, Payment);
  if (!validation.valid) {
    return sendResponse(res, 400, null, validation.message);
  }

  const existing = await Payment.findById(id);
  if (!existing) {
    return sendResponse(res, 404, null, "Payment method not found.");
  }

  if (existing.ownerId.toString() !== req.userId) {
    return sendResponse(
      res,
      403,
      null,
      "Access denied. Not your payment method."
    );
  }

  existing.platform = platform;
  existing.platformUserName = platformUserName;
  existing.accountNumber = accountNumber;

  await existing.save();

  return sendResponse(
    res,
    200,
    existing,
    "Payment method updated successfully."
  );
});

// Delete payment
exports.deletePayment = tryCatch(async (req, res) => {
  const { id } = req.params;

  const validation = await isValidObjectId(id, Payment);
  if (!validation.valid) {
    return sendResponse(res, 400, null, validation.message);
  }

  const payment = await Payment.findById(id);
  if (!payment)
    return sendResponse(res, 404, null, "Payment method not found.");

  if (payment.ownerId.toString() !== req.userId) {
    return sendResponse(
      res,
      403,
      null,
      "Access denied. Not your payment method."
    );
  }

  await payment.deleteOne();

  return sendResponse(res, 200, null, "Payment method deleted successfully.");
});

// Public: Get all payments by Admin ID
exports.getPaymentsByAdmin = tryCatch(async (req, res) => {
  const { adminId } = req.params;

  if (!adminId) return sendResponse(res, 400, null, "Admin ID is required.");

  const payments = await Payment.find({ ownerId: adminId })
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, payments);
});
