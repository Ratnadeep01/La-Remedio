import { query } from '../config/db.js';

const ServiceModel = {
  /**
   * Get all default services.
   */
  async getDefaults() {
    const result = await query('SELECT * FROM default_services ORDER BY name');
    return result.rows;
  },

  /**
   * Add a service to a business (from default or custom).
   */
  async create({ businessId, defaultServiceId, name, isCustom, sortOrder }) {
    const result = await query(
      `INSERT INTO business_services (business_id, default_service_id, name, is_custom, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [businessId, defaultServiceId || null, name, isCustom || false, sortOrder || 0]
    );
    return result.rows[0];
  },

  /**
   * Find all services for a business.
   */
  async findByBusinessId(businessId) {
    const result = await query(
      'SELECT * FROM business_services WHERE business_id = $1 ORDER BY sort_order, created_at',
      [businessId]
    );
    return result.rows;
  },

  /**
   * Find service by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM business_services WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Update a service.
   */
  async update(id, { name, sortOrder }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sortOrder); }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE business_services SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Delete a service.
   */
  async delete(id) {
    const result = await query('DELETE FROM business_services WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  /**
   * Get complete service tree: service → categories → sub-categories → customisables → items
   */
  async getFullServiceTree(businessId) {
    // Get all services
    const services = await this.findByBusinessId(businessId);

    for (const service of services) {
      // Get categories for this service
      const catResult = await query(
        'SELECT * FROM categories WHERE business_service_id = $1 ORDER BY sort_order',
        [service.id]
      );
      service.categories = catResult.rows;

      // Get sub-categories linked to categories
      for (const category of service.categories) {
        const subCatResult = await query(
          'SELECT * FROM sub_categories WHERE category_id = $1 ORDER BY sort_order',
          [category.id]
        );
        category.sub_categories = subCatResult.rows;

        // Get customisables for each sub-category
        for (const subCat of category.sub_categories) {
          const custResult = await query(
            'SELECT * FROM customisables WHERE sub_category_id = $1 ORDER BY sort_order',
            [subCat.id]
          );
          subCat.customisables = custResult.rows;

          for (const cust of subCat.customisables) {
            const itemResult = await query(
              'SELECT * FROM customisable_items WHERE customisable_id = $1 ORDER BY sort_order',
              [cust.id]
            );
            cust.items = itemResult.rows;
          }
        }
      }

      // Get sub-categories directly linked to service (no category)
      const directSubCatResult = await query(
        'SELECT * FROM sub_categories WHERE business_service_id = $1 AND category_id IS NULL ORDER BY sort_order',
        [service.id]
      );
      service.direct_sub_categories = directSubCatResult.rows;

      // Get customisables for direct sub-categories
      for (const subCat of service.direct_sub_categories) {
        const custResult = await query(
          'SELECT * FROM customisables WHERE sub_category_id = $1 ORDER BY sort_order',
          [subCat.id]
        );
        subCat.customisables = custResult.rows;

        for (const cust of subCat.customisables) {
          const itemResult = await query(
            'SELECT * FROM customisable_items WHERE customisable_id = $1 ORDER BY sort_order',
            [cust.id]
          );
          cust.items = itemResult.rows;
        }
      }
    }

    return services;
  },
};

export default ServiceModel;
