const express = require("express");
const router = express.Router();

const { verifyToken, checkRole } = require("../middleware/checking_middleware");
const {
  createSocialLink,
  getSocialLinksByLanding,
  updateSocialLink,
  deleteSocialLink,
} = require("../controller/social_controller");

// Admin-only routes for managing social media links associated with a landing page

// Create a new social link for a landing page
router.post("/:landingId", verifyToken, checkRole("admin"), createSocialLink);

// Get all social links for a specific landing page
router.get(
  "/:landingId",
  verifyToken,
  checkRole("admin"),
  getSocialLinksByLanding
);

// Update a specific social link by its ID
router.put("/:socialLinkId", verifyToken, checkRole("admin"), updateSocialLink);

// Delete a specific social link by its ID
router.delete(
  "/:socialLinkId",
  verifyToken,
  checkRole("admin"),
  deleteSocialLink
);

module.exports = router;
