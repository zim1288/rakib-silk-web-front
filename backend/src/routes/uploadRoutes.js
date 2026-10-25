/**
 * Upload & Media Express Routes.
 * 
 * Maps `/v1/upload` and `/v1/delete-image` endpoints to uploadController.
 */

const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const uploadController = require('../controllers/uploadController');

router.post('/upload', upload.single('image'), uploadController.uploadImage);
router.post('/delete-image', uploadController.deleteImage);

module.exports = router;
