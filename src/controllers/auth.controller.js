import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { generateOtp, verifyOtp } from '../utils/otp.js';
import UserModel from '../models/user.model.js';
import OtpModel from '../models/otp.model.js';

dotenv.config();

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number (dummy OTP for now).
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const { otp, expiresAt } = generateOtp();

  await OtpModel.create(phone, otp, expiresAt);

  // In production, send OTP via SMS here
  console.log(`📱 OTP for ${phone}: ${otp}`);

  return ApiResponse.success(res, 'OTP sent successfully', {
    phone,
    // Include OTP in response for development only
    ...(process.env.NODE_ENV === 'development' && { otp }),
  });
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return JWT token.
 */
export const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const otpRecord = await OtpModel.findLatest(phone);
  if (!otpRecord) {
    return ApiResponse.validationError(res, 'No OTP found. Please request a new one.');
  }

  const verification = verifyOtp(otp, otpRecord.otp, otpRecord.expires_at);
  if (!verification.valid) {
    return ApiResponse.validationError(res, verification.message);
  }

  // Mark OTP as used
  await OtpModel.markUsed(otpRecord.id);

  // Find or create user
  let user = await UserModel.findByPhone(phone);
  let isNewUser = false;

  if (!user) {
    user = await UserModel.create(phone);
    isNewUser = true;
  } else if (!user.is_verified) {
    user = await UserModel.verify(user.id);
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  return ApiResponse.success(res, 'OTP verified successfully', {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      isVerified: user.is_verified,
    },
    isNewUser,
  });
});

/**
 * GET /api/auth/me
 * Get current user profile.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  return ApiResponse.success(res, 'User profile retrieved', {
    id: user.id,
    phone: user.phone,
    isVerified: user.is_verified,
    createdAt: user.created_at,
  });
});
