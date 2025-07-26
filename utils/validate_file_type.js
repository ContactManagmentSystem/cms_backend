const { fileTypeFromBuffer } = require('file-type');
const fs = require('fs/promises');

/**
 * Validates file type from disk using its buffer.
 * @param {string} filePath - Path to the file on disk
 * @param {string[]} allowedMimeTypes - Array of allowed MIME types
 * @returns {Promise<{ valid: boolean, mime?: string, reason?: string }>}
 */
async function validateFileType(filePath, allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp']) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileType = await fileTypeFromBuffer(fileBuffer);

    if (!fileType) {
      return { valid: false, reason: 'File type could not be determined.' };
    }

    if (!allowedMimeTypes.includes(fileType.mime)) {
      return { valid: false, reason: `Unsupported file type: ${fileType.mime}` };
    }

    return { valid: true, mime: fileType.mime };
  } catch (err) {
    return { valid: false, reason: 'Error reading file: ' + err.message };
  }
}

module.exports = { validateFileType };
