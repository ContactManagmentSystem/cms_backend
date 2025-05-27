const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    progress: {
      type: String,
      enum: ["pending", "accepted", "declined", "done"],
      default: "pending",
    },
    phonePrimary: {
      type: String,
      required: true,
    },
    phoneSecondary: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["COD", "Prepaid"],
      required: true,
    },
    transactionScreenshot: {
      type: String,
      required: function () {
        return this.paymentType === "prepaid";
      },
    },
    paymentDetails: {
      paymentPlatform: {
        type: String,
        required: function () {
          return this.paymentType === "prepaid";
        },
      },
      paymentPlatformUserName: {
        type: String,
        required: function () {
          return this.paymentType === "prepaid";
        },
      },
      accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        required: function () {
          return this.paymentType === "prepaid";
        },
      },
    },
    siteOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "Admin" depending on your user model
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
