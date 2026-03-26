import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import ApiResponse from '../utils/apiResponse.js';

dotenv.config();

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header (Bearer <token>).
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.unauthorized(res, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return ApiResponse.unauthorized(res, 'Invalid or expired token.');
  }
};

export default auth;
