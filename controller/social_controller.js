const SocialLink = require("../models/social");
const Landing = require("../models/landing");
const { tryCatch } = require("../utils/try_catch");
const { sendResponse } = require("../utils/response");
const { checkParamId, checkIfEmpty } = require("../utils/is_valid_id");

exports.createSocialLink = tryCatch(async (req, res) => {
  const { name, link, icon } = req.body;
  const { landingId } = req.params;
  
  console.log(name);
  console.log(link);
  console.log(icon);

  if (!name || !link || !icon) {
    return sendResponse(res, 400, null, "All fields are required.");
  }

  const landing = await Landing.findById(landingId);
  if (!landing) {
    return sendResponse(res, 404, null, "Landing not found.");
  }

  // Create the social link
  const newLink = await SocialLink.create({
    name,
    link,
    icon,
    landingId,
    owner: req.userId,
  });

  // Add the social link ID to the landing's socialLinks array
  landing.socialLinks.push(newLink._id);
  await landing.save();

  return sendResponse(
    res,
    201,
    newLink,
    "Social link created and linked to landing."
  );
});

// Get all social links for a landing
exports.getSocialLinksByLanding = tryCatch(async (req, res) => {
  const { landingId } = req.params;

  const landing = await Landing.findById(landingId);
  if (!landing) {
    return sendResponse(res, 404, null, "Landing not found.");
  }

  // Check if the current user is the owner of the landing
  if (landing.owner.toString() !== req.userId) {
    return sendResponse(
      res,
      403,
      null,
      "Access denied. Not the owner of this landing."
    );
  }

  const links = await SocialLink.find({ landingId }).lean();
  return sendResponse(res, 200, links, "Social links fetched successfully.");
});

// Update a specific social link
exports.updateSocialLink = tryCatch(async (req, res) => {
  const { socialLinkId } = req.params;
  const { name, link, icon } = req.body;

  const idCheck = checkParamId(socialLinkId, "Social Link ID");
  if (!idCheck.valid) {
    return sendResponse(res, 400, null, idCheck.message);
  }

  const linkDoc = await SocialLink.findById(socialLinkId);
  if (!linkDoc) {
    return sendResponse(res, 404, null, "Social link not found.");
  }

  linkDoc.name = name ?? linkDoc.name;
  linkDoc.link = link ?? linkDoc.link;
  linkDoc.icon = icon ?? linkDoc.icon;

  await linkDoc.save();

  return sendResponse(res, 200, linkDoc, "Social link updated successfully.");
});

// Delete a social link
exports.deleteSocialLink = tryCatch(async (req, res) => {
  const { socialLinkId } = req.params;

  const idCheck = checkParamId(socialLinkId, "Social Link ID");
  if (!idCheck.valid) {
    return sendResponse(res, 400, null, idCheck.message);
  }

  const deleted = await SocialLink.findByIdAndDelete(socialLinkId);
  if (!deleted) {
    return sendResponse(res, 404, null, "Social link not found.");
  }

  return sendResponse(res, 204, null, "Social link deleted successfully.");
});
