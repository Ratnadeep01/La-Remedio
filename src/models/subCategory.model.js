import { query } from '../config/db.js';

const SubCategoryModel = {
  /**
   * Create a sub-category. Can be linked to a category or directly to a service.
   */
  async create({ businessServiceId, categoryId, title, description, price, gender, sortOrder }) {
    const result = await query(
      `INSERT INTO sub_categories (business_service_id, category_id, title, description, price, gender, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [businessServiceId, categoryId || null, title, description || null, price, gender || 'both', sortOrder || 0]
    );
    return result.rows[0];
  },

  /**
   * Find sub-category by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM sub_categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Find sub-categories by service ID (direct, no category).
   */
  async findByServiceId(businessServiceId) {
    const result = await query(
      'SELECT * FROM sub_categories WHERE business_service_id = $1 AND category_id IS NULL ORDER BY sort_order',
      [businessServiceId]
    );
    return result.rows;
  },

  /**
   * Find sub-categories by category ID.
   */
  async findByCategoryId(categoryId) {
    const result = await query(
      'SELECT * FROM sub_categories WHERE category_id = $1 ORDER BY sort_order',
      [categoryId]
    );
    return result.rows;
  },

  /**
   * Update a sub-category.
   */
  async update(id, data) {
    const fieldMapping = {
      title: 'title',
      description: 'description',
      price: 'price',
      gender: 'gender',
      sortOrder: 'sort_order',
      categoryId: 'category_id',
    };

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [camelKey, snakeKey] of Object.entries(fieldMapping)) {
      if (data[camelKey] !== undefined) {
        fields.push(`${snakeKey} = $${idx++}`);
        values.push(data[camelKey]);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE sub_categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Delete a sub-category.
   */
  async delete(id) {
    const result = await query('DELETE FROM sub_categories WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
};

export default SubCategoryModel;
