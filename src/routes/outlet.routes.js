import { Router } from 'express';
import Joi from 'joi';
import validate from '../middlewares/validate.js';
import auth from '../middlewares/auth.js';
import {
  createOutlet, getOutlets, getOutlet, updateOutlet, deleteOutlet,
} from '../controllers/outlet.controller.js';
import {
  getSchedules, createSchedule, bulkSetSchedules,
  getWeeklySchedules, setWeeklySchedules
} from '../controllers/schedule.controller.js';

const router = Router();

const createOutletSchema = Joi.object({
  name: Joi.string().max(255).allow('', null),
  addressLine1: Joi.string().max(255).allow('', null),
  addressLine2: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100).allow('', null),
  state: Joi.string().max(100).allow('', null),
  pincode: Joi.string().max(10).allow('', null),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  contactNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required()
    .messages({ 'string.pattern.base': 'Contact number must be 10-15 digits' }),
});

const updateOutletSchema = Joi.object({
  name: Joi.string().max(255).allow('', null),
  addressLine1: Joi.string().max(255).allow('', null),
  addressLine2: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100).allow('', null),
  state: Joi.string().max(100).allow('', null),
  pincode: Joi.string().max(10).allow('', null),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  contactNumber: Joi.string().pattern(/^[0-9]{10,15}$/)
    .messages({ 'string.pattern.base': 'Contact number must be 10-15 digits' }),
}).min(1);

router.use(auth);

// DEBUG LOG
router.use((req, res, next) => {
  if (req.url.includes('schedules')) {
    console.log(`[OUTLET ROUTE DEBUG] ${req.method} ${req.url}`);
  }
  next();
});

// Nested Schedule Routes (Moved to top for priority)
router.get('/:outletId/schedules', getSchedules);
router.post('/:outletId/schedules', createSchedule);
router.post('/:outletId/schedules/bulk', bulkSetSchedules);
router.get('/:outletId/weekly-schedules', getWeeklySchedules);
router.post('/:outletId/weekly-schedules', setWeeklySchedules);

router.post('/', validate(createOutletSchema), createOutlet);
router.get('/', getOutlets);
router.get('/:id', getOutlet);
router.put('/:id', validate(updateOutletSchema), updateOutlet);
router.delete('/:id', deleteOutlet);

export default router;
