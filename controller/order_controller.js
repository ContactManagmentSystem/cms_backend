const Order = require("../models/order");
const Product = require("../models/product");
const Payment = require("../models/payment");
const Landing = require("../models/landing");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");
const { isValidObjectId } = require("../utils/is_valid_id");
const path = require("path");
const fs = require("fs");
const { validateFileType } = require("../utils/validate_file_type");

exports.createOrder = tryCatch(async (req, res) => {
  const {
    products,
    phonePrimary,
    phoneSecondary = "",
    address,
    paymentType,
    paymentDetails,
    siteOwner,
  } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return sendResponse(res, 400, null, "At least one product is required.");
  }

  if (!address || !phonePrimary || !paymentType || !siteOwner) {
    return sendResponse(res, 400, null, "Missing required fields.");
  }

  const normalizedPaymentType = paymentType.trim();

  const landing = await Landing.findOne({ owner: siteOwner }).lean();
  if (!landing) {
    return sendResponse(res, 404, null, "Store landing not found.");
  }

  const isAccepted = landing.acceptPaymentTypes.includes(normalizedPaymentType);
  if (!isAccepted) {
    return sendResponse(
      res,
      400,
      null,
      `This store does not accept ${normalizedPaymentType} payments.`
    );
  }

  let totalAmount = 0;
  const verifiedProducts = [];

  for (const { productId, quantity } of products) {
    if (!productId || !quantity || quantity <= 0) {
      return sendResponse(res, 400, null, "Invalid product or quantity.");
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return sendResponse(res, 404, null, `Product not found: ${productId}`);
    }

    const discount =
      product.discountPrice && product.discountPrice > 0
        ? product.discountPrice
        : 0;
    const price = product.price - discount;

    totalAmount += price * quantity;
    verifiedProducts.push({ productId: product._id, quantity });
  }

  let transactionScreenshot = null;
  let finalPaymentDetails = {};

  if (normalizedPaymentType === "Prepaid") {
    if (!req.file) {
      return sendResponse(res, 400, null, "Transaction screenshot is required.");
    }

    //Secure file type validation
    const { valid, reason } = await validateFileType(req.file.path);
    if (!valid) {
      // Clean up invalid file
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
      return sendResponse(res, 400, null, `Invalid file: ${reason}`);
    }

    if (
      !paymentDetails ||
      !paymentDetails.paymentPlatform ||
      !paymentDetails.paymentPlatformUserName ||
      !paymentDetails.accountId
    ) {
      return sendResponse(res, 400, null, "All payment details are required.");
    }

    const paymentAccount = await Payment.findById(paymentDetails.accountId);
    if (!paymentAccount) {
      return sendResponse(res, 404, null, "Payment account not found.");
    }

    transactionScreenshot = `https://backend.olivermenus.com/${req.file.path}`;
    finalPaymentDetails = paymentDetails;
  }

  const order = await Order.create({
    products: verifiedProducts,
    totalAmount,
    address,
    phonePrimary,
    phoneSecondary,
    paymentType: normalizedPaymentType,
    transactionScreenshot,
    paymentDetails: finalPaymentDetails,
    siteOwner,
    progress: "pending",
  });

  return sendResponse(res, 201, order, "Order placed successfully.");
});

exports.getOrders = tryCatch(async (req, res) => {
  const adminId = req.userId;

  const orders = await Order.find({ siteOwner: adminId })
    .populate("products.productId", "name price discountPrice")
    .populate("paymentDetails.accountId")
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, orders);
});

exports.updateOrderProgress = tryCatch(async (req, res) => {
  const { id } = req.params;
  const { progress, orderCode, reason } = req.body;
  const adminId = req.userId;

  const validProgress = ["pending", "accepted", "declined", "done"];
  if (!validProgress.includes(progress)) {
    return sendResponse(res, 400, null, "Invalid progress value.");
  }

  const order = await Order.findById(id).populate("products.productId");
  if (!order) {
    return sendResponse(res, 404, null, "Order not found.");
  }

  if (order.siteOwner.toString() !== adminId) {
    return sendResponse(res, 403, null, "Access denied.");
  }

  if (order.progress === "done") {
    return sendResponse(res, 400, null, "Completed orders cannot be modified.");
  }

  if (progress === "declined" && !reason) {
    return sendResponse(
      res,
      400,
      null,
      "Reason is required when declining an order."
    );
  }

  if ((progress === "accepted" || progress === "done") && !orderCode) {
    return sendResponse(
      res,
      400,
      null,
      "Order code is required when accepting or completing an order."
    );
  }

  if (
    (progress === "accepted" || progress === "done") &&
    orderCode !== order.orderCode
  ) {
    const existing = await Order.findOne({ orderCode });
    if (existing) {
      return sendResponse(res, 409, null, "Order code already exists.");
    }
    order.orderCode = orderCode;
  }

  if (progress === "declined") {
    order.reason = reason;
  }

  if (progress === "done") {
    for (const item of order.products) {
      const product = item.productId;
      if (!product) continue;

      if (product.stockCount < item.quantity) {
        return sendResponse(
          res,
          400,
          null,
          `Not enough stock for ${product.name}`
        );
      }

      product.stockCount -= item.quantity;
      await product.save();
    }
  }

  order.progress = progress;
  await order.save();

  return sendResponse(res, 200, order, "Order status updated.");
});

exports.deleteOrder = tryCatch(async (req, res) => {
  const { id } = req.params;
  const adminId = req.userId;

  const valid = await isValidObjectId(id, Order);
  if (!valid.valid) return sendResponse(res, 400, null, valid.message);

  const order = await Order.findById(id);
  if (!order) {
    return sendResponse(res, 404, null, "Order not found.");
  }

  if (order.siteOwner.toString() !== adminId) {
    return sendResponse(res, 403, null, "Access denied.");
  }

  if (order.progress === "done") {
    return sendResponse(res, 400, null, "Cannot delete completed orders.");
  }

  if (order.transactionScreenshot) {
    const localPath = path.join(
      __dirname,
      "..",
      order.transactionScreenshot.replace(
        `https://backend.olivermenus.com/`,
        ""
      )
    );
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }

  await order.deleteOne();
  return sendResponse(res, 200, null, "Order deleted.");
});

exports.getOrderById = tryCatch(async (req, res) => {
  const { id } = req.params;

  const valid = await isValidObjectId(id, Order);
  if (!valid.valid) {
    return sendResponse(res, 400, null, valid.message);
  }

  const order = await Order.findById(id)
    .populate("products.productId", "name price")
    .populate("paymentDetails.accountId", "platform accountNumber")
    .lean();

  if (!order) {
    return sendResponse(res, 404, null, "Order not found.");
  }

  return sendResponse(res, 200, order);
});
