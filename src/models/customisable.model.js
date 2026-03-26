import { query } from '../config/db.js';

const CustomisableModel = {
  /**
   * Create a customisable group under a sub-category.
   */
  async create({ subCategoryId, shortTitle, sortOrder }) {
    const result = await query(
      `INSERT INTO customisables (sub_category_id, short_title, sort_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [subCategoryId, shortTitle, sortOrder || 0]
    );
    return result.rows[0];
  },

  /**
   * Find customisable by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM customisables WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Find customisables by sub-category ID.
   */
  async findBySubCategoryId(subCategoryId) {
    const result = await query(
      'SELECT * FROM customisables WHERE sub_category_id = $1 ORDER BY sort_order',
      [subCategoryId]
    );
    return result.rows;
  },

  /**
   * Update a customisable group.
   */
  async update(id, { shortTitle, sortOrder }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (shortTitle !== undefined) { fields.push(`short_title = $${idx++}`); values.push(shortTitle); }
    if (sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sortOrder); }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE customisables SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Delete a customisable group (cascades to items).
   */
  async delete(id) {
    const result = await query('DELETE FROM customisables WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
};

export default CustomisableModel;
