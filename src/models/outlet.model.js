import { query } from '../config/db.js';

const OutletModel = {
  /**
   * Create a new outlet.
   */
  async create({ businessId, name, addressLine1, addressLine2, city, state, pincode, latitude, longitude, contactNumber }) {
    const result = await query(
      `INSERT INTO outlets (business_id, name, address_line1, address_line2, city, state, pincode, latitude, longitude, contact_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [businessId, name, addressLine1, addressLine2, city, state, pincode, latitude, longitude, contactNumber]
    );
    return result.rows[0];
  },

  /**
   * Find all outlets for a business.
   */
  async findByBusinessId(businessId) {
    const result = await query(
      'SELECT * FROM outlets WHERE business_id = $1 ORDER BY created_at',
      [businessId]
    );
    return result.rows;
  },

  /**
   * Find outlet by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM outlets WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Update an outlet.
   */
  async update(id, data) {
    const allowedFields = [
      'name', 'address_line1', 'address_line2', 'city', 'state',
      'pincode', 'latitude', 'longitude', 'contact_number',
    ];

    const fieldMapping = {
      name: 'name',
      addressLine1: 'address_line1',
      addressLine2: 'address_line2',
      city: 'city',
      state: 'state',
      pincode: 'pincode',
      latitude: 'latitude',
      longitude: 'longitude',
      contactNumber: 'contact_number',
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
      `UPDATE outlets SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Delete an outlet.
   */
  async delete(id) {
    const result = await query('DELETE FROM outlets WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
};

export default OutletModel;
