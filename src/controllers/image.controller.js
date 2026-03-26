import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ImageModel from '../models/image.model.js';
import BusinessModel from '../models/business.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Helper to get business ID.
 */
const getBusinessId = async (userId) => {
  const business = await BusinessModel.findByUserId(userId);
  return business ? business.id : null;
};

/**
 * POST /api/images
 * Upload images for business (min 2, max 10 total).
 */
export const uploadImages = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const { type = 'normal' } = req.body;
  if (!['normal', 'banner'].includes(type)) {
    return ApiResponse.validationError(res, 'Invalid image type. Must be "normal" or "banner".');
  }

  if (!req.files || req.files.length === 0) {
    return ApiResponse.validationError(res, 'Please upload at least one image.');
  }

  const currentCount = await ImageModel.countByBusinessId(businessId, type);
  const newTotal = currentCount + req.files.length;

  if (newTotal > 10) {
    return ApiResponse.validationError(
      res,
      `Cannot upload ${req.files.length} ${type} image(s). You have ${currentCount}/10 ${type} images. Maximum allowed is 10.`
    );
  }

  const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
  const images = await ImageModel.create(businessId, imageUrls, type);

  return ApiResponse.created(res, 'Images uploaded successfully', {
    images,
    total: newTotal,
  });
});

/**
 * GET /api/images
 * List all images for business.
 */
export const getImages = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const { type } = req.query;
  const images = await ImageModel.findByBusinessId(businessId, type);
  return ApiResponse.success(res, 'Images retrieved', images);
});

/**
 * DELETE /api/images/:id
 * Delete an image (maintains min 2 constraint).
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const image = await ImageModel.findById(req.params.id);
  if (!image) {
    return ApiResponse.notFound(res, 'Image not found.');
  }

  if (image.business_id !== businessId) {
    return ApiResponse.forbidden(res, 'You do not own this image.');
  }

  await ImageModel.delete(req.params.id);
  return ApiResponse.success(res, 'Image deleted');
});

/**
 * PUT /api/images/reorder
 * Reorder images.
 */
export const reorderImages = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const { imageIds } = req.body;
  const images = await ImageModel.reorder(businessId, imageIds);

  return ApiResponse.success(res, 'Images reordered', images);
});
