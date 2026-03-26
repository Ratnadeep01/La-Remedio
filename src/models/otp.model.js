import { query } from '../config/db.js';

const OtpModel = {
  /**
   * Store a new OTP.
   */
  async create(phone, otp, expiresAt) {
    // Invalidate previous unused OTPs for this phone
    await query(
      'UPDATE otp_tokens SET is_used = true WHERE phone = $1 AND is_used = false',
      [phone]
    );

    const result = await query(
      `INSERT INTO otp_tokens (phone, otp, expires_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [phone, otp, expiresAt]
    );
    return result.rows[0];
  },

  /**
   * Find the latest unused OTP for a phone.
   */
  async findLatest(phone) {
    const result = await query(
      `SELECT * FROM otp_tokens
       WHERE phone = $1 AND is_used = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );
    return result.rows[0] || null;
  },

  /**
   * Mark OTP as used.
   */
  async markUsed(id) {
    await query('UPDATE otp_tokens SET is_used = true WHERE id = $1', [id]);
  },
};

export default OtpModel;
