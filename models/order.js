const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      required: true,
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
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// 🔠 Generate 7-character code (uppercase + numbers)
function generateOrderCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 🛠 Ensure unique orderCode before saving
orderSchema.pre("validate", async function (next) {
  if (!this.orderCode) {
    let code;
    let exists = true;

    while (exists) {
      code = generateOrderCode();
      exists = await mongoose.models.Order.findOne({ orderCode: code });
    }

    this.orderCode = code;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
