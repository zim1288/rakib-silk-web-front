/**
 * Cloudinary Media Storage Configuration.
 * 
 * Configures Cloudinary SDK v2 and Multer Cloudinary storage engine
 * for uploading merchant item images and deleting obsolete photos.
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer storage engine pointing to Cloudinary 'tally-app' folder
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tally-app',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

// Multer upload middleware instance for single or multi-part processing
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file limit
  },
});

module.exports = {
  cloudinary,
  upload,
};
