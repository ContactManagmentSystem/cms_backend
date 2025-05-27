const mongoose = require("mongoose");

exports.isValidObjectId = async (id, model) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, message: `Invalid ID format: ${id}` };
  }

  if (model) {
    const document = await model.findById(id);
    if (!document) {
      return { valid: false, message: `ID not found: ${id}` };
    }
  }

  return { valid: true };
};

exports.checkIfEmpty = (data, label = "Data") => {
  const isEmpty =
    !data || (typeof data === "object" && Object.keys(data).length === 0);
  return isEmpty
    ? { empty: true, message: `${label} cannot be empty.` }
    : { empty: false };
};

exports.checkParamId = (id, label = "ID") => {
  if (!id || typeof id !== "string" || id.trim() === "") {
    return { valid: false, message: `${label} is required.` };
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, message: `${label} format is invalid.` };
  }

  return { valid: true };
};

