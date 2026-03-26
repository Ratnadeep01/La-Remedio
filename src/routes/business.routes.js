import { Router } from 'express';
import Joi from 'joi';
import validate from '../middlewares/validate.js';
import auth from '../middlewares/auth.js';
import {
  createBusiness, getBusiness, updateBusiness,
  addAmenities, setAmenities,
} from '../controllers/business.controller.js';

const router = Router();

const createBusinessSchema = Joi.object({
  type: Joi.string().valid('salon', 'spa', 'clinic').required(),
  name: Joi.string().min(2).max(255).required(),
  about: Joi.string().max(2000).allow('', null),
});

const updateBusinessSchema = Joi.object({
  type: Joi.string().valid('salon', 'spa', 'clinic'),
  name: Joi.string().min(2).max(255),
  about: Joi.string().max(2000).allow('', null),
}).min(1);

const amenitiesSchema = Joi.object({
  amenities: Joi.array().items(Joi.string().min(1).max(100)).min(1).required(),
});

router.use(auth);

router.post('/', validate(createBusinessSchema), createBusiness);
router.get('/', getBusiness);
router.put('/', validate(updateBusinessSchema), updateBusiness);
router.post('/amenities', validate(amenitiesSchema), addAmenities);
router.put('/amenities', validate(amenitiesSchema), setAmenities);

export default router;
