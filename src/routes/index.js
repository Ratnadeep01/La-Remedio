import { Router } from 'express';
import authRoutes from './auth.routes.js';
import businessRoutes from './business.routes.js';
import outletRoutes from './outlet.routes.js';
import imageRoutes from './image.routes.js';
import serviceRoutes, {
  categoryRouter,
  subCategoryRouter,
  customisableRouter,
  customisableItemRouter,
} from './service.routes.js';
import scheduleRoutes from './schedule.routes.js';

const router = Router();

router.use((req, res, next) => {
  console.log(`[GLOBAL API DEBUG] ${req.method} ${req.originalUrl}`);
  next();
});

// Outlets (Priority)
router.use('/outlets', outletRoutes);

// Auth
router.use('/auth', authRoutes);

// Business profile
router.use('/business', businessRoutes);

// Standalone Schedule Updates
router.use('/schedules', scheduleRoutes);

// Business images
router.use('/images', imageRoutes);

// Services
router.use('/services', serviceRoutes);

// Categories (standalone updates/deletes)
router.use('/categories', categoryRouter);

// Sub-categories (standalone updates/deletes + customisables)
router.use('/sub-categories', subCategoryRouter);

// Customisables (standalone updates/deletes + items)
router.use('/customisables', customisableRouter);

// Customisable items (standalone updates/deletes)
router.use('/customisable-items', customisableItemRouter);

// Schedules (standalone updates/merges)
router.use('/schedules', scheduleRoutes);

export default router;
