import { query } from '../config/db.js';

const CategoryModel = {
  /**
   * Create a category under a service.
   */
  async create({ businessServiceId, title, sortOrder }) {
    const result = await query(
      `INSERT INTO categories (business_service_id, title, sort_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [businessServiceId, title, sortOrder || 0]
    );
    return result.rows[0];
  },

  /**
   * Find category by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Find all categories for a service.
   */
  async findByServiceId(businessServiceId) {
    const result = await query(
      'SELECT * FROM categories WHERE business_service_id = $1 ORDER BY sort_order',
      [businessServiceId]
    );
    return result.rows;
  },

  /**
   * Update a category.
   */
  async update(id, { title, sortOrder }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
    if (sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sortOrder); }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Delete a category.
   */
  async delete(id) {
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
};

export default CategoryModel;
