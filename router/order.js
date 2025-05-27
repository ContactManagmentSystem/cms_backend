const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderProgress,
  deleteOrder,
  getOrdersByAdmin,
} = require("../controller/order_controller");

const { verifyToken, checkRole } = require("../middleware/checking_middleware");
const upload = require("../middleware/file_upload");

const router = express.Router();

//public create order and getOrderByID
router.post("/", upload.single("transactionScreenshot"), createOrder);
router.get("/:id", getOrderById);

//private route
router.get("/", verifyToken, checkRole("admin"), getOrders);
router.put("/:id", verifyToken, checkRole("admin"), updateOrderProgress);
router.delete("/:id", verifyToken, checkRole("admin"), deleteOrder);

module.exports = router;
