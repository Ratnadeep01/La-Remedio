import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ServiceModel from '../models/service.model.js';
import CategoryModel from '../models/category.model.js';
import SubCategoryModel from '../models/subCategory.model.js';
import CustomisableModel from '../models/customisable.model.js';
import CustomisableItemModel from '../models/customisableItem.model.js';
import BusinessModel from '../models/business.model.js';

/**
 * Helper to get business ID.
 */
const getBusinessId = async (userId) => {
  const business = await BusinessModel.findByUserId(userId);
  return business ? business.id : null;
};

/**
 * Helper to verify service ownership.
 */
const verifyServiceOwnership = async (serviceId, userId) => {
  console.log(`[VERIFY OWNERSHIP] serviceId: ${serviceId}, userId: ${userId}`);
  const service = await ServiceModel.findById(serviceId);
  if (!service) {
    console.log(`[VERIFY OWNERSHIP] FAILED: Service ${serviceId} not found`);
    return { error: 'Service not found', service: null };
  }
  const businessId = await getBusinessId(userId);
  console.log(`[VERIFY OWNERSHIP] service.business_id: ${service.business_id}, user's businessId: ${businessId}`);
  if (service.business_id !== businessId) {
    console.log(`[VERIFY OWNERSHIP] FAILED: Ownership mismatch`);
    return { error: 'You do not own this service', service: null };
  }
  return { error: null, service };
};

// ================================================================
// SERVICES
// ================================================================

/**
 * GET /api/services/defaults
 * List all default services.
 */
export const getDefaultServices = asyncHandler(async (req, res) => {
  const defaults = await ServiceModel.getDefaults();
  return ApiResponse.success(res, 'Default services retrieved', defaults);
});

/**
 * POST /api/services
 * Add a service to business (from default or custom).
 */
export const createService = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const { defaultServiceId, name, isCustom, sortOrder } = req.body;
  const service = await ServiceModel.create({
    businessId, defaultServiceId, name, isCustom, sortOrder,
  });

  return ApiResponse.created(res, 'Service added', service);
});

/**
 * GET /api/services
 * List all business services with full tree (categories, sub-categories, customisables).
 */
export const getServices = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) {
    return ApiResponse.notFound(res, 'Business profile not found.');
  }

  const services = await ServiceModel.getFullServiceTree(businessId);
  return ApiResponse.success(res, 'Services retrieved', services);
});

/**
 * PUT /api/services/:id
 * Update a service.
 */
export const updateService = asyncHandler(async (req, res) => {
  const { error } = await verifyServiceOwnership(req.params.id, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  const { name, sortOrder } = req.body;
  const updated = await ServiceModel.update(req.params.id, { name, sortOrder });

  return ApiResponse.success(res, 'Service updated', updated);
});

/**
 * DELETE /api/services/:id
 * Delete a service (cascades all categories, sub-categories, customisables).
 */
export const deleteService = asyncHandler(async (req, res) => {
  const { error } = await verifyServiceOwnership(req.params.id, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  await ServiceModel.delete(req.params.id);
  return ApiResponse.success(res, 'Service deleted');
});

// ================================================================
// CATEGORIES
// ================================================================

/**
 * POST /api/services/:serviceId/categories
 * Add a category to a service.
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { error } = await verifyServiceOwnership(req.params.serviceId, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  const { title, sortOrder } = req.body;
  const category = await CategoryModel.create({
    businessServiceId: req.params.serviceId, title, sortOrder,
  });

  return ApiResponse.created(res, 'Category created', category);
});

/**
 * PUT /api/categories/:id
 * Update a category.
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) return ApiResponse.notFound(res, 'Category not found');

  const { error } = await verifyServiceOwnership(category.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  const { title, sortOrder } = req.body;
  const updated = await CategoryModel.update(req.params.id, { title, sortOrder });

  return ApiResponse.success(res, 'Category updated', updated);
});

/**
 * DELETE /api/categories/:id
 * Delete a category (cascades sub-categories).
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) return ApiResponse.notFound(res, 'Category not found');

  const { error } = await verifyServiceOwnership(category.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  await CategoryModel.delete(req.params.id);
  return ApiResponse.success(res, 'Category deleted');
});

// ================================================================
// SUB-CATEGORIES
// ================================================================

/**
 * POST /api/services/:serviceId/sub-categories
 * Add a sub-category (with optional categoryId).
 */
export const createSubCategory = asyncHandler(async (req, res) => {
  const { error } = await verifyServiceOwnership(req.params.serviceId, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  const { categoryId, title, description, price, gender, sortOrder } = req.body;

  // If categoryId provided, verify it belongs to this service
  if (categoryId) {
    const category = await CategoryModel.findById(categoryId);
    if (!category || category.business_service_id !== req.params.serviceId) {
      return ApiResponse.validationError(res, 'Category does not belong to this service.');
    }
  }

  const subCategory = await SubCategoryModel.create({
    businessServiceId: req.params.serviceId,
    categoryId, title, description, price, gender, sortOrder,
  });

  return ApiResponse.created(res, 'Sub-category created', subCategory);
});

/**
 * PUT /api/sub-categories/:id
 * Update a sub-category.
 */
export const updateSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategoryModel.findById(req.params.id);
  if (!subCategory) return ApiResponse.notFound(res, 'Sub-category not found');

  const { error } = await verifyServiceOwnership(subCategory.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  const { title, description, price, gender, sortOrder, categoryId } = req.body;
  const updated = await SubCategoryModel.update(req.params.id, {
    title, description, price, gender, sortOrder, categoryId,
  });

  return ApiResponse.success(res, 'Sub-category updated', updated);
});

/**
 * DELETE /api/sub-categories/:id
 * Delete a sub-category (cascades customisables).
 */
export const deleteSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategoryModel.findById(req.params.id);
  if (!subCategory) return ApiResponse.notFound(res, 'Sub-category not found');

  const { error } = await verifyServiceOwnership(subCategory.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  await SubCategoryModel.delete(req.params.id);
  return ApiResponse.success(res, 'Sub-category deleted');
});

// ================================================================
// CUSTOMISABLES
// ================================================================

/**
 * POST /api/sub-categories/:subCategoryId/customisables
 * Add a customisable group to a sub-category.
 */
export const createCustomisable = asyncHandler(async (req, res) => {
  const subCategory = await SubCategoryModel.findById(req.params.subCategoryId);
  if (!subCategory) return ApiResponse.notFound(res, 'Sub-category not found');

  const { error } = await verifyServiceOwnership(subCategory.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  const { shortTitle, sortOrder } = req.body;
  const customisable = await CustomisableModel.create({
    subCategoryId: req.params.subCategoryId, shortTitle, sortOrder,
  });

  return ApiResponse.created(res, 'Customisable group created', customisable);
});

/**
 * PUT /api/customisables/:id
 * Update a customisable group.
 */
export const updateCustomisable = asyncHandler(async (req, res) => {
  const customisable = await CustomisableModel.findById(req.params.id);
  if (!customisable) return ApiResponse.notFound(res, 'Customisable not found');

  const subCategory = await SubCategoryModel.findById(customisable.sub_category_id);
  const { error } = await verifyServiceOwnership(subCategory.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  const { shortTitle, sortOrder } = req.body;
  const updated = await CustomisableModel.update(req.params.id, { shortTitle, sortOrder });

  return ApiResponse.success(res, 'Customisable group updated', updated);
});

/**
 * DELETE /api/customisables/:id
 * Delete a customisable group (cascades items).
 */
export const deleteCustomisable = asyncHandler(async (req, res) => {
  const customisable = await CustomisableModel.findById(req.params.id);
  if (!customisable) return ApiResponse.notFound(res, 'Customisable not found');

  const subCategory = await SubCategoryModel.findById(customisable.sub_category_id);
  const { error } = await verifyServiceOwnership(subCategory.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  await CustomisableModel.delete(req.params.id);
  return ApiResponse.success(res, 'Customisable group deleted');
});

// ================================================================
// CUSTOMISABLE ITEMS
// ================================================================

/**
 * POST /api/customisables/:customisableId/items
 * Add an item to a customisable group.
 */
export const createCustomisableItem = asyncHandler(async (req, res) => {
  const customisable = await CustomisableModel.findById(req.params.customisableId);
  if (!customisable) return ApiResponse.notFound(res, 'Customisable group not found');

  const subCategory = await SubCategoryModel.findById(customisable.sub_category_id);
  const { error } = await verifyServiceOwnership(subCategory.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  const { itemName, startingPrice, sortOrder } = req.body;
  const item = await CustomisableItemModel.create({
    customisableId: req.params.customisableId, itemName, startingPrice, sortOrder,
  });

  return ApiResponse.created(res, 'Customisable item created', item);
});

/**
 * PUT /api/customisable-items/:id
 * Update a customisable item.
 */
export const updateCustomisableItem = asyncHandler(async (req, res) => {
  const item = await CustomisableItemModel.findById(req.params.id);
  if (!item) return ApiResponse.notFound(res, 'Customisable item not found');

  const customisable = await CustomisableModel.findById(item.customisable_id);
  const subCategory = await SubCategoryModel.findById(customisable.sub_category_id);
  const { error } = await verifyServiceOwnership(subCategory.business_service_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  const { itemName, startingPrice, sortOrder } = req.body;
  const updated = await CustomisableItemModel.update(req.params.id, {
    itemName, startingPrice, sortOrder,
  });

  return ApiResponse.success(res, 'Customisable item updated', updated);
});

/**
 * DELETE /api/customisable-items/:id
 * Delete a customisable item.
 */
export const deleteCustomisableItem = asyncHandler(async (req, res) => {
  const item = await CustomisableItemModel.findById(req.params.id);
  if (!item) return ApiResponse.notFound(res, 'Customisable item not found');

  const customisable = await CustomisableModel.findById(item.customisable_id);
  const subCategory = await SubCategoryModel.findById(customisable.sub_category_id);
  await CustomisableItemModel.delete(req.params.id);
  return ApiResponse.success(res, 'Customisable item deleted');
});

/**
 * POST /api/services/bulk
 * Create a full hierarchy in one transaction.
 */
export const createBulkService = asyncHandler(async (req, res) => {
  const businessId = await getBusinessId(req.user.id);
  if (!businessId) return ApiResponse.notFound(res, 'Business profile not found.');

  const {
    defaultServiceId, name, isCustom,
    hasCategories, categoryTitle,
    subTitle, subDescription, subPrice, subGender
  } = req.body;

  // 1. Create Service
  const service = await ServiceModel.create({
    businessId, defaultServiceId, name, isCustom
  });

  // 2. Create Category (optional)
  let categoryId = null;
  if (hasCategories && categoryTitle) {
    const cat = await CategoryModel.create({
      businessServiceId: service.id, title: categoryTitle
    });
    categoryId = cat.id;
  }

  // 3. Create Sub-category
  const subCategory = await SubCategoryModel.create({
    businessServiceId: service.id,
    categoryId,
    title: subTitle,
    description: subDescription,
    price: subPrice,
    gender: subGender
  });

  return ApiResponse.created(res, 'Service hierarchy created', {
    service,
    category: categoryId,
    subCategory
  });
});
