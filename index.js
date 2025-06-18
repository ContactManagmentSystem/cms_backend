const express = require("express");
const connectDB = require("./db/mongo");
const productRouter = require("./router/product");
const categoryRouter = require("./router/category");
const landingRouter = require("./router/landing");
const socialRouter = require("./router/social");
const paymentRouter = require("./router/payment");
const userRouter = require("./router/user");
const authRouter = require("./router/authorize");
// const dashboardRouter = require("./router/dashboard");
const orderRouter = require("./router/order");
const notFound = require("./middleware/not_found");
const errorHandler = require("./middleware/error_handler");
const cors = require("cors");
const path = require("path");

const testing = require("./router/testing");

const app = express();
const port = 7677;

// Connect to the database
connectDB()
  .then(() => {
    app.use(express.json());

    // Enable CORS for any origin
    app.use(cors());

    // Register routers
    app.use("/api/v1/products", productRouter);
    app.use("/api/v1/cate", categoryRouter);
    app.use("/api/v1/landing", landingRouter);
    app.use("/api/v1/social", socialRouter);
    app.use("/api/v1/payment", paymentRouter);
    // app.use("/api/v1/dashboard", dashboardRouter);
    app.use("/api/v1/orders", orderRouter);
    app.use("/api/v1/users", userRouter);
    app.use("/api/v1/auth", authRouter);

    app.use("/uploads", express.static(path.join(__dirname, "uploads")));
    app.use("/api/v1/file", testing);

    // Error handling middlewares
    app.use(notFound);
    app.use(errorHandler);

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
