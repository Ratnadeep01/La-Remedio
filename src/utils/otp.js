import dotenv from 'dotenv';

dotenv.config();

const DUMMY_OTP = process.env.DUMMY_OTP || '123456';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;

/**
 * Generate a dummy OTP.
 * In production, replace this with actual SMS integration.
 * @returns {{ otp: string, expiresAt: Date }}
 */
export const generateOtp = () => {
  const otp = DUMMY_OTP;
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  return { otp, expiresAt };
};

/**
 * Verify an OTP against the stored value.
 * @param {string} inputOtp - OTP entered by user
 * @param {string} storedOtp - OTP from database
 * @param {Date|string} expiresAt - Expiry timestamp
 * @returns {{ valid: boolean, message: string }}
 */
export const verifyOtp = (inputOtp, storedOtp, expiresAt) => {
  if (new Date() > new Date(expiresAt)) {
    return { valid: false, message: 'OTP has expired' };
  }
  if (inputOtp !== storedOtp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  return { valid: true, message: 'OTP verified successfully' };
};
