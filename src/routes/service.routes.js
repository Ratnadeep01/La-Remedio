import { Router } from 'express';
import Joi from 'joi';
import validate from '../middlewares/validate.js';
import auth from '../middlewares/auth.js';
import {
  getDefaultServices, createService, getServices, updateService, deleteService,
  createBulkService,
  createCategory, updateCategory, deleteCategory,
  createSubCategory, updateSubCategory, deleteSubCategory,
  createCustomisable, updateCustomisable, deleteCustomisable,
  createCustomisableItem, updateCustomisableItem, deleteCustomisableItem,
} from '../controllers/service.controller.js';

const router = Router();

// ---- Validation Schemas ----

const createServiceSchema = Joi.object({
  defaultServiceId: Joi.string().uuid().allow(null),
  name: Joi.string().min(1).max(255).required(),
  isCustom: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateServiceSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  sortOrder: Joi.number().integer().min(0),
}).min(1);

const createCategorySchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateCategorySchema = Joi.object({
  title: Joi.string().min(1).max(255),
  sortOrder: Joi.number().integer().min(0),
}).min(1);

const createSubCategorySchema = Joi.object({
  categoryId: Joi.string().uuid().allow(null),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow('', null),
  price: Joi.number().precision(2).min(0).required(),
  gender: Joi.string().valid('male', 'female', 'both').default('both'),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateSubCategorySchema = Joi.object({
  categoryId: Joi.string().uuid().allow(null),
  title: Joi.string().min(1).max(255),
  description: Joi.string().max(1000).allow('', null),
  price: Joi.number().precision(2).min(0),
  gender: Joi.string().valid('male', 'female', 'both'),
  sortOrder: Joi.number().integer().min(0),
}).min(1);

const createCustomisableSchema = Joi.object({
  shortTitle: Joi.string().min(1).max(255).required(),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateCustomisableSchema = Joi.object({
  shortTitle: Joi.string().min(1).max(255),
  sortOrder: Joi.number().integer().min(0),
}).min(1);

const createItemSchema = Joi.object({
  itemName: Joi.string().min(1).max(255).required(),
  startingPrice: Joi.number().precision(2).min(0).required(),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateItemSchema = Joi.object({
  itemName: Joi.string().min(1).max(255),
  startingPrice: Joi.number().precision(2).min(0),
  sortOrder: Joi.number().integer().min(0),
}).min(1);

// ---- Routes ----

// Default services (public, but still behind auth)
router.get('/defaults', auth, getDefaultServices);

// Business services
router.use(auth);

router.post('/', validate(createServiceSchema), createService);
router.post('/bulk', createBulkService);
router.get('/', getServices);
router.put('/:id', validate(updateServiceSchema), updateService);
router.delete('/:id', deleteService);

// Categories under a service
router.post('/:serviceId/categories', validate(createCategorySchema), createCategory);

// Sub-categories under a service (with optional categoryId)
router.post('/:serviceId/sub-categories', validate(createSubCategorySchema), createSubCategory);

export default router;

// ---- Standalone routes for categories, sub-categories, customisables, items ----
// These are mounted separately in the route aggregator

export const categoryRouter = Router();
categoryRouter.use(auth);
categoryRouter.put('/:id', validate(updateCategorySchema), updateCategory);
categoryRouter.delete('/:id', deleteCategory);

export const subCategoryRouter = Router();
subCategoryRouter.use(auth);
subCategoryRouter.put('/:id', validate(updateSubCategorySchema), updateSubCategory);
subCategoryRouter.delete('/:id', deleteSubCategory);
subCategoryRouter.post('/:subCategoryId/customisables', validate(createCustomisableSchema), createCustomisable);

export const customisableRouter = Router();
customisableRouter.use(auth);
customisableRouter.put('/:id', validate(updateCustomisableSchema), updateCustomisable);
customisableRouter.delete('/:id', deleteCustomisable);
customisableRouter.post('/:customisableId/items', validate(createItemSchema), createCustomisableItem);

export const customisableItemRouter = Router();
customisableItemRouter.use(auth);
customisableItemRouter.put('/:id', validate(updateItemSchema), updateCustomisableItem);
customisableItemRouter.delete('/:id', deleteCustomisableItem);
