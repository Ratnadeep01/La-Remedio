import { query } from '../config/db.js';

const ImageModel = {
  /**
   * Add images to a business.
   */
  async create(businessId, imageUrls, type = 'normal') {
    const images = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const result = await query(
        'INSERT INTO business_images (business_id, image_url, sort_order, type) VALUES ($1, $2, $3, $4) RETURNING *',
        [businessId, imageUrls[i], i, type]
      );
      images.push(result.rows[0]);
    }
    return images;
  },

  /**
   * Find all images for a business.
   */
  async findByBusinessId(businessId, type = null) {
    let sql = 'SELECT * FROM business_images WHERE business_id = $1';
    const params = [businessId];

    if (type) {
      sql += ' AND type = $2';
      params.push(type);
    }

    sql += ' ORDER BY sort_order';
    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Find image by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM business_images WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Count images for a business.
   */
  async countByBusinessId(businessId, type = null) {
    let sql = 'SELECT COUNT(*) as count FROM business_images WHERE business_id = $1';
    const params = [businessId];

    if (type) {
      sql += ' AND type = $2';
      params.push(type);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Delete an image.
   */
  async delete(id) {
    const result = await query('DELETE FROM business_images WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  /**
   * Reorder images.
   */
  async reorder(businessId, imageIds) {
    const images = [];
    for (let i = 0; i < imageIds.length; i++) {
      const result = await query(
        'UPDATE business_images SET sort_order = $1 WHERE id = $2 AND business_id = $3 RETURNING *',
        [i, imageIds[i], businessId]
      );
      if (result.rows[0]) images.push(result.rows[0]);
    }
    return images;
  },
};

export default ImageModel;
