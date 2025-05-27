const express = require("express");
const { signup, login } = require("../controller/authorize_controller");
const { default: rateLimit } = require("express-rate-limit");

const router = express.Router();
const signupLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1,
  message:
    "Too many accounts created from this IP, please try again after 1 minute",
  headers: true,
});

router.route("/signup").post(signupLimiter, signup);
router.route("/login").post(login);

module.exports = router;
