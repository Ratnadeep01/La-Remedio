import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import BusinessModel from '../models/business.model.js';

/**
 * POST /api/business
 * Create business profile.
 */
export const createBusiness = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Check if user already has a business
  const existing = await BusinessModel.findByUserId(userId);
  if (existing) {
    return ApiResponse.error(res, 'Business profile already exists. Use PUT to update.', 409);
  }

  const { type, name, about } = req.body;
  const business = await BusinessModel.create({ userId, type, name, about });

  return ApiResponse.created(res, 'Business profile created', business);
});

/**
 * GET /api/business
 * Get current user's business profile with amenities.
 */
export const getBusiness = asyncHandler(async (req, res) => {
  const business = await BusinessModel.findWithAmenities(req.user.id);
  if (!business) {
    return ApiResponse.notFound(res, 'Business profile not found. Please create one first.');
  }

  return ApiResponse.success(res, 'Business profile retrieved', business);
});

/**
 * PUT /api/business
 * Update business profile.
 */
export const updateBusiness = asyncHandler(async (req, res) => {
  const business = await BusinessModel.findByUserId(req.user.id);
  if (!business) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const { type, name, about } = req.body;
  const updated = await BusinessModel.update(business.id, { type, name, about });

  return ApiResponse.success(res, 'Business profile updated', updated);
});

/**
 * POST /api/business/amenities
 * Add amenities to business.
 */
export const addAmenities = asyncHandler(async (req, res) => {
  const business = await BusinessModel.findByUserId(req.user.id);
  if (!business) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const { amenities } = req.body;
  const added = await BusinessModel.addAmenities(business.id, amenities);

  return ApiResponse.created(res, 'Amenities added', added);
});

/**
 * PUT /api/business/amenities
 * Replace all amenities for business.
 */
export const setAmenities = asyncHandler(async (req, res) => {
  const business = await BusinessModel.findByUserId(req.user.id);
  if (!business) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const { amenities } = req.body;
  const updated = await BusinessModel.setAmenities(business.id, amenities);

  return ApiResponse.success(res, 'Amenities updated', updated);
});
