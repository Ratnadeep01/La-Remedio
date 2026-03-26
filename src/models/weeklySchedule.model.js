import { query } from '../config/db.js';

const WeeklyScheduleModel = {
  async upsert({ outletId, dayOfWeek, isOpen, openingTime, closingTime }) {
    const result = await query(
      `INSERT INTO outlet_weekly_schedules (outlet_id, day_of_week, is_open, opening_time, closing_time)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (outlet_id, day_of_week)
       DO UPDATE SET is_open = $3, opening_time = $4, closing_time = $5
       RETURNING *`,
      [outletId, dayOfWeek, isOpen, openingTime || null, closingTime || null]
    );
    return result.rows[0];
  },

  async bulkUpsert(outletId, schedules) {
    const results = [];
    for (const s of schedules) {
      results.push(await this.upsert({ outletId, ...s }));
    }
    return results;
  },

  async findByOutletId(outletId) {
    const result = await query(
      `SELECT * FROM outlet_weekly_schedules WHERE outlet_id = $1 ORDER BY day_of_week`,
      [outletId]
    );
    return result.rows;
  }
};

export default WeeklyScheduleModel;
