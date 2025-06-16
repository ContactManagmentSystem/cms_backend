const mongoose = require("mongoose");

const landingSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
    trim: true,
    default: "My Store",
  },
  colourCode: {
    type: String,
    required: true,
    trim: true,
    match: /^#([0-9A-F]{3}){1,2}$/i,
    default: "#000000",
  },
  image: {
    type: String,
    required: true,
  },
  heroImage: {
    type: [String],
    default: [],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  acceptPaymentTypes: {
    type: [String],
    enum: ["COD", "Prepaid"],
    default: ["COD"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Landing = mongoose.model("Landing", landingSchema);

module.exports = Landing;
