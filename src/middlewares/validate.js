import ApiResponse from '../utils/apiResponse.js';

/**
 * Request validation middleware using Joi schemas.
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @param {'body'|'query'|'params'} source - Request property to validate
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message.replace(/"/g, ''));
    return ApiResponse.validationError(res, 'Validation failed', messages);
  }

  req[source] = value;
  next();
};

export default validate;
