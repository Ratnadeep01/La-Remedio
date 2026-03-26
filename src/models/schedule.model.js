import { query } from '../config/db.js';

const ScheduleModel = {
  /**
   * Create or update a schedule entry for a specific date.
   */
  async upsert({ outletId, scheduleDate, isOpen, openingTime, closingTime }) {
    const result = await query(
      `INSERT INTO outlet_schedules (outlet_id, schedule_date, is_open, opening_time, closing_time)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (outlet_id, schedule_date)
       DO UPDATE SET is_open = $3, opening_time = $4, closing_time = $5
       RETURNING *`,
      [outletId, scheduleDate, isOpen, openingTime || null, closingTime || null]
    );
    return result.rows[0];
  },

  /**
   * Bulk upsert schedules for multiple dates.
   */
  async bulkUpsert(outletId, schedules) {
    const results = [];
    for (const schedule of schedules) {
      const result = await this.upsert({
        outletId,
        scheduleDate: schedule.scheduleDate,
        isOpen: schedule.isOpen,
        openingTime: schedule.openingTime,
        closingTime: schedule.closingTime,
      });
      results.push(result);
    }
    return results;
  },

  /**
   * Get schedules for an outlet from today for next N days.
   */
  async findByOutletId(outletId, days = 30) {
    const result = await query(
      `SELECT id, outlet_id, schedule_date::text as schedule_date, is_open, opening_time, closing_time 
       FROM outlet_schedules
       WHERE outlet_id = $1
         AND schedule_date >= CURRENT_DATE
         AND schedule_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
       ORDER BY schedule_date`,
      [outletId, days]
    );
    return result.rows;
  },

  /**
   * Find schedule by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM outlet_schedules WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Update a schedule entry.
   */
  async update(id, { isOpen, openingTime, closingTime }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (isOpen !== undefined) { fields.push(`is_open = $${idx++}`); values.push(isOpen); }
    if (openingTime !== undefined) { fields.push(`opening_time = $${idx++}`); values.push(openingTime); }
    if (closingTime !== undefined) { fields.push(`closing_time = $${idx++}`); values.push(closingTime); }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE outlet_schedules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Delete a schedule entry.
   */
  async delete(id) {
    const result = await query('DELETE FROM outlet_schedules WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
};

export default ScheduleModel;
