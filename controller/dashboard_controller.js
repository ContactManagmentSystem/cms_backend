const Package = require("../models/package");
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");

// Get dashboard data
exports.getDashboard = tryCatch(async (req, res) => {
  const [
    userCount,
    packageCount,
    productCount,
    totalPendingOrders,
    totalDoneOrders,
    orderedUsers,
    monthlyUserCount,
    monthlyOrderCount,
  ] = await Promise.all([
    User.countDocuments(),
    Package.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments({ progress: "pending" }),
    Order.countDocuments({ progress: "done" }),
    // Count users who have placed at least one order
    Order.aggregate([
      {
        $group: {
          _id: "$user",
          lastOrder: { $max: "$orderDate" },
        },
      },
      {
        $match: {
          lastOrder: { $ne: null },
        },
      },
      {
        $count: "orderedUsers",
      },
    ]),
    // Group users by month
    User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),
    // Group orders by month
    Order.aggregate([
      {
        $group: {
          _id: { $month: "$orderDate" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),
  ]);

  // Handle the case where orderedUsers might be an empty array
  const orderedUsersCount =
    orderedUsers.length > 0 ? orderedUsers[0].orderedUsers : 0;

  // Process monthly data to fit the 12 months structure
  const monthlyUsers = Array(12).fill(0);
  const monthlyOrders = Array(12).fill(0);

  monthlyUserCount.forEach((entry) => {
    monthlyUsers[entry._id - 1] = entry.count;
  });

  monthlyOrderCount.forEach((entry) => {
    monthlyOrders[entry._id - 1] = entry.count;
  });

  // Construct the response data
  const dashboardData = {
    totalUsers: userCount,
    totalPackages: packageCount,
    totalProducts: productCount,
    totalPendingOrders: totalPendingOrders,
    totalDoneOrders: totalDoneOrders,
    orderedUsers: orderedUsersCount,
    chartData: {
      monthlyUsers,
      monthlyOrders,
    },
  };

  // Send response
  return sendResponse(res, 200, dashboardData);
});
