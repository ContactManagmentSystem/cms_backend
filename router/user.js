const express = require("express");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updatePassword,
} = require("../controller/user_controller");
const { verifyToken, checkRole } = require("../middleware/checking_middleware");

const router = express.Router();

router.route("/").post(verifyToken, checkRole("superadmin"), createUser);

router.route("/").get(verifyToken, checkRole("superadmin"), getUsers);

router
  .route("/:id")
  .get(verifyToken, checkRole("superadmin"), getUserById)
  .put(verifyToken, checkRole("superadmin"), updateUser)
  .post(verifyToken, checkRole("superadmin"), updatePassword)
  .delete(verifyToken, checkRole("superadmin"), deleteUser);

module.exports = router;
