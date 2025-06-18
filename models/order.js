const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      sparse: true,
      required: function () {
        return this.progress === "accepted" || this.progress === "done";
      },
    },
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
    reason: {
      type: String,
      required: function () {
        return this.progress === "declined";
      },
      default: "No Reason",
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
        return this.paymentType === "Prepaid";
      },
    },
    paymentDetails: {
      paymentPlatform: {
        type: String,
        required: function () {
          return this.paymentType === "Prepaid";
        },
      },
      paymentPlatformUserName: {
        type: String,
        required: function () {
          return this.paymentType === "Prepaid";
        },
      },
      accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        required: function () {
          return this.paymentType === "Prepaid";
        },
      },
    },
    siteOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
