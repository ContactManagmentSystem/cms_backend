const fs = require("fs");
const path = require("path");
const Landing = require("../models/landing");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");
const { isValidObjectId } = require("../utils/is_valid_id");

// Create a new landing (only one per admin)
exports.createLanding = tryCatch(async (req, res) => {
  const { storeName, colourCode } = req.body;
  const files = req.files;

  if (!req.userId) return sendResponse(res, 400, null, "User ID is required.");
  if (!storeName || !colourCode) {
    return sendResponse(
      res,
      400,
      null,
      "Store name and colour code are required."
    );
  }

  if (!files || !files.image || files.image.length === 0) {
    return sendResponse(res, 400, null, "Main image file is required.");
  }

  // Check if the user already has a landing
  const existingLanding = await Landing.findOne({ owner: req.userId }).lean();
  if (existingLanding) {
    return sendResponse(res, 400, null, "You already have a landing page.");
  }

  const imageUrl = `https://backend.olivermenus.com/${
    files.image[0].path
    }`;
  
  const heroImageUrls =
    files.heroImage?.map(
      (file) => `https://backend.olivermenus.com/${file.path}`
    ) || [];

  const landing = await Landing.create({
    storeName,
    colourCode,
    image: imageUrl,
    heroImage: heroImageUrls,
    owner: req.userId,
  });

  return sendResponse(res, 201, landing, "Landing created successfully.");
});

exports.updateLanding = tryCatch(async (req, res) => {
  const { id } = req.params;
  const { storeName, colourCode, deletedHeroImages } = req.body;
  const files = req.files;
  // console.log(colourCode)
  // Validate ID
  const validation = await isValidObjectId(id, Landing);
  if (!validation.valid) {
    return sendResponse(res, 400, null, validation.message);
  }

  const landing = await Landing.findById(id);
  if (!landing) return sendResponse(res, 404, null, "Landing not found.");
  if (landing.owner.toString() !== req.userId) {
    return sendResponse(res, 403, null, "Access denied.");
  }

  // Update base fields (with safety fallback for colourCode)
  if (storeName) landing.storeName = storeName;

  if (colourCode && /^#([0-9A-F]{3}){1,2}$/i.test(colourCode)) {
    landing.colourCode = colourCode;
  } else if (colourCode !== undefined) {
    return sendResponse(res, 400, null, "Invalid colourCode format.");
  }

  // Handle main image replacement
  if (files?.image?.length > 0) {
    landing.image = `https://backend.olivermenus.com/${
      files.image[0].path
    }`;
  }

  // HERO IMAGE UPDATE LOGIC
  let currentHeroImages = landing.heroImage || [];

  if (deletedHeroImages) {
    try {
      const toDelete = JSON.parse(deletedHeroImages);

      toDelete.forEach((imgUrl) => {
        const imgPath = path.join(
          __dirname,
          "..",
          imgUrl.replace(`https://backend.olivermenus.com/`, "")
        );
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      });

      currentHeroImages = currentHeroImages.filter(
        (img) => !toDelete.includes(img)
      );
    } catch (err) {
      return sendResponse(res, 400, null, "Invalid deletedHeroImages format.");
    }
  }

  // Validate image count
  const newHeroCount = files?.heroImage?.length || 0;
  const totalHeroCount = currentHeroImages.length + newHeroCount;

  if (totalHeroCount > 5) {
    return sendResponse(
      res,
      400,
      null,
      `A maximum of 5 hero images is allowed. You already have ${currentHeroImages.length}.`
    );
  }

  // Add new hero images
  if (files?.heroImage?.length > 0) {
    const newHeroImages = files.heroImage.map(
      (file) => `https://backend.olivermenus.com/${file.path}`
    );
    currentHeroImages = [...currentHeroImages, ...newHeroImages];
  }

  landing.heroImage = currentHeroImages;

  await landing.save();

  return sendResponse(res, 200, landing, "Landing updated successfully.");
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
