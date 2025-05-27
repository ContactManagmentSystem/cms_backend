const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByAdmin,
} = require("../controller/product_controller");

const { verifyToken, checkRole } = require("../middleware/checking_middleware");
const upload = require("../middleware/file_upload");

const router = express.Router();

// Public route to get all products of a specific admin
router.get("/public/:adminId", getProductsByAdmin);
router.get("/:id/public/:adminId", getProductById);

// Get all products (paginated) or create a new product (admin only)
router
  .route("/")
  .get(verifyToken, checkRole("admin"), getProducts)
  .post(
    verifyToken,
    checkRole("admin"),
    upload.array("productImage"),
    createProduct
  );

// Get, update, or delete a product by ID (admin only for edit/delete)
router
  .route("/:id")
  .put(
    verifyToken,
    checkRole("admin"),
    upload.array("productImage", 5),
    updateProduct
  )
  .delete(verifyToken, checkRole("admin"), deleteProduct);

module.exports = router;
