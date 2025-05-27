const express = require("express");
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesByAdmin,
} = require("../controller/category_controller");

const upload = require("../middleware/file_upload");
const { verifyToken, checkRole } = require("../middleware/checking_middleware");

router
  .route("/")
  .post(
    verifyToken,
    checkRole("admin"),
    upload.single("categoryImage"),
    createCategory
  )
  .get(verifyToken, checkRole("admin"), getAllCategories);

router
  .route("/:id")
  .get(verifyToken, checkRole("admin"), getCategoryById)
  .put(
    verifyToken,
    checkRole("admin"),
    upload.single("categoryImage"),
    updateCategory
  )
  .delete(verifyToken, checkRole("admin"), deleteCategory);

router.get("/public/:adminId", getCategoriesByAdmin);

module.exports = router;
