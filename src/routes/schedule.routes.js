import { Router } from 'express';
import {
  getSchedules, createSchedule, updateSchedule, bulkSetSchedules,
  getWeeklySchedules, setWeeklySchedules
} from '../controllers/schedule.controller.js';
import auth from '../middlewares/auth.js';

const router = Router();

router.use(auth);

// PUT /api/schedules/:id
router.put('/:id', updateSchedule);

export default router;
