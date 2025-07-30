const fileType = require("file-type");
const fs = require("fs/promises");
const path = require("path");

/**
 * Validates file type from disk using its buffer.
 * @param {string} filePath - Path to the file on disk (relative or absolute)
 * @param {string[]} allowedMimeTypes - Array of allowed MIME types
 * @returns {Promise<{ valid: boolean, mime?: string, reason?: string }>}
 */
async function validateFileType(filePath, allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp']) {
  try {
    // console.log(filePath)
    const absolutePath = path.resolve(filePath);
    const fileBuffer = await fs.readFile(absolutePath);
    const fileTypeResult = await fileType.fromBuffer(fileBuffer); 

    if (!fileTypeResult) {
      return { valid: false, reason: 'File type could not be determined.' };
    }

    if (!allowedMimeTypes.includes(fileTypeResult.mime)) {
      return { valid: false, reason: `Unsupported file type: ${fileTypeResult.mime}` };
    }

    return { valid: true, mime: fileTypeResult.mime };
  } catch (err) {
    // console.log(err)
    return { valid: false, reason: 'Error reading file: ' + err.message };
  }
}

module.exports = { validateFileType };
