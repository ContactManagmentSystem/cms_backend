const express = require("express");
const {
  createPayment,
  getPayments,
  updatePayment,
  deletePayment,
  getPaymentsByAdmin,
} = require("../controller/payment_controller");

const { verifyToken, checkRole } = require("../middleware/checking_middleware");

const router = express.Router();

// Public route to get all payments of a specific admin
router.get("/public/:adminId", getPaymentsByAdmin);

// Get all payments (admin only) or create a new one
router
  .route("/")
  .get(verifyToken, checkRole("admin"), getPayments)
  .post(verifyToken, checkRole("admin"), createPayment);

// Update or delete payment by ID (admin only)
router
  .route("/:id")
  .put(verifyToken, checkRole("admin"), updatePayment)
  .delete(verifyToken, checkRole("admin"), deletePayment);

module.exports = router;
