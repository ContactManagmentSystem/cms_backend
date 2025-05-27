const Product = require("../models/product");
const User = require("../models/user");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");
const bcrypt = require("bcrypt");
const { checkParamId, checkIfEmpty } = require("../utils/is_valid_id");

const isValidPaymentStatus = (status) => ["paid", "unpaid"].includes(status);

exports.createUser = tryCatch(async (req, res) => {
  const {
    username,
    email,
    password,
    role,
    domainName,
    serverStartDate,
    serverExpiredDate,
    paymentStatus,
    productPostLimit,
    contactInfo = {},
  } = req.body;

  const { line, whatsapp, messenger, viber, telegram } = contactInfo;

  if (
    !username ||
    !email ||
    !password ||
    !role ||
    !domainName ||
    !serverStartDate ||
    !serverExpiredDate
  ) {
    return sendResponse(
      res,
      400,
      null,
      "All required fields must be provided."
    );
  }

  if (!["superadmin", "admin"].includes(role)) {
    return sendResponse(
      res,
      400,
      null,
      "Role must be one of: superadmin, admin."
    );
  }

  if (paymentStatus && !isValidPaymentStatus(paymentStatus)) {
    return sendResponse(
      res,
      400,
      null,
      "Payment status must be either 'paid' or 'unpaid'."
    );
  }

  if (role === "admin") {
    if (typeof productPostLimit !== "number" || productPostLimit < 1) {
      return sendResponse(
        res,
        400,
        null,
        "Product post limit must be a number greater than 0."
      );
    }
  }

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    return sendResponse(res, 400, null, `Email "${email}" is already in use.`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    role,
    domainName,
    serverStartDate,
    serverExpiredDate,
    paymentStatus: paymentStatus || "unpaid",
    productPostLimit: role === "admin" ? productPostLimit : undefined,
    contactInfo: {
      line: line || "",
      whatsapp: whatsapp || "",
      messenger: messenger || "",
      viber: viber || "",
      telegram: telegram || "",
    },
  });

  await newUser.save();

  const responseUser = {
    id: newUser._id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    shopID: newUser.shopID,
    domainName: newUser.domainName,
    serverStartDate: newUser.serverStartDate,
    serverExpiredDate: newUser.serverExpiredDate,
    paymentStatus: newUser.paymentStatus,
    productPostLimit: newUser.productPostLimit,
    contactInfo: newUser.contactInfo,
  };

  return sendResponse(res, 201, responseUser, "User created successfully!");
});


exports.getUsers = tryCatch(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { _id: { $ne: req.userId } }; // Exclude self

  const totalUsers = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password -__v")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Count product posts for each user
  const userIds = users.map((u) => u._id);
  const productCounts = await Product.aggregate([
    { $match: { owner: { $in: userIds } } },
    { $group: { _id: "$owner", count: { $sum: 1 } } },
  ]);

  const productCountMap = {};
  productCounts.forEach((entry) => {
    productCountMap[entry._id.toString()] = entry.count;
  });

  // Attach count to users
  const enrichedUsers = users.map((user) => ({
    ...user,
    productPostCount: productCountMap[user._id.toString()] || 0,
  }));

  return sendResponse(
    res,
    200,
    {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      pageSize: limit,
      users: enrichedUsers,
    },
    "Users fetched successfully."
  );
});


exports.getUserById = tryCatch(async (req, res) => {
  const { id } = req.params;

  const idCheck = checkParamId(id, "User ID");
  if (!idCheck.valid) {
    return sendResponse(res, 400, null, idCheck.message);
  }

  const user = await User.findById(id).select("-password").lean();
  if (!user) {
    return sendResponse(res, 404, null, "User not found.");
  }

  return sendResponse(res, 200, user);
});

exports.updateUser = tryCatch(async (req, res) => {
  const { id } = req.params;

  const idCheck = checkParamId(id, "User ID");
  if (!idCheck.valid) {
    return sendResponse(res, 400, null, idCheck.message);
  }

  const bodyCheck = checkIfEmpty(req.body, "Update data");
  if (bodyCheck.empty) {
    return sendResponse(res, 400, null, bodyCheck.message);
  }

  const {
    username,
    email,
    role,
    paymentStatus,
    serverStartDate,
    serverExpiredDate,
    productPostLimit,
    contactInfo = {},
  } = req.body;

  const { line, whatsapp, messenger, viber, telegram } = contactInfo;

  const user = await User.findById(id);
  if (!user) {
    return sendResponse(res, 404, null, "User not found.");
  }

  if (role && !["superadmin", "admin"].includes(role)) {
    return sendResponse(
      res,
      400,
      null,
      "Role must be one of: superadmin, admin."
    );
  }

  if (paymentStatus && !isValidPaymentStatus(paymentStatus)) {
    return sendResponse(
      res,
      400,
      null,
      "Payment status must be either 'paid' or 'unpaid'."
    );
  }

  if (user.role === "admin") {
    if (typeof productPostLimit !== "undefined") {
      if (typeof productPostLimit !== "number" || productPostLimit < 1) {
        return sendResponse(
          res,
          400,
          null,
          "Product post limit must be a number greater than 0."
        );
      }
      user.productPostLimit = productPostLimit;
    }
  }

  user.username = username ?? user.username;
  user.email = email ?? user.email;
  user.role = role ?? user.role;
  user.paymentStatus = paymentStatus ?? user.paymentStatus;
  user.serverStartDate = serverStartDate ?? user.serverStartDate;
  user.serverExpiredDate = serverExpiredDate ?? user.serverExpiredDate;

  user.contactInfo = {
    line: line ?? user.contactInfo.line,
    whatsapp: whatsapp ?? user.contactInfo.whatsapp,
    messenger: messenger ?? user.contactInfo.messenger,
    viber: viber ?? user.contactInfo.viber,
    telegram: telegram ?? user.contactInfo.telegram,
  };

  await user.save();

  return sendResponse(
    res,
    200,
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      paymentStatus: user.paymentStatus,
      serverStartDate: user.serverStartDate,
      serverExpiredDate: user.serverExpiredDate,
      productPostLimit: user.productPostLimit,
      contactInfo: user.contactInfo,
    },
    "User updated successfully."
  );
});

exports.deleteUser = tryCatch(async (req, res) => {
  const { id } = req.params;

  const idCheck = checkParamId(id, "User ID");
  if (!idCheck.valid) {
    return sendResponse(res, 400, null, idCheck.message);
  }

  const user = await User.findByIdAndDelete(id).lean();
  if (!user) {
    return sendResponse(res, 404, null, "User not found.");
  }

  return sendResponse(res, 204, null, "User deleted successfully.");
});

exports.updatePassword = tryCatch(async (req, res) => {
  const { id } = req.params;

  const idCheck = checkParamId(id, "User ID");
  if (!idCheck.valid) {
    return sendResponse(res, 400, null, idCheck.message);
  }

  const bodyCheck = checkIfEmpty(req.body, "Password data");
  if (bodyCheck.empty) {
    return sendResponse(res, 400, null, bodyCheck.message);
  }

  const { password } = req.body;

  if (!password || typeof password !== "string" || password.length < 6) {
    return sendResponse(
      res,
      400,
      null,
      "A valid password with at least 6 characters is required."
    );
  }

  const user = await User.findById(id);
  if (!user) {
    return sendResponse(res, 404, null, "User not found.");
  }

  // Only allow updating admins, not superadmins
  if (user.role === "superadmin") {
    return sendResponse(
      res,
      403,
      null,
      "You cannot update the password of another superadmin."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;

  await user.save();

  return sendResponse(
    res,
    200,
    { id: user._id, username: user.username, role: user.role },
    "Password updated successfully."
  );
});
