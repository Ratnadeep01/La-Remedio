import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import OutletModel from '../models/outlet.model.js';
import BusinessModel from '../models/business.model.js';

/**
 * Helper to get business ID for the current user.
 */
const getBusinessId = async (userId) => {
  const business = await BusinessModel.findByUserId(userId);
  return business ? business.id : null;
};

/**
 * POST /api/outlets
 * Create a new outlet.
 */
export const createOutlet = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) {
    return ApiResponse.notFound(res, 'Business profile not found. Please create one first.');
  }

  const {
    name, addressLine1, addressLine2, city, state,
    pincode, latitude, longitude, contactNumber,
  } = req.body;

  const outlet = await OutletModel.create({
    businessId, name, addressLine1, addressLine2, city,
    state, pincode, latitude, longitude, contactNumber,
  });

  return ApiResponse.created(res, 'Outlet created', outlet);
});

/**
 * GET /api/outlets
 * List all outlets for the business.
 */
export const getOutlets = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const outlets = await OutletModel.findByBusinessId(businessId);
  return ApiResponse.success(res, 'Outlets retrieved', outlets);
});

/**
 * GET /api/outlets/:id
 * Get outlet by ID.
 */
export const getOutlet = asyncHandler(async (req, res) => {
  const outlet = await OutletModel.findById(req.params.id);
  if (!outlet) {
    return ApiResponse.notFound(res, 'Outlet not found.');
  }

  // Verify ownership
  const businessId = await getBusinessId(req.user.id);
  if (outlet.business_id !== businessId) {
    return ApiResponse.forbidden(res, 'You do not own this outlet.');
  }

  return ApiResponse.success(res, 'Outlet retrieved', outlet);
});

/**
 * PUT /api/outlets/:id
 * Update an outlet.
 */
export const updateOutlet = asyncHandler(async (req, res) => {
  const outlet = await OutletModel.findById(req.params.id);
  if (!outlet) {
    return ApiResponse.notFound(res, 'Outlet not found.');
  }

  const businessId = await getBusinessId(req.user.id);
  if (outlet.business_id !== businessId) {
    return ApiResponse.forbidden(res, 'You do not own this outlet.');
  }

  const updated = await OutletModel.update(req.params.id, req.body);
  return ApiResponse.success(res, 'Outlet updated', updated);
});

/**
 * DELETE /api/outlets/:id
 * Delete an outlet.
 */
export const deleteOutlet = asyncHandler(async (req, res) => {
  const outlet = await OutletModel.findById(req.params.id);
  if (!outlet) {
    return ApiResponse.notFound(res, 'Outlet not found.');
  }

  const businessId = await getBusinessId(req.user.id);
  if (outlet.business_id !== businessId) {
    return ApiResponse.forbidden(res, 'You do not own this outlet.');
  }

  await OutletModel.delete(req.params.id);
  return ApiResponse.success(res, 'Outlet deleted');
});
