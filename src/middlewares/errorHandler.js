import ApiResponse from '../utils/apiResponse.js';

/**
 * Global error handler middleware.
 */
const errorHandler = (err, req, res, _next) => {
  console.error('❌ Error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return ApiResponse.validationError(res, 'File too large. Maximum size is 5MB.');
  }

  // Multer unexpected field error
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return ApiResponse.validationError(res, 'Too many files uploaded.');
  }

  // Joi validation error
  if (err.isJoi) {
    const messages = err.details.map((d) => d.message);
    return ApiResponse.validationError(res, 'Validation failed', messages);
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return ApiResponse.error(res, 'Duplicate entry. Resource already exists.', 409);
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return ApiResponse.error(res, 'Referenced resource not found.', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return ApiResponse.error(res, message, statusCode);
};

export default errorHandler;
