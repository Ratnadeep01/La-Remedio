import { Router } from 'express';
import Joi from 'joi';
import validate from '../middlewares/validate.js';
import { sendOtp, verifyOtpHandler, getMe } from '../controllers/auth.controller.js';
import auth from '../middlewares/auth.js';

const router = Router();

const sendOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
    .messages({ 'string.pattern.base': 'Phone number must be 10-15 digits' }),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
    .messages({ 'string.pattern.base': 'Phone number must be 10-15 digits' }),
  otp: Joi.string().length(6).required()
    .messages({ 'string.length': 'OTP must be 6 digits' }),
});

router.post('/send-otp', validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtpHandler);
router.get('/me', auth, getMe);

export default router;
