const express = require("express");
const router = express.Router();
const {
  createLanding,
  getMyLanding,
  getLandingById,
  updateLanding,
  deleteLanding,
  getPublicLandingByAdmin,
  updatePaymentTypes,
} = require("../controller/landing_controller");

const { verifyToken, checkRole } = require("../middleware/checking_middleware");
const upload = require("../middleware/file_upload");

const landingUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "heroImage", maxCount: 5 }, 
]);

// Admin routes: Create, view, update, delete their landing
router.post("/", verifyToken, checkRole("admin"), landingUpload, createLanding);

// Public route: View landing page by admin ID (no authentication)
router.get("/public/:adminId", getPublicLandingByAdmin);
router.get("/my", verifyToken, checkRole("admin"), getMyLanding);

// PATCH route for payment types only
router.patch(
  "/payment-types",
  verifyToken,
  checkRole("admin"),
  updatePaymentTypes
);

router
  .route("/:id")
  .get(verifyToken, checkRole("admin"), getLandingById)
  .put(
    verifyToken,
    checkRole("admin"),
    landingUpload, 
    updateLanding
  )
  .delete(verifyToken, checkRole("admin"), deleteLanding);

module.exports = router;
