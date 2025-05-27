const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Order = require("../models/order");
const Product = require("../models/product");
const { sendResponse } = require("../utils/response");

exports.verifyToken = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return sendResponse(res, 401, null, "Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    req.user = await User.findById(req.userId).select("-password").lean();
    // console.log("User in verifyToken:", req.user);
    if (!req.user) {
      return sendResponse(res, 404, null, "User not found.");
    }

    next();
  } catch (error) {
    return sendResponse(res, 400, null, "Invalid token.");
  }
};

exports.checkRole = (requiredRole) => {
  return (req, res, next) => {
    // console.log("User in checkRole:", req.user);
    if (!req.user) {
      return sendResponse(
        res,
        403,
        null,
        "Access denied. User not authenticated."
      );
    }

    if (req.user.role !== requiredRole) {
      return sendResponse(
        res,
        403,
        null,
        "Access denied. Insufficient permissions."
      );
    }
    // console.log(!req.user.isVerified);
    // if (!req.user.isVerified) {
    //   return sendResponse(res, 403, null, "Access denied. User not verified.");
    // }

    next();
  };
};

exports.fetchOrdersByUserId = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendResponse(res, 400, null, "User ID not provided.");
    }

    const orders = await Order.find({ user: userId })
      .populate("items.product", "name -_id price")
      .populate("items.package", "name -_id price")
      .sort({ orderDate: -1 })
      .lean();

    if (!orders) {
      return sendResponse(res, 404, null, "No orders found for this user.");
    }

    req.orders = orders;
    next();
  } catch (error) {
    console.error("Error fetching orders:", error);
    return sendResponse(
      res,
      500,
      null,
      "An error occurred while fetching orders."
    );
  }
};
