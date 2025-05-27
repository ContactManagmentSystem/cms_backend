require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
  process.exit(1); // Exit the process with failure
});

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      // Removed useNewUrlParser, useUnifiedTopology as they're deprecated in MongoDB 4.x
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Connection error!", error);
    throw error;
  }
};

module.exports = connectDB;
