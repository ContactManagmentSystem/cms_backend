const Product = require("../models/product");
const Category = require("../models/category");
const User = require("../models/user");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");
const { isValidObjectId } = require("../utils/is_valid_id");
const { validateFileType } = require("../utils/validate_file_type");
const fs = require("fs");
const path = require("path");

// Create Product
exports.createProduct = tryCatch(async (req, res) => {
  const { name, price, discountPrice, category, stockCount, description } = req.body;
  const files = req.files;

  if (!req.userId) {
    return sendResponse(res, 400, null, "User ID is required.");
  }

  if (!name || !price || !category) {
    return sendResponse(res, 400, null, "Name, price, and category are required.");
  }

  if (!files || files.length === 0) {
    return sendResponse(res, 400, null, "At least one product image is required.");
  }

  if (files.length > 5) {
    return sendResponse(res, 400, null, "You can upload a maximum of 5 product images.");
  }

  // Validate MIME types
  for (const file of files) {
    const validation = await validateFileType(file.path);
    if (!validation.valid) {
      return sendResponse(res, 400, null, `Invalid file: ${validation.reason}`);
    }
  }

  if (!isValidObjectId(category)) {
    return sendResponse(res, 400, null, "Invalid category ID format.");
  }

  const categoryExists = await Category.findById(category).lean();
  if (!categoryExists) {
    return sendResponse(res, 404, null, "Category not found.");
  }

  const existing = await Product.findOne({ name }).lean();
  if (existing) {
    return sendResponse(res, 400, null, `Product with name "${name}" already exists.`);
  }

  const imageUrls = files.map(file => `https://backend.olivermenus.com/${file.path}`);

  const product = await Product.create({
    name,
    price,
    discountPrice: discountPrice || null,
    category,
    stockCount: stockCount || 0,
    description,
    images: imageUrls,
    owner: req.userId,
  });

  return sendResponse(res, 201, product, "Product created successfully.");
});

// Get Products
exports.getProducts = tryCatch(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const totalProducts = await Product.countDocuments({ owner: req.userId });
  const user = await User.findById(req.userId).select("productPostLimit").lean();
  const productPostLimit = user?.productPostLimit || 0;

  const products = await Product.find({ owner: req.userId })
    .populate("category", "name _id description image")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return sendResponse(res, 200, {
    products,
    table: {
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      pageLimit: limit,
      totalProducts,
      productPostCount: totalProducts,
      productPostLimit,
    },
  });
});

// Get Product by ID
exports.getProductById = tryCatch(async (req, res) => {
  const { id } = req.params;

  const validation = await isValidObjectId(id, Product);
  if (!validation.valid) {
    return sendResponse(res, 400, null, validation.message);
  }

  const product = await Product.findById(id)
    .populate("category", "name description image")
    .lean();

  if (!product) {
    return sendResponse(res, 404, null, "Product not found.");
  }

  return sendResponse(res, 200, product);
});

// Update Product
exports.updateProduct = tryCatch(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    discountPrice,
    category,
    stockCount,
    description,
    deletedImages,
  } = req.body;
  const files = req.files;

  const validation = await isValidObjectId(id, Product);
  if (!validation.valid) {
    return sendResponse(res, 400, null, validation.message);
  }

  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    return sendResponse(res, 404, null, "Product not found.");
  }

  if (existingProduct.owner.toString() !== req.userId) {
    return sendResponse(res, 403, null, "Access denied. Not your product.");
  }

  const updateData = { name, price, discountPrice, category, stockCount, description };
  let currentImages = existingProduct.images || [];

  if (deletedImages) {
    try {
      const toDelete = JSON.parse(deletedImages);
      toDelete.forEach((imgUrl) => {
        const imgPath = path.join(__dirname, "..", imgUrl.replace(`https://backend.olivermenus.com/`, ""));
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      });
      currentImages = currentImages.filter((img) => !toDelete.includes(img));
    } catch (err) {
      return sendResponse(res, 400, null, "Invalid deletedImages format.");
    }
  }

  const newImageCount = files?.length || 0;
  const totalImageCount = currentImages.length + newImageCount;

  if (totalImageCount > 5) {
    return sendResponse(
      res,
      400,
      null,
      `A product can have a maximum of 5 images. You currently have ${currentImages.length} images.`
    );
  }

  // Validate MIME types of new images
  if (files && files.length > 0) {
    for (const file of files) {
      const validation = await validateFileType(file.path);
      if (!validation.valid) {
        return sendResponse(res, 400, null, `Invalid file: ${validation.reason}`);
      }
    }

    const newImages = files.map(file => `https://backend.olivermenus.com/${file.path}`);
    currentImages = [...currentImages, ...newImages];
  }

  updateData.images = currentImages;

  const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean();

  return sendResponse(res, 200, updatedProduct, "Product updated successfully.");
});

// Delete Product
exports.deleteProduct = tryCatch(async (req, res) => {
  const { id } = req.params;

  const validation = await isValidObjectId(id, Product);
  if (!validation.valid)
    return sendResponse(res, 400, null, validation.message);

  const product = await Product.findById(id);
  if (!product) return sendResponse(res, 404, null, "Product not found.");

  if (product.owner.toString() !== req.userId) {
    return sendResponse(res, 403, null, "Access denied. Not your product.");
  }

  await product.deleteOne();

  return sendResponse(res, 200, null, "Product deleted successfully.");
});

// Public: Get All Products by Admin ID
exports.getProductsByAdmin = tryCatch(async (req, res) => {
  const { adminId } = req.params;
  const { search } = req.query;

  if (!adminId) {
    return sendResponse(res, 400, null, "Admin ID is required.");
  }

  const query = { owner: adminId };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const products = await Product.find(query)
    .populate("category", "name _id description image")
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, products);
});
