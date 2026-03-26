/**
 * Standardized API response helper.
 */
class ApiResponse {
  /**
   * Success response
   * @param {import('express').Response} res
   * @param {string} message
   * @param {*} data
   * @param {number} statusCode
   */
  static success(res, message = 'Success', data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Created response (201)
   */
  static created(res, message = 'Created successfully', data = null) {
    return ApiResponse.success(res, message, data, 201);
  }

  /**
   * Error response
   * @param {import('express').Response} res
   * @param {string} message
   * @param {number} statusCode
   * @param {*} errors
   */
  static error(res, message = 'Something went wrong', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  /**
   * Validation error (400)
   */
  static validationError(res, message = 'Validation failed', errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401);
  }

  /**
   * Forbidden (403)
   */
  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, 403);
  }

  /**
   * Not found (404)
   */
  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }
}

export default ApiResponse;
