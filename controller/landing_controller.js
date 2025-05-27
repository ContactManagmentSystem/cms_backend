const Landing = require("../models/landing");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");
const { isValidObjectId } = require("../utils/is_valid_id");

// Create a new landing (only one per admin)
exports.createLanding = tryCatch(async (req, res) => {
  const { storeName, colourCode } = req.body;
  const file = req.file;

  if (!req.userId) return sendResponse(res, 400, null, "User ID is required.");
  if (!storeName || !colourCode) {
    return sendResponse(
      res,
      400,
      null,
      "Store name and colour code are required."
    );
  }

  if (!file) {
    return sendResponse(res, 400, null, "Image file is required.");
  }

  // Check if the user already has a landing
  const existingLanding = await Landing.findOne({ owner: req.userId }).lean();
  if (existingLanding) {
    return sendResponse(res, 400, null, "You already have a landing page.");
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/${file.path}`;

  const landing = await Landing.create({
    storeName,
    colourCode,
    image: imageUrl,
    owner: req.userId,
  });

  return sendResponse(res, 201, landing, "Landing created successfully.");
});

// Get current user's landing
exports.getMyLanding = tryCatch(async (req, res) => {
  const landing = await Landing.findOne({ owner: req.userId }).lean();
  if (!landing) return sendResponse(res, 200, null, "Landing haven't created.");

  return sendResponse(res, 200, landing);
});

// Get landing by ID (admin access only to own)
exports.getLandingById = tryCatch(async (req, res) => {
  const { id } = req.params;

  const validation = await isValidObjectId(id, Landing);
  if (!validation.valid) {
    return sendResponse(res, 400, null, validation.message);
  }

  const landing = await Landing.findById(id).lean();
  if (!landing) return sendResponse(res, 404, null, "Landing not found.");
  if (landing.owner.toString() !== req.userId) {
    return sendResponse(res, 403, null, "Access denied.");
  }

  return sendResponse(res, 200, landing);
});

// Update landing (only by owner)
exports.updateLanding = tryCatch(async (req, res) => {
  const { id } = req.params;
  const { storeName, colourCode } = req.body;
  const file = req.file;

  const validation = await isValidObjectId(id, Landing);
  if (!validation.valid) {
    return sendResponse(res, 400, null, validation.message);
  }

  const landing = await Landing.findById(id);
  if (!landing) return sendResponse(res, 404, null, "Landing not found.");
  if (landing.owner.toString() !== req.userId) {
    return sendResponse(res, 403, null, "Access denied.");
  }

  if (storeName) landing.storeName = storeName;
  if (colourCode) landing.colourCode = colourCode;
  if (file) {
    landing.image = `${req.protocol}://${req.get("host")}/${file.path}`;
  }

  await landing.save();

  return sendResponse(res, 200, landing, "Landing updated successfully.");
});

// Delete landing (only by owner)
exports.deleteLanding = tryCatch(async (req, res) => {
  const { id } = req.params;

  const validation = await isValidObjectId(id, Landing);
  if (!validation.valid)
    return sendResponse(res, 400, null, validation.message);

  const landing = await Landing.findById(id);
  if (!landing) return sendResponse(res, 404, null, "Landing not found.");
  if (landing.owner.toString() !== req.userId) {
    return sendResponse(res, 403, null, "Access denied.");
  }

  await landing.deleteOne();

  return sendResponse(res, 200, null, "Landing deleted successfully.");
});

// Public: Get landing page of a specific admin
exports.getPublicLandingByAdmin = tryCatch(async (req, res) => {
  const { adminId } = req.params;

  if (!adminId) {
    return sendResponse(res, 400, null, "Admin ID is required.");
  }

  const landing = await Landing.findOne({ owner: adminId }).lean();
  if (!landing) {
    return sendResponse(res, 404, null, "Landing not found for this admin.");
  }

  return sendResponse(res, 200, landing);
});

// Update only the acceptPaymentTypes for the landing (owner only)
exports.updatePaymentTypes = tryCatch(async (req, res) => {
  const { paymentTypes } = req.body;
  if (!Array.isArray(paymentTypes)) {
    return sendResponse(res, 400, null, "paymentTypes must be an array.");
  }

  const validTypes = ["COD", "Prepaid"];
  const isValid = paymentTypes.every((type) => validTypes.includes(type));
  if (!isValid) {
    return sendResponse(res, 400, null, "Invalid payment type(s) provided.");
  }

  // Find the landing belonging to the current user
  const landing = await Landing.findOne({ owner: req.userId });
  if (!landing) {
    return sendResponse(res, 404, null, "Landing not found for this user.");
  }

  // Update the correct schema field: acceptPaymentTypes
  landing.acceptPaymentTypes = paymentTypes;
  await landing.save();

  return sendResponse(res, 200, landing, "Payment types updated successfully.");
});
