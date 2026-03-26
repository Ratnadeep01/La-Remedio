import { query } from '../config/db.js';

const BusinessModel = {
  /**
   * Create a new business profile.
   */
  async create({ userId, type, name, about }) {
    const result = await query(
      `INSERT INTO businesses (user_id, type, name, about)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, type, name, about]
    );
    return result.rows[0];
  },

  /**
   * Find business by user ID.
   */
  async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM businesses WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Find business by ID.
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM businesses WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Update business profile.
   */
  async update(id, { type, name, about }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (type !== undefined) { fields.push(`type = $${idx++}`); values.push(type); }
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (about !== undefined) { fields.push(`about = $${idx++}`); values.push(about); }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE businesses SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Get business with amenities.
   */
  async findWithAmenities(userId) {
    const business = await this.findByUserId(userId);
    if (!business) return null;

    const amenities = await query(
      'SELECT * FROM amenities WHERE business_id = $1 ORDER BY created_at',
      [business.id]
    );

    return { ...business, amenities: amenities.rows };
  },

  /**
   * Set amenities for a business (replaces all).
   */
  async setAmenities(businessId, amenityNames) {
    await query('DELETE FROM amenities WHERE business_id = $1', [businessId]);

    const amenities = [];
    for (const name of amenityNames) {
      const result = await query(
        'INSERT INTO amenities (business_id, name) VALUES ($1, $2) RETURNING *',
        [businessId, name]
      );
      amenities.push(result.rows[0]);
    }
    return amenities;
  },

  /**
   * Add amenities to a business.
   */
  async addAmenities(businessId, amenityNames) {
    const amenities = [];
    for (const name of amenityNames) {
      const result = await query(
        'INSERT INTO amenities (business_id, name) VALUES ($1, $2) RETURNING *',
        [businessId, name]
      );
      amenities.push(result.rows[0]);
    }
    return amenities;
  },
};

export default BusinessModel;
