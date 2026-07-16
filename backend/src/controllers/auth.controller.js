import config from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { authService } from '../services/auth.service.js';

// Helper to set cookies securely
const setTokenCookies = (res, tokens) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.app.env === 'production', // true in production
    sameSite: 'lax',
    path: '/',
  };

  res.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper to clear cookies on logout
const clearTokenCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.app.env === 'production',
    sameSite: 'lax',
    path: '/',
  };
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  setTokenCookies(res, result.tokens);

  res.status(201).json(
    ApiResponse.success(
      { user: result.user, tokens: result.tokens },
      'Registration successful. Please verify your email.',
      201
    )
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  setTokenCookies(res, result.tokens);

  res.status(200).json(
    ApiResponse.success(
      { user: result.user, tokens: result.tokens },
      'Login successful'
    )
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  // Try retrieving refresh token from cookies, headers, or body
  let token = req.body.refreshToken || (req.cookies && req.cookies.refreshToken);

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const tokens = await authService.refreshTokens(token);
  setTokenCookies(res, tokens);

  res.status(200).json(
    ApiResponse.success(
      tokens,
      'Token refreshed successfully'
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await authService.logout(req.user.id);
  }
  clearTokenCookies(res);

  res.status(200).json(
    ApiResponse.success(
      null,
      'Logged out successfully'
    )
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  res.status(200).json(
    ApiResponse.success(
      null,
      'If your email is registered in our records, you will receive a secure password reset link shortly'
    )
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  // Token could be in query or body
  const token = req.query.token || req.body.token;
  const { password } = req.body;

  await authService.resetPassword(token, password);

  res.status(200).json(
    ApiResponse.success(
      null,
      'Password reset successful. You can now login with your new credentials'
    )
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);

  res.status(200).json(
    ApiResponse.success(
      null,
      'Password changed successfully'
    )
  );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.query.token || req.body.token;
  await authService.verifyEmail(token);

  res.status(200).json(
    ApiResponse.success(
      null,
      'Email verification successful. Welcome to COSMAN Maison'
    )
  );
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email);

  res.status(200).json(
    ApiResponse.success(
      null,
      'Verification email has been resent successfully'
    )
  );
});

export const getMe = asyncHandler(async (req, res) => {
  const profile = await authService.getMe(req.user.id);

  res.status(200).json(
    ApiResponse.success(
      profile,
      'Profile retrieved successfully'
    )
  );
});
export default {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  getMe,
};
