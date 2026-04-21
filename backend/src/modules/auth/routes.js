const express = require('express');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests
  message: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later',
  },
});

const {
  getAuthInfo,
  signup,
  login,
  verifyEmail,
  getMe,
  resendVerification,
  forgotPassword,
  resetPasswordHandler,
  logout,
} = require('./controller');
const { requireAuth } = require('./middleware');

const authRouter = express.Router();

authRouter.get('/', getAuthInfo);
authRouter.post('/signup', authLimiter, signup);
authRouter.post('/login', authLimiter, login);
authRouter.get('/verify-email', verifyEmail);
authRouter.post('/resend-verification', authLimiter, resendVerification);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/reset-password', authLimiter, resetPasswordHandler);
authRouter.post('/logout', requireAuth, logout);
authRouter.get('/me', requireAuth, getMe);

module.exports = {
  authRouter,
};
