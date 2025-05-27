const mongoose = require("mongoose");

function generateShopID() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["superadmin", "admin"],
    default: "admin",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  shopID: {
    type: String,
    unique: true,
    default: generateShopID,
  },
  domainName: {
    type: String,
    required: true,
    trim: true,
  },
  serverStartDate: {
    type: String,
    default: () => new Date().toISOString(),
  },
  serverExpiredDate: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },
  contactInfo: {
    line: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    messenger: { type: String, trim: true },
    viber: { type: String, trim: true },
    telegram: { type: String, trim: true },
  },
  productPostLimit: {
    type: Number,
    default: 50,
    min: 1,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
