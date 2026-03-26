import { query } from '../config/db.js';

const UserModel = {
  /**
   * Find user by phone number.
   */
  async findByPhone(phone) {
    const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0] || null;
  },

  /**
   * Find user by ID.
   */
  async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Create a new user with phone.
   */
  async create(phone) {
    const result = await query(
      'INSERT INTO users (phone, is_verified) VALUES ($1, true) RETURNING *',
      [phone]
    );
    return result.rows[0];
  },

  /**
   * Mark user as verified.
   */
  async verify(id) {
    const result = await query(
      'UPDATE users SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },
};

export default UserModel;
