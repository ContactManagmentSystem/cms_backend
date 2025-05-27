const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true,
  },
  platformUserName: {
    type: String,
    required: true,
    trim: true,
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
