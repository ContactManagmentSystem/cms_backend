const express = require("express");
const { verifyToken, checkRole } = require("../middleware/checking_middleware");
const { getDashboard } = require("../controller/dashboard_controller");

const router = express.Router();

router.route("/").post(verifyToken, checkRole("superadmin"), getDashboard);

module.exports = router;
