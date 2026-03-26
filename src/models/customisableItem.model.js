import { query } from '../config/db.js';

const CustomisableItemModel = {
  /**
   * Create an item under a customisable group.
   */
  async create({ customisableId, itemName, startingPrice, sortOrder }) {
    const result = await query(
      `INSERT INTO customisable_items (customisable_id, item_name, starting_price, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customisableId, itemName, startingPrice, sortOrder || 0]
    );
    return result.rows[0];
  },

  /**
   * Find item by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM customisable_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Find items by customisable ID.
   */
  async findByCustomisableId(customisableId) {
    const result = await query(
      'SELECT * FROM customisable_items WHERE customisable_id = $1 ORDER BY sort_order',
      [customisableId]
    );
    return result.rows;
  },

  /**
   * Update an item.
   */
  async update(id, { itemName, startingPrice, sortOrder }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (itemName !== undefined) { fields.push(`item_name = $${idx++}`); values.push(itemName); }
    if (startingPrice !== undefined) { fields.push(`starting_price = $${idx++}`); values.push(startingPrice); }
    if (sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sortOrder); }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE customisable_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Delete an item.
   */
  async delete(id) {
    const result = await query('DELETE FROM customisable_items WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
};

export default CustomisableItemModel;
