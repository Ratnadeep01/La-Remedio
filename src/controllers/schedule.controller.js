import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ScheduleModel from '../models/schedule.model.js';
import WeeklyScheduleModel from '../models/weeklySchedule.model.js';
import OutletModel from '../models/outlet.model.js';
import BusinessModel from '../models/business.model.js';

/**
 * Helper to verify outlet ownership.
 */
const verifyOutletOwnership = async (outletId, userId) => {
  const outlet = await OutletModel.findById(outletId);
  if (!outlet) return { error: 'Outlet not found', outlet: null };

  const business = await BusinessModel.findByUserId(userId);
  if (!business || outlet.business_id !== business.id) {
    return { error: 'You do not own this outlet', outlet: null };
  }

  return { error: null, outlet };
};

/**
 * POST /api/outlets/:outletId/schedules
 * Set schedule for a specific date.
 */
export const createSchedule = asyncHandler(async (req, res) => {
  const { error } = await verifyOutletOwnership(req.params.outletId, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  const { scheduleDate, isOpen, openingTime, closingTime } = req.body;

  // Validate date is within next 30 days
  const date = new Date(scheduleDate);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 31);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return ApiResponse.validationError(res, 'Schedule date cannot be in the past.');
  }
  if (date > maxDate) {
    return ApiResponse.validationError(res, 'Schedule date must be within the next 30 days.');
  }

  const schedule = await ScheduleModel.upsert({
    outletId: req.params.outletId,
    scheduleDate, isOpen, openingTime, closingTime,
  });

  return ApiResponse.created(res, 'Schedule set', schedule);
});

/**
 * GET /api/outlets/:outletId/schedules
 * Get schedules for the next 30 days.
 */
export const getSchedules = asyncHandler(async (req, res) => {
  const { error, outlet } = await verifyOutletOwnership(req.params.outletId, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  const days = parseInt(req.query.days, 10) || 30;
  
  // 1. Get date-specific overrides
  const overrides = await ScheduleModel.findByOutletId(req.params.outletId, days);
  
  // 2. Get weekly defaults
  const weeklyDefaults = await WeeklyScheduleModel.findByOutletId(req.params.outletId);
  
  // 3. Generate 30-day merged view
  const result = [];
  const today = new Date();
  
  // Start from tomorrow
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);
  
  const daysInt = parseInt(days) || 15;
  
  for (let i = 0; i < daysInt; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Format YYYY-MM-DD manually to avoid ISO UTC shift
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dayOfWeek = currentDate.getDay(); // 0 (Sun) - 6 (Sat)
    
    // Find override (comparing raw strings from DB)
    const override = overrides.find(o => o.schedule_date === dateStr);

    console.log(`[SCHEDULE MERGE] Date: ${dateStr}, Override: ${override ? 'YES' : 'NO'} (${override?.schedule_date})`);
    
    if (override) {
      result.push({
        id: override.id,
        outlet_id: req.params.outletId,
        schedule_date: dateStr,
        is_open: override.is_open,
        opening_time: override.opening_time,
        closing_time: override.closing_time,
        type: 'override',
      });
    } else {
      const dayDefault = weeklyDefaults.find(w => w.day_of_week === dayOfWeek);
      result.push({
        id: `fallback-${dateStr}`,
        outlet_id: req.params.outletId,
        schedule_date: dateStr,
        is_open: dayDefault ? dayDefault.is_open : true,
        opening_time: dayDefault ? dayDefault.opening_time : '09:00:00',
        closing_time: dayDefault ? dayDefault.closing_time : '21:00:00',
        type: dayDefault ? 'default' : 'fallback',
      });
    }
  }

  return ApiResponse.success(res, 'Schedules retrieved', result);
});

/**
 * PUT /api/schedules/:id
 * Update a schedule entry.
 */
export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await ScheduleModel.findById(req.params.id);
  if (!schedule) return ApiResponse.notFound(res, 'Schedule not found');

  const { error } = await verifyOutletOwnership(schedule.outlet_id, req.user.id);
  if (error) return ApiResponse.forbidden(res, error);

  const { isOpen, openingTime, closingTime } = req.body;
  const updated = await ScheduleModel.update(req.params.id, {
    isOpen, openingTime, closingTime,
  });

  return ApiResponse.success(res, 'Schedule updated', updated);
});

/**
 * POST /api/outlets/:outletId/schedules/bulk
 * Bulk set schedules for multiple dates.
 */
export const bulkSetSchedules = asyncHandler(async (req, res) => {
  const { schedules } = req.body;
  console.log(`[BULK SET] Received ${schedules?.length} schedules. First date: ${schedules?.[0]?.scheduleDate}`);
  const { error } = await verifyOutletOwnership(req.params.outletId, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return ApiResponse.validationError(res, 'Please provide an array of schedules.');
  }

  // Validate all dates are within range
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 31);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const s of schedules) {
    const date = new Date(s.scheduleDate);
    if (date < today || date > maxDate) {
      return ApiResponse.validationError(
        res,
        `Schedule date ${s.scheduleDate} is out of range. Must be within next 30 days.`
      );
    }
  }

  const results = await ScheduleModel.bulkUpsert(req.params.outletId, schedules);

  return ApiResponse.created(res, 'Schedules set in bulk', results);
});

/**
 * GET /api/outlets/:outletId/weekly-schedules
 */
export const getWeeklySchedules = asyncHandler(async (req, res) => {
  const { error } = await verifyOutletOwnership(req.params.outletId, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  const schedules = await WeeklyScheduleModel.findByOutletId(req.params.outletId);
  return ApiResponse.success(res, 'Weekly schedules retrieved', schedules);
});

/**
 * POST /api/outlets/:outletId/weekly-schedules
 */
export const setWeeklySchedules = asyncHandler(async (req, res) => {
  const { error } = await verifyOutletOwnership(req.params.outletId, req.user.id);
  if (error) return ApiResponse.notFound(res, error);

  const { schedules } = req.body; // Array of { dayOfWeek, isOpen, openingTime, closingTime }
  if (!Array.isArray(schedules)) {
    return ApiResponse.validationError(res, 'Schedules must be an array');
  }

  const results = await WeeklyScheduleModel.bulkUpsert(req.params.outletId, schedules);
  return ApiResponse.created(res, 'Weekly schedules updated', results);
});
