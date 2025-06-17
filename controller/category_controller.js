const Category = require("../models/category");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");
const fs = require("fs");
const path = require("path");

// Create a new category
exports.createCategory = tryCatch(async (req, res) => {
  const { name, description } = req.body;
  const file = req.file;

  if (!req.userId) return sendResponse(res, 400, null, "User ID is required.");
  if (!name) return sendResponse(res, 400, null, "Category name is required.");
  if (!file) return sendResponse(res, 400, null, "Category image is required.");

  const exists = await Category.findOne({ name }).lean();
  if (exists) return sendResponse(res, 400, null, "Category already exists.");

  const imageUrl = `https://backend.olivermenus.com/${file.path}`;

  const category = await Category.create({
    name,
    description: description || "",
    image: imageUrl,
    owner: req.userId,
  });

  return sendResponse(res, 201, category, "Category created successfully.");
});

// Get all categories owned by the logged-in user
exports.getAllCategories = tryCatch(async (req, res) => {
  const categories = await Category.find({ owner: req.userId })
    .sort({ createdAt: -1 })
    .lean();
  return sendResponse(res, 200, categories);
});

// Public: Get categories of a specific admin
exports.getCategoriesByAdmin = tryCatch(async (req, res) => {
  const { adminId } = req.params;

  if (!adminId) return sendResponse(res, 400, null, "Admin ID is required.");

  const categories = await Category.find({ owner: adminId })
    .sort({ createdAt: -1 })
    .lean();

  return sendResponse(res, 200, categories);
});

// Get single category by ID (with owner check)
exports.getCategoryById = tryCatch(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id).lean();
  if (!category) return sendResponse(res, 404, null, "Category not found.");
  if (category.owner.toString() !== req.userId)
    return sendResponse(res, 403, null, "Access denied.");

  return sendResponse(res, 200, category);
});

// Update category (with owner check and image upload)
exports.updateCategory = tryCatch(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const file = req.file;

  const category = await Category.findById(id);
  if (!category) return sendResponse(res, 404, null, "Category not found.");
  if (category.owner.toString() !== req.userId)
    return sendResponse(res, 403, null, "Access denied.");

  if (file) {
    const oldImagePath = path.join(__dirname, "..", category.image);
    if (fs.existsSync(oldImagePath)) {
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error("Failed to delete old image:", err);
      });
    }

    const imageUrl = `https://backend.olivermenus.com/${file.path}`;
    category.image = imageUrl;
  }

  category.name = name ?? category.name;
  category.description = description ?? category.description;

  await category.save();

  return sendResponse(res, 200, category, "Category updated successfully.");
});

// Delete category (with owner check)
exports.deleteCategory = tryCatch(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) return sendResponse(res, 404, null, "Category not found.");
  if (category.owner.toString() !== req.userId)
    return sendResponse(res, 403, null, "Access denied.");

  await category.deleteOne();

  return sendResponse(res, 200, null, "Category deleted successfully.");
});
