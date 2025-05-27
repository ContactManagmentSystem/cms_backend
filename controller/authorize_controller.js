const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");

// Signup Controller
exports.signup = tryCatch(async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  // Validate that all fields are provided
  if (!username || !email || !password || !confirmPassword) {
    return sendResponse(res, 400, null, "All fields are required.");
  }

  // Check if the password and confirmPassword match
  if (password !== confirmPassword) {
    return sendResponse(res, 400, null, "Passwords do not match.");
  }

  // Check if the email already exists
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    return sendResponse(res, 400, null, `Email "${email}" is already in use.`);
  }
 const existingUsernameUser = await User.findOne({ username }).lean();
 if (existingUsernameUser) {
   return sendResponse(
     res,
     400,
     null,
     `Username "${username}" is already in use.`
   );
 }
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    role: role || "user",
  });

  // Save the user to the database
  await newUser.save();

  // Prepare the response
  const responseUser = {
    username: newUser.username,
    email: newUser.email,
  };

  return sendResponse(res, 201, responseUser, "User created successfully!");
});

// Login Controller
exports.login = tryCatch(async (req, res) => {
  const { email, password } = req.body;

  // Validate that both email and password are provided
  if (!email || !password) {
    return sendResponse(res, 400, null, "Email and password are required.");
  }

  // Check if the user exists
  const user = await User.findOne({ email }).lean();
  if (!user) {
    return sendResponse(res, 400, null, "Invalid email or password.");
  }

  // Compare the password with the hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendResponse(res, 400, null, "Invalid email or password.");
  }

  // Create a JWT token with user ID and role
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET
  );

  // Prepare the response
  const responseUser = {
    data: { username: user.username, email: user.email, role: user.role },
    token,
  };

  return sendResponse(res, 200, responseUser, "Login successful!");
});
