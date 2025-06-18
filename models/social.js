const mongoose = require("mongoose");

const socialLinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  link: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    required: true,
    trim: true,
  },
  landingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Landing",
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});


const SocialLink = mongoose.model("SocialLink", socialLinkSchema);
module.exports = SocialLink;
